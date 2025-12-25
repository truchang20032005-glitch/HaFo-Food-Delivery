const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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

app.use('/uploads', express.static('uploads'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
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
app.use("/api/health", (req, res) => {
    console.log('[PING]');
    res.status(200).send('OK');
});

app.get('/', (req, res) => res.send('Server HaFo đang chạy ngon lành!'));

app.listen(PORT, () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));