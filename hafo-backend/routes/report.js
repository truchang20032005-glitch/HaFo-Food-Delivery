const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// 1. SHIPPER GỬI BÁO CÁO (Gọi từ ShipperHistory.js)
router.post('/review', async (req, res) => {
    try {
        const { orderId, shipperId, reason, reviewContent } = req.body;

        const newReport = new Report({
            orderId,
            shipperId,
            reason,
            reviewContent
        });

        await newReport.save();
        res.status(201).json({ message: "Gửi báo cáo thành công!", data: newReport });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ADMIN LẤY DANH SÁCH BÁO CÁO (Cho trang quản trị sau này)
router.get('/', async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('shipperId', 'fullName phone')
            .populate('orderId', '_id total')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. ADMIN XỬ LÝ BÁO CÁO
router.put('/:id/status', async (req, res) => {
    try {
        const { status, adminNote } = req.body;
        const updated = await Report.findByIdAndUpdate(
            req.params.id,
            { status, adminNote },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;