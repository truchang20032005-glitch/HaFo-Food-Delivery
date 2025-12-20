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
            const p = await PendingRestaurant.findById(id);
            if (!p) return res.status(404).json({ message: 'Lỗi' });

            // COPY FULL DỮ LIỆU
            const newRest = new Restaurant({
                owner: p.userId,
                name: p.name,
                address: p.address,
                phone: p.phone,
                image: p.avatar,
                city: p.city,
                district: p.district,
                cuisine: p.cuisine,
                openTime: p.openTime,
                closeTime: p.closeTime,
                priceRange: p.priceRange,
                bankName: p.bankName,
                bankAccount: p.bankAccount,
                bankOwner: p.bankOwner,
                bankBranch: p.bankBranch,
                isOpen: true
            });
            await newRest.save();

            await User.findByIdAndUpdate(p.userId, { role: 'merchant' });
            p.status = 'approved';
            await p.save();
        }
        else if (type === 'shipper') {
            const p = await PendingShipper.findById(id);
            if (!p) return res.status(404).json({ message: 'Lỗi' });

            const newShip = new Shipper({
                user: p.userId,
                vehicleType: p.vehicleType,
                licensePlate: p.licensePlate,
                currentLocation: p.area,
                bankName: p.bankName,
                bankAccount: p.bankAccount,
                bankOwner: p.bankOwner,
                income: 0
            });
            await newShip.save();

            await User.findByIdAndUpdate(p.userId, {
                role: 'shipper', fullName: p.fullName, phone: p.phone
            });
            p.status = 'approved';
            await p.save();
        }
        res.json({ message: 'Đã duyệt và đồng bộ dữ liệu!' });
    } catch (err) {
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