const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// --- 1. LẤY DANH SÁCH TẤT CẢ ĐƠN (Cho Admin/Chủ quán) ---
router.get('/', async (req, res) => {
    try {
        const { restaurantId, shipperId } = req.query;
        let query = {};

        // Nếu có truyền restaurantId -> Chỉ lấy đơn của quán đó
        if (restaurantId) {
            query.restaurantId = restaurantId;
        }

        // Nếu có truyền shipperId -> Chỉ lấy đơn của shipper đó
        if (shipperId) {
            // Logic cho shipper: Đơn đã nhận (pickup/done)
            // HOẶC có thể thêm logic lấy đơn 'prep' chưa có shipper nếu cần
            query.$or = [
                { shipperId: shipperId },
                // { status: 'prep', shipperId: null } // (Tùy chọn: Hiện cả đơn chờ nhận)
            ];
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });

        // Format dữ liệu items nếu cần (tuy nhiên frontend giờ đã lưu object)
        // Mình sẽ trả về nguyên object để frontend tự xử lý hiển thị
        res.json(orders);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 2. API LẤY CHI TIẾT 1 ĐƠN HÀNG ---
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
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
    const { status, shipperId, rating, review, isReviewed } = req.body;
    let updateData = {};

    if (status) updateData.status = status;
    if (shipperId) updateData.shipperId = shipperId;
    if (rating) updateData.rating = rating;
    if (review) updateData.review = review;
    if (isReviewed !== undefined) updateData.isReviewed = isReviewed;

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
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

module.exports = router;