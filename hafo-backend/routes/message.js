const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Lấy tin nhắn theo mã đơn hàng
router.get('/:orderId', async (req, res) => {
    try {
        const messages = await Message.find({ orderId: req.params.orderId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Gửi tin nhắn mới
router.post('/', async (req, res) => {
    try {
        const { orderId, senderId, text } = req.body;

        // Kiểm tra xem dữ liệu có bị null không trước khi lưu
        if (!orderId || !senderId || !text) {
            return res.status(400).json({ message: "Thiếu thông tin tin nhắn!" });
        }

        const newMessage = new Message({ orderId, senderId, text });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("LỖI BACKEND CHAT:", error.message); // Xem lỗi ở đây
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;