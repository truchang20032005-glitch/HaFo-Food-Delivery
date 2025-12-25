const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 1. LẤY THÔNG TIN PROFILE (Mới nhất từ DB)
// GET /api/user/:id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // Không trả về pass
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. CẬP NHẬT PROFILE
// PUT /api/user/:id
router.put('/:id', async (req, res) => {
    try {
        const { fullName, phone, email, gender, birthday, addresses } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { fullName, phone, email, gender, birthday, addresses },
            { new: true } // Trả về data mới sau khi update
        ).select('-password');

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. API LẤY DANH SÁCH TẤT CẢ USER 
router.get('/', async (req, res) => {
    try {
        // Lấy tất cả user, sắp xếp mới nhất lên đầu, loại bỏ trường password
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 4. API KHÓA / MỞ KHÓA TÀI KHOẢN 
router.put('/:id/toggle-status', async (req, res) => {
    try {
        const { reason } = req.body; // Nhận lý do từ body
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        const currentStatus = user.status || 'active';

        if (currentStatus === 'active') {
            // ĐANG ACTIVE -> KHÓA
            user.status = 'locked';
            user.lockReason = reason || 'Vi phạm điều khoản cộng đồng'; // Lưu lý do
        } else {
            // ĐANG LOCKED -> MỞ KHÓA
            user.status = 'active';
            user.lockReason = ''; // Xóa lý do cũ
        }

        await user.save();
        res.json({ message: 'Cập nhật trạng thái thành công', status: user.status });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
module.exports = router;