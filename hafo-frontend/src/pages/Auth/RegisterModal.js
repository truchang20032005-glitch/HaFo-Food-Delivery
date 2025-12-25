import { useState } from 'react';
import api from '../../services/api';

function RegisterModal({ isOpen, onClose, role, onOpenLogin }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: '', password: '', confirmPassword: '',
        fullName: '', email: '', phone: '',
        gender: 'Nam', birthday: '', address: '', otp: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSendOtp = async () => {
        if (!formData.email) return alert("Vui lòng nhập Email trước!");
        setLoading(true);
        try {
            await api.post('/auth/send-otp', { email: formData.email });
            alert(`✅ Đã gửi mã OTP đến ${formData.email}`);
            setStep(2);
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
                <div className="auth-modal__head">
                    <div className="auth-modal__title">
                        {role ? 'Đăng ký Đối tác' : 'Đăng ký Tài khoản'}
                    </div>
                    <button className="auth-modal__close" onClick={onClose}>✕</button>
                </div>

                <div className="auth-modal__body">
                    {/* (Các ô input giữ nguyên code cũ nhưng nằm trong class mới) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div className="nhom-input"><input name="username" placeholder="Tên đăng nhập *" value={formData.username} onChange={handleChange} /></div>
                        <div className="nhom-input"><input name="fullName" placeholder="Họ và tên *" value={formData.fullName} onChange={handleChange} /></div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div className="nhom-input"><input name="email" type="email" placeholder="Email *" value={formData.email} onChange={handleChange} /></div>
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

                    <div style={{ background: '#FFF5F2', padding: '15px', borderRadius: '8px', border: '1px dashed #F97350', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input name="otp" placeholder="Mã OTP" value={formData.otp} onChange={handleChange} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            <button onClick={handleSendOtp} disabled={loading} style={{ background: '#333', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer' }}>
                                {loading ? '...' : 'Lấy OTP'}
                            </button>
                        </div>
                    </div>

                    <button className="nut-dang-nhap-chinh" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'ĐANG XỬ LÝ...' : 'HOÀN TẤT ĐĂNG KÝ'}
                    </button>

                    <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px' }}>
                        Đã có tài khoản? <span onClick={() => { onClose(); onOpenLogin(); }} style={{ color: '#F97350', fontWeight: 'bold', cursor: 'pointer' }}>Đăng nhập</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterModal;