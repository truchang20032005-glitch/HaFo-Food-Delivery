const mongoose = require('mongoose');

const ShipperSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleType: { type: String, required: true },
    licensePlate: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },
    rating: { type: Number, default: 5.0 },
    income: { type: Number, default: 0 },
    // ✅ Thêm các trường ngân hàng mới
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    bankOwner: { type: String, default: '' },
    bankBranch: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Shipper', ShipperSchema);