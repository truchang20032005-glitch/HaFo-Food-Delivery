const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    shipperId: { type: String, default: null },

    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },

    customer: { type: String, required: true },

    // --- SỬA ĐỔI QUAN TRỌNG Ở ĐÂY ---
    items: [
        {
            foodId: { type: String, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true }, // Giá của 1 món (đã cộng topping)
            quantity: { type: Number, required: true },
            image: { type: String, default: '' },
            options: { type: String, default: '' } // Lưu text topping (VD: "Size L, Thêm trứng") để hiển thị nhanh
        }
    ],
    // ---------------------------------

    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ['new', 'prep', 'pickup', 'done', 'cancel'],
        default: 'new'
    },

    // Đánh giá
    rating: { type: Number, default: 0 },
    review: { type: String, default: '' },
    isReviewed: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);