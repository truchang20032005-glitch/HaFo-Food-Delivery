const express = require('express');
const router = express.Router();
const CustomerReview = require('../models/CustomerReview');
const ReviewReply = require('../models/ReviewReply');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Shipper = require('../models/Shipper');
const Report = require('../models/Report');

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
        const { userId, content, userRole } = req.body; // userRole lấy từ User đang đăng nhập

        const newReply = new ReviewReply({
            reviewId: req.params.reviewId,
            userId,
            content,
            userRole // 'merchant' hoặc 'shipper'
        });

        await newReply.save();
        res.status(201).json(newReply);
    } catch (err) {
        res.status(400).json({ error: err.message });
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

// API lấy thông báo cho Khách hàng
router.get('/notifications/customer/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // 1. Lấy review IDs của khách
        const userReviews = await CustomerReview.find({ customerId: userId }).select('_id');
        const reviewIds = userReviews.map(r => r._id);

        // 2. Lấy phản hồi CHƯA ĐỌC
        const replies = await ReviewReply.find({
            reviewId: { $in: reviewIds },
            userRole: { $in: ['merchant', 'shipper'] },
            isReadByCustomer: false // ✅ Lọc tin chưa đọc
        }).populate('reviewId');

        // 3. Lấy đơn hàng của khách (Dùng trường 'customer')
        const userOrders = await Order.find({ userId: userId }).select('_id');
        const orderIds = userOrders.map(o => o._id);

        // 4. Lấy khiếu nại Admin đã xử lý và CHƯA ĐỌC
        const adminWarnings = await Report.find({
            orderId: { $in: orderIds },
            status: { $ne: 'pending' },
            isReadByCustomer: false // ✅ Lọc tin chưa đọc
        }).sort({ updatedAt: -1 });

        let list = [];

        replies.forEach(rep => {
            list.push({
                id: rep.reviewId?._id || rep.reviewId,
                orderId: rep.reviewId?.orderId, // ✅ Lấy orderId từ review object
                notificationId: rep._id, // Để mark-read
                type: 'reply',
                msg: `${rep.userRole === 'merchant' ? 'Nhà hàng' : 'Tài xế'} đã phản hồi đánh giá`,
                time: rep.createdAt,
                link: '/history'
            });
        });

        adminWarnings.forEach(warn => {
            list.push({
                id: warn._id,
                orderId: warn.orderId,
                notificationId: warn._id, // Để mark-read
                type: 'admin_warning',
                msg: `Thông báo từ Admin: ${warn.adminNote || 'Yêu cầu kiểm tra lại đánh giá'}`,
                time: warn.updatedAt,
                link: '/history'
            });
        });

        list.sort((a, b) => new Date(b.time) - new Date(a.time));
        res.json({ total: list.length, notifications: list });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// API Đánh dấu đã đọc thông báo
router.put('/notifications/mark-read/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        if (type === 'reply') {
            await ReviewReply.findByIdAndUpdate(id, { isReadByCustomer: true });
        } else {
            await Report.findByIdAndUpdate(id, { isReadByCustomer: true });
        }
        res.json({ message: "Đã đánh dấu đã đọc" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;