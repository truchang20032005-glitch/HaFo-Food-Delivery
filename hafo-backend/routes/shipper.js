const express = require('express');
const router = express.Router();
const Shipper = require('../models/Shipper');

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

// 2. LẤY THÔNG TIN SHIPPER THEO USER ID
// LẤY HỒ SƠ SHIPPER THEO USER ID
// GET /api/shippers/profile/:userId
router.get('/profile/:userId', async (req, res) => {
    try {
        // Tìm hồ sơ Shipper gắn với User ID này
        const shipperProfile = await Shipper.findOne({ user: req.params.userId }).populate('user', 'fullName phone email');

        if (!shipperProfile) {
            return res.status(404).json({ message: "Chưa có hồ sơ shipper" });
        }
        res.json(shipperProfile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 3. LẤY DANH SÁCH SHIPPER (Cho Admin)
router.get('/', async (req, res) => {
    try {
        // Populate để lấy luôn tên từ bảng User
        const shippers = await Shipper.find().populate('user', 'fullName phone email');
        res.json(shippers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;