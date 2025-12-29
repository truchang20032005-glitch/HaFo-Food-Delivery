const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const Otp = require('../models/Otp');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_nay_phai_giau';

// --- CẤU HÌNH GỬI MAIL (NODEMAILER) ---
// Bạn nhớ thay bằng email và mật khẩu ứng dụng thật của bạn
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io", // ✅ Đúng host trong ảnh của bạn
    port: 2525, // ✅ Bạn dùng cổng 2525 cho ổn định
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper: Tạo mã OTP ngẫu nhiên 6 số
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ================= API GỬI OTP (Cho Đăng ký & Quên MK) =================
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Vui lòng nhập email!' });

    try {
        const otp = generateOTP();

        // Lưu OTP vào DB (Ghi đè nếu cũ)
        await Otp.deleteMany({ email });
        await new Otp({ email, otp }).save();

        // Gửi mail
        await transporter.sendMail({
            from: '"HaFo Support" <happyfoodcskh2025@gmail.com>',
            to: email,
            subject: 'Mã xác thực OTP - HaFo Food',
            text: `Mã OTP của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`
        });

        res.json({ message: 'Đã gửi mã OTP về email!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi gửi email: ' + err.message });
    }
});

// =============================================================
// ✅ API ĐĂNG NHẬP MẠNG XÃ HỘI (GOOGLE / FACEBOOK)
// Logic: Nhận email từ Frontend -> Nếu có rồi thì Login -> Chưa có thì Tự tạo User rồi Login
// =============================================================
router.post('/social-login', async (req, res) => {
    const { email, fullName, avatar, providerId } = req.body;

    if (!email) return res.status(400).json({ message: 'Không lấy được email từ mạng xã hội!' });

    try {
        // 1. Kiểm tra xem user đã tồn tại chưa
        let user = await User.findOne({ email });

        if (user) {
            // A. NẾU ĐÃ CÓ USER
            // Kiểm tra nếu tài khoản bị khóa
            if (user.status === 'locked') {
                return res.status(403).json({ message: 'Tài khoản bị khóa', reason: user.lockReason });
            }

            // Cập nhật lại avatar nếu user chưa có (hoặc muốn đồng bộ luôn)
            if (!user.avatar && avatar) {
                user.avatar = avatar;
                await user.save();
            }

        } else {
            // B. NẾU CHƯA CÓ -> TẠO MỚI (AUTO REGISTER)
            // Tạo mật khẩu ngẫu nhiên (Vì login bằng Google ko cần pass)
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            // Tạo username từ email (bỏ phần @gmail.com) + số ngẫu nhiên để tránh trùng
            const randomUsername = email.split('@')[0] + Math.floor(Math.random() * 1000);

            user = new User({
                username: randomUsername,
                password: hashedPassword,
                fullName: fullName || 'Người dùng HaFo',
                email: email,
                avatar: avatar || '',
                role: 'customer', // Mặc định là khách hàng
                addresses: [],
                approvalStatus: user.approvalStatus
            });

            await user.save();
        }

        // 2. Tạo Token JWT (Giống hệt API login thường)
        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'Đăng nhập mạng xã hội thành công',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar || ''
            }
        });

    } catch (err) {
        console.error("Lỗi Social Login:", err);
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ================= API ĐĂNG KÝ (Nâng cấp) =================
router.post('/register', async (req, res) => {
    const {
        username, password, fullName,
        email, phone, gender, birthday, address, // Các trường mới
        otp, role, targetRole
    } = req.body;

    // 1. Validate cơ bản
    if (!username || !password || !fullName || !email || !otp) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin bắt buộc!' });
    }

    try {
        // 2. Kiểm tra OTP
        const validOtp = await Otp.findOne({ email, otp });
        if (!validOtp) {
            return res.status(400).json({ message: 'Mã OTP không đúng hoặc đã hết hạn!' });
        }

        // 3. Kiểm tra User tồn tại
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Tài khoản hoặc Email đã tồn tại!' });
        }

        // 4. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Tạo User mới
        const newUser = new User({
            username,
            password: hashedPassword,
            fullName,
            email,
            phone,
            gender,
            birthday,
            addresses: address ? [{ label: 'Mặc định', value: address }] : [], // Lưu địa chỉ vào mảng
            role: role || 'customer',
            targetRole: targetRole || null,
            approvalStatus: 'none'
        });

        await newUser.save();

        // Xóa OTP sau khi dùng xong
        await Otp.deleteMany({ email });

        res.status(201).json({ message: 'Đăng ký thành công! Vui lòng đăng nhập.' });

    } catch (err) {
        res.status(500).json({ message: 'Lỗi server: ' + err.message });
    }
});

// ================= API ĐĂNG NHẬP (Giữ nguyên logic cũ) =================
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });

        if (user.status === 'locked') {
            return res.status(403).json({ message: 'Tài khoản bị khóa', reason: user.lockReason });
        }

        const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                fullName: user.fullName,
                email: user.email,
                avatar: user.avatar || '',
                approvalStatus: user.approvalStatus
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ================= API QUÊN MẬT KHẨU (Reset Password) =================
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        // Check OTP
        const validOtp = await Otp.findOne({ email, otp });
        if (!validOtp) return res.status(400).json({ message: 'Mã OTP không hợp lệ!' });

        // Tìm User
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Email chưa được đăng ký!' });

        // Đổi pass
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        await Otp.deleteMany({ email }); // Xóa OTP

        res.json({ message: 'Đổi mật khẩu thành công! Hãy đăng nhập lại.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// API Lấy thông tin user (Cho checkout/profile...)
router.get('/me/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;