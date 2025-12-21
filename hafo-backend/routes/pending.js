const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const PendingRestaurant = require('../models/PendingRestaurant');
const PendingShipper = require('../models/PendingShipper');
const Restaurant = require('../models/Restaurant');
const Shipper = require('../models/Shipper');
const User = require('../models/User');

// --- CẤU HÌNH MULTER ---

// 1. Đảm bảo thư mục uploads tồn tại
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 2. Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Đặt tên file: timestamp-tengoc (xử lý ký tự đặc biệt)
        const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
        cb(null, Date.now() + '-' + cleanFileName);
    }
});

// 3. Bộ lọc file (Chỉ cho phép Ảnh và PDF)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Chấp nhận
    } else {
        cb(new Error('Sai định dạng! Chỉ chấp nhận file ảnh (JPEG, PNG) hoặc PDF.'), false); // Từ chối
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn 5MB mỗi file
});

// 2. API ĐĂNG KÝ NHÀ HÀNG (CÓ UPLOAD ẢNH)
router.post('/merchant', upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'idCardFront', maxCount: 1 },
    { name: 'idCardBack', maxCount: 1 },
    { name: 'businessLicense', maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files || {};

        const newReq = new PendingRestaurant({
            ...req.body,
            avatar: files.avatar ? files.avatar[0].path.replace(/\\/g, "/") : '',
            idCardFront: files.idCardFront ? files.idCardFront[0].path.replace(/\\/g, "/") : '',
            idCardBack: files.idCardBack ? files.idCardBack[0].path.replace(/\\/g, "/") : '',
            businessLicense: files.businessLicense ? files.businessLicense[0].path.replace(/\\/g, "/") : '',

            cuisine: req.body.cuisine ? (Array.isArray(req.body.cuisine) ? req.body.cuisine : [req.body.cuisine]) : []
        });

        await newReq.save();
        res.status(201).json({ message: "Gửi hồ sơ nhà hàng thành công!", code: newReq._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 3. API ĐĂNG KÝ SHIPPER (CÓ UPLOAD ẢNH)
router.post('/shipper', upload.fields([
    { name: 'cccdFront', maxCount: 1 },
    { name: 'cccdBack', maxCount: 1 },
    { name: 'licenseImage', maxCount: 1 },
    { name: 'vehicleRegImage', maxCount: 1 },
    { name: 'avatar', maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files || {};

        const newReq = new PendingShipper({
            ...req.body,
            cccdFront: files.cccdFront ? files.cccdFront[0].path.replace(/\\/g, "/") : '',
            cccdBack: files.cccdBack ? files.cccdBack[0].path.replace(/\\/g, "/") : '',
            licenseImage: files.licenseImage ? files.licenseImage[0].path.replace(/\\/g, "/") : '',
            vehicleRegImage: files.vehicleRegImage ? files.vehicleRegImage[0].path.replace(/\\/g, "/") : '',
            avatar: files.avatar ? files.avatar[0].path.replace(/\\/g, "/") : ''
        });

        await newReq.save();
        res.status(201).json({ message: "Gửi hồ sơ Shipper thành công!", code: newReq._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. ADMIN LẤY DANH SÁCH CHỜ (Chỉnh lại để lấy real data)
router.get('/all', async (req, res) => {
    try {
        const merchants = await PendingRestaurant.find({ status: 'pending' });
        const shippers = await PendingShipper.find({ status: 'pending' });
        res.json({ merchants, shippers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API DUYỆT HỒ SƠ (ĐÃ FIX KỸ LOGIC TẠO QUÁN)
router.put('/approve/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        if (type === 'merchant') {
            const pending = await PendingRestaurant.findById(id);
            if (!pending) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });

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
                bankName: pending.bankName,
                bankAccount: pending.bankAccount,
                bankOwner: pending.bankOwner,
                isOpen: true
            });
            await newRestaurant.save();

            await User.findByIdAndUpdate(pending.userId, { role: 'merchant' });
            pending.status = 'approved';
            await pending.save();

        } else if (type === 'shipper') {
            const pending = await PendingShipper.findById(id);
            if (!pending) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });

            const newShipper = new Shipper({
                user: pending.userId,
                vehicleType: pending.vehicleType,
                licensePlate: pending.licensePlate,
                currentLocation: pending.district || 'TP.HCM',
                bankName: pending.bankName,
                bankAccount: pending.bankAccount,
                bankOwner: pending.bankOwner,
                income: 0
            });
            await newShipper.save();

            await User.findByIdAndUpdate(pending.userId, {
                role: 'shipper',
                fullName: pending.fullName,
                phone: pending.phone
            });
            pending.status = 'approved';
            await pending.save();
        }
        res.json({ message: 'Đã duyệt thành công!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/reject/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        if (type === 'merchant') await PendingRestaurant.findByIdAndUpdate(id, { status: 'rejected' });
        else await PendingShipper.findByIdAndUpdate(id, { status: 'rejected' });
        res.json({ message: 'Đã từ chối.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;