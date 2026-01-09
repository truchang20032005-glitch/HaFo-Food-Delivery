const uploadCloud = require('../config/cloudinary');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Notification = require('../models/Notification');
const authRoutes = require('./auth');

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

const handleViolation = async (userId, reason) => {
    const User = require('../models/User');
    const { sendLockAccountEmail } = require('./auth'); // Dùng lại helper gửi mail má đã có

    const user = await User.findById(userId);
    if (!user) return;

    user.violationCount += 1; // Tăng số lần vi phạm

    // Lần vi phạm 1 & 2: Chỉ cảnh cáo qua "Chuông"
    if (user.violationCount < 3) {
        const newNoti = new Notification({
            userId: user._id,
            msg: `Cảnh báo: Bạn đã sử dụng ngôn từ khiếm nhã. Vi phạm thêm ${3 - user.violationCount} lần nữa tài khoản sẽ bị khóa!`,
            type: 'warning'
        });
        await newNoti.save();
    }
    // Lần thứ 3: Khóa nick tự động
    else {
        const LOCK_DAYS = 7; // Vi phạm ngôn từ khóa nặng hơn, cho 7 ngày đi má
        const unlockDate = new Date();
        unlockDate.setDate(unlockDate.getDate() + LOCK_DAYS);

        user.status = 'locked';
        user.lockReason = `Tái diễn hành vi sử dụng ngôn từ khiếm nhã (${reason})`;
        user.lockUntil = unlockDate;

        // Gửi email thông báo khóa nick
        await sendLockAccountEmail(user.email, user.fullName, user.lockReason, LOCK_DAYS, unlockDate);
    }

    await user.save();
    return user.violationCount;
};

router.get('/maintenance/update-tier-fields', async (req, res) => {
    try {
        // Cập nhật tất cả user chưa có trường totalSpending
        await User.updateMany(
            { totalSpending: { $exists: false } },
            {
                $set: {
                    totalSpending: 0,
                    membershipTier: 'Basic',
                    systemVouchers: []
                }
            }
        );
        res.json({ message: "Đã cập nhật database thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/maintenance/set-gold-tier/:userId', async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: "Không tìm thấy User" });

        // 1. Cập nhật hạng và chi tiêu
        user.membershipTier = 'Gold';
        user.totalSpending = 7000000;

        // 2. Thêm 3 mã giảm giá 50k của hạng Vàng vào kho
        user.systemVouchers = [
            {
                code: 'HAFOGOLD_TEST1',
                value: 50000,
                minOrder: 100000,
                endDate: new Date('2026-12-31'), // HSD xa để test
                isUsed: false
            },
            {
                code: 'HAFOGOLD_TEST2',
                value: 50000,
                minOrder: 100000,
                endDate: new Date('2026-12-31'),
                isUsed: false
            },
            {
                code: 'HAFOGOLD_TEST3',
                value: 50000,
                minOrder: 100000,
                endDate: new Date('2026-12-31'),
                isUsed: false
            }
        ];

        await user.save();
        res.json({ message: "Đã nâng cấp tài khoản lên hạng Vàng thành công!", user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.handleViolation = handleViolation;
module.exports = router;