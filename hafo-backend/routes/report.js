const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const CustomerReview = require('../models/CustomerReview');
const { checkContentAI } = require('../utils/aiModerator'); // Import bộ quét AI
const User = require('../models/User'); // Import model User để xử phạt
const { sendLockAccountEmail } = require('./auth');
const Notification = require('../models/Notification');

// Gửi báo cáo (Merchant hoặc Shipper gọi chung API này)
router.post('/review', async (req, res) => {
    try {
        const { orderId, reporterId, reporterRole, reason, reviewContent } = req.body;

        // 1. KIỂM TRA NGÔN TỪ TRONG LÝ DO BÁO CÁO BẰNG AI
        const isBad = await checkContentAI(reason);

        if (isBad) {
            const user = await User.findById(reporterId);
            if (user) {
                user.violationCount = (user.violationCount || 0) + 1; // Tăng số lần vi phạm

                // Nếu vi phạm từ lần thứ 3 -> Khóa tài khoản 7 ngày
                if (user.violationCount >= 3) {
                    const LOCK_DAYS = 7;
                    const unlockDate = new Date();
                    unlockDate.setDate(unlockDate.getDate() + LOCK_DAYS);

                    user.status = 'locked';
                    user.lockReason = "Sử dụng ngôn từ khiếm nhã khi gửi báo cáo khiếu nại";
                    user.lockUntil = unlockDate;
                    await user.save();

                    // Gửi email thông báo khóa nick
                    await sendLockAccountEmail(user.email, user.fullName, user.lockReason, LOCK_DAYS, unlockDate);

                    return res.status(403).json({
                        message: "Tài khoản của bạn đã bị khóa do sử dụng ngôn từ không phù hợp khi báo cáo!",
                        violationCount: user.violationCount
                    });
                } else {
                    // Vi phạm lần 1 hoặc 2 -> Cảnh cáo
                    await user.save();
                    return res.status(400).json({
                        message: `Cảnh báo: Nội dung báo cáo không phù hợp. Bạn đã vi phạm ${user.violationCount}/3 lần. Tái diễn sẽ bị khóa tài khoản!`,
                        violationCount: user.violationCount
                    });
                }
            }
        }

        // 2. NẾU NỘI DUNG SẠCH -> LƯU BÁO CÁO NHƯ CŨ
        const newReport = new Report({
            orderId,
            reporterId,
            reporterRole,
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
        res.status(500).json({ message: err.message });
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
        let notifications = []; // ✅ Khởi tạo mảng thông báo chung

        // 1. Tìm các báo cáo (khiếu nại) đã được xử lý
        const reports = await Report.find({
            reporterId: userId,
            status: { $ne: 'pending' },
            isReadByPartner: false
        }).sort({ updatedAt: -1 });

        // Đẩy báo cáo vào mảng chung
        reports.forEach(r => {
            notifications.push({
                id: r._id,
                type: 'report_processed',
                msg: `Khiếu nại đơn #${r.orderId.toString().slice(-6).toUpperCase()} đã được xử lý: ${r.adminNote}`,
                time: r.updatedAt,
                link: '/shipper/history' // Hoặc link phù hợp với role
            });
        });

        // 2. Nếu là Nhà hàng, lấy thêm thông báo đơn hàng mới
        // (Bước này cần tìm xem user này có quán nào không)
        const restaurant = await Restaurant.findOne({ owner: userId });
        if (restaurant) {
            const newOrders = await Order.find({
                restaurantId: restaurant._id,
                status: 'new'
            }).sort({ createdAt: -1 }).limit(5);

            newOrders.forEach(o => {
                notifications.push({
                    id: o._id,
                    type: 'order',
                    msg: `Bạn có đơn hàng mới #${o._id.toString().slice(-6).toUpperCase()}`,
                    time: o.createdAt,
                    link: '/merchant/orders'
                });
            });
        }

        // Sắp xếp tất cả theo thời gian mới nhất
        notifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json(notifications);

    } catch (err) {
        console.error("LỖI NOTIFICATION:", err); // ✅ Thêm dòng này để Terminal hiện lỗi cho bạn thấy
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;