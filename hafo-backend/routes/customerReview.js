const express = require('express');
const router = express.Router();
const CustomerReview = require('../models/CustomerReview');
const ReviewReply = require('../models/ReviewReply');
const Order = require('../models/Order');

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

        // ✅ PHẢI MỞ DÒNG NÀY ĐỂ TRANG LỊCH SỬ CẬP NHẬT NÚT
        await Order.findByIdAndUpdate(orderId, {
            isReviewed: true,
            restaurantRating: rating,      // Sao của quán (rating tổng)
            shipperRating: shipperRating   // Sao của shipper
        });

        res.status(201).json(newReview);
    } catch (err) {
        console.error("LỖI LƯU ĐÁNH GIÁ:", err.message); // Xem lỗi cụ thể ở terminal
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