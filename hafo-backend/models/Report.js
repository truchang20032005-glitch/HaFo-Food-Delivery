const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    // Liên kết tới đơn hàng bị khiếu nại
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },

    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reporterRole: { type: String, enum: ['merchant', 'shipper'], required: true },

    // Nội dung đánh giá của khách mà shipper muốn khiếu nại
    reviewContent: { type: String },

    // Lý do shipper khiếu nại
    reason: { type: String, required: true },

    // Trạng thái xử lý của Admin
    status: {
        type: String,
        enum: ['pending', 'processed', 'ignored'],
        default: 'pending'
    },

    // Ghi chú của Admin sau khi xem xét
    adminNote: { type: String, default: '' },
    isReadByCustomer: { type: Boolean, default: false }, // Đã đọc bởi khách bị báo cáo
    isReadByPartner: { type: Boolean, default: false }   // Đã đọc bởi shipper/nhà hàng đi báo cáo
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);