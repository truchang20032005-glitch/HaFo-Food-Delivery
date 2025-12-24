const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Food = require('../models/Food');

const uploadDir = 'uploads/foods';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, WEBP)'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ========== API THÊM MÓN ==========
router.post('/', upload.single('image'), async (req, res) => {
    // ... (Code cũ của bạn, đảm bảo có xử lý options/toppings)
    try {
        const { name, price, description, restaurantId, options, toppings } = req.body;
        const imagePath = req.file ? req.file.path.replace(/\\/g, "/") : "";

        let parsedOptions = [];
        let parsedToppings = [];
        if (options) { try { parsedOptions = JSON.parse(options); } catch (e) { } }
        if (toppings) { try { parsedToppings = JSON.parse(toppings); } catch (e) { } }

        const newFood = new Food({
            name,
            price: Number(price),
            description,
            image: imagePath,
            restaurant: restaurantId,
            options: parsedOptions,
            toppings: parsedToppings
        });

        await newFood.save();
        res.status(201).json(newFood);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// ========== API SỬA MÓN (MỚI) ==========
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, price, description, isAvailable, options, toppings } = req.body;

        const updateData = {
            name,
            price: Number(price),
            description,
            isAvailable: isAvailable === 'true' // Chuyển string sang boolean
        };

        // Nếu có file ảnh mới thì cập nhật, không thì giữ nguyên
        if (req.file) {
            updateData.image = req.file.path.replace(/\\/g, "/");
        }

        // Cập nhật Options & Toppings
        if (options) {
            try { updateData.options = JSON.parse(options); } catch (e) { }
        }
        if (toppings) {
            try { updateData.toppings = JSON.parse(toppings); } catch (e) { }
        }

        const updatedFood = await Food.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedFood);
    } catch (error) {
        console.error("Lỗi sửa món:", error);
        res.status(400).json({ message: error.message });
    }
});

// API Lấy danh sách món
router.get('/', async (req, res) => {
    try {
        const foods = await Food.find().populate('restaurant', 'name');
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// API Lấy chi tiết 1 món
router.get('/:id', async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        res.json(food);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// API Lấy menu quán
router.get('/:id/menu', async (req, res) => {
    try {
        const foods = await Food.find({ restaurant: req.params.id });
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// API Xóa món
router.delete('/:id', async (req, res) => {
    try {
        await Food.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;