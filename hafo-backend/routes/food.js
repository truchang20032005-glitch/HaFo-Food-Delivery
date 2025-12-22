const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Food = require('../models/Food');

// ========== CẤU HÌNH MULTER CHO FOOD ==========
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

// ========== API THÊM MÓN MỚI (CÓ UPLOAD ẢNH) ==========
router.post('/', upload.single('image'), async (req, res) => {
    console.log('📥 Nhận request thêm món:', req.body);
    console.log('📸 File ảnh:', req.file);

    const { name, price, description, restaurantId, category } = req.body;

    // Validation
    if (!restaurantId) {
        console.error('❌ Thiếu restaurantId');
        return res.status(400).json({ message: 'Lỗi: Không xác định được quán ăn!' });
    }
    if (!name || !price) {
        console.error('❌ Thiếu name hoặc price');
        return res.status(400).json({ message: 'Vui lòng nhập tên món và giá!' });
    }

    try {
        // Lấy đường dẫn ảnh (nếu có upload)
        const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : '';

        const newFood = new Food({
            name,
            price: Number(price),
            description,
            image: imagePath,
            category,
            restaurant: restaurantId
        });

        await newFood.save();
        console.log('✅ Đã tạo món mới:', newFood._id);
        res.status(201).json(newFood);
    } catch (error) {
        console.error("❌ Lỗi tạo món:", error);
        res.status(400).json({ message: error.message });
    }
});

// ========== API LẤY DANH SÁCH MÓN ==========
router.get('/', async (req, res) => {
    try {
        const foods = await Food.find().populate('restaurant', 'name');
        res.json(foods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ========== API XÓA MÓN ==========
router.delete('/:id', async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        
        // Xóa file ảnh nếu có
        if (food && food.image && fs.existsSync(food.image)) {
            fs.unlinkSync(food.image);
            console.log('🗑️ Đã xóa file ảnh:', food.image);
        }
        
        await Food.findByIdAndDelete(req.params.id);
        console.log('🗑️ Đã xóa món:', req.params.id);
        res.json({ message: 'Đã xóa món ăn' });
    } catch (error) {
        console.error('❌ Lỗi xóa món:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
