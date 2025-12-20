const mongoose = require('mongoose');

const PendingRestaurantSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // ID tài khoản đăng ký

    // Bước 1: Loại hình
    serviceType: { type: String, default: 'food' }, // food | mart

    // Bước 2: Thông tin quán
    name: String,
    type: String, // Loại món (Bún bò, Cơm...)
    address: String, // Địa chỉ đầy đủ
    city: String,
    district: String,
    phone: String,

    // Bước 3: Người đại diện
    repName: String,
    repEmail: String,
    repPhone: String,
    cccdFront: String, // Link ảnh
    cccdBack: String,
    regType: String, // cá nhân | hộ kinh doanh | doanh nghiệp

    // Bước 4: Ngân hàng
    bankName: String,
    bankAccount: String,
    bankOwner: String,
    bankBranch: String,

    // Bước 5: Chi tiết
    avatar: String,
    cover: String,
    openHours: Object, // Lưu JSON giờ mở cửa

    status: { type: String, default: 'pending' }, // pending | approved | rejected
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PendingRestaurant', PendingRestaurantSchema);