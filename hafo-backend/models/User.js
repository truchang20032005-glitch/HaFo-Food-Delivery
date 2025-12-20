const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: {
        type: String,
        enum: ['customer', 'merchant', 'shipper', 'admin'],
        default: 'customer'
    },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    gender: { type: String, default: 'Khác' },
    birthday: { type: String, default: '' },

    // Mảng chứa danh sách địa chỉ
    addresses: [
        {
            label: { type: String, default: 'Nhà riêng' }, // VD: Nhà, Cty
            value: { type: String, required: true }        // VD: 123 Nguyễn Văn Cừ...
        }
    ],

    avatar: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);