const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // <-- THÊM: Để mã hóa mật khẩu admin
require('dotenv').config();

// IMPORT MODELS
const User = require('./models/User'); // <-- THÊM: Để tạo user admin

// IMPORT ROUTES
const authRoutes = require('./routes/auth');
const foodRoutes = require('./routes/food');
const orderRoutes = require('./routes/order');
const analyticsRoutes = require('./routes/analytics');
const restaurantRoutes = require('./routes/restaurant');
const shipperRoutes = require('./routes/shipper');
const pendingRoutes = require('./routes/pending'); // <-- NẾU CHƯA CÓ
const citiesRoute = require('./routes/cities');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'))

const MONGO_URI = 'mongodb+srv://truchang20032005:truchang20032005@cluster0.6dkuxpp.mongodb.net/hafo_db?appName=Cluster0';

// --- HÀM TẠO ADMIN MẶC ĐỊNH ---
const createDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const newAdmin = new User({
                username: 'admin',
                password: hashedPassword,
                fullName: 'Quản Trị Viên',
                role: 'admin',
                email: 'admin@hafo.com'
            });
            await newAdmin.save();
            console.log('⚡ ĐÃ TẠO TÀI KHOẢN ADMIN: admin / admin123');
        }
    } catch (error) {
        console.error('Lỗi tạo Admin:', error);
    }
};

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Đã kết nối MongoDB thành công!');
        createDefaultAdmin(); // <-- GỌI HÀM TẠO ADMIN NGAY KHI KẾT NỐI DB
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

app.get('/', (req, res) => res.send('Server HaFo đang chạy ngon lành!'));

app.listen(PORT, () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));