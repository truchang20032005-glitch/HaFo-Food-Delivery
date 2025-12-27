const express = require('express');
const router = express.Router();
const Shipper = require('../models/Shipper');
const Order = require('../models/Order');
const User = require('../models/User');

// 1. ĐĂNG KÝ HỒ SƠ SHIPPER (Giữ nguyên)
router.post('/', async (req, res) => {
    try {
        const newShipper = new Shipper(req.body);
        await newShipper.save();
        res.status(201).json(newShipper);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ 2. CẬP NHẬT HỒ SƠ SHIPPER (THÊM MỚI ĐỂ HẾT LỖI 404)
router.put('/profile/:userId', async (req, res) => {
    try {
        const {
            fullName, phone, email,
            vehicleType, licensePlate, currentLocation,
            bankName, bankAccount, bankOwner, bankBranch
        } = req.body;

        // 1. Cập nhật thông tin cơ bản ở bảng User
        if (fullName || phone || email) {
            await User.findByIdAndUpdate(req.params.userId, { fullName, phone, email });
        }

        // 2. Cập nhật thông tin shipper & ngân hàng
        const updatedShipper = await Shipper.findOneAndUpdate(
            { user: req.params.userId },
            {
                vehicleType, licensePlate, currentLocation,
                bankName, bankAccount, bankOwner, bankBranch
            },
            { new: true }
        ).populate('user', '-password');

        if (!updatedShipper) return res.status(404).json({ message: "Không tìm thấy hồ sơ" });
        res.json(updatedShipper);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. LẤY HỒ SƠ SHIPPER THEO USER ID (Giữ nguyên)
router.get('/profile/:userId', async (req, res) => {
    try {
        const shipperProfile = await Shipper.findOne({ user: req.params.userId }).populate('user', 'fullName phone email avatar');
        if (!shipperProfile) {
            return res.status(404).json({ message: "Chưa có hồ sơ shipper" });
        }
        res.json(shipperProfile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. LẤY DANH SÁCH SHIPPER
router.get('/', async (req, res) => {
    try {
        const shippers = await Shipper.find().populate('user', 'fullName phone email avatar');

        const result = await Promise.all(shippers.map(async (shipper) => {
            // ✅ SỬA TẠI ĐÂY: Đếm dựa trên User ID thay vì Shipper ID
            // Vì ShipperHistory đang dùng user.id để lọc, nên ta phải đếm theo user.id
            const orderCount = await Order.countDocuments({
                shipperId: shipper.user._id, // Dùng ID của bảng User
                status: 'done'
            });

            return {
                ...shipper.toObject(),
                orders: orderCount || 0,
                income: shipper.income || 0
            };
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;