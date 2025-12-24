import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

/**
 * Modal đăng ký tài khoản
 * @param {boolean} isOpen - Hiển thị modal hay không
 * @param {function} onClose - Hàm đóng modal
 * @param {string} role - Role để đăng ký: 'pending_merchant' hoặc 'pending_shipper'
 */
function RegisterModal({ isOpen, onClose, role, onOpenLogin }) {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        // 1. Validate
        if (!formData.username || !formData.password || !formData.fullName) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            // 2. Đăng ký với role PENDING (chưa phải merchant/shipper thật)
            /*await axios.post('http://localhost:5000/api/auth/register', {
                username: formData.username,
                password: formData.password,
                fullName: formData.fullName,
                role: role // ✅ GỬI: 'pending_merchant' hoặc 'pending_shipper'
            });*/
            await api.post('/auth/register', {
                username: formData.username,
                password: formData.password,
                fullName: formData.fullName,
                role: role // ✅ GỬI: 'pending_merchant' hoặc 'pending_shipper'
            });

            alert('Đăng ký thành công!');

            // 3. Tự động đăng nhập
            /*const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                username: formData.username,
                password: formData.password
            });*/
            const loginResponse = await api.post('/auth/login', {
                username: formData.username,
                password: formData.password
            });

            // 4. Lưu token và thông tin user
            localStorage.setItem('token', loginResponse.data.token);
            localStorage.setItem('user', JSON.stringify(loginResponse.data.user));

            onClose();

            // 5. Chuyển đến trang điền thông tin
            if (role === 'pending_merchant') {
                navigate('/register/merchant');
            } else if (role === 'pending_shipper') {
                navigate('/register/shipper');
            }

        } catch (error) {
            alert(error.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    if (!isOpen) return null;

    // Hiển thị tiêu đề theo role
    const getTitle = () => {
        if (role === 'pending_merchant') return 'Đăng ký Đối tác Nhà hàng';
        if (role === 'pending_shipper') return 'Đăng ký Đối tác Tài xế';
        return 'Đăng ký tài khoản';
    };

    return (
        <div className="lop-phu">
            <div className="hop-dang-nhap">
                <div className="hdn__tieu-de">
                    {getTitle()}
                    <button className="nut-dong" onClick={onClose}>✕</button>
                </div>

                <div className="hdn__than">
                    {/* Họ tên */}
                    <div className="nhom-input">
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Họ và tên hiển thị"
                            value={formData.fullName}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Tên đăng nhập */}
                    <div className="nhom-input">
                        <input
                            type="text"
                            name="username"
                            placeholder="Tên đăng nhập"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Mật khẩu */}
                    <div className="nhom-input">
                        <input
                            type="password"
                            name="password"
                            placeholder="Mật khẩu"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div className="nhom-input">
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Nhập lại mật khẩu"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Nút đăng ký */}
                    <button className="nut-dang-nhap-chinh" onClick={handleSubmit}>
                        ĐĂNG KÝ NGAY
                    </button>

                    {/* Link đăng nhập nếu đã có tài khoản */}
                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                        <span>
                            Đã có tài khoản?{' '}
                            <span
                                onClick={() => {
                                    onClose();
                                    // TODO: Mở LoginModal
                                    onOpenLogin?.();
                                }}
                                style={{
                                    color: '#F97350',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                Đăng nhập
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterModal;