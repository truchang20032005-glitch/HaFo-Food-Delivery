import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

function Settings() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null); // Ref để mở chọn file
    const [loading, setLoading] = useState(false);

    // State cho thông tin Admin
    const [adminInfo, setAdminInfo] = useState({
        id: '',
        fullName: '',
        email: '',
        phone: '',
        avatar: '' // Thêm avatar vào state
    });

    const [systemConfig, setSystemConfig] = useState(() => {
        const savedConfig = localStorage.getItem('adminConfig');
        return savedConfig ? JSON.parse(savedConfig) : {
            timeout: 15,
            maxOrders: 500,
            theme: 'light',
            language: 'vi'
        };
    });

    const [showPassModal, setShowPassModal] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    // --- 1. LOAD DỮ LIỆU KHI VÀO TRANG ---
    const fetchProfile = async () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const userObj = JSON.parse(userStr);
            try {
                const res = await api.get(`/users/${userObj.id}`);
                const u = res.data;
                setAdminInfo({
                    id: u._id,
                    fullName: u.fullName || '',
                    email: u.email || '',
                    phone: u.phone || '',
                    avatar: u.avatar || '' // Lấy avatar từ DB
                });
            } catch (err) {
                console.error("Lỗi tải profile:", err);
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        document.body.classList.remove('light', 'dark');
        if (systemConfig.theme === 'dark') {
            document.body.classList.add('dark');
        }
        localStorage.setItem('adminConfig', JSON.stringify(systemConfig));
    }, [systemConfig.theme]);

    const getCleanImageUrl = (url) => {
        if (!url) return "/images/admin.png";
        const connector = url.includes('?') ? '&' : '?';
        return `${url}${connector}t=${new Date().getTime()}`;
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click(); // Kích hoạt input file ẩn
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('avatar', file);

        try {
            setLoading(true);
            const res = await api.put(`/users/${adminInfo.id}`, uploadData);
            const updatedUser = res.data;

            // Cập nhật State để UI thay đổi ngay
            setAdminInfo(prev => ({ ...prev, avatar: updatedUser.avatar }));

            // Cập nhật LocalStorage
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const newUserStorage = { ...currentUser, avatar: updatedUser.avatar };
            localStorage.setItem('user', JSON.stringify(newUserStorage));

            // 🔥 PHÁT EVENT ĐỂ NAVBAR/HEADER CẬP NHẬT THEO
            window.dispatchEvent(new Event('storage'));

            alert("✅ Cập nhật ảnh đại diện thành công!");

            // Reset input file để có thể chọn lại chính file đó nếu muốn
            e.target.value = null;
        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // --- 3. LƯU THÔNG TIN CHỮ ---
    const handleSaveInfo = async () => {
        if (!adminInfo.fullName) return alert("Tên không được để trống!");
        setLoading(true);
        try {
            const res = await api.put(`/users/${adminInfo.id}`, {
                fullName: adminInfo.fullName,
                email: adminInfo.email,
                phone: adminInfo.phone
            });

            const currentUser = JSON.parse(localStorage.getItem('user'));
            localStorage.setItem('user', JSON.stringify({ ...currentUser, fullName: res.data.fullName, email: res.data.email, phone: res.data.phone }));

            alert("✅ Cập nhật thông tin thành công!");
        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleChangePass = async () => {
        if (!passData.current || !passData.new || !passData.confirm) return alert("⚠️ Vui lòng nhập đủ!");
        if (passData.new !== passData.confirm) return alert("❌ Mật khẩu không khớp!");

        try {
            await api.post('/auth/change-password', { userId: adminInfo.id, oldPass: passData.current, newPass: passData.new });
            alert("✅ Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
            window.location.reload();
        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            {/* 1. THÔNG TIN TÀI KHOẢN */}
            <div className="card-stat" style={{ marginTop: '20px', padding: '25px' }}>
                <h4 style={{ marginTop: 0, color: '#F97350', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                    <i className="fa-solid fa-user-gear"></i> Thông tin tài khoản
                </h4>

                <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                    {/* KHU VỰC AVATAR (Giao diện giống Profile khách) */}
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{ position: 'relative', width: '120px', height: '120px', cursor: 'pointer' }}
                            onClick={handleAvatarClick}
                        >
                            <img
                                src={getCleanImageUrl(adminInfo.avatar)}
                                alt="Admin Avatar"
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                onError={(e) => e.target.src = 'https://via.placeholder.com/120'}
                            />
                            <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#F97350', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                                <i className="fa-solid fa-camera" style={{ fontSize: '14px' }}></i>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                        <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>Nhấn để đổi ảnh</p>
                    </div>

                    {/* FORM NHẬP LIỆU */}
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '150px 1fr', gap: '15px', alignItems: 'center' }}>
                        <label style={{ fontWeight: '600', color: '#555' }}>Tên quản trị</label>
                        <input
                            value={adminInfo.fullName}
                            onChange={(e) => setAdminInfo({ ...adminInfo, fullName: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />

                        <label style={{ fontWeight: '600', color: '#555' }}>Email</label>
                        <input
                            value={adminInfo.email}
                            onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />

                        <label style={{ fontWeight: '600', color: '#555' }}>Điện thoại</label>
                        <input
                            value={adminInfo.phone}
                            onChange={(e) => setAdminInfo({ ...adminInfo, phone: e.target.value })}
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                        />

                        <div></div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button className="btn primary" onClick={handleSaveInfo} disabled={loading} style={{ padding: '10px 20px' }}>
                                {loading ? 'Đang lưu...' : 'Lưu thông tin'}
                            </button>
                            <button className="btn" onClick={() => setShowPassModal(true)}>Đổi mật khẩu</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. CẤU HÌNH HỆ THỐNG */}
            <div className="card-stat" style={{ marginTop: '20px', padding: '25px' }}>
                <h4 style={{ marginTop: 0, color: '#F97350', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
                    <i className="fa-solid fa-paint-roller"></i> Giao diện & Hệ thống
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '150px 300px', gap: '15px', alignItems: 'center' }}>
                    <label style={{ fontWeight: '600' }}>Chủ đề</label>
                    <select
                        value={systemConfig.theme}
                        onChange={(e) => setSystemConfig({ ...systemConfig, theme: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    >
                        <option value="light">Sáng (Mặc định)</option>
                        <option value="dark">Tối</option>
                    </select>

                    <label style={{ fontWeight: '600' }}>Ngôn ngữ</label>
                    <select
                        value={systemConfig.language}
                        onChange={(e) => setSystemConfig({ ...systemConfig, language: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                    </select>

                    <div></div>
                    <button className="btn soft" onClick={() => { localStorage.setItem('adminConfig', JSON.stringify(systemConfig)); alert("⚙️ Đã lưu cấu hình!"); }}>Lưu cấu hình</button>
                </div>
            </div>

            {/* MODAL ĐỔI MẬT KHẨU (Giữ nguyên) */}
            {showPassModal && (
                <div className="modal-bg" onClick={() => setShowPassModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <h3 style={{ color: '#F97350', textAlign: 'center' }}>Đổi mật khẩu</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                            <input type="password" placeholder="Mật khẩu hiện tại" value={passData.current} onChange={(e) => setPassData({ ...passData, current: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            <input type="password" placeholder="Mật khẩu mới" value={passData.new} onChange={(e) => setPassData({ ...passData, new: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                            <input type="password" placeholder="Xác nhận mật khẩu mới" value={passData.confirm} onChange={(e) => setPassData({ ...passData, confirm: e.target.value })} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button className="btn" onClick={() => setShowPassModal(false)}>Hủy</button>
                            <button className="btn primary" onClick={handleChangePass}>Cập nhật</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;