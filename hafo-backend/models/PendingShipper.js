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

    // ✅ TRƯỜNG MỚI: Tọa độ GeoJSON
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [106.660172, 10.762622] }
    },

    // Xe cộ & Giấy tờ
    vehicleType: String,
    licensePlate: String,
    driverLicense: String,
    cccdFront: String,
    cccdBack: String,
    avatar: String,
    licenseImage: String,
    vehicleRegImage: String,

    // Ngân hàng & Hoạt động
    bankName: String,
    bankAccount: String,
    bankOwner: String,
    bankBranch: String,
    area: String,
    workTime: String,

    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    rejectReason: { type: String, default: '' }
});

module.exports = mongoose.models.PendingShipper || mongoose.model('PendingShipper', PendingShipperSchema);