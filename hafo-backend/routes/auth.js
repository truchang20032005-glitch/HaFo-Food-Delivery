const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_nay_phai_giau';

// ========================================
// 1. API ĐĂNG KÝ (Register) - ĐÃ SỬA
// ========================================
router.post('/register', async (req, res) => {
    const { username, password, fullName, role, targetRole } = req.body;

    // 1. Validate đầu vào cơ bản
    if (!username || !password || !fullName) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
    }

    // ✅ 2. THÊM: Validate role hợp lệ
    const validRoles = ['customer', 'pending_merchant', 'pending_shipper'];
    if (role && !validRoles.includes(role)) {
        return res.status(400).json({ message: 'Vai trò không hợp lệ!' });
    }

    try {
        // 3. Kiểm tra user tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Tài khoản này đã tồn tại!' });
        }

        // 4. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // ✅ 5. THÊM: Xác định approvalStatus dựa trên role
        let approvalStatus = 'none';
        if (role === 'pending_merchant' || role === 'pending_shipper') {
            approvalStatus = 'pending'; // Đánh dấu đang chờ duyệt
        }

        // 6. Tạo user mới
        const newUser = new User({
            username,
            password: hashedPassword,
            fullName,
            role: role || 'customer',        // ✅ Nhận role từ frontend
            approvalStatus: approvalStatus,   // ✅ Set trạng thái
            targetRole: targetRole || '' // <-- LƯU Ý ĐỊNH VÀO DB
        });

        await newUser.save();

        // ✅ 7. THÊM: Trả về thêm role và approvalStatus
        res.status(201).json({
            message: 'Đăng ký thành công!',
            userId: newUser._id,
            role: newUser.role,              // ✅ Để frontend biết role
            approvalStatus: newUser.approvalStatus // ✅ Để frontend biết trạng thái
        });

    } catch (error) {
        console.error('❌ Lỗi đăng ký:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// ========================================
// 2. API ĐĂNG NHẬP (Login) - ĐÃ SỬA
// ========================================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // 1. Validate đầu vào
    if (!username || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập tài khoản và mật khẩu!' });
    }

    try {
        // 2. Tìm user trong DB
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });
        }

        // 3. So sánh mật khẩu
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Sai tài khoản hoặc mật khẩu' });
        }

        // 4. Tạo Token
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        // ✅ 5. THÊM: Trả về thêm approvalStatus để frontend điều hướng
        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                approvalStatus: user.approvalStatus, // ✅ QUAN TRỌNG: Frontend cần để điều hướng
                targetRole: user.targetRole
            }
        });

    } catch (error) {
        console.error('❌ Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// ========================================
// 3. API LẤY THÔNG TIN USER - THÊM MỚI (OPTIONAL)
// ========================================
// Dùng để frontend check lại thông tin user sau khi đăng nhập
router.get('/me/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json(user);
    } catch (error) {
        console.error('❌ Lỗi lấy thông tin user:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

module.exports = router;