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

// 2. LẤY TẤT CẢ QUÁN (Gộp chung logic lấy stats cho Admin và Khách hàng)
router.get('/', async (req, res) => {
    try {
        // Lấy danh sách quán và thông tin chủ sở hữu
        const restaurants = await Restaurant.find().populate('owner', 'fullName email phone');

        // Tính toán thống kê cho từng quán (Dùng Promise.all để chạy song song)
        const result = await Promise.all(restaurants.map(async (rest) => {
            // Tính doanh thu từ các đơn đã hoàn thành (status: 'done')
            const stats = await Order.aggregate([
                {
                    $match: {
                        restaurantId: rest._id,
                        status: 'done'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRevenue: { $sum: '$total' }
                    }
                }
            ]);

            // Lấy tổng số đơn hàng của quán này
            const countAll = await Order.countDocuments({ restaurantId: rest._id });
            const revenueValue = stats[0] ? stats[0].totalRevenue : 0;

            return {
                ...rest.toObject(),
                orders: countAll || 0, // Đảm bảo luôn có số 0 nếu không có đơn
                revenue: revenueValue || 0 // Đảm bảo không bị undefined dẫn đến lỗi "undefinedđ"
            };
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. LẤY CHI TIẾT 1 QUÁN + MENU
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        const foods = await Food.find({ restaurant: req.params.id });
        res.json({ restaurant, foods });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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