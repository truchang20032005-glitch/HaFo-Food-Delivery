const express = require('express');
const router = express.Router();
const multer = require('multer');
const nodemailer = require('nodemailer');
const uploadCloud = require('../config/cloudinary');

const PendingRestaurant = require('../models/PendingRestaurant');
const PendingShipper = require('../models/PendingShipper');
const Restaurant = require('../models/Restaurant');
const Shipper = require('../models/Shipper');
const User = require('../models/User');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');

// MIDDLEWARE XỬ LÝ UPLOAD
const handleUpload = (fields) => {
    return (req, res, next) => {
        const uploadFn = uploadCloud.fields(fields);
        uploadFn(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                return res.status(400).json({ message: "Lỗi upload file: " + err.message });
            } else if (err) {
                return res.status(400).json({ message: err.message });
            }
            next();
        });
    };
};

// API ĐĂNG KÝ NHÀ HÀNG
router.post('/merchant', handleUpload([
    { name: 'avatar', maxCount: 1 },
    { name: 'idCardFront', maxCount: 1 },
    { name: 'idCardBack', maxCount: 1 },
    { name: 'businessLicense', maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files || {};

        // Chuyển tọa độ từ string (nếu gửi qua FormData) sang mảng số
        const lng = parseFloat(req.body.lng) || 106.660172;
        const lat = parseFloat(req.body.lat) || 10.762622;

        const newReq = new PendingRestaurant({
            ...req.body,
            location: {
                type: 'Point',
                coordinates: [lng, lat] // [Kinh độ, Vĩ độ]
            },
            avatar: files.avatar ? files.avatar[0].path : '',
            idCardFront: files.idCardFront ? files.idCardFront[0].path : '',
            idCardBack: files.idCardBack ? files.idCardBack[0].path : '',
            businessLicense: files.businessLicense ? files.businessLicense[0].path : '',
            cuisine: req.body.cuisine ? (Array.isArray(req.body.cuisine) ? req.body.cuisine : [req.body.cuisine]) : []
        });
        await newReq.save();
        await User.findByIdAndUpdate(req.body.userId, { approvalStatus: 'pending' });
        res.status(201).json({ message: "Gửi hồ sơ thành công!", code: newReq._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API ĐĂNG KÝ SHIPPER 
router.post('/shipper', handleUpload([
    { name: 'cccdFront', maxCount: 1 }, { name: 'cccdBack', maxCount: 1 },
    { name: 'licenseImage', maxCount: 1 }, { name: 'vehicleRegImage', maxCount: 1 },
    { name: 'avatar', maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files || {};
        const lng = parseFloat(req.body.lng) || 106.660172;
        const lat = parseFloat(req.body.lat) || 10.762622;

        const newReq = new PendingShipper({
            ...req.body,
            location: { type: 'Point', coordinates: [lng, lat] }, // ✅ Lưu tọa độ
            cccdFront: files.cccdFront ? files.cccdFront[0].path : '',
            cccdBack: files.cccdBack ? files.cccdBack[0].path : '',
            licenseImage: files.licenseImage ? files.licenseImage[0].path : '',
            vehicleRegImage: files.vehicleRegImage ? files.vehicleRegImage[0].path : '',
            avatar: files.avatar ? files.avatar[0].path : ''
        });
        await newReq.save();
        await User.findByIdAndUpdate(req.body.userId, { approvalStatus: 'pending' });
        res.status(201).json({ message: "Gửi hồ sơ Shipper thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CẤU HÌNH GMAIL GỬI THÔNG BÁO
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io", // ✅ Đúng host trong ảnh của bạn
    port: 2525, // ✅ Bạn dùng cổng 2525 cho ổn định
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendNotificationEmail = async (toEmail, subject, text) => {
    try {
        await transporter.sendMail({ from: '"HaFo Admin" <no-reply@hafo.com>', to: toEmail, subject, text });
    } catch (error) { console.error("Lỗi gửi mail:", error); }
};

// API DUYỆT HỒ SƠ
router.put('/approve/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        let emailToSend = "";
        let nameToSend = "";

        if (type === 'merchant') {
            const pending = await PendingRestaurant.findById(id);
            if (!pending) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });

            emailToSend = pending.email;
            nameToSend = pending.name;

            const newRestaurant = new Restaurant({
                owner: pending.userId,
                name: pending.name,
                address: pending.address,
                phone: pending.phone,
                image: pending.avatar,
                city: pending.city,
                district: pending.district,
                cuisine: pending.cuisine,
                openTime: pending.openTime || '07:00',
                closeTime: pending.closeTime || '22:00',
                priceRange: pending.priceRange,
                bankName: pending.bankName,
                bankAccount: pending.bankAccount,
                bankOwner: pending.bankOwner,
                bankBranch: pending.bankBranch,
                location: pending.location,
                isOpen: true
            });
            await newRestaurant.save();
            await User.findByIdAndUpdate(pending.userId, { role: 'merchant', restaurant: newRestaurant._id, approvalStatus: 'approved' });
            pending.status = 'approved';
            await pending.save();

        } else if (type === 'shipper') {
            const pending = await PendingShipper.findById(id);
            if (!pending) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });

            emailToSend = pending.email;
            nameToSend = pending.fullName;

            const newShipper = new Shipper({
                user: pending.userId,
                vehicleType: pending.vehicleType,
                licensePlate: pending.licensePlate,
                location: pending.location,
                bankName: pending.bankName,
                bankAccount: pending.bankAccount,
                bankOwner: pending.bankOwner,
                income: 0
            });
            await newShipper.save();
            await User.findByIdAndUpdate(pending.userId, { role: 'shipper', shipper: newShipper._id, fullName: pending.fullName, phone: pending.phone, approvalStatus: 'approved' });
            pending.status = 'approved';
            await pending.save();
        }

        if (emailToSend) {
            const content = `Xin chào ${nameToSend},\nHồ sơ đối tác tại HaFo đã được DUYỆT THÀNH CÔNG!\nTrân trọng.`;
            await sendNotificationEmail(emailToSend, "Hồ sơ HaFo đã được duyệt! 🎉", content);
        }
        res.json({ message: 'Đã duyệt thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API TỪ CHỐI HỒ SƠ
router.put('/reject/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    const { reason } = req.body;
    try {
        let p = (type === 'merchant') ? await PendingRestaurant.findByIdAndUpdate(id, { status: 'rejected' }) : await PendingShipper.findByIdAndUpdate(id, { status: 'rejected' });
        const email = p.email;
        const name = p.name || p.fullName;
        if (email) {
            const content = `Xin chào ${name},\nHồ sơ của bạn bị TỪ CHỐI.\nLý do: ${reason}\nTrân trọng.`;
            await sendNotificationEmail(email, "Thông báo hồ sơ HaFo ⚠️", content);
        }
        res.json({ message: 'Đã từ chối hồ sơ.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/count', async (req, res) => {
    const mCount = await PendingRestaurant.countDocuments({ status: 'pending' });
    const sCount = await PendingShipper.countDocuments({ status: 'pending' });
    res.json({ total: mCount + sCount });
});

router.get('/all', async (req, res) => {
    const merchants = await PendingRestaurant.find({ status: 'pending' });
    const shippers = await PendingShipper.find({ status: 'pending' });
    res.json({ merchants, shippers });
});

router.get('/notifications', async (req, res) => {
    try {
        // 1. Lấy đơn chờ duyệt
        const mPending = await PendingRestaurant.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5);
        const sPending = await PendingShipper.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5);

        // 2. Lấy khiếu nại chưa xử lý (Cần import Report model)
        const reports = await Report.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5);

        // 3. Lấy yêu cầu rút tiền (Cần import Transaction model)
        const trans = await Transaction.find({ status: 'pending' }).sort({ createdAt: -1 }).limit(5);

        // Tổng hợp tin nhắn
        let list = [];
        mPending.forEach(p => list.push({ id: p._id, type: 'reg', msg: `Quán mới: ${p.name}`, time: p.createdAt, link: '/admin/pending' }));
        sPending.forEach(p => list.push({ id: p._id, type: 'reg', msg: `Shipper mới: ${p.fullName}`, time: p.createdAt, link: '/admin/pending' }));
        reports.forEach(r => list.push({ id: r._id, type: 'report', msg: `Khiếu nại mới từ ${r.reporterRole}`, time: r.createdAt, link: '/admin/reports' }));
        trans.forEach(t => list.push({ id: t._id, type: 'withdraw', msg: `Yêu cầu rút tiền: ${t.amount.toLocaleString()}đ`, time: t.createdAt, link: '/admin/transactions' }));

        // Sắp xếp theo thời gian mới nhất
        list.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({
            total: list.length,
            notifications: list.slice(0, 10) // Lấy 10 cái mới nhất
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;