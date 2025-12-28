const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// --- 1. LẤY DANH SÁCH TẤT CẢ ĐƠN (Cho Admin/Chủ quán) ---
router.get('/', async (req, res) => {
    try {
        const { restaurantId, shipperId } = req.query;
        let query = {};

        if (restaurantId) query.restaurantId = restaurantId;

        if (shipperId) {
            query.$or = [
                { shipperId: shipperId },
                // { status: 'prep', shipperId: null } 
            ];
        }

        // --- SỬA Ở ĐÂY: Thêm .populate('restaurantId', 'name') ---
        const orders = await Order.find(query)
            .populate('restaurantId', 'name') // Lấy tên quán từ ID quán
            .sort({ createdAt: -1 });

        res.json(orders);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 2. API LẤY CHI TIẾT 1 ĐƠN HÀNG ---
router.get('/:id', async (req, res) => {
    try {
        // THÊM .populate('restaurantId') ĐỂ LẤY TÊN, ĐỊA CHỈ, SDT QUÁN
        const order = await Order.findById(req.params.id)
            .populate('restaurantId')
            .populate('shipperId', 'fullName phone avatar'); // Lấy luôn thông tin tài xế ở đây

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 3. TẠO ĐƠN HÀNG MỚI (CẬP NHẬT) ---
router.post('/', async (req, res) => {
    // Nhận thêm restaurantId từ Frontend gửi xuống
    const { customer, items, total, userId, restaurantId } = req.body;

    try {
        const newOrder = new Order({
            userId,
            restaurantId, // <-- Lưu restaurantId vào DB
            customer,
            items, // <-- Lưu mảng items chi tiết
            total
        });
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        console.error("Lỗi tạo đơn:", error);
        res.status(400).json({ message: error.message });
    }
});

// --- 4. CẬP NHẬT TRẠNG THÁI ĐƠN ---
router.put('/:id', async (req, res) => {
    // Đổi rating -> restaurantRating, shipperRating
    const { status, shipperId, restaurantRating, shipperRating, review, isReviewed } = req.body;
    let updateData = {};

    if (status) updateData.status = status;
    if (shipperId) updateData.shipperId = shipperId;

    // Cập nhật đúng tên trường mới
    if (restaurantRating) updateData.restaurantRating = restaurantRating;
    if (shipperRating) updateData.shipperRating = shipperRating;

    if (review) updateData.review = review;
    if (isReviewed !== undefined) updateData.isReviewed = isReviewed;

    try {
        const updatedOrder = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- 5. LẤY LỊCH SỬ ĐƠN CỦA 1 USER ---
router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// API lấy đơn cho Shipper
router.get('/available-orders', async (req, res) => {
    try {
        const { lat, lng, radius = 5000 } = req.query; // mặc định 5km

        // Tìm các Quán ăn trong bán kính shipper
        const nearbyRestaurants = await Restaurant.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(radius)
                }
            }
        }).select('_id');

        const restaurantIds = nearbyRestaurants.map(r => r._id);

        // Chỉ lấy những đơn thuộc các quán gần đây
        const orders = await Order.find({
            restaurantId: { $in: restaurantIds },
            status: 'pending'
        }).populate('restaurantId');

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;