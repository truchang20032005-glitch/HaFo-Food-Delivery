const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    // Đổi String -> ObjectId để liên kết bảng User
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shipperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    customer: { type: String, required: true },
    items: [{
        foodId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String, default: '' },
        options: { type: String, default: '' }
    }],
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['new', 'prep', 'ready', 'pickup', 'done', 'cancel'],
        default: 'new'
    },

    // ✅ TÁCH RIÊNG 2 LOẠI ĐÁNH GIÁ ĐỂ KHÔNG ĐÈ NHAU
    restaurantRating: { type: Number, default: 0 }, // Sao của quán
    shipperRating: { type: Number, default: 0 },    // Sao của shipper

    review: { type: String, default: '' },
    isReviewed: { type: Boolean, default: false },
    lat: { type: Number },
    lng: { type: Number },
    note: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);