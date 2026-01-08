const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },

    // Thêm 2 role pending
    role: {
        type: String,
        enum: [
            'customer',
            'merchant',
            'shipper',
            'admin',
            'pending_merchant',  // THÊM - Merchant chờ duyệt
            'pending_shipper'    // THÊM - Shipper chờ duyệt
        ],
        default: 'customer'
    },

    // status để phục vụ chức năng khóa/mở khóa của admin
    status: {
        type: String,
        enum: ['active', 'locked'],
        default: 'active'
    },
    // lí do admin khóa tài khoản
    lockReason: { type: String, default: '' },
    lockUntil: { type: Date, default: null },

    // THÊM MỚI: Trạng thái duyệt
    approvalStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
        // none: Chưa gửi hồ sơ
        // pending: Đã gửi, chờ admin duyệt
        // approved: Đã được duyệt
        // rejected: Bị từ chối
    },

    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    gender: { type: String, default: 'Khác' },
    birthday: { type: String, default: '' },

    // Mảng chứa danh sách địa chỉ
    addresses: [
        {
            label: { type: String, default: 'Nhà riêng' }, // VD: Nhà riêng, Văn phòng
            value: { type: String, required: true },       // Địa chỉ dạng chữ
            lat: { type: Number },                         // Vĩ độ
            lng: { type: Number }                          // Kinh độ
        }
    ],

    // --- THÊM TRƯỜNG NÀY: VAI TRÒ MONG MUỐN ---
    // Lưu 'merchant' hoặc 'shipper' nếu họ đăng ký từ nút "Trở thành đối tác"
    targetRole: { type: String, default: '' },

    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
    shipper: { type: mongoose.Schema.Types.ObjectId, ref: 'Shipper' },

    avatar: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);