const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const CustomerReview = require('../models/CustomerReview');

// Gửi báo cáo (Merchant hoặc Shipper gọi chung API này)
router.post('/review', async (req, res) => {
    try {
        const { orderId, reporterId, reporterRole, reason, reviewContent } = req.body;

        const newReport = new Report({
            orderId,
            reporterId,
            reporterRole, // 'merchant' hoặc 'shipper'
            reason,
            reviewContent
        });
        await newReport.save();

        // Cập nhật trạng thái báo cáo bên phía Review để UI hiển thị "Đã báo cáo"
        await CustomerReview.findOneAndUpdate(
            { orderId: orderId },
            { isReported: true }
        );

        res.status(201).json({ message: "Gửi báo cáo thành công!", data: newReport });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. ADMIN LẤY DANH SÁCH BÁO CÁO (Cho trang quản trị sau này)
router.get('/', async (req, res) => {
    try {
        const reports = await Report.find()
            // Sửa shipperId thành reporterId cho đúng với Model Report.js
            .populate('reporterId', 'fullName phone avatar')
            .populate('orderId', '_id total customer')
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