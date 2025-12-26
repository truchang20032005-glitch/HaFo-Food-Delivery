const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import các Model (Đảm bảo đường dẫn đúng với project của bạn)
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Food = require('./models/Food');
const Shipper = require('./models/Shipper');
const Order = require('./models/Order');

// Kết nối MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Đã kết nối MongoDB');
    } catch (err) {
        console.error('❌ Lỗi kết nối:', err);
        process.exit(1);
    }
};

// Dữ liệu mẫu (Ảnh lấy từ Unsplash để đảm bảo luôn hiển thị)
const IMAGES = {
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    food1: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60", // Burger
    food2: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=60", // Salad
    food3: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=500&q=60", // Gà rán
    shop1: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=500&q=60", // Nhà hàng sang
    shop2: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=60", // Quán ăn nhanh
};

const seedData = async () => {
    await connectDB();

    console.log('🗑️  Đang xóa dữ liệu cũ...');
    await User.deleteMany({});
    await Restaurant.deleteMany({});
    await Food.deleteMany({});
    await Shipper.deleteMany({});
    await Order.deleteMany({});

    console.log('🌱 Đang tạo dữ liệu mới...');

    // 1. TẠO USER (Mật khẩu chung: 123)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);

    const users = await User.insertMany([
        { username: "admin", fullName: "Admin", email: "happyfoodcskh2025@gmail.com", password: hashedPassword, role: "admin", phone: "0909000000", avatar: IMAGES.avatar },
        { username: "res02", fullName: "Phạm Bảo Khang", email: "baokhang@gmail.com", password: hashedPassword, role: "merchant", phone: "0909111111", avatar: IMAGES.avatar },
        { username: "res01", fullName: "Trần Minh Hiếu", email: "minhhieu@gmail.com", password: hashedPassword, role: "merchant", phone: "0909222222", avatar: IMAGES.avatar },
        { username: "ship01", fullName: "Nguyễn Minh Tài", email: "minhtai@gmail.com", password: hashedPassword, role: "shipper", phone: "0909333333", avatar: IMAGES.avatar },
        {
            username: "user01", fullName: "Trúc Hằng", email: "truchang2003205@gmail.com", password: hashedPassword, role: "customer", phone: "0909444444", avatar: IMAGES.avatar, addresses: [
                {
                    value: "107/10 đường Xóm Ga, khu phố Thắng Lợi 1, phường Dĩ An",
                    label: "Nhà riêng"
                }
            ]
        }
    ]);

    const [admin, merch1, merch2, shipperUser, customer] = users;

    // 2. TẠO HỒ SƠ SHIPPER
    const shipperProfile = await Shipper.create({
        user: shipperUser._id,
        vehicleType: "Xe Máy",
        licensePlate: "59-X1 123.45",
        isAvailable: true,
        currentLocation: "Quận 1, TP.HCM"
    });

    // 3. TẠO NHÀ HÀNG (Liên kết với Merchant)
    const restaurants = await Restaurant.insertMany([
        {
            owner: merch1._id,
            name: "KFC Chicken",
            address: "99 Nguyễn Huệ, Quận 1",
            phone: "02839393939",
            image: IMAGES.shop1,
            openTime: "08:00",
            closeTime: "22:00",
            isOpen: true,
            rating: 4.8,
            cuisine: ["Gà rán", "Fastfood"],
            city: "TP. Hồ Chí Minh",
            district: "Quận 1"
        },
        {
            owner: merch2._id,
            name: "Phở Gia Truyền",
            address: "102 Pasteur, Quận 1",
            phone: "0909888888",
            image: IMAGES.shop2,
            openTime: "06:00",
            closeTime: "21:00",
            isOpen: true,
            rating: 4.5,
            cuisine: ["Phở", "Món Việt"],
            city: "TP. Hồ Chí Minh",
            district: "Quận 3"
        }
    ]);

    const [shop1, shop2] = restaurants;

    console.log('✅ Đã tạo dữ liệu mẫu thành công!');

    process.exit();
};

seedData();