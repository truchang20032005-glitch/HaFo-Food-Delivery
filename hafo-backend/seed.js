const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Food = require('./models/Food');
const Shipper = require('./models/Shipper');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Đã kết nối MongoDB');
    } catch (err) {
        console.error('❌ Lỗi kết nối:', err);
        process.exit(1);
    }
};

const IMAGES = {
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
    shop1: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=500&q=60",
    shop2: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=500&q=60",
};

const seedData = async () => {
    await connectDB();

    console.log('🗑️  Đang xóa dữ liệu cũ...');
    await Promise.all([
        User.deleteMany({}),
        Restaurant.deleteMany({}),
        Food.deleteMany({}),
        Shipper.deleteMany({})
    ]);

    console.log('🌱 Đang tạo dữ liệu mới...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123', salt);

    // 1. TẠO USER
    const users = await User.insertMany([
        { username: "admin", fullName: "Admin", email: "happyfoodcskh2025@gmail.com", password: hashedPassword, role: "admin", approvalStatus: 'approved' },
        { username: "res01", fullName: "Trần Minh Hiếu", email: "merch1@gmail.com", password: hashedPassword, role: "merchant", approvalStatus: 'approved' },
        { username: "res02", fullName: "Phạm Bảo Khang", email: "merch2@gmail.com", password: hashedPassword, role: "merchant", approvalStatus: 'approved' },
        { username: "ship01", fullName: "Đặng Thành An", email: "shipper@gmail.com", password: hashedPassword, role: "shipper", approvalStatus: 'approved' },
        { username: "user01", fullName: "Trúc Hằng", email: "customer@gmail.com", password: hashedPassword, role: "customer" }
    ]);

    const [admin, merch1, merch2, shipperUser, customer] = users;

    // 2. TẠO NHÀ HÀNG (Cần có location chuẩn GeoJSON)
    const restaurants = await Restaurant.insertMany([
        {
            owner: merch1._id,
            name: "KFC Chicken",
            address: "99 Nguyễn Huệ, Quận 1",
            location: { type: "Point", coordinates: [106.7009, 10.7769] },
            phone: "02839393939",
            image: IMAGES.shop1,
            cuisine: ["Gà rán", "Fastfood"],
            isOpen: true,
            rating: 4.8
        },
        {
            owner: merch2._id,
            name: "Phở Gia Truyền",
            address: "102 Pasteur, Quận 1",
            location: { type: "Point", coordinates: [106.6991, 10.7735] },
            phone: "0909888888",
            image: IMAGES.shop2,
            cuisine: ["Phở", "Món Việt"],
            isOpen: true,
            rating: 4.5
        }
    ]);

    // 3. TẠO HỒ SƠ SHIPPER
    const shipperProfile = await Shipper.create({
        user: shipperUser._id,
        vehicleType: "Xe Máy",
        licensePlate: "59-X1 123.45",
        location: { type: "Point", coordinates: [106.6601, 10.7626] },
        isAvailable: true
    });

    // 4. CẬP NHẬT LIÊN KẾT NGƯỢC CHO USER
    await User.findByIdAndUpdate(merch1._id, { restaurant: restaurants[0]._id });
    await User.findByIdAndUpdate(merch2._id, { restaurant: restaurants[1]._id });
    await User.findByIdAndUpdate(shipperUser._id, { shipper: shipperProfile._id });

    console.log('✅ Đã tạo dữ liệu mẫu thành công với tọa độ GeoJSON!');
    process.exit();
};

seedData();