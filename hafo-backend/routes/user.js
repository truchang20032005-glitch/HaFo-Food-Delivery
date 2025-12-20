const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 1. LẤY THÔNG TIN PROFILE (Mới nhất từ DB)
// GET /api/user/:id
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password'); // Không trả về pass
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. CẬP NHẬT PROFILE
// PUT /api/user/:id
router.put('/:id', async (req, res) => {
    try {
        const { fullName, phone, email, gender, birthday, addresses } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { fullName, phone, email, gender, birthday, addresses },
            { new: true } // Trả về data mới sau khi update
        ).select('-password');

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;