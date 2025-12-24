const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Copy từ Pending sang
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    image: String,

    // Thông tin chi tiết
    city: String,
    district: String,
    cuisine: [String],
    openTime: String,
    closeTime: String,
    priceRange: String,

    // Ngân hàng (Để hiển thị ở trang Ví)
    bankName: String,
    bankAccount: String,
    bankOwner: String,
    bankBranch: String,

    rating: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);