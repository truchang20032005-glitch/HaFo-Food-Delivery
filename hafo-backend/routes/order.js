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
            // Logic cho shipper: Đơn đã nhận (pickup/done) HOẶC Đơn đang chờ (prep) chưa có shipper
            // Nhưng để đơn giản, shipper dashboard sẽ gọi API riêng hoặc lọc ở client nếu ít đơn.
            // Ở đây ta ưu tiên lọc theo quán trước.
        }

        const orders = await Order.find().sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            id: order._id,
            customer: order.customer,
            items: order.items,
            total: order.total,
            status: order.status,
            time: new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }));

        res.json(formattedOrders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 2. API LẤY LỊCH SỬ ĐƠN CỦA 1 USER (MỚI) ---
// GET /api/orders/user/:userId
router.get('/user/:userId', async (req, res) => {
    try {
        // Tìm đơn hàng có userId trùng khớp, sắp xếp mới nhất lên đầu
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- 3. API LẤY CHI TIẾT 1 ĐƠN HÀNG ---
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

// --- 4. TẠO ĐƠN HÀNG MỚI (SỬA LẠI) ---
router.post('/', async (req, res) => {
    // Nhận thêm userId từ Frontend gửi xuống
    const { customer, items, total, userId, restaurantId } = req.body;

    try {
        const newOrder = new Order({
            userId,
            restaurantId,
            customer,
            items,
            total
        });
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// --- 5. CẬP NHẬT TRẠNG THÁI ĐƠN ---
router.put('/:id', async (req, res) => {
    const { status } = req.body;

    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        );
        res.json(updatedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router;