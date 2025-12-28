const mongoose = require('mongoose');

const RestaurantSchema = new mongoose.Schema({
    // 1. LIÊN KẾT CHỦ SỞ HỮU
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // 2. THÔNG TIN CƠ BẢN (Dùng để hiển thị danh sách quán)
    name: { type: String, required: true },
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: true } // [lng, lat]
    },
    phone: { type: String, required: true },
    image: { type: String }, // Link ảnh bìa quán

    // 3. CHI TIẾT KINH DOANH
    city: { type: String },
    district: { type: String },
    cuisine: [{ type: String }], // Mảng các loại món ăn (VD: [ "Cơm", "Bún", "Phở" ])
    openTime: { type: String },  // Giờ mở cửa (VD: "08:00")
    closeTime: { type: String }, // Giờ đóng cửa (VD: "21:00")
    priceRange: { type: String }, // Phân khúc giá (VD: "30.000đ - 100.000đ")

    // 4. THÔNG TIN TÀI KHOẢN NGÂN HÀNG (Để đối soát rút tiền ở trang Ví)
    bankName: { type: String },    // Tên ngân hàng (VD: Vietcombank)
    bankAccount: { type: String }, // Số tài khoản
    bankOwner: { type: String },   // Họ tên chủ tài khoản
    bankBranch: { type: String },  // Chi nhánh ngân hàng

    // 5. CHỈ SỐ VÀ TRẠNG THÁI
    rating: { type: Number, default: 0 },   // Điểm đánh giá trung bình
    isOpen: { type: Boolean, default: true }, // Trạng thái quán (Đóng/Mở cửa)

    // 6. TỌA ĐỘ GPS (Để dùng cho Map real và Shipper tìm đường)
    lat: { type: Number, default: 10.762622 }, // Vĩ độ (Mặc định TP.HCM)
    lng: { type: Number, default: 106.660172 }  // Kinh độ (Mặc định TP.HCM)

}, {
    timestamps: true // Tự động tạo trường createdAt và updatedAt cho má luôn
});

module.exports = mongoose.models.Restaurant || mongoose.model('Restaurant', RestaurantSchema);