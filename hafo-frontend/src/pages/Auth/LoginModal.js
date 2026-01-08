import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { alertSuccess, alertError, alertWarning } from '../../utils/hafoAlert';

// Import Firebase

import { signInWithPopup, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { auth } from '../../firebase';

// 1. Thêm prop onOpenRegister vào đây
function LoginModal({ isOpen, onClose, onOpenRegister }) {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'

    const [loginData, setLoginData] = useState({ username: '', password: '' });
    const [resetData, setResetData] = useState({ email: '', otp: '', newPassword: '' });

    // --- LOGIC ĐĂNG NHẬP ---
    const handleLogin = async () => {
        // 1. Kiểm tra đầu vào
        if (!loginData.username || !loginData.password) {
            // Truyền cả title và text cho rõ ràng
            return alertWarning("Thiếu thông tin", "Vui lòng nhập đầy đủ username và password!");
        }

        try {
            const res = await api.post('/auth/login', loginData);

            // 2. Xử lý logic đăng nhập
            login(res.data.user, res.data.token);

            // 3. Thông báo thành công và ĐỢI nó chạy xong timer 2s
            await alertSuccess("Thành công", "Chào mừng bạn quay trở lại!");

            // 4. Sau khi alert đóng mới thực hiện các bước tiếp theo
            onClose();
            navigate('/');

        } catch (err) {
            // 5. Bắt lỗi từ Server
            const errMsg = err.response?.data?.message || "Không thể kết nối đến máy chủ";
            alertError("Đăng nhập thất bại", errMsg);
        }
    };

    const handleSocialLogin = async (providerName) => {
        try {
            let provider;
            if (providerName === 'Google') {
                provider = new GoogleAuthProvider();
            } else if (providerName === 'Facebook') {
                provider = new FacebookAuthProvider();
            } else {
                return;
            }

            // 1. Mở Popup đăng nhập của Google/FB
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // 2. Lấy thông tin cần thiết
            const payload = {
                email: user.email,
                fullName: user.displayName,
                avatar: user.photoURL,
                providerId: providerName
            };

            // 3. Gửi về Backend để lấy JWT Token của hệ thống HaFo
            const res = await api.post('/auth/social-login', payload);

            // 4. Lưu đăng nhập như bình thường
            login(res.data.user, res.data.token);
            await alertSuccess(`Xin chào, ${res.data.user.fullName}!`);
            onClose();

            // Điều hướng
            if (res.data.user.role === 'admin') navigate('/admin');
            else navigate('/home');

        } catch (error) {
            console.error(error);
            if (error.code === 'auth/popup-closed-by-user') return; // Người dùng tự tắt popup
            if (error.code === 'auth/account-exists-with-different-credential') {
                alertWarning("Thiếu thông tin", "Email này đã được đăng ký bằng phương thức khác.");
                return;
            }
            alertError("Đăng nhập thất bại: " + error.message);
        }
    };

    const sendResetOtp = async () => {
        if (!resetData.email) return alertWarning("Thiếu thông tin", "Vui lòng nhập Email!");
        try {
            await api.post('/auth/send-otp', { email: resetData.email });
            await alertSuccess("Đã gửi OTP vào email của bạn!");
            setView('reset');
        } catch (err) {
            alertError("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    const confirmResetPass = async () => {
        if (!resetData.otp || !resetData.newPassword) return alertWarning("Thiếu thông tin", "Nhập đủ OTP và Mật khẩu mới!");
        try {
            await api.post('/auth/reset-password', resetData);
            await alertSuccess("Đổi mật khẩu thành công! Vui lòng đăng nhập.");
            setView('login');
        } catch (err) {
            alertError("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    if (!isOpen) return null;
    return (
        <div className="auth-overlay">
            <div className="auth-modal">
                <div className="auth-modal__head" style={{ justifyContent: 'center', position: 'relative', padding: '10px 0', minHeight: 'auto' }}>
                    {/* ✅ Căn giữa tiêu đề Đăng nhập */}
                    <h2 style={{
                        textAlign: 'center',
                        width: '100%',
                        margin: '0',
                        //lineHeight: '1.2',
                        color: '#ffffffff',
                        fontWeight: '900',
                        fontSize: '20px'
                    }}>
                        {view === 'login' && 'Đăng nhập'}
                        {view === 'forgot' && 'Quên mật khẩu'}
                        {view === 'reset' && 'Đặt lại mật khẩu'}
                    </h2>
                    <button className="auth-modal__close" onClick={onClose} style={{
                        position: 'absolute',
                        right: '20px',
                        top: '50%',         // ✅ FIX 5: Căn giữa nút đóng theo chiều dọc header mới
                        transform: 'translateY(-50%)'
                    }}>✕</button>
                </div>

                <div className="auth-modal__body">

                    {view === 'login' && (
                        <>
                            <div className="nhom-input" style={{ marginBottom: 15 }}>
                                <input placeholder="Tên đăng nhập" value={loginData.username} onChange={e => setLoginData({ ...loginData, username: e.target.value })} />
                            </div>
                            <div className="nhom-input" style={{ marginBottom: 10 }}>
                                <input type="password" placeholder="Mật khẩu" value={loginData.password} onChange={e => setLoginData({ ...loginData, password: e.target.value })} />
                            </div>

                            <div style={{ textAlign: 'right', marginBottom: 20 }}>
                                <span className="hover-link" onClick={() => setView('forgot')} style={{ color: '#F97350', fontSize: 13, cursor: 'pointer' }}>Quên mật khẩu?</span>
                            </div>

                            <button className="nut-dang-nhap-chinh" onClick={handleLogin}>ĐĂNG NHẬP</button>

                            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                                Bạn chưa có tài khoản?{' '}
                                <span
                                    onClick={() => { onClose(); onOpenRegister(); }}
                                    onMouseOver={(e) => (e.target.style.textDecoration = 'underline')}
                                    onMouseOut={(e) => (e.target.style.textDecoration = 'none')}
                                    style={{ color: '#F97350', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Đăng ký ngay
                                </span>
                            </div>

                            {/* --- PHẦN SOCIAL LOGIN --- */}
                            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: '#999', fontSize: 13 }}>
                                <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                                <span style={{ padding: '0 10px' }}>Hoặc đăng nhập bằng</span>
                                <div style={{ flex: 1, height: 1, background: '#eee' }}></div>
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                {/* Nút Google */}
                                <button
                                    onClick={() => handleSocialLogin('Google')}
                                    className="social-btn"
                                    style={{ flex: 1, padding: 10, border: '1px solid #db4437', background: '#db4437', color: '#fff', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    <i className="fa-brands fa-google"></i> Google
                                </button>
                            </div>
                        </>
                    )}

                    {view === 'forgot' && (
                        <>
                            <p style={{ marginBottom: 15, fontSize: 14, color: '#666' }}>Nhập email đã đăng ký để nhận mã OTP.</p>
                            <div className="nhom-input" style={{ marginBottom: 20 }}>
                                <input type="email" placeholder="Email của bạn" value={resetData.email} onChange={e => setResetData({ ...resetData, email: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
                                <button className="nut-dang-nhap-chinh" style={{ justifyContent: 'center', width: '40%', marginTop: 10 }} onClick={sendResetOtp}>
                                    GỬI MÃ OTP
                                </button>
                                <button className="btn soft" style={{ justifyContent: 'center', width: '40%', marginTop: 10 }} onClick={() => setView('login')}>
                                    Quay lại
                                </button>
                            </div>
                        </>
                    )}

                    {view === 'reset' && (
                        <>
                            <div className="nhom-input" style={{ marginBottom: 15 }}>
                                <input placeholder="Mã OTP 6 số" value={resetData.otp} onChange={e => setResetData({ ...resetData, otp: e.target.value })} />
                            </div>
                            <div className="nhom-input" style={{ marginBottom: 20 }}>
                                <input type="password" placeholder="Mật khẩu mới" value={resetData.newPassword} onChange={e => setResetData({ ...resetData, newPassword: e.target.value })} />
                            </div>
                            <button className="nut-dang-nhap-chinh" onClick={confirmResetPass}>XÁC NHẬN ĐỔI</button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

export default LoginModal;