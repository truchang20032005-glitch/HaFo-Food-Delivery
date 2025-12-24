const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    image: { type: String },
    isAvailable: { type: Boolean, default: true },

    // --- THÊM CÁC TRƯỜNG TÙY CHỌN (Size & Topping) ---
    // Ví dụ: [{name: "Vừa", price: 0}, {name: "Lớn", price: 5000}]
    options: [
        {
            name: { type: String, required: true }, // Tên size
            price: { type: Number, default: 0 }     // Giá cộng thêm
        }
    ],
    // Ví dụ: [{name: "Thêm Chả", price: 5000}, {name: "Thêm Trứng", price: 3000}]
    toppings: [
        {
            name: { type: String, required: true }, // Tên topping
            price: { type: Number, required: true } // Giá topping
        }
    ]
});

module.exports = mongoose.models.Food || mongoose.model('Food', FoodSchema);