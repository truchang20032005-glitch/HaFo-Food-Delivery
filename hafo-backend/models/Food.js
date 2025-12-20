const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
    // QUAN TRỌNG: Món này thuộc quán nào?
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: String },
    isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model('Food', FoodSchema);