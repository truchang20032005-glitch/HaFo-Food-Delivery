const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// 1. THỐNG KÊ TỔNG QUAN (Cho Admin)
// GET /api/analytics/admin/summary
router.get('/admin/summary', async (req, res) => {
    try {
        // Đếm tổng số đơn
        const totalOrders = await Order.countDocuments();

        // Tính tổng doanh thu (cộng dồn trường total)
        // Lưu ý: Chỉ tính các đơn đã hoàn thành (status = 'done')
        const revenueData = await Order.aggregate([
            { $match: { status: 'done' } },
            { $group: { _id: null, totalRevenue: { $sum: "$total" } } }
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        // Đếm số đơn theo trạng thái
        const statusCounts = await Order.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        res.json({
            totalOrders,
            totalRevenue,
            statusCounts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. BIỂU ĐỒ DOANH THU 7 NGÀY GẦN NHẤT
// GET /api/analytics/admin/chart
router.get('/admin/chart', async (req, res) => {
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
            { $sort: { _id: 1 } } // Sắp xếp theo ngày tăng dần
        ]);

        res.json(dailyRevenue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;