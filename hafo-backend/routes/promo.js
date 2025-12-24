const express = require('express');
const router = express.Router();
const Promo = require('../models/Promo');

// 1. LẤY MÃ CỦA QUÁN
router.get('/:restaurantId', async (req, res) => {
    try {
        const promos = await Promo.find({ restaurantId: req.params.restaurantId });
        res.json(promos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. TẠO MÃ MỚI
router.post('/', async (req, res) => {
    try {
        const newPromo = new Promo(req.body);
        await newPromo.save();
        res.status(201).json(newPromo);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 3. CẬP NHẬT THÔNG TIN MÃ (Sửa mã, giá trị...)
router.put('/update/:id', async (req, res) => {
    try {
        const updatedPromo = await Promo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedPromo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. BẬT/TẮT TRẠNG THÁI (Toggle Active)
router.put('/:id', async (req, res) => {
    try {
        const promo = await Promo.findById(req.params.id);
        promo.isActive = !promo.isActive;
        await promo.save();
        res.json(promo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. XÓA MÃ
router.delete('/:id', async (req, res) => {
    try {
        await Promo.findByIdAndDelete(req.params.id);
        res.json({ message: 'Đã xóa mã khuyến mãi' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;