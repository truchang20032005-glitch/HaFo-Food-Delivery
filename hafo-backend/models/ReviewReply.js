const mongoose = require('mongoose');

const ReviewReplySchema = new mongoose.Schema({
    reviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CustomerReview',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: { type: String, required: true },

    // THÊM TRƯỜNG NÀY: Để phân biệt ai đang trả lời
    userRole: {
        type: String,
        enum: ['merchant', 'shipper', 'admin'],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('ReviewReply', ReviewReplySchema);