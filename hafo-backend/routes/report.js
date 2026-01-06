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

// API Đánh dấu đã đọc báo cáo dành cho Shipper/Merchant
router.put('/mark-read-partner/:id', async (req, res) => {
    try {
        await Report.findByIdAndUpdate(req.params.id, { isReadByPartner: true });
        res.json({ message: "Đã đánh dấu đã đọc báo cáo" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/notifications/partner/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        // Tìm các báo cáo do user này gửi mà đã được xử lý và chưa đọc
        const reports = await Report.find({
            reporterId: userId,
            status: { $ne: 'pending' },
            isReadByPartner: false // Bạn nên thêm trường này vào Model Report tương tự Khách hàng
        }).sort({ updatedAt: -1 });

        const newOrders = await Order.find({
            restaurantId: shopId,
            status: 'new'
        }).sort({ createdAt: -1 }).limit(5);

        newOrders.forEach(o => {
            list.push({
                id: o._id,          // Để khi click vào thì biết ID đơn nào
                type: 'order',      // Loại thông báo đơn hàng
                msg: `Bạn có đơn hàng mới #${o._id.toString().slice(-6).toUpperCase()}`,
                time: o.createdAt,
                link: '/merchant/orders' // Đường dẫn khi click vào thông báo
            });
        });

        const list = reports.map(r => ({
            id: r._id,
            notificationId: r._id,
            type: 'report_processed',
            time: r.updatedAt,
            msg: `Khiếu nại đơn #${r.orderId.toString().slice(-6).toUpperCase()} đã được Admin xử lý: ${r.adminNote}`,
            time: r.updatedAt
        }));

        list.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;