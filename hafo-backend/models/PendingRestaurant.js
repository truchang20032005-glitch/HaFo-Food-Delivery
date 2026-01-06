const mongoose = require('mongoose');

const PendingRestaurantSchema = new mongoose.Schema({
    userId: { type: String, required: true },

    // --- THÔNG TIN CƠ BẢN ---
    serviceType: { type: String, default: 'food' },
    name: String,
    phone: String,
    email: String,
    address: String,
    city: String,
    district: String,

    // ✅ TRƯỜNG MỚI: Tọa độ GeoJSON
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [106.660172, 10.762622] } // [lng, lat]
    },

    // --- VẬN HÀNH ---
    cuisine: [String],
    signatureDish: String,
    openTime: String,
    closeTime: String,
    priceRange: String,
    parkingFee: String,
    avatar: String,

    // --- PHÁP LÝ & NGÂN HÀNG ---
    ownerName: String,
    idCard: String,
    idCardFront: String,
    idCardBack: String,
    bankName: String,
    bankAccount: String,
    bankOwner: String,
    bankBranch: String,

    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    rejectReason: { type: String, default: '' }
});

module.exports = mongoose.models.PendingRestaurant || mongoose.model('PendingRestaurant', PendingRestaurantSchema);