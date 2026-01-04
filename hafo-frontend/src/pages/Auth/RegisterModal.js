import { useState } from 'react';
import api from '../../services/api';

function RegisterModal({ isOpen, onClose, role, onOpenLogin }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const modalTitle = (role && role !== 'customer') ? "Đăng ký đối tác" : "Đăng ký";
    const [errors, setErrors] = useState({ email: '', username: '' });

    const [formData, setFormData] = useState({
        username: '', password: '', confirmPassword: '',
        fullName: '', email: '', phone: '',
        gender: 'Nam', birthday: '', address: '', otp: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Hàm kiểm tra trùng lặp thực tế qua API
    const checkDuplicate = async (field, value) => {
        if (!value) return;
        try {
            await api.post('/auth/check-duplicate', { [field]: value });
            setErrors(prev => ({ ...prev, [field]: '' })); // Xóa lỗi nếu hợp lệ
        } catch (err) {
            setErrors(prev => ({ ...prev, [field]: err.response?.data?.message || 'Đã có lỗi xảy ra' }));
        }
    };

    const handleSendOtp = async () => {
        if (!formData.email) return alert("Vui lòng nhập Email trước!");
        if (errors.email) return alert("Email này không hợp lệ hoặc đã tồn tại!");
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email: formData.email });
            alert(`✅ Đã gửi mã OTP đến ${formData.email}`);
            setStep(2); // ✅ Trượt sang bước 2
        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.username || !formData.password || !formData.otp) return alert("Điền đủ thông tin!");
        if (formData.password !== formData.confirmPassword) return alert("Mật khẩu không khớp!");

        setLoading(true);
        try {
            await api.post('/auth/register', { ...formData, role: role || 'customer' });
            alert("🎉 Đăng ký thành công!");
            onClose();
            onOpenLogin();
        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // ✅ ĐÃ ĐỔI TÊN CLASS Ở ĐÂY
    return (
        <div className="auth-overlay">
            <div className="auth-modal" style={{ maxWidth: '600px' }}>
                <div className="auth-modal__head" style={{ justifyContent: 'center', position: 'relative', padding: '10px 0', minHeight: 'auto' }}>
                    <div className="auth-modal__title">
                        <h2 style={{
                            textAlign: 'center',
                            width: '100%',
                            margin: '0',
                            lineHeight: '1.2',
                            color: '#ffffffff',
                            fontWeight: '900',
                            fontSize: '20px'
                        }}>
                            {modalTitle}
                        </h2>
                    </div>
                    <button className="auth-modal__close" onClick={onClose} style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50%',         // ✅ FIX 5: Căn giữa nút đóng theo chiều dọc header mới
                        transform: 'translateY(-50%)'
                    }}>✕</button>
                </div>

                <div className="auth-modal__body" style={{ padding: '20px 0' }}>
                    {/* Khung bao ngoài để ẩn phần tràn */}
                    <div className="auth-slider-container" style={{ width: '100%', overflow: 'hidden' }}>

                        {/* Thanh trượt chứa cả 2 step. Dịch chuyển dựa trên biến step */}
                        <div
                            className="auth-slider-content"
                            style={{
                                display: 'flex',
                                width: '200%',
                                transition: 'transform 0.5s ease-in-out',
                                transform: `translateX(${step === 1 ? '0%' : '-50%'})`
                            }}
                        >
                            {/* --- BƯỚC 1: NHẬP THÔNG TIN (Chiếm 50% thanh trượt) --- */}
                            <div className="auth-step-pane" style={{ width: '50%', padding: '0 25px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div className="nhom-input">
                                        <input
                                            name="username"
                                            placeholder="Tên đăng nhập *"
                                            value={formData.username}
                                            onChange={handleChange}
                                            onBlur={(e) => checkDuplicate('username', e.target.value)} // Kiểm tra khi rời ô
                                        />
                                        {errors.username && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.username}</span>}
                                    </div>
                                    <div className="nhom-input"><input name="fullName" placeholder="Họ và tên *" value={formData.fullName} onChange={handleChange} /></div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div className="nhom-input">
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="Email *"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={(e) => checkDuplicate('email', e.target.value)} // Kiểm tra khi rời ô
                                        />
                                        {errors.email && <span style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
                                    </div>
                                    <div className="nhom-input"><input name="phone" placeholder="SĐT *" value={formData.phone} onChange={handleChange} /></div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div className="nhom-input"><input name="birthday" type="date" value={formData.birthday} onChange={handleChange} /></div>
                                    <div className="nhom-input">
                                        <select name="gender" value={formData.gender} onChange={handleChange}>
                                            <option>Nam</option><option>Nữ</option><option>Khác</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="nhom-input" style={{ marginBottom: '15px' }}>
                                    <input name="address" placeholder="Địa chỉ" value={formData.address} onChange={handleChange} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                    <div className="nhom-input"><input name="password" type="password" placeholder="Mật khẩu *" value={formData.password} onChange={handleChange} /></div>
                                    <div className="nhom-input"><input name="confirmPassword" type="password" placeholder="Nhập lại MK *" value={formData.confirmPassword} onChange={handleChange} /></div>
                                </div>

                                <button className="nut-dang-nhap-chinh" onClick={handleSendOtp} disabled={loading}>
                                    {loading ? 'ĐANG GỬI MÃ...' : 'TIẾP TỤC & LẤY MÃ'}
                                </button>
                            </div>

                            {/* --- BƯỚC 2: XÁC THỰC OTP (Chiếm 50% còn lại) --- */}
                            <div className="auth-step-pane" style={{ width: '50%', padding: '0 25px' }}>
                                <div style={{
                                    background: '#f8fafc',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    marginBottom: '20px',
                                    textAlign: 'center'
                                }}>
                                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '15px' }}>
                                        Mã xác thực đã được gửi đến email:<br /><b>{formData.email}</b>
                                    </p>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            name="otp"
                                            placeholder="Mã OTP"
                                            value={formData.otp}
                                            onChange={handleChange}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '10px',
                                                border: '1px solid #ddd',
                                                outline: 'none',
                                                textAlign: 'center',
                                                letterSpacing: '2px'
                                            }}
                                        />
                                        <button
                                            onClick={handleSendOtp}
                                            disabled={loading}
                                            style={{
                                                background: '#333',
                                                color: '#fff',
                                                border: 'none',
                                                padding: '0 15px',
                                                borderRadius: '10px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            GỬI LẠI
                                        </button>
                                    </div>
                                </div>

                                <button className="nut-dang-nhap-chinh" onClick={handleSubmit} disabled={loading}>
                                    {loading ? 'ĐANG XỬ LÝ...' : 'HOÀN TẤT ĐĂNG KÝ'}
                                </button>

                                <p
                                    onClick={() => setStep(1)}
                                    style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', color: '#F97350', fontSize: '13px', fontWeight: 'bold' }}
                                >
                                    <i className="fa-solid fa-arrow-left"></i> Quay lại sửa thông tin
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Phần đăng nhập nằm ngoài thanh trượt để cố định */}
                    <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                        Đã có tài khoản? <span onClick={() => { onClose(); onOpenLogin(); }} style={{ color: '#F97350', fontWeight: 'bold', cursor: 'pointer' }}>Đăng nhập</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterModal;