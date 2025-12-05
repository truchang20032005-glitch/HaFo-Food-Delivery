# HAFO - Hệ Thống Đặt Món & Giao Hàng Trực Tuyến

![Status](https://img.shields.io/badge/Status-Completed-success) ![Version](https://img.shields.io/badge/Version-1.0.0-blue)

## 📖 Giới thiệu (Introduction)

**HAFO** là nền tảng ứng dụng web kết nối giữa Khách hàng, Nhà hàng và Người giao hàng. Hệ thống giải quyết bài toán đặt đồ ăn trực tuyến nhanh chóng, quản lý đơn hàng hiệu quả và theo dõi tiến trình giao hàng theo thời gian thực.

Dự án được xây dựng nhằm phục vụ môn học: **[Tên môn học/Đồ án tốt nghiệp]**.

---

## 🚀 Tính năng chính (Key Features)

Dựa trên phân hệ Khách hàng và quản lý hệ thống:

### 👤 Phân hệ Khách hàng (Customer)
- **Quản lý tài khoản:** Đăng ký, Đăng nhập, Quên mật khẩu, Cập nhật thông tin cá nhân.
- **Tìm kiếm & Đặt món:**
  - Tìm kiếm nhà hàng/món ăn theo từ khóa.
  - Quản lý giỏ hàng (Thêm/Sửa/Xóa).
  - Áp dụng mã khuyến mãi (Voucher).
- **Thanh toán đa dạng:**
  - Tiền mặt (COD).
  - Ví điện tử.
  - Chuyển khoản ngân hàng.
- **Theo dõi đơn hàng:** Xem trạng thái đơn (Đang chuẩn bị, Đang giao, Đã giao) và vị trí shipper.
- **Đánh giá:** Gửi feedback/rating sau khi hoàn thành đơn.

### 🏢 Phân hệ Nhà hàng (Restaurant)
- Nhận đơn đặt hàng mới.
- Cập nhật trạng thái món ăn (Hết hàng/Còn hàng).
- Thống kê doanh thu ngày/tháng.

### 🛵 Phân hệ Giao hàng (Shipper)
- Nhận đơn giao hàng từ hệ thống.
- Cập nhật trạng thái giao vận.

---

## 🛠 Công nghệ sử dụng (Tech Stack)

- **Frontend:** [ReactJS / HTML5 / CSS3 / Bootstrap]
- **Backend:** [NodeJS / Java Spring Boot / PHP Laravel]
- **Database:** [MySQL / SQL Server / MongoDB]
- **Tools:** VS Code, Git, Postman.

---

## ⚙️ Hướng dẫn cài đặt (Installation)

Để chạy dự án này trên máy cục bộ (Localhost), làm theo các bước sau:

### 1. Yêu cầu hệ thống
- Node.js (phiên bản 14 trở lên)
- [MySQL/SQL Server] đã được cài đặt và chạy.

### 2. Cài đặt

**Bước 1: Clone dự án**
```bash
git clone [https://github.com/](https://github.com/)[username-cua-ban]/hafo-project.git
cd hafo-project