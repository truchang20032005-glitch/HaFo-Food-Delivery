const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// --- CẤU HÌNH UPLOAD ẢNH (MULTER) ---
const uploadDir = 'uploads/avatars';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Đặt tên file: user_timestamp.jpg
        const uniqueName = `user-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
    }
});

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
router.put('/:id', upload.single('avatar'), async (req, res) => {
    try {
        // Lấy các dữ liệu text
        const { fullName, phone, email, gender, birthday, addresses } = req.body;

        const updateData = {
            fullName,
            phone,
            email,
            gender,
            birthday
        };

        // Xử lý Addresses (Vì gửi qua FormData nên nó là chuỗi JSON, cần parse lại)
        if (addresses) {
            try {
                updateData.addresses = JSON.parse(addresses);
            } catch (e) {
                console.error("Lỗi parse địa chỉ:", e);
            }
        }

        // Xử lý Avatar (Nếu có upload file mới)
        if (req.file) {
            // Lưu đường dẫn file vào DB (convert dấu \ thành / cho window)
            updateData.avatar = req.file.path.replace(/\\/g, "/");
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).select('-password');

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