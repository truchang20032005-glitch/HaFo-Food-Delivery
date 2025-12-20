const express = require('express');
const router = express.Router();
const Food = require('../models/Food');

// API THÊM MÓN MỚI
router.post('/', async (req, res) => {
    // 1. Nhận dữ liệu từ Frontend
    const { name, price, description, image, restaurantId, category } = req.body;

    // 2. Kiểm tra dữ liệu bắt buộc
    if (!restaurantId) {
        return res.status(400).json({ message: 'Lỗi: Không xác định được quán ăn! Vui lòng cập nhật thông tin quán trước.' });
    }
    if (!name || !price) {
        return res.status(400).json({ message: 'Vui lòng nhập tên món và giá!' });
    }

    try {
        const newFood = new Food({
            name,
            price,
            description,
            image,
            category,
            // --- SỬA LỖI Ở ĐÂY ---
            restaurant: restaurantId // Map 'restaurantId' từ FE vào trường 'restaurant' của DB
            // ---------------------
        });

        await newFood.save();
        res.status(201).json(newFood);
    } catch (error) {
        console.error("Lỗi tạo món:", error);
        res.status(400).json({ message: error.message });
    }
});

// Lấy danh sách món (Giữ nguyên)
router.get('/', async (req, res) => {
    try {
        const foods = await Food.find();
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Xóa món (Giữ nguyên)
router.delete('/:id', async (req, res) => {
    try {
        await Food.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa món ăn' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;