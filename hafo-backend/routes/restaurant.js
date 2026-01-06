const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Food = require('../models/Food');
const Order = require('../models/Order');
const uploadCloud = require('../config/cloudinary');
const CustomerReview = require('../models/CustomerReview');
const ReviewReply = require('../models/ReviewReply');
const Report = require('../models/Report');
const Transaction = require('../models/Transaction');

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
        const restaurants = await Restaurant.find().populate('owner', 'fullName email phone');

        // 1. Tính doanh thu và số đơn
        const orderStats = await Order.aggregate([
            { $match: { status: 'done' } },
            {
                $group: {
                    _id: '$restaurantId',
                    totalRevenue: { $sum: '$total' },
                    totalOrders: { $sum: 1 }
                }
            }
        ]);

        // ✅ 2. LOGIC MỚI: Tìm giá thấp nhất (minPrice) từ Menu của từng quán
        const foodStats = await Food.aggregate([
            {
                $group: {
                    _id: '$restaurant',
                    minPrice: { $min: '$price' } // Lấy giá nhỏ nhất trong bảng Food
                }
            }
        ]);

        const statsMap = {};
        orderStats.forEach(item => {
            statsMap[item._id.toString()] = { revenue: item.totalRevenue, orders: item.totalOrders };
        });

        // ✅ Chuyển foodStats sang Map
        const foodMap = {};
        foodStats.forEach(item => {
            foodMap[item._id.toString()] = item.minPrice;
        });

        const result = restaurants.map(rest => {
            const restId = rest._id.toString();
            const restStats = statsMap[restId] || { revenue: 0, orders: 0 };
            const minPrice = foodMap[restId] || 0; // Lấy minPrice từ Map

            return {
                ...rest.toObject(),
                revenue: restStats.revenue,
                orders: restStats.orders,
                minPrice: minPrice // ✅ Trả về minPrice để Home.js sắp xếp
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

// API lấy thông báo cho Nhà hàng (Đơn mới, Đánh giá, Giao dịch, Khiếu nại)
router.get('/notifications/:shopId', async (req, res) => {
    try {
        const shopId = req.params.shopId;

        // 1. Tìm quán trước để lấy thông tin (Sửa lỗi thứ tự thực thi)
        const restaurant = await Restaurant.findById(shopId);
        if (!restaurant) return res.status(404).json({ message: "Không tìm thấy quán" });

        const ownerId = restaurant.owner;

        // 2. Lấy đơn hàng mới (Chỉ lấy đơn trạng thái 'new')
        const newOrders = await Order.find({
            restaurantId: shopId,
            status: 'new'
        }).sort({ createdAt: -1 });

        // 3. Lấy đánh giá chưa phản hồi (Giới hạn 5 cái gần nhất)
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

        // 4. Lấy các báo cáo (khiếu nại) đã được Admin xử lý
        const processedReports = await Report.find({
            reporterId: ownerId,
            reporterRole: 'merchant',
            status: { $ne: 'pending' }
        }).sort({ updatedAt: -1 }).limit(5);

        // 5. Lấy các giao dịch rút tiền đã được Admin xử lý (Yêu cầu có model Transaction)
        // Nếu bạn chưa import Transaction thì hãy thêm: const Transaction = require('../models/Transaction'); ở đầu file
        let processedTransactions = [];
        try {
            const Transaction = require('../models/Transaction');
            processedTransactions = await Transaction.find({
                userId: ownerId,
                status: { $ne: 'pending' }
            }).sort({ updatedAt: -1 }).limit(5);
        } catch (e) {
            console.log("Chưa có model Transaction hoặc lỗi truy vấn giao dịch");
        }

        // 6. Tổng hợp tất cả vào một danh sách duy nhất
        let list = [];

        // Gom thông báo Đơn hàng
        newOrders.forEach(o => {
            list.push({
                id: o._id,
                type: 'order',
                msg: `Đơn hàng mới: #${o._id.toString().slice(-6).toUpperCase()}`,
                time: o.createdAt,
                link: '/merchant/orders'
            });
        });

        // Gom thông báo Đánh giá
        unrepliedReviews.forEach(r => {
            list.push({
                id: r._id,
                type: 'review',
                msg: `${r.customerId?.fullName || 'Khách'} đánh giá ${r.rating} sao - Chờ phản hồi`,
                time: r.createdAt,
                link: '/merchant/reviews'
            });
        });

        // Gom thông báo Giao dịch tiền
        processedTransactions.forEach(t => {
            const statusText = t.status === 'approved' ? 'THÀNH CÔNG' : 'BỊ TỪ CHỐI';
            list.push({
                type: 'transaction',
                msg: `Rút tiền ${t.amount.toLocaleString()}đ: ${statusText}`,
                time: t.updatedAt,
                link: '/merchant/wallet'
            });
        });

        // Gom thông báo Báo cáo/Khiếu nại
        processedReports.forEach(rep => {
            const statusText = rep.status === 'processed' ? 'ĐÃ XỬ LÝ' : 'ĐÃ TỪ CHỐI';
            list.push({
                type: 'report_resolved',
                msg: `Khiếu nại đánh giá: Admin ${statusText}`,
                time: rep.updatedAt,
                link: '/merchant/reviews'
            });
        });

        // 7. Sắp xếp toàn bộ danh sách theo thời gian mới nhất
        list.sort((a, b) => new Date(b.time) - new Date(a.time));

        // ✅ TRẢ VỀ MẢNG TRỰC TIẾP (Để khớp với logic MerchantLayout.js)
        res.json(list);

    } catch (err) {
        console.error("Lỗi API Notifications:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;