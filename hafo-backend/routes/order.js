const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Shipper = require('../models/Shipper');

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

// API lấy đơn cho Shipper
router.get('/available-orders', async (req, res) => {
    try {
        const { lat, lng, radius = 5000, currentShipperId } = req.query;

        // ✅ KIỂM TRA: Nếu shipper này đang có > 3 đơn chưa hoàn thành, không cho hiện đơn mới nữa
        if (currentShipperId) {
            const activeCount = await Order.countDocuments({
                shipperId: currentShipperId,
                status: { $in: ['prep', 'ready', 'pickup'] }
            });
            if (activeCount >= 3) {
                return res.json([]); // Trả về mảng rỗng vì "đã đầy tải"
            }
        }

        const nearbyRestaurants = await Restaurant.find({
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseInt(radius)
                }
            }
        }).select('_id');

        const restaurantIds = nearbyRestaurants.map(r => r._id);
        const orders = await Order.find({
            restaurantId: { $in: restaurantIds },
            shipperId: null,
            status: { $in: ['new', 'prep', 'ready'] }
        }).populate('restaurantId');

        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
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
    const { customer, items, total, userId, restaurantId, lat, lng, note, tipAmount } = req.body;

    try {
        const newOrder = new Order({
            userId,
            restaurantId, // <-- Lưu restaurantId vào DB
            customer,
            items, // <-- Lưu mảng items chi tiết
            total,
            lat, // ✅ LƯU VĨ ĐỘ
            lng, // ✅ LƯU KINH ĐỘ
            note, // ✅ LƯU GHI CHÚ
            tipAmount: tipAmount || 0
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
    try {
        const { status, shipperId, restaurantRating, shipperRating, review, isReviewed, tipAmount } = req.body;

        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: "Không tìm thấy đơn hàng này!" });
        }

        let updateData = {};
        if (status) updateData.status = status;
        if (shipperId) updateData.shipperId = shipperId;

        // Nếu muốn cập nhật lại tipAmount vào đơn hàng (nếu có gửi lên)
        if (tipAmount !== undefined) updateData.tipAmount = tipAmount;

        // ✅ LOGIC CỘNG TIỀN: Chỉ chạy khi đơn hàng chuyển sang 'done' lần đầu tiên
        if (status === 'done' && order.status !== 'done') {
            // Dùng tiền tip từ database (order.tipAmount) để an toàn tuyệt đối
            const actualTip = order.tipAmount || 0;

            // 1. Cộng doanh thu cho Quán (Trừ tip ra)
            await Restaurant.findByIdAndUpdate(order.restaurantId, {
                $inc: { revenue: (order.total - actualTip) }
            });

            // 2. Cộng 80% tiền tip vào ví Shipper
            if (order.shipperId) {
                const shipperBonus = actualTip * 0.8;
                if (shipperBonus > 0) {
                    await Shipper.findOneAndUpdate(
                        { user: order.shipperId },
                        { $inc: { income: shipperBonus } }
                    );
                }
            }
        }

        // 3. Cập nhật các trường đánh giá
        if (restaurantRating) updateData.restaurantRating = restaurantRating;
        if (shipperRating) updateData.shipperRating = shipperRating;
        if (review) updateData.review = review;
        if (isReviewed !== undefined) updateData.isReviewed = isReviewed;

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        res.json(updatedOrder);

    } catch (error) {
        console.error("Lỗi cập nhật đơn:", error);
        res.status(400).json({ message: error.message });
    }
});

// API Hủy đơn hàng dành cho khách hàng
router.put('/:id/customer-cancel', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

        // ✅ CHỈ CHO PHÉP HỦY KHI TRẠNG THÁI LÀ 'new' (Quán chưa xác nhận)
        if (order.status !== 'new') {
            return res.status(400).json({ message: "Quán đã xác nhận đơn, bạn không thể tự hủy lúc này!" });
        }

        order.status = 'cancel';
        order.note = (order.note || "") + " [Khách tự hủy]";
        await order.save();

        res.json({ message: "Hủy đơn thành công!", order });
    } catch (err) {
        res.status(500).json({ error: err.message });
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