const mongoose = require('mongoose');

const CustomerReviewSchema = new mongoose.Schema({
    // LIÊN KẾT CÁC BÊN
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    shipperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Có thể null nếu đơn chưa giao

    // ĐÁNH GIÁ TỔNG THỂ
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    images: [String], // Khách có thể up nhiều ảnh món ăn

    // ĐÁNH GIÁ CHI TIẾT TỪNG MÓN
    itemReviews: [{
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        name: String,
        options: String, // ✅ Thêm trường này để lưu "Topping: Trứng chần..."
        rating: Number,
        comment: String
    }],

    // ĐÁNH GIÁ SHIPPER
    shipperRating: { type: Number, min: 1, max: 5 },
    shipperComment: { type: String, default: '' },

    // TRẠNG THÁI BÁO CÁO (Dành cho má)
    isReported: { type: Boolean, default: false },
    reportReason: { type: String, default: '' },
    reportStatus: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' }

}, { timestamps: true });

module.exports = mongoose.model('CustomerReview', CustomerReviewSchema);