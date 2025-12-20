const mongoose = require('mongoose');

const ShipperSchema = new mongoose.Schema({
    // Liên kết với tài khoản User
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vehicleType: { type: String, required: true }, // Xe máy / Xe đạp
    licensePlate: { type: String, required: true }, // Biển số
    isAvailable: { type: Boolean, default: true }, // Đang rảnh / Đang bận
    currentLocation: { type: String }, // Vị trí hiện tại (giả lập text)
    rating: { type: Number, default: 5.0 },
    income: { type: Number, default: 0 } // Tổng thu nhập
}, { timestamps: true });

module.exports = mongoose.model('Shipper', ShipperSchema);