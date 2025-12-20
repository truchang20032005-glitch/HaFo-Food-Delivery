const mongoose = require('mongoose');

const PromoSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    code: { type: String, required: true },
    type: { type: String, enum: ['percent', 'amount'], default: 'amount' },
    value: { type: Number, required: true }, // Số tiền giảm hoặc %
    minOrder: { type: Number, default: 0 },
    limit: { type: Number, default: 100 },
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Promo', PromoSchema);