const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const uploadCloud = require('../config/cloudinary');

// 1. TẠO QUÁN MỚI (Khi Merchant đăng ký thông tin quán)
router.post('/', async (req, res) => {
    try {
        const newRest = new Restaurant(req.body);
        await newRest.save();
        res.status(201).json(newRest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LẤY TẤT CẢ QUÁN (Cho trang chủ Khách hàng)
router.get('/', async (req, res) => {
    try {
        const rests = await Restaurant.find();
        res.json(rests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ THÊM ROUTE NÀY - Lấy thông tin quán của merchant
router.get('/my-shop/:userId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.params.userId });

        if (!restaurant) {
            console.log('❌ Không tìm thấy restaurant');
            return res.status(404).json({ message: 'Chưa có thông tin quán' });
        }

        res.json(restaurant);
    } catch (err) {
        console.error('❌ Lỗi:', err);
        res.status(500).json({ error: err.message });
    }
});

// 3. LẤY CHI TIẾT 1 QUÁN + MENU (Cho trang Chi tiết quán)
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        const foods = await Food.find({ restaurant: req.params.id });
        res.json({ restaurant, foods });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ✅ THÊM ROUTE NÀY - Lấy menu của 1 quán
router.get('/:id/menu', async (req, res) => {
    try {
        const foods = await Food.find({ restaurant: req.params.id });
        res.json(foods);
    } catch (err) {
        console.error('❌ Lỗi lấy menu:', err);
        res.status(500).json({ error: err.message });
    }
});

// 4. TÌM QUÁN CỦA USER ĐANG ĐĂNG NHẬP (Cho Merchant Dashboard)
router.get('/owner/:userId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.params.userId });
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LẤY TẤT CẢ QUÁN (KÈM THỐNG KÊ DOANH THU CHO ADMIN)
router.get('/', async (req, res) => {
    try {
        // Lấy danh sách quán và thông tin chủ sở hữu
        const restaurants = await Restaurant.find().populate('owner', 'fullName email phone');

        // Tính toán thống kê cho từng quán (Dùng Promise.all để chạy song song cho nhanh)
        const result = await Promise.all(restaurants.map(async (rest) => {
            // Tính tổng đơn và doanh thu từ bảng Order
            const stats = await Order.aggregate([
                {
                    $match: {
                        restaurantId: rest._id,
                        status: 'done' // Chỉ tính đơn đã hoàn thành cho doanh thu
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalOrders: { $sum: 1 }, // Đếm số đơn
                        totalRevenue: { $sum: '$total' } // Cộng tổng tiền
                    }
                }
            ]);

            // Lấy tổng đơn (kể cả chưa hoàn thành) để hiển thị số lượng order
            const countAll = await Order.countDocuments({ restaurantId: rest._id });

            const statData = stats[0] || { totalOrders: 0, totalRevenue: 0 };

            return {
                ...rest.toObject(),
                orders: countAll, // Tổng số đơn đã đặt
                revenue: statData.totalRevenue // Doanh thu thực tế (đã done)
            };
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// THÊM Route cập nhật thông tin quán (Bao gồm upload ảnh)
router.put('/:id', uploadCloud.single('image'), async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Nếu có upload ảnh mới thì cập nhật link
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