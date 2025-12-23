import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function LoginModal({ isOpen, onClose, targetRole }) {
    const navigate = useNavigate();
    const { login } = useAuth();
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
            // Logic gửi role khi đăng ký (giữ nguyên)
            let payload = { ...formData };
            if (isRegister) {
                if (targetRole === 'merchant') payload.role = 'pending_merchant';
                if (targetRole === 'shipper') payload.role = 'pending_shipper';
                payload.targetRole = targetRole;
            }

            const response = await axios.post(`http://localhost:5000/api/auth${endpoint}`, payload);

            if (isRegister) {
                alert('Đăng ký thành công! Vui lòng đăng nhập.');
                setIsRegister(false);
            } else {
                alert('Đăng nhập thành công!');
                const user = response.data.user;
                const token = response.data.token;

                // GỌI HÀM LOGIN CỦA CONTEXT -> APP SẼ TỰ RE-RENDER NGAY LẬP TỨC
                login(user, token);
                onClose();

                // --- LOGIC ĐIỀU HƯỚNG MỚI (CHECK KỸ HƠN) ---

                // 1. Nếu đã bị TỪ CHỐI
                if (user.approvalStatus === 'rejected') {
                    alert("Hồ sơ của bạn đã bị từ chối. Vui lòng liên hệ Admin.");
                    return;
                }

                // 2. Nếu đang CHỜ DUYỆT (Đã nộp đơn rồi)
                if (user.approvalStatus === 'pending') {
                    alert("Hồ sơ của bạn đang được xét duyệt. Vui lòng quay lại sau!");
                    // Có thể chuyển đến trang thông báo chờ (nếu có)
                    navigate('/');
                    return;
                }

                // 3. Nếu CHƯA NỘP ĐƠN (pending_... nhưng status là none)
                if (user.role === 'pending_merchant') {
                    navigate('/register/merchant');
                    return;
                }
                if (user.role === 'pending_shipper') {
                    navigate('/register/shipper');
                    return;
                }

                // 4. Các role chính thức
                if (user.role === 'merchant') navigate('/merchant/dashboard');
                else if (user.role === 'shipper') navigate('/shipper/dashboard');
                else if (user.role === 'admin') navigate('/admin/dashboard');
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