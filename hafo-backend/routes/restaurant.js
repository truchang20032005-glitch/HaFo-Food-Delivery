const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');

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

module.exports = router;