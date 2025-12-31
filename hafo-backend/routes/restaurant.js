const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Order = require('../models/Order');
const uploadCloud = require('../config/cloudinary');
const CustomerReview = require('../models/CustomerReview');
const ReviewReply = require('../models/ReviewReply');
const Report = require('../models/Report');

// 1. TẠO QUÁN MỚI
router.post('/', async (req, res) => {
    try {
        const data = { ...req.body };

        // ✅ Bắt buộc phải đóng gói tọa độ vào GeoJSON
        if (data.lat && data.lng) {
            data.location = {
                type: 'Point',
                coordinates: [parseFloat(data.lng), parseFloat(data.lat)]
            };
            delete data.lat;
            delete data.lng;
        }

        const newRest = new Restaurant(data);
        await newRest.save();
        res.status(201).json(newRest);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LẤY DANH SÁCH TẤT CẢ QUÁN KÈM DOANH THU (Dành cho Admin/Home)
router.get('/', async (req, res) => {
    try {
        // 1. Lấy danh sách quán và thông tin chủ sở hữu
        const restaurants = await Restaurant.find().populate('owner', 'fullName email phone');

        // 2. Tính doanh thu và số đơn của TẤT CẢ quán bằng 1 câu lệnh aggregate
        const stats = await Order.aggregate([
            { $match: { status: 'done' } },
            {
                $group: {
                    _id: '$restaurantId',
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 } // Đếm luôn số đơn cho tiện
                }
            }
        ]);

        // 3. Chuyển kết quả sang Map để tra cứu O(1)
        const statsMap = {};
        stats.forEach(item => {
            statsMap[item._id.toString()] = {
                revenue: item.totalRevenue,
                orders: item.totalOrders
            };
        });

        // 4. Hợp nhất dữ liệu
        const result = restaurants.map(rest => {
            const restStats = statsMap[rest._id.toString()] || { revenue: 0, orders: 0 };
            return {
                ...rest.toObject(),
                revenue: restStats.revenue,
                orders: restStats.orders
            };
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. LẤY CHI TIẾT 1 QUÁN
router.get('/:id', async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'fullName phone email');
        if (!restaurant) return res.status(404).json({ message: 'Không tìm thấy quán' });
        res.json(restaurant);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. LẤY MENU CỦA 1 QUÁN
router.get('/:id/menu', async (req, res) => {
    try {
        const foods = await Food.find({ restaurant: req.params.id });
        res.json(foods);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. TÌM QUÁN CỦA USER ĐANG ĐĂNG NHẬP (Cho Merchant Dashboard)
router.get('/my-shop/:userId', async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.params.userId });
        if (!restaurant) return res.status(404).json({ message: 'Chưa có thông tin quán' });
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. CẬP NHẬT THÔNG TIN QUÁN (Bao gồm upload ảnh)
router.put('/:id', uploadCloud.single('image'), async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (req.file) {
            updateData.image = req.file.path;
        }

        // ĐỒNG BỘ TỌA ĐỘ VÀO GEOJSON
        // Vì Leaflet dùng [lat, lng] nhưng MongoDB dùng [lng, lat]
        if (updateData.lat !== undefined && updateData.lng !== undefined) {
            updateData.location = {
                type: 'Point',
                coordinates: [parseFloat(updateData.lng), parseFloat(updateData.lat)] // [lng, lat]
            };
            // Xóa lat, lng khỏi updateData để không lưu vào DB nữa
            delete updateData.lat;
            delete updateData.lng;
        }

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            { $set: updateData }, // Sử dụng $set để an toàn hơn
            { new: true }
        );
        res.json(updatedRestaurant);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// API lấy thông báo cho Nhà hàng (Đơn mới & Đánh giá mới)
router.get('/notifications/:shopId', async (req, res) => {
    try {
        const shopId = req.params.shopId;
        const ownerId = restaurant.owner;

        // Bước 0: Lấy thông tin quán để biết ID của chủ quán (dùng để tìm báo cáo)
        const restaurant = await Restaurant.findById(shopId);
        if (!restaurant) return res.status(404).json({ message: "Không tìm thấy quán" });

        // 1. Lấy đơn hàng mới (Chỉ lấy đơn 'new')
        const newOrders = await Order.find({
            restaurantId: shopId,
            status: 'new'
        }).sort({ createdAt: -1 });

        // 2. Lấy đánh giá chưa phản hồi
        const allReviews = await CustomerReview.find({ restaurantId: shopId })
            .populate('customerId', 'fullName')
            .sort({ createdAt: -1 });

        const unrepliedReviews = [];
        for (const rev of allReviews) {
            const merchantReply = await ReviewReply.findOne({
                reviewId: rev._id,
                userRole: 'merchant'
            });
            if (!merchantReply) unrepliedReviews.push(rev);
            if (unrepliedReviews.length >= 5) break;
        }

        // 3. ✅ LOGIC MỚI: Lấy các báo cáo đã được Admin xử lý
        // Tìm các báo cáo do chủ quán này gửi (reporterRole: 'merchant') mà status KHÁC 'pending'
        const processedReports = await Report.find({
            reporterId: ownerId,
            reporterRole: 'merchant',
            status: { $ne: 'pending' } // $ne là "not equal" (khác pending)
        }).sort({ updatedAt: -1 }).limit(5);

        // 3.5. ✅ LẤY CÁCH GIAO DỊCH RÚT TIỀN ĐÃ ĐƯỢC ADMIN XỬ LÝ
        const processedTransactions = await Transaction.find({
            userId: ownerId,
            status: { $ne: 'pending' }
        }).sort({ updatedAt: -1 }).limit(5);

        // 4. Tổng hợp danh sách gửi về Frontend
        let list = [];

        // Thông báo Đơn hàng
        newOrders.forEach(o => {
            list.push({
                id: o._id, // ✅ THÊM ID ĐỂ MỞ MODAL
                type: 'order',
                msg: `Đơn hàng mới: #${o._id.slice(-6).toUpperCase()}`,
                time: o.createdAt,
                link: '/merchant/orders'
            });
        });

        unrepliedReviews.forEach(r => {
            list.push({
                id: r._id, // ✅ THÊM ID ĐỂ MỞ MODAL
                type: 'review',
                msg: `${r.customerId?.fullName || 'Khách'} đánh giá ${r.rating} sao - Chờ phản hồi`,
                time: r.createdAt,
                link: '/merchant/reviews'
            });
        });

        processedTransactions.forEach(t => {
            const statusText = t.status === 'approved' ? 'THÀNH CÔNG' : 'BỊ TỪ CHỐI';
            list.push({
                type: 'transaction',
                msg: `Rút tiền ${t.amount.toLocaleString()}đ: ${statusText}`,
                time: t.updatedAt,
                link: '/merchant/wallet'
            });
        });

        // ✅ Thông báo Báo cáo đã xử lý
        processedReports.forEach(rep => {
            const statusText = rep.status === 'processed' ? 'ĐÃ XỬ LÝ' : 'ĐÃ TỪ CHỐI';
            list.push({
                type: 'report_resolved',
                msg: `Báo cáo đánh giá: Admin ${statusText}`,
                time: rep.updatedAt, // Lấy thời gian admin cập nhật
                link: '/merchant/reviews' // Quay lại trang reviews để xem kết quả
            });
        });

        // Sắp xếp tất cả theo thời gian mới nhất
        list.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({
            total: list.length,
            notifications: list
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;