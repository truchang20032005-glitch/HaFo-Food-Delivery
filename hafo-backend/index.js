const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// --- 1. THÊM IMPORT CHO SOCKET.IO ---
const http = require('http');
const { Server } = require('socket.io');

// IMPORT MODELS
const User = require('./models/User');

// IMPORT ROUTES
const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const orderRoutes = require('./routes/order');
const analyticsRoutes = require('./routes/analytics');
const restaurantRoutes = require('./routes/restaurant');
const shipperRoutes = require('./routes/shipper');
const pendingRoutes = require('./routes/pending');
const citiesRoute = require('./routes/cities');
const chatRoutes = require('./routes/chat');
const promoRoutes = require('./routes/promo');
const userRoutes = require('./routes/user');
const customerReviewRoutes = require('./routes/customerReview');
const transactionRoutes = require('./routes/transaction');
const reportRoutes = require('./routes/report');
const messageRoutes = require('./routes/message');

const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. TẠO HTTP SERVER VÀ CẤU HÌNH SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://hafo-2025.vercel.app"],
        methods: ["GET", "POST"]
    }
});

// Cấu hình CORS cho Express (Giữ nguyên của má)
const allowedOrigins = [
    "http://localhost:3000",
    'https://hafo-2025.vercel.app'
];

const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Kết nối MongoDB
const MONGO_URI = process.env.MONGO_URI;
mongoose.connect(MONGO_URI, {
    connectTimeoutMS: 60000, // Tăng lên 60 giây
    serverSelectionTimeoutMS: 60000
})
    .then(() => {
        console.log('✅ Đã kết nối MongoDB thành công!');

    })
    .catch(err => console.error('❌ Lỗi kết nối MongoDB:', err));

// ĐĂNG KÝ ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/shippers', shipperRoutes);
app.use('/api/pending', pendingRoutes);
app.use('/api', citiesRoute);
app.use('/api/chat', chatRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customer-reviews', customerReviewRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/messages', messageRoutes);

app.use("/api/health", (req, res) => {
    console.log('[PING]');
    res.status(200).send('OK');
});

app.get('/', (req, res) => res.send('Server HaFo đang chạy ngon lành kèm Socket.io!'));

// --- 3. LOGIC XỬ LÝ SOCKET.IO (DI CHUYỂN SHIPPER) ---
io.on('connection', (socket) => {
    console.log('⚡ Một client đã kết nối:', socket.id);

    // Lắng nghe tọa độ từ app Shipper gửi lên
    socket.on('shipper_update_location', (data) => {
        // data = { shipperId, lat, lng, orderId }
        console.log(`📍 Shipper ${data.shipperId} di chuyển tới: ${data.lat}, ${data.lng}`);

        // Phát tọa độ này tới kênh theo dõi của đơn hàng cụ thể
        if (data.orderId) {
            io.emit(`tracking_order_${data.orderId}`, {
                lat: data.lat,
                lng: data.lng
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Một client đã ngắt kết nối');
    });
});

// --- 4. THAY ĐỔI: CHẠY BẰNG SERVER CHỨ KHÔNG PHẢI APP ---
server.listen(PORT, () => {
    console.log(`🚀 Server HaFo đang chạy tại http://localhost:${PORT}`);
    console.log(`📡 Socket.io đã sẵn sàng lắng nghe tọa độ shipper!`);
});