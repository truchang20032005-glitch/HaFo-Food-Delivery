const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Order = require('../models/Order');
const uploadCloud = require('../config/cloudinary');

// 1. TẠO QUÁN MỚI
router.post('/', async (req, res) => {
    try {
        const newRest = new Restaurant(req.body);
        await newRest.save();
        res.status(201).json(newRest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LẤY DANH SÁCH TẤT CẢ QUÁN KÈM DOANH THU (Dành cho Admin/Home)
router.get('/', async (req, res) => {
    try {
        // 1. Lấy danh sách quán và thông tin chủ sở hữu
        const restaurants = await Restaurant.find().populate('owner', 'fullName email phone');

        // 2. Tính doanh thu và số đơn của TẤT CẢ quán bằng 1 câu lệnh aggregate
        const stats = await Order.aggregate([
            { $match: { status: 'done' } },
            {
                $group: {
                    _id: '$restaurantId',
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 } // Đếm luôn số đơn cho tiện
                }
            }
        ]);

        // 3. Chuyển kết quả sang Map để tra cứu O(1)
        const statsMap = {};
        stats.forEach(item => {
            statsMap[item._id.toString()] = {
                revenue: item.totalRevenue,
                orders: item.totalOrders
            };
        });

        // 4. Hợp nhất dữ liệu
        const result = restaurants.map(rest => {
            const restStats = statsMap[rest._id.toString()] || { revenue: 0, orders: 0 };
            return {
                ...rest.toObject(),
                revenue: restStats.revenue,
                orders: restStats.orders
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. LẤY CHI TIẾT 1 QUÁN
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'fullName phone email');
        if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy quán' });
        res.json(restaurant);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. LẤY MENU CỦA 1 QUÁN
router.get('/:id/menu', async (req, res) => {
    try {
        const foods = await Food.find({ restaurant: req.params.id });
        res.json(foods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. TÌM QUÁN CỦA USER ĐANG ĐĂNG NHẬP (Cho Merchant Dashboard)
router.get('/my-shop/:userId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.params.userId });
        if (!restaurant) return res.status(404).json({ message: 'Chưa có thông tin quán' });
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. CẬP NHẬT THÔNG TIN QUÁN (Bao gồm upload ảnh)
router.put('/:id', uploadCloud.single('image'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.image = req.file.path;
        }
        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        res.json(updatedRestaurant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;