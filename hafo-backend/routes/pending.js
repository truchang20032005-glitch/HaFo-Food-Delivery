const express = require('express');
const router = express.Router();
const PendingRestaurant = require('../models/PendingRestaurant');
const PendingShipper = require('../models/PendingShipper');
const Restaurant = require('../models/Restaurant');
const Shipper = require('../models/Shipper');
const User = require('../models/User');

// 1. GỬI HỒ SƠ (Giữ nguyên code cũ)
router.post('/merchant', async (req, res) => {
    try {
        const newReq = new PendingRestaurant(req.body);
        await newReq.save();
        res.status(201).json({ message: "Gửi hồ sơ thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/shipper', async (req, res) => {
    try {
        const newReq = new PendingShipper(req.body);
        await newReq.save();
        res.status(201).json({ message: "Gửi hồ sơ thành công!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ADMIN LẤY DANH SÁCH CHỜ (Chỉnh lại để lấy real data)
router.get('/all', async (req, res) => {
    try {
        // Chỉ lấy những đơn có trạng thái là 'pending'
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

            // 1. Tạo Quán ngay lập tức
            const newRestaurant = new Restaurant({
                owner: pending.userId, // Quan trọng: ID của user chủ quán
                name: pending.name,
                address: pending.address,
                phone: pending.phone,
                // Các thông tin khác
                city: pending.city,
                openTime: pending.openTime || '07:00',
                closeTime: pending.closeTime || '22:00',
                isOpen: true,
                rating: 5.0
            });

            const savedRest = await newRestaurant.save();
            console.log("-> Đã tạo quán:", savedRest._id);

            // 2. Nâng cấp User
            await User.findByIdAndUpdate(pending.userId, { role: 'merchant' });

            // 3. Xong đơn
            pending.status = 'approved';
            await pending.save();

        } else if (type === 'shipper') {
            const pending = await PendingShipper.findById(id);
            if (!pending) return res.status(404).json({ message: 'Không tìm thấy hồ sơ' });

            // 1. Tạo Shipper
            const newShipper = new Shipper({
                user: pending.userId,
                vehicleType: pending.vehicleType,
                licensePlate: pending.licensePlate,
                currentLocation: pending.city,
                income: 0
            });
            await newShipper.save();

            // 2. Cập nhật User
            await User.findByIdAndUpdate(pending.userId, {
                role: 'shipper',
                fullName: pending.fullName,
                phone: pending.phone
            });

            pending.status = 'approved';
            await pending.save();
        }

        res.json({ message: 'Đã duyệt và tạo dữ liệu thành công!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// --- 4. API TỪ CHỐI HỒ SƠ ---
router.put('/reject/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        if (type === 'merchant') {
            await PendingRestaurant.findByIdAndUpdate(id, { status: 'rejected' });
        } else {
            await PendingShipper.findByIdAndUpdate(id, { status: 'rejected' });
        }
        res.json({ message: 'Đã từ chối hồ sơ.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;