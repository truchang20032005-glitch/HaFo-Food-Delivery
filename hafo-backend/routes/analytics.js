const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');         // <--- 1. THÊM
const Restaurant = require('../models/Restaurant'); // <--- 2. THÊM

// 1. THỐNG KÊ TỔNG QUAN (Cập nhật để đếm User và Shop)
router.get('/admin/summary', async (req, res) => {
    try {
        // Đếm tổng số đơn
        const totalOrders = await Order.countDocuments();

        // Tính tổng doanh thu (đơn đã hoàn thành)
        const revenueData = await Order.aggregate([
            { $match: { status: 'done' } },
            { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        // Đếm số đơn theo trạng thái
        const statusCounts = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // --- CODE MỚI THÊM: Đếm User và Shop ---
        const totalUsers = await User.countDocuments({ role: 'customer' }); // Chỉ đếm khách hàng
        const totalShops = await Restaurant.countDocuments();
        // ---------------------------------------

        res.json({
            totalOrders,
            totalRevenue,
            statusCounts,
            totalUsers, // Trả về số liệu thật
            totalShops  // Trả về số liệu thật
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. BIỂU ĐỒ DOANH THU (Giữ nguyên code cũ của bạn)
router.get('/admin/chart', async (req, res) => {
    // ... (Code cũ giữ nguyên)
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyRevenue = await Order.aggregate([
            {
                $match: {
                    status: 'done',
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    dailyTotal: { $sum: "$total" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(dailyRevenue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 3. API TOP NHÀ HÀNG (THÊM MỚI)
router.get('/admin/top-restaurants', async (req, res) => {
    try {
        const topRest = await Order.aggregate([
            { $match: { status: 'done' } }, // Chỉ tính đơn hoàn thành
            {
                $group: {
                    _id: "$restaurantId",
                    totalRevenue: { $sum: "$total" },
                    totalOrders: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } }, // Sắp xếp doanh thu cao nhất
            { $limit: 5 }, // Lấy top 5
            {
                $lookup: {
                    from: "restaurants", // Tên collection trong DB (thường là số nhiều)
                    localField: "_id",
                    foreignField: "_id",
                    as: "restaurantInfo"
                }
            },
            { $unwind: "$restaurantInfo" },
            {
                $project: {
                    name: "$restaurantInfo.name",
                    totalRevenue: 1,
                    totalOrders: 1
                }
            }
        ]);
        res.json(topRest);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;