import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginModal({ isOpen, onClose, targetRole }) {
    const navigate = useNavigate();
    // 1. Quản lý trạng thái: Đăng nhập (false) hay Đăng ký (true)
    const [isRegister, setIsRegister] = useState(false);

    // 2. Quản lý dữ liệu nhập vào
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '', // Dùng cho đăng ký
        fullName: ''         // Dùng cho đăng ký
    });

    // Hàm cập nhật dữ liệu khi gõ phím
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. HÀM GỬI DỮ LIỆU LÊN SERVER (QUAN TRỌNG)
    const handleSubmit = async () => {
        // Validate cơ bản
        if (!formData.username || !formData.password) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        // Kiểm tra mật khẩu nhập lại (khi đăng ký)
        if (isRegister && formData.password !== formData.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            const endpoint = isRegister ? '/register' : '/login';
            const url = `http://localhost:5000/api/auth${endpoint}`;
            const response = await axios.post(url, formData);

            if (isRegister) {
                alert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
                setIsRegister(false);
            } else {
                alert('Đăng nhập thành công!');
                const userData = response.data.user; // Lấy thông tin user từ response
                const token = response.data.token;

                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                onClose();

                // --- LOGIC ĐIỀU HƯỚNG QUAN TRỌNG ---
                if (targetRole === 'merchant') {
                    navigate('/register/merchant'); // Chuyển sang form Nhà hàng
                } else if (targetRole === 'shipper') {
                    navigate('/register/shipper'); // Chuyển sang form Shipper
                } else {
                    window.location.reload(); // Khách thường thì reload
                }

                // 2. Nếu đăng nhập bình thường -> Chuyển theo Role của User
                switch (userData.role) {
                    case 'merchant':
                        navigate('/merchant/dashboard'); // Chuyển sang trang Quản lý quán
                        break;
                    case 'shipper':
                        navigate('/shipper/dashboard'); // Chuyển sang trang Tài xế
                        break;
                    case 'admin':
                        navigate('/admin/dashboard'); // Chuyển sang trang Admin
                        break;
                    default:
                        navigate('/'); // Khách hàng về trang chủ
                        window.location.reload(); // Reload để cập nhật Navbar
                        break;
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="lop-phu">
            <div className="hop-dang-nhap">
                <div className="hdn__tieu-de">
                    {isRegister ? "Đăng ký tài khoản" : "Đăng nhập"}
                    <button className="nut-dong" onClick={onClose}>✕</button>
                </div>

                <div className="hdn__than">
                    {/* Form nhập liệu */}
                    {isRegister && (
                        <div className="nhom-input">
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Họ và tên hiển thị"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    <div className="nhom-input">
                        <input
                            type="text"
                            name="username"
                            placeholder="Tên đăng nhập"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="nhom-input">
                        <input
                            type="password"
                            name="password"
                            placeholder="Mật khẩu"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    {isRegister && (
                        <div className="nhom-input">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Nhập lại mật khẩu"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    {/* Nút bấm gọi hàm handleSubmit */}
                    <button className="nut-dang-nhap-chinh" onClick={handleSubmit}>
                        {isRegister ? "ĐĂNG KÝ NGAY" : "ĐĂNG NHẬP"}
                    </button>

                    {/* Chuyển đổi qua lại giữa Đăng nhập/Đăng ký */}
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                        {isRegister ? (
                            <span>
                                Bạn đã có tài khoản?
                                <span
                                    onClick={() => setIsRegister(false)}
                                    style={{ color: '#F97350', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }}
                                >
                                    Đăng nhập
                                </span>
                            </span>
                        ) : (
                            <span>
                                Bạn chưa có tài khoản?
                                <span
                                    onClick={() => setIsRegister(true)}
                                    style={{ color: '#F97350', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }}
                                >
                                    Đăng ký ngay
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;