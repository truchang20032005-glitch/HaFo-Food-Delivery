const mongoose = require('mongoose');

const PendingShipperSchema = new mongoose.Schema({
    userId: { type: String, required: true },

    // Thông tin cá nhân
    fullName: String,
    phone: String,
    email: String,
    dob: String,
    address: String,
    cccdFront: String,
    cccdBack: String,
    selfie: String,

    // Xe & Giấy tờ
    vehicleType: String, // xe máy | xe đạp
    licensePlate: String,
    driverLicense: String, // Số GPLX
    licenseImage: String,
    vehicleRegImage: String,

    // Ngân hàng
    bankName: String,
    bankAccount: String,
    bankOwner: String,

    // Khu vực & Thời gian
    city: String,
    district: String,
    shifts: [String], // Các ca làm việc đăng ký

    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PendingShipper', PendingShipperSchema);