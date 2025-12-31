const express = require('express');
const router = express.Router();
const Shipper = require('../models/Shipper');
const Order = require('../models/Order');
const User = require('../models/User');
const Report = require('../models/Report'); //
const CustomerReview = require('../models/CustomerReview'); //
const ReviewReply = require('../models/ReviewReply'); //


// 1. ĐĂNG KÝ HỒ SƠ SHIPPER (Giữ nguyên)
router.post('/', async (req, res) => {
    try {
        const newShipper = new Shipper(req.body);
        await newShipper.save();
        res.status(201).json(newShipper);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CẬP NHẬT HỒ SƠ SHIPPER
router.put('/profile/:userId', async (req, res) => {
    try {
        const {
            fullName, phone, email, // Dữ liệu của bảng User
            vehicleType, licensePlate, // Dữ liệu của bảng Shipper
            bankName, bankAccount, bankOwner, bankBranch
        } = req.body;

        // 1. Cập nhật bảng User để đổi fullName
        if (fullName || phone || email) {
            await User.findByIdAndUpdate(req.params.userId, {
                fullName,
                phone,
                email
            });
        }

        // 2. Cập nhật bảng Shipper và trả về dữ liệu mới nhất
        const updatedShipper = await Shipper.findOneAndUpdate(
            { user: req.params.userId },
            {
                vehicleType,
                licensePlate,
                bankName,
                bankAccount,
                bankOwner,
                bankBranch
            },
            { new: true, runValidators: true } // Trả về data sau khi sửa
        ).populate('user', '-password'); // Lấy luôn thông tin User mới cập nhật

        if (!updatedShipper) {
            return res.status(404).json({ message: "Không tìm thấy hồ sơ shipper" });
        }

        res.json(updatedShipper);
    } catch (err) {
        console.error("Lỗi cập nhật profile:", err);
        res.status(500).json({ message: "Lỗi hệ thống: " + err.message });
    }
});

// 3. LẤY HỒ SƠ SHIPPER THEO USER ID (Giữ nguyên)
router.get('/profile/:userId', async (req, res) => {
    try {
        const shipperProfile = await Shipper.findOne({ user: req.params.userId }).populate('user', 'fullName phone email avatar');
        if (!shipperProfile) {
            return res.status(404).json({ message: "Chưa có hồ sơ shipper" });
        }
        res.json(shipperProfile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. LẤY DANH SÁCH SHIPPER
router.get('/', async (req, res) => {
    try {
        const shippers = await Shipper.find().populate('user', 'fullName phone email avatar');

        const result = await Promise.all(shippers.map(async (shipper) => {
            // ✅ SỬA TẠI ĐÂY: Đếm dựa trên User ID thay vì Shipper ID
            // Vì ShipperHistory đang dùng user.id để lọc, nên ta phải đếm theo user.id
            const orderCount = await Order.countDocuments({
                shipperId: shipper.user._id, // Dùng ID của bảng User
                status: 'done'
            });

            return {
                ...shipper.toObject(),
                orders: orderCount || 0,
                income: shipper.income || 0
            };
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API CẬP NHẬT TỌA ĐỘ THỰC TẾ 
router.put('/location/:userId', async (req, res) => {
    try {
        const { lat, lng } = req.body;

        // Cập nhật vị trí chuẩn GeoJSON [lng, lat]
        const updatedShipper = await Shipper.findOneAndUpdate(
            { user: req.params.userId },
            {
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                }
            },
            { new: true }
        );

        if (!updatedShipper) return res.status(404).json({ message: "Không tìm thấy shipper" });
        res.json({ message: "Đã cập nhật vị trí", location: updatedShipper.location });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API lấy thông báo cho Shipper (Gần giống Merchant nhưng lọc cho Shipper)
router.get('/notifications/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;

        // 1. Lấy đánh giá từ khách mà Shipper CHƯA phản hồi
        const allReviews = await CustomerReview.find({ shipperId: userId })
            .populate('customerId', 'fullName')
            .sort({ createdAt: -1 });

        const unrepliedReviews = [];
        for (const rev of allReviews) {
            const shipperReply = await ReviewReply.findOne({
                reviewId: rev._id,
                userRole: 'shipper'
            });
            if (!shipperReply) unrepliedReviews.push(rev);
            if (unrepliedReviews.length >= 5) break;
        }

        // 2. Lấy báo cáo của Shipper đã được Admin xử lý
        const processedReports = await Report.find({
            reporterId: userId,
            reporterRole: 'shipper',
            status: { $ne: 'pending' }
        }).sort({ updatedAt: -1 }).limit(5);

        // 3. Tổng hợp danh sách
        let list = [];

        unrepliedReviews.forEach(r => {
            list.push({
                id: r.orderId, // ✅ Quan trọng: Gửi ID đơn hàng để Frontend tìm đơn
                type: 'review',
                msg: `Khách ${r.customerId?.fullName || ''} đánh giá bạn ${r.rating} sao`,
                time: r.createdAt,
                link: '/shipper/history'
            });
        });

        processedReports.forEach(rep => {
            const statusText = rep.status === 'processed' ? 'ĐÃ CHẤP NHẬN' : 'ĐÃ TỪ CHỐI';
            list.push({
                type: 'report_resolved',
                msg: `Khiếu nại của bạn: Admin ${statusText}`,
                time: rep.updatedAt,
                link: '/shipper/history'
            });
        });

        list.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({
            total: list.length,
            notifications: list
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;