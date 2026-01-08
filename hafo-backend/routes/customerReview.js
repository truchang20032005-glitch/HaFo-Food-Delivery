const express = require('express');
const router = express.Router();
const CustomerReview = require('../models/CustomerReview');
const ReviewReply = require('../models/ReviewReply');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Shipper = require('../models/Shipper');
const Report = require('../models/Report');
const { checkContentAI } = require('../utils/aiModerator');
const User = require('../models/User'); // Import model User để xử phạt
const { sendLockAccountEmail } = require('./auth'); // Import hàm gửi mail

// 1. Lấy tất cả đánh giá của 1 quán (Kèm các phản hồi)
router.get('/restaurant/:restaurantId', async (req, res) => {
    try {
        const reviews = await CustomerReview.find({ restaurantId: req.params.restaurantId })
            .populate('customerId', 'fullName avatar')
            .sort({ createdAt: -1 });

        // Lấy thêm phản hồi cho mỗi đánh giá
        const result = await Promise.all(reviews.map(async (rev) => {
            const replies = await ReviewReply.find({ reviewId: rev._id }).populate('userId', 'fullName avatar');
            return { ...rev.toObject(), replies };
        }));

        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Phản hồi đánh giá
// Gửi phản hồi (Dùng chung cho cả Merchant và Shipper)
router.post('/:reviewId/reply', async (req, res) => {
    try {
        const { userId, content, userRole } = req.body;

        // 1. SỬ DỤNG AI ĐỂ QUÉT NỘI DUNG PHẢN HỒI
        const isBad = await checkContentAI(content);

        if (isBad) {
            const user = await User.findById(userId);
            if (user) {
                // Tăng số lần vi phạm ngôn từ
                user.violationCount = (user.violationCount || 0) + 1;

                // Nếu vi phạm từ lần thứ 3 trở đi -> Khóa tài khoản 7 ngày
                if (user.violationCount >= 3) {
                    const LOCK_DAYS = 7;
                    const unlockDate = new Date();
                    unlockDate.setDate(unlockDate.getDate() + LOCK_DAYS);

                    user.status = 'locked'; // Cập nhật trạng thái locked
                    user.lockReason = "Tái diễn hành vi sử dụng ngôn từ khiếm nhã trong phản hồi đánh giá";
                    user.lockUntil = unlockDate; // Cập nhật thời gian mở khóa
                    await user.save();

                    // Gửi email thông báo cho người dùng
                    await sendLockAccountEmail(user.email, user.fullName, user.lockReason, LOCK_DAYS, unlockDate);

                    return res.status(403).json({
                        message: "Tài khoản của bạn đã bị khóa 7 ngày do vi phạm tiêu chuẩn cộng đồng nhiều lần!",
                        violationCount: user.violationCount
                    });
                } else {
                    // Nếu vi phạm lần 1 hoặc 2 -> Cảnh cáo
                    await user.save();
                    return res.status(400).json({
                        message: `Cảnh báo: Phản hồi của bạn chứa từ ngữ không phù hợp. Bạn đã vi phạm ${user.violationCount}/3 lần. Tái diễn sẽ bị khóa tài khoản!`,
                        violationCount: user.violationCount
                    });
                }
            }
        }

        // 2. NẾU NỘI DUNG SẠCH -> LƯU PHẢN HỒI NHƯ BÌNH THƯỜNG
        const newReply = new ReviewReply({
            reviewId: req.params.reviewId,
            userId,
            content,
            userRole
        });

        await newReply.save();
        res.status(201).json(newReply);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { orderId, customerId, restaurantId, shipperId, rating, comment, itemReviews, shipperRating, shipperComment } = req.body;

        const newReview = new CustomerReview({
            orderId, customerId, restaurantId, shipperId,
            rating, comment, itemReviews, shipperRating, shipperComment
        });
        await newReview.save();

        // 1. Cập nhật trạng thái đơn hàng
        await Order.findByIdAndUpdate(orderId, {
            isReviewed: true,
            restaurantRating: rating,
            shipperRating: shipperRating
        });

        // 2. ✅ LOGIC MỚI: Tự động cập nhật Rating trung bình cho QUÁN
        const resReviews = await CustomerReview.find({ restaurantId });
        const avgResRating = resReviews.reduce((acc, r) => acc + r.rating, 0) / resReviews.length;
        await Restaurant.findByIdAndUpdate(restaurantId, { rating: avgResRating.toFixed(1) });

        // 3. ✅ LOGIC MỚI: Tự động cập nhật Rating trung bình cho SHIPPER
        if (shipperId) {
            const shipReviews = await CustomerReview.find({ shipperId });
            const avgShipRating = shipReviews.reduce((acc, r) => acc + (r.shipperRating || 5), 0) / shipReviews.length;
            // Lưu ý: Shipper ID trong CustomerReview là UserID, nên ta tìm theo UserID
            await Shipper.findOneAndUpdate({ user: shipperId }, { rating: avgShipRating.toFixed(1) });
        }

        res.status(201).json(newReview);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 3. Báo cáo đánh giá sai sự thật
router.put('/:reviewId/report', async (req, res) => {
    try {
        const review = await CustomerReview.findByIdAndUpdate(
            req.params.reviewId,
            { isReported: true, reportReason: req.body.reason, reportStatus: 'pending' },
            { new: true }
        );
        res.json(review);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

// Lấy chi tiết đánh giá của 1 đơn hàng (Kèm phản hồi)
router.get('/order/:orderId', async (req, res) => {
    try {
        const review = await CustomerReview.findOne({ orderId: req.params.orderId })
            .populate('customerId', 'fullName avatar')
            .populate('restaurantId', 'name')
            .populate('shipperId', 'fullName avatar');

        if (!review) return res.status(404).json({ message: "Chưa có đánh giá" });

        // Lấy thêm phản hồi
        const replies = await ReviewReply.find({ reviewId: review._id }).populate('userId', 'fullName avatar');

        res.json({ ...review.toObject(), replies });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cập nhật đánh giá
router.put('/:reviewId', async (req, res) => {
    try {
        const updatedReview = await CustomerReview.findByIdAndUpdate(
            req.params.reviewId,
            req.body,
            { new: true }
        );
        res.json(updatedReview);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;