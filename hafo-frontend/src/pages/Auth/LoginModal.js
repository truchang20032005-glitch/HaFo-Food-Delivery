import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function LoginModal({ isOpen, onClose, targetRole }) {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isRegister, setIsRegister] = useState(false);

    // State cho Modal bị khóa
    const [lockedData, setLockedData] = useState(null); // { message, reason }

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
        if (!formData.username || !formData.password) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        if (isRegister && formData.password !== formData.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            const endpoint = isRegister ? '/register' : '/login';
            let payload = { ...formData };
            if (isRegister) {
                if (targetRole === 'merchant') payload.role = 'pending_merchant';
                if (targetRole === 'shipper') payload.role = 'pending_shipper';
                payload.targetRole = targetRole;
            }

            const response = await api.post(`/auth${endpoint}`, payload);

            if (isRegister) {
                alert('Đăng ký thành công! Vui lòng đăng nhập.');
                setIsRegister(false);
            } else {
                // Đăng nhập thành công
                const user = response.data.user;
                const token = response.data.token;
                login(user, token);
                onClose();

                // Logic điều hướng (giữ nguyên code cũ của bạn)
                if (user.approvalStatus === 'rejected') { alert("Hồ sơ đã bị từ chối."); return; }
                if (user.approvalStatus === 'pending') { navigate('/pending-approval'); return; }
                if (user.role === 'pending_merchant') { navigate('/register/merchant'); return; }
                if (user.role === 'pending_shipper') { navigate('/register/shipper'); return; }
                if (user.role === 'merchant') navigate('/merchant/dashboard');
                else if (user.role === 'shipper') navigate('/shipper/dashboard');
                else if (user.role === 'admin') navigate('/admin/dashboard');
            }
        } catch (error) {
            // XỬ LÝ RIÊNG LỖI BỊ KHÓA (403)
            if (error.response && error.response.status === 403) {
                // Backend trả về: { message: "...", reason: "..." }
                setLockedData(error.response.data);
            } else {
                alert(error.response?.data?.message || "Có lỗi xảy ra!");
            }
        }
    };

    if (!isOpen) return null;

    // --- GIAO DIỆN HIỂN THỊ KHI BỊ KHÓA ---
    if (lockedData) {
        return (
            <div className="lop-phu">
                <div className="hop-dang-nhap" style={{ textAlign: 'center', padding: '30px' }}>
                    <div style={{ fontSize: '50px', marginBottom: '10px' }}>🔒</div>
                    <h2 style={{ color: '#EF4444', margin: '0 0 10px 0' }}>Tài khoản bị khóa</h2>
                    <p style={{ color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                        {lockedData.message}
                    </p>
                    <div style={{ background: '#FFF5F5', padding: '15px', borderRadius: '8px', margin: '20px 0', border: '1px dashed #EF4444', textAlign: 'left' }}>
                        <div style={{ fontSize: '13px', color: '#EF4444', fontWeight: 'bold', marginBottom: '5px' }}>LÝ DO:</div>
                        <div style={{ color: '#333' }}>{lockedData.reason || "Không có lý do cụ thể."}</div>
                    </div>
                    <button
                        className="nut-dang-nhap-chinh"
                        onClick={() => { setLockedData(null); onClose(); }} // Đóng modal
                        style={{ background: '#666' }}
                    >
                        Đóng
                    </button>
                </div>
            </div>
        );
    }

    // --- GIAO DIỆN ĐĂNG NHẬP BÌNH THƯỜNG ---
    return (
        <div className="lop-phu">
            <div className="hop-dang-nhap">
                <div className="hdn__tieu-de">
                    {isRegister ? "Đăng ký tài khoản" : "Đăng nhập"}
                    <button className="nut-dong" onClick={onClose}>✕</button>
                </div>

                <div className="hdn__than">
                    {isRegister && (
                        <div className="nhom-input">
                            <input type="text" name="fullName" placeholder="Họ và tên hiển thị" value={formData.fullName} onChange={handleChange} />
                        </div>
                    )}
                    <div className="nhom-input">
                        <input type="text" name="username" placeholder="Tên đăng nhập" value={formData.username} onChange={handleChange} />
                    </div>
                    <div className="nhom-input">
                        <input type="password" name="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} />
                    </div>
                    {isRegister && (
                        <div className="nhom-input">
                            <input type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" value={formData.confirmPassword} onChange={handleChange} />
                        </div>
                    )}

                    <button className="nut-dang-nhap-chinh" onClick={handleSubmit}>
                        {isRegister ? "ĐĂNG KÝ NGAY" : "ĐĂNG NHẬP"}
                    </button>

                    <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                        {isRegister ? (
                            <span>Bạn đã có tài khoản? <span onClick={() => setIsRegister(false)} style={{ color: '#F97350', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }}>Đăng nhập</span></span>
                        ) : (
                            <span>Bạn chưa có tài khoản? <span onClick={() => setIsRegister(true)} style={{ color: '#F97350', fontWeight: 'bold', cursor: 'pointer', marginLeft: '5px' }}>Đăng ký ngay</span></span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginModal;