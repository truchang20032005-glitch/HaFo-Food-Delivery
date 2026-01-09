const express = require('express');
const router = express.Router();
const CustomerReview = require('../models/CustomerReview');
const ReviewReply = require('../models/ReviewReply');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Shipper = require('../models/Shipper');
const Report = require('../models/Report');
const { checkContentAI } = require('../utils/aiModerator');
const User = require('../models/User');
const { handleViolation } = require('./user');
const { sendLockAccountEmail } = require('./auth');

// 1. Lấy tất cả đánh giá của 1 quán (Giữ nguyên)
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const reviews = await CustomerReview.find({ restaurantId: req.params.restaurantId })
            .populate('customerId', 'fullName avatar')
            .sort({ createdAt: -1 });

        const result = await Promise.all(reviews.map(async (rev) => {
            const replies = await ReviewReply.find({ reviewId: rev._id }).populate('userId', 'fullName avatar');
            return { ...rev.toObject(), replies };
        }));

        res.json(result);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 2. PHẢN HỒI ĐÁNH GIÁ (Đã tối ưu hóa AI)
router.post('/:reviewId/reply', async (req, res) => {
    try {
        const { userId, content, userRole } = req.body;

        // 🟢 BƯỚC 1: QUÉT AI
        const isBad = await checkContentAI(content);

        if (isBad) {
            // ✅ SỬA: Gọi hàm xử phạt tập trung, không viết code lặp lại gây lỗi
            const count = await handleViolation(userId, "Dùng ngôn từ khiếm nhã khi phản hồi đánh giá");

            return res.status(400).json({
                message: `Nội dung phản hồi vi phạm quy tắc! Bạn đã vi phạm ${count}/3 lần.`,
                violationCount: count
            });
        }

        // 🟢 BƯỚC 2: LƯU PHẢN HỒI
        const newReply = new ReviewReply({
            reviewId: req.params.reviewId,
            userId,
            content,
            userRole
        });

        await newReply.save();
        res.status(201).json(newReply);

    } catch (err) { res.status(500).json({ message: err.message }); }
});

// 3. GỬI ĐÁNH GIÁ MỚI (Đã thêm Cảnh sát AI quét comment)
router.post('/', async (req, res) => {
    try {
        const { orderId, customerId, restaurantId, shipperId, rating, comment, itemReviews, shipperRating, shipperComment } = req.body;

        // 🟢 BƯỚC 1: QUÉT AI CHO TẤT CẢ CÁC TRƯỜNG CHỨA CHỮ
        // Gom các đoạn text lại để quét một lần cho nhanh
        const fullText = `${comment} ${shipperComment} ${itemReviews.map(i => i.comment).join(' ')}`;
        const isBad = await checkContentAI(fullText);

        if (isBad) {
            const count = await handleViolation(customerId, "Sử dụng ngôn từ khiếm nhã trong đánh giá món ăn/shipper");
            return res.status(400).json({
                message: "Đánh giá của bạn chứa từ ngữ không phù hợp và đã bị chặn!",
                violationCount: count
            });
        }

        // 🟢 BƯỚC 2: LƯU ĐÁNH GIÁ
        const newReview = new CustomerReview({
            orderId, customerId, restaurantId, shipperId,
            rating, comment, itemReviews, shipperRating, shipperComment
        });
        await newReview.save();
        const io = req.app.get('socketio');
        if (io) {
            // Thông báo cho nhà hàng
            io.to(restaurantId.toString()).emit('new-notification');
            // Thông báo cho shipper (nếu có)
            if (shipperId) {
                io.to(shipperId.toString()).emit('new-notification');
            }
        }

        // Cập nhật trạng thái đơn hàng và Rating trung bình (Giữ nguyên logic của má)
        await Order.findByIdAndUpdate(orderId, { isReviewed: true, restaurantRating: rating, shipperRating: shipperRating });

        const resReviews = await CustomerReview.find({ restaurantId });
        const avgResRating = resReviews.reduce((acc, r) => acc + r.rating, 0) / resReviews.length;
        await Restaurant.findByIdAndUpdate(restaurantId, { rating: avgResRating.toFixed(1) });

        if (shipperId) {
            const shipReviews = await CustomerReview.find({ shipperId });
            const avgShipRating = shipReviews.reduce((acc, r) => acc + (r.shipperRating || 5), 0) / shipReviews.length;
            await Shipper.findOneAndUpdate({ user: shipperId }, { rating: avgShipRating.toFixed(1) });
        }

        res.status(201).json(newReview);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// 4. CẬP NHẬT ĐÁNH GIÁ (Đã thêm AI bảo vệ)
router.put('/:reviewId', async (req, res) => {
    try {
        const { comment, shipperComment, itemReviews, customerId } = req.body;

        // 🟢 BƯỚC 1: QUÉT AI KHI KHÁCH SỬA NỘI DUNG
        if (comment || shipperComment || itemReviews) {
            const textToQuery = `${comment || ''} ${shipperComment || ''} ${itemReviews ? itemReviews.map(i => i.comment).join(' ') : ''}`;
            const isBad = await checkContentAI(textToQuery);

            if (isBad) {
                const count = await handleViolation(customerId, "Sửa đánh giá thành ngôn từ khiếm nhã");
                return res.status(400).json({ message: "Nội dung sửa đổi vi phạm quy tắc cộng đồng!" });
            }
        }

        const updatedReview = await CustomerReview.findByIdAndUpdate(
            req.params.reviewId,
            req.body,
            { new: true }
        );
        res.json(updatedReview);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// 5. Báo cáo đánh giá (Giữ nguyên)
router.put('/:reviewId/report', async (req, res) => {
    try {
        const review = await CustomerReview.findByIdAndUpdate(
            req.params.reviewId,
            { isReported: true, reportReason: req.body.reason, reportStatus: 'pending' },
            { new: true }
        );
        res.json(review);
    } catch (err) { res.status(400).json({ message: err.message }); }
});

// 6. Lấy chi tiết đánh giá (Giữ nguyên)
router.get('/order/:orderId', async (req, res) => {
    try {
        const review = await CustomerReview.findOne({ orderId: req.params.orderId })
            .populate('customerId', 'fullName avatar')
            .populate('restaurantId', 'name')
            .populate('shipperId', 'fullName avatar');

        if (!review) return res.status(404).json({ message: "Chưa có đánh giá" });

        const replies = await ReviewReply.find({ reviewId: review._id }).populate('userId', 'fullName avatar');
        res.json({ ...review.toObject(), replies });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;