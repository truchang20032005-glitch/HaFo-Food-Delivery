// routes/notification.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const ReviewReply = require('../models/ReviewReply');
const CustomerReview = require('../models/CustomerReview');
const Order = require('../models/Order');
const Report = require('../models/Report');
const Restaurant = require('../models/Restaurant');

// 1. LẤY THÔNG BÁO CHO KHÁCH HÀNG (Customer)
router.get('/customer/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        let list = [];

        // Lấy phản hồi đánh giá chưa đọc
        const userReviews = await CustomerReview.find({ customerId: userId }).select('_id');
        const reviewIds = userReviews.map(r => r._id);
        const replies = await ReviewReply.find({
            reviewId: { $in: reviewIds },
            userRole: { $in: ['merchant', 'shipper'] },
            isReadByCustomer: false
        }).populate('reviewId');

        // Lấy khiếu nại Admin đã xử lý
        const userOrders = await Order.find({ userId: userId }).select('_id');
        const orderIds = userOrders.map(o => o._id);
        const adminWarnings = await Report.find({
            orderId: { $in: orderIds },
            status: { $ne: 'pending' },
            isReadByCustomer: false
        });

        // Lấy cảnh báo vi phạm từ AI (Bảng Notification)
        const aiWarnings = await Notification.find({ userId, isRead: false });

        // Gom tất cả vào một mảng chung
        replies.forEach(rep => list.push({
            id: rep.reviewId?._id || rep.reviewId,
            orderId: rep.reviewId?.orderId,
            notificationId: rep._id,
            type: 'reply',
            msg: `${rep.userRole === 'merchant' ? 'Nhà hàng' : 'Tài xế'} đã phản hồi đánh giá`,
            time: rep.createdAt,
            link: '/history'
        }));

        adminWarnings.forEach(warn => list.push({
            id: warn._id,
            orderId: warn.orderId,
            notificationId: warn._id,
            type: 'admin_warning',
            msg: `Thông báo Admin: ${warn.adminNote || 'Cập nhật khiếu nại'}`,
            time: warn.updatedAt,
            link: '/history'
        }));

        aiWarnings.forEach(warn => list.push({
            id: warn._id,
            notificationId: warn._id,
            type: 'warning',
            msg: warn.msg,
            time: warn.createdAt,
            link: '#'
        }));

        list.sort((a, b) => new Date(b.time) - new Date(a.time));
        res.json({ total: list.length, notifications: list });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. LẤY THÔNG BÁO CHO ĐỐI TÁC (Merchant/Shipper)
router.get('/partner/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        let list = [];

        // 1. Lấy cảnh báo vi phạm từ hệ thống (AI warnings) - MỚI BỔ SUNG
        const aiWarnings = await Notification.find({ userId, isRead: false });
        aiWarnings.forEach(warn => list.push({
            id: warn._id,
            notificationId: warn._id,
            type: 'warning',
            msg: warn.msg,
            time: warn.createdAt,
            link: '#'
        }));

        // 2. Lấy đơn hàng mới & Đánh giá mới cho Nhà hàng
        const restaurant = await Restaurant.findOne({ owner: userId });
        if (restaurant) {
            // Đơn hàng mới
            const newOrders = await Order.find({ restaurantId: restaurant._id, status: 'new' }).limit(5);
            newOrders.forEach(o => list.push({
                id: o._id,
                type: 'order',
                msg: `Đơn hàng mới #${o._id.toString().slice(-6).toUpperCase()}`,
                time: o.createdAt,
                link: '/merchant/orders'
            }));

            // Đánh giá mới cho quán - MỚI BỔ SUNG
            const newReviews = await CustomerReview.find({ restaurantId: restaurant._id }).sort({ createdAt: -1 }).limit(5);
            newReviews.forEach(rev => list.push({
                id: rev._id,
                type: 'review',
                msg: `Khách hàng vừa đánh giá quán của bạn`,
                time: rev.createdAt,
                link: '/merchant/reviews'
            }));
        }

        // 3. Lấy đánh giá mới cho Shipper - MỚI BỔ SUNG
        const shipper = await Shipper.findOne({ user: userId });
        if (shipper) {
            const shipReviews = await CustomerReview.find({ shipperId: userId }).sort({ createdAt: -1 }).limit(5);
            shipReviews.forEach(rev => list.push({
                id: rev._id,
                type: 'review',
                msg: `Bạn vừa nhận được một đánh giá mới`,
                time: rev.createdAt,
                link: '/shipper/history'
            }));
        }

        // 4. Lấy khiếu nại đã xử lý (Giữ nguyên)
        const reports = await Report.find({ reporterId: userId, status: { $ne: 'pending' }, isReadByPartner: false });
        reports.forEach(r => list.push({
            id: r._id,
            type: 'report_processed',
            msg: `Khiếu nại đơn #${r.orderId.toString().slice(-6).toUpperCase()} đã xử lý`,
            time: r.updatedAt,
            link: shipper ? '/shipper/history' : '/merchant/reviews'
        }));

        list.sort((a, b) => new Date(b.time) - new Date(a.time));
        res.json(list);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. ĐÁNH DẤU ĐÃ ĐỌC
router.put('/mark-read/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        if (type === 'reply') {
            await ReviewReply.findByIdAndUpdate(id, { isReadByCustomer: true });
        } else if (type === 'warning') {
            await Notification.findByIdAndUpdate(id, { isRead: true });
        } else if (type === 'admin_warning' || type === 'report_processed') {
            // ✅ Sửa lại: Cập nhật bảng Report
            await Report.findByIdAndUpdate(id, { isReadByCustomer: true, isReadByPartner: true });
        } else if (type === 'order') {
            // ✅ Đơn hàng mới thì không cần mark-read trong bảng Report, 
            // Có thể bỏ qua hoặc xử lý riêng tùy má
            return res.json({ message: "Đơn hàng mới không cần đánh dấu đọc" });
        }
        res.json({ message: "Đã đánh dấu đã đọc" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;