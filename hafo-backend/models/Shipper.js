const mongoose = require('mongoose');

const ShipperSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleType: { type: String, required: true },
    licensePlate: { type: String, required: true },
    isAvailable: { type: Boolean, default: true },

    // ✅ Khai báo tọa độ chuẩn GeoJSON
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [lng, lat]
    },

    rating: { type: Number, default: 5.0 },
    income: { type: Number, default: 0 },

    // ✅ Các trường ngân hàng
    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    bankOwner: { type: String, default: '' },
    bankBranch: { type: String, default: '' }
}, {
    timestamps: true
});

// ✅ ĐỂ DÒNG NÀY Ở ĐÂY NÈ MÁ (Ngoài ngoặc nhọn của Schema)
// Nó giúp MongoDB hiểu đây là bản đồ để chạy được lệnh tìm quán gần đây ($near)
ShipperSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Shipper', ShipperSchema);