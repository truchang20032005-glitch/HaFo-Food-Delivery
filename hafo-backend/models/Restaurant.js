// models/Restaurant.js
const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    address: { type: String },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    // ✅ THÊM TRƯỜNG NÀY: Để lưu doanh thu quán và cho phép rút tiền
    revenue: { type: Number, default: 0 },

    phone: { type: String, required: true },
    image: { type: String },
    city: { type: String },
    district: { type: String },
    cuisine: [{ type: String }],
    openTime: { type: String },
    closeTime: { type: String },
    priceRange: { type: String },
    bankName: { type: String },
    bankAccount: { type: String },
    bankOwner: { type: String },
    bankBranch: { type: String },
    rating: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    lat: { type: Number, default: 10.762622 },
    lng: { type: Number, default: 106.660172 }
}, { timestamps: true });

// ✅ DÒNG NÀY CỰC KỲ QUAN TRỌNG: Để MongoDB tính được khoảng cách $near
RestaurantSchema.index({ location: '2dsphere' });

module.exports = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);