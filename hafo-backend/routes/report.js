const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const CustomerReview = require('../models/CustomerReview');
const { checkContentAI } = require('../utils/aiModerator');
const User = require('../models/User');
const { handleViolation } = require('./user');
const { sendLockAccountEmail } = require('./auth');

// 1. GỬI BÁO CÁO (Merchant hoặc Shipper gọi chung)
router.post('/review', async (req, res) => {
    try {
        const { orderId, reporterId, reporterRole, reason, reviewContent } = req.body;

        // 🟢 BƯỚC 1: KIỂM TRA NGÔN TỪ LÝ DO BÁO CÁO
        const isBad = await checkContentAI(reason);

        if (isBad) {
            // ✅ SỬA: Gọi hàm xử phạt từ user.js (Hàm này tự lo đếm số lần, lưu Notification và khóa nick)
            const count = await handleViolation(reporterId, "Sử dụng ngôn từ khiếm nhã khi gửi báo cáo khiếu nại");

            return res.status(400).json({
                message: `Nội dung báo cáo vi phạm quy tắc cộng đồng! Bạn đã vi phạm ${count}/3 lần.`,
                violationCount: count
            });
        }

        // 🟢 BƯỚC 2: LƯU BÁO CÁO
        const newReport = new Report({
            orderId,
            reporterId,
            reporterRole,
            reason,
            reviewContent
        });
        await newReport.save();

        // Cập nhật trạng thái đã báo cáo bên phía Review
        await CustomerReview.findOneAndUpdate(
            { orderId: orderId },
            { isReported: true }
        );

        res.status(201).json({ message: "Gửi báo cáo thành công!", data: newReport });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. ADMIN LẤY DANH SÁCH BÁO CÁO
router.get('/', async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporterId', 'fullName phone avatar')
            .populate('orderId', '_id total customer')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ message: err.message });
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
        res.status(500).json({ message: err.message });
    }
});

// 4. ĐÁNH DẤU ĐÃ ĐỌC (Dành cho Shipper/Merchant)
router.put('/mark-read-partner/:id', async (req, res) => {
    try {
        await Report.findByIdAndUpdate(req.params.id, { isReadByPartner: true });
        res.json({ message: "Đã đánh dấu đã đọc báo cáo" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


module.exports = router;