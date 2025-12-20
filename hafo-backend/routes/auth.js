const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Gọi model User

// Lấy secret key từ biến môi trường (hoặc dùng tạm chuỗi cứng nếu chưa set .env)
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_nay_phai_giau';

// --- 1. API ĐĂNG KÝ (Register) ---
// Method: POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, password, fullName, role } = req.body;

    // 1. Validate đầu vào cơ bản
    if (!username || !password || !fullName) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
    }

    try {
        // 2. Kiểm tra user tồn tại
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Tài khoản này đã tồn tại!' });
        }

        // 3. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Tạo user mới
        const newUser = new User({
            username,
            password: hashedPassword,
            fullName,
            role: role || 'customer' // Mặc định là khách hàng
        });

        await newUser.save();

        res.status(201).json({ message: 'Đăng ký thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

// --- 2. API ĐĂNG NHẬP (Login) ---
// Method: POST /api/auth/login
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
            { expiresIn: '1d' } // Token sống trong 1 ngày
        );

        // 5. Trả về kết quả
        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                fullName: user.fullName
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
});

module.exports = router;