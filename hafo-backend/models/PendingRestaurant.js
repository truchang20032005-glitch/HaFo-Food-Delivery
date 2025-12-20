const mongoose = require('mongoose');

const PendingRestaurantSchema = new mongoose.Schema({
    userId: { type: String, required: true },

    // --- BƯỚC 1: LOẠI HÌNH ---
    serviceType: { type: String, default: 'food' }, // food | mart

    // --- BƯỚC 2: THÔNG TIN CƠ BẢN ---
    name: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    district: String,

    // --- BƯỚC 3: ẨM THỰC & VẬN HÀNH ---
    cuisine: [String], // Mảng các loại món (Cơm, Bún...)
    signatureDish: String, // Món đặc trưng
    openTime: String,
    closeTime: String,
    priceRange: String,
    parkingFee: String,
    avatar: String, // Link ảnh mặt tiền

    // --- BƯỚC 4: PHÁP LÝ ---
    ownerName: String,
    idCard: String,
    idCardFront: String,
    idCardBack: String,

    // --- BƯỚC 5: NGÂN HÀNG ---
    bankName: String,
    bankAccount: String,
    bankOwner: String,
    bankBranch: String,

    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.PendingRestaurant || mongoose.model('PendingRestaurant', PendingRestaurantSchema);