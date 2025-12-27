const express = require('express');
const router = express.Router();
const CustomerReview = require('../models/CustomerReview');
const ReviewReply = require('../models/ReviewReply');

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

module.exports = router;