const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, index: { expires: 300 } } // Tự động xóa sau 300s (5 phút)
});

module.exports = mongoose.model('Otp', OtpSchema);