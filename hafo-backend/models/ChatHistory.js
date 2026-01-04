const mongoose = require('mongoose');

const ChatHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [{
        sender: { type: String, enum: ['user', 'bot'], required: true },
        text: { type: String, required: true },
        foods: { type: Array, default: [] }, // Lưu lại cả các món bot đã gợi ý
        createdAt: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('ChatHistory', ChatHistorySchema);