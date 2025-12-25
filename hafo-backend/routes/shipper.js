const express = require('express');
const router = express.Router();
const Shipper = require('../models/Shipper');
const Order = require('../models/Order');

// 1. ĐĂNG KÝ HỒ SƠ SHIPPER
router.post('/', async (req, res) => {
    try {
        const newShipper = new Shipper(req.body);
        await newShipper.save();
        res.status(201).json(newShipper);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LẤY HỒ SƠ SHIPPER THEO USER ID
router.get('/profile/:userId', async (req, res) => {
    try {
        const shipperProfile = await Shipper.findOne({ user: req.params.userId }).populate('user', 'fullName phone email');
        if (!shipperProfile) {
            return res.status(404).json({ message: "Chưa có hồ sơ shipper" });
        }
        res.json(shipperProfile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. LẤY DANH SÁCH SHIPPER (Cho Admin - Kèm thống kê đơn)
router.get('/', async (req, res) => {
    try {
        // Lấy danh sách shipper và thông tin user tương ứng
        const shippers = await Shipper.find().populate('user', 'fullName phone email');

        // Tính toán số đơn hàng cho từng shipper
        const result = await Promise.all(shippers.map(async (shipper) => {
            // Đếm số đơn hàng đã hoàn thành (status: 'done') của shipper này
            // ⚠️ Lỗi cũ nằm ở đây vì biến Order chưa được khai báo
            const orderCount = await Order.countDocuments({
                shipperId: shipper._id,
                status: 'done'
            });

            return {
                ...shipper.toObject(),
                orders: orderCount
            };
        }));

        res.json(result);
    } catch (err) {
        console.error("Lỗi lấy shipper:", err); // Log lỗi ra console để dễ debug
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;