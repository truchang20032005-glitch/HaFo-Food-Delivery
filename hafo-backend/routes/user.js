const uploadCloud = require('../config/cloudinary');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// 1. LẤY THÔNG TIN PROFILE
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. CẬP NHẬT PROFILE (CÓ UPLOAD AVATAR)
router.put('/:id', uploadCloud.single('avatar'), async (req, res) => {
    try {
        // Chỉ lấy những trường CÓ GIÁ TRỊ từ req.body
        let updateData = {};

        const fields = ['fullName', 'phone', 'email', 'gender', 'birthday'];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        // Xử lý ảnh avatar nếu có
        if (req.file) {
            updateData.avatar = req.file.path;
        }

        // Xử lý Addresses nếu có gửi lên (vì nó là chuỗi JSON)
        if (req.body.addresses) {
            try {
                updateData.addresses = JSON.parse(req.body.addresses);
            } catch (e) {
                console.error("Lỗi parse addresses");
            }
        }

        // Thực hiện cập nhật
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updateData }, // Dùng $set để chỉ cập nhật các trường có trong updateData
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        res.json(updatedUser);
    } catch (error) {
        console.error("Lỗi update user:", error);
        res.status(500).json({ message: error.message });
    }
});

// 3. API LẤY DANH SÁCH TẤT CẢ USER (Giữ nguyên)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. KHÓA / MỞ KHÓA (Giữ nguyên)
router.put('/:id/toggle-status', async (req, res) => {
    try {
        const { reason } = req.body;
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const currentStatus = user.status || 'active';
        if (currentStatus === 'active') {
            user.status = 'locked';
            user.lockReason = reason || 'Vi phạm điều khoản';
        } else {
            user.status = 'active';
            user.lockReason = '';
        }
        await user.save();
        res.json({ message: 'Thành công', status: user.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;