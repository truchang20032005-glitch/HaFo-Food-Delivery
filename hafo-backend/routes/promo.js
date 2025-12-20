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

// 3. BẬT/TẮT MÃ
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

module.exports = router;