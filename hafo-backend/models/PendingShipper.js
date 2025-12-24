const mongoose = require('mongoose');

const PendingShipperSchema = new mongoose.Schema({
    userId: { type: String, required: true },

    // Cá nhân
    fullName: String,
    phone: String,
    email: String,
    dob: String,
    address: String,
    city: String,
    district: String,

    // Xe cộ
    vehicleType: String, // Xe máy/Xe điện
    licensePlate: String,

    // Giấy tờ
    driverLicense: String, // Số bằng lái
    cccdFront: { type: String }, // Mặt trước CMND
    cccdBack: { type: String },  // Mặt sau CMND
    profileImage: { type: String }, // Ảnh chân dung (Selfie)

    // Ngân hàng
    bankName: String,
    bankAccount: String,
    bankOwner: String,
    bankBranch: String,

    // Hoạt động
    area: String,
    workTime: String,

    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.PendingShipper || mongoose.model('PendingShipper', PendingShipperSchema);