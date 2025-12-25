import { useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
        if (!loginData.username || !loginData.password) return alert("Nhập thiếu thông tin!");
        try {
            const res = await api.post('/auth/login', loginData);
            login(res.data.user, res.data.token);
            alert("Đăng nhập thành công!");
            onClose();
            // Điều hướng
            if (res.data.user.role === 'admin') navigate('/admin');
            else if (res.data.user.role === 'merchant') navigate('/merchant');
            else if (res.data.user.role === 'shipper') navigate('/shipper');
            else navigate('/home');
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || err.message));
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
            alert(`Xin chào, ${res.data.user.fullName}!`);
            onClose();

            // Điều hướng
            if (res.data.user.role === 'admin') navigate('/admin');
            else navigate('/home');

        } catch (error) {
            console.error(error);
            if (error.code === 'auth/popup-closed-by-user') return; // Người dùng tự tắt popup
            if (error.code === 'auth/account-exists-with-different-credential') {
                alert("Email này đã được đăng ký bằng phương thức khác.");
                return;
            }
            alert("Đăng nhập thất bại: " + error.message);
        }
    };

    const sendResetOtp = async () => {
        if (!resetData.email) return alert("Vui lòng nhập Email!");
        try {
            await api.post('/auth/send-otp', { email: resetData.email });
            alert("Đã gửi OTP vào email của bạn!");
            setView('reset');
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    const confirmResetPass = async () => {
        if (!resetData.otp || !resetData.newPassword) return alert("Nhập đủ OTP và Mật khẩu mới!");
        try {
            await api.post('/auth/reset-password', resetData);
            alert("Đổi mật khẩu thành công! Vui lòng đăng nhập.");
            setView('login');
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    if (!isOpen) return null;
    return (
        <div className="auth-overlay">
            <div className="auth-modal">
                <div className="auth-modal__head">
                    <div className="auth-modal__title">
                        {view === 'login' && 'Đăng Nhập'}
                        {view === 'forgot' && 'Quên Mật Khẩu'}
                        {view === 'reset' && 'Đặt Lại Mật Khẩu'}
                    </div>
                    <button className="auth-modal__close" onClick={onClose}>✕</button>
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
                                <span onClick={() => setView('forgot')} style={{ color: '#F97350', fontSize: 13, cursor: 'pointer' }}>Quên mật khẩu?</span>
                            </div>

                            <button className="nut-dang-nhap-chinh" onClick={handleLogin}>ĐĂNG NHẬP</button>

                            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                                Bạn chưa có tài khoản?{' '}
                                <span
                                    onClick={() => { onClose(); onOpenRegister(); }}
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
                                {/* Nút Facebook */}
                                <button
                                    onClick={() => handleSocialLogin('Facebook')}
                                    style={{ flex: 1, padding: 10, border: '1px solid #3b5998', background: '#3b5998', color: '#fff', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                                >
                                    <i className="fa-brands fa-facebook-f"></i> Facebook
                                </button>

                                {/* Nút Google */}
                                <button
                                    onClick={() => handleSocialLogin('Google')}
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
                            <button className="nut-dang-nhap-chinh" onClick={sendResetOtp}>GỬI MÃ OTP</button>
                            <button className="btn soft" style={{ width: '100%', marginTop: 10 }} onClick={() => setView('login')}>Quay lại</button>
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