const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Order = require('../models/Order');

// Lấy tin nhắn (Chỉ người liên quan mới được xem)
router.get('/:orderId', async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        // Logic bảo mật: Bạn nên lấy userId từ Token (middleware auth) để kiểm tra
        // if (req.user.id !== order.userId.toString() && ...) 
        // return res.status(403).json({ message: "Bạn không có quyền xem chat này" });

        const messages = await Message.find({ orderId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Gửi tin nhắn mới
router.post('/', async (req, res) => {
    try {
        const { orderId, senderId, text } = req.body;

        if (!orderId || !senderId || !text) {
            return res.status(400).json({ message: "Thiếu thông tin tin nhắn!" });
        }

        const newMessage = new Message({ orderId, senderId, text });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;