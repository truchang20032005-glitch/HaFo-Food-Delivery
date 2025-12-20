const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    image: { type: String, default: '' },
    rating: { type: Number, default: 0 },

    openTime: { type: String, default: '07:00' },
    closeTime: { type: String, default: '22:00' },

    bankName: { type: String, default: '' },
    bankAccount: { type: String, default: '' },
    bankOwner: { type: String, default: '' },

    isOpen: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', RestaurantSchema);