import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Thêm để điều hướng khi logout
import api from '../../services/api';

function Settings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // State cho thông tin Admin (Khởi tạo rỗng chờ load)
    const [adminInfo, setAdminInfo] = useState({
        id: '',
        fullName: '',
        email: '',
        phone: ''
    });

    // State cho cấu hình hệ thống (Cái này tạm thời lưu LocalStorage hoặc làm API sau)
    const [systemConfig, setSystemConfig] = useState(() => {
        // 1. Thử lấy cấu hình đã lưu trong LocalStorage ra trước
        const savedConfig = localStorage.getItem('adminConfig');

        // 2. Nếu có thì dùng, nếu không thì mới dùng mặc định
        return savedConfig ? JSON.parse(savedConfig) : {
            timeout: 15,
            maxOrders: 500,
            theme: 'light',
            language: 'vi'
        };
    });

    // State cho đổi mật khẩu
    const [showPassModal, setShowPassModal] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    // --- 1. LOAD DỮ LIỆU KHI VÀO TRANG ---
    useEffect(() => {
        const fetchProfile = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                try {
                    // Gọi API lấy thông tin mới nhất từ DB
                    const res = await api.get(`/users/${userObj.id}`);
                    const u = res.data;
                    setAdminInfo({
                        id: u._id,
                        fullName: u.fullName || '',
                        email: u.email || '',
                        phone: u.phone || ''
                    });
                } catch (err) {
                    console.error("Lỗi tải profile:", err);
                }
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        // 1. Xóa hết các class theme cũ
        document.body.classList.remove('light', 'dark');

        // 2. Thêm class theme mới (nếu không phải light)
        if (systemConfig.theme === 'dark') {
            document.body.classList.add('dark');
        }

        // 3. Lưu luôn vào LocalStorage để F5 không bị mất
        localStorage.setItem('adminConfig', JSON.stringify(systemConfig));
    }, [systemConfig.theme]); // Chạy lại mỗi khi systemConfig.theme thay đổi

    // --- 2. HÀM LƯU THÔNG TIN PROFILE (REAL) ---
    const handleSaveInfo = async () => {
        if (!adminInfo.fullName) return alert("Tên không được để trống!");

        setLoading(true);
        try {
            // Gọi API cập nhật user
            const res = await api.put(`/users/${adminInfo.id}`, {
                fullName: adminInfo.fullName,
                email: adminInfo.email,
                phone: adminInfo.phone
            });

            // Cập nhật lại LocalStorage để các trang khác hiển thị đúng tên mới
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...currentUser, fullName: res.data.fullName, email: res.data.email, phone: res.data.phone };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert("✅ Cập nhật thông tin thành công!");
        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // --- 3. HÀM ĐỔI MẬT KHẨU (REAL) ---
    const handleChangePass = async () => {
        if (!passData.current || !passData.new || !passData.confirm) {
            alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        if (passData.new !== passData.confirm) {
            alert("❌ Mật khẩu xác nhận không khớp!");
            return;
        }

        try {
            await api.post('/auth/change-password', {
                userId: adminInfo.id,
                oldPass: passData.current,
                newPass: passData.new
            });

            alert("✅ Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");

            // Đăng xuất ngay lập tức để bảo mật
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
            window.location.reload();

        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    // Xử lý lưu cấu hình (Vẫn Demo hoặc lưu LocalStorage)
    const handleSaveConfig = () => {
        // Có thể lưu vào localStorage để giữ setting ở máy client
        localStorage.setItem('adminConfig', JSON.stringify(systemConfig));
        alert(`⚙️ Đã lưu cấu hình vào trình duyệt!`);
    };

    return (
        <div>
            {/* 1. THÔNG TIN TÀI KHOẢN */}
            <div className="card-stat" style={{ marginTop: '20px' }}>
                <h4 style={{ marginTop: 0, color: '#F97350', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <i className="fa-solid fa-user-gear"></i> Thông tin tài khoản
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '15px', alignItems: 'center' }}>
                    <label style={{ fontWeight: '600' }}>Tên hiển thị</label>
                    <input
                        value={adminInfo.fullName}
                        onChange={(e) => setAdminInfo({ ...adminInfo, fullName: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />

                    <label style={{ fontWeight: '600' }}>Email liên hệ</label>
                    <input
                        value={adminInfo.email}
                        onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />

                    <label style={{ fontWeight: '600' }}>Số điện thoại</label>
                    <input
                        value={adminInfo.phone}
                        onChange={(e) => setAdminInfo({ ...adminInfo, phone: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />

                    <div></div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn primary" onClick={handleSaveInfo} disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        <button className="btn" onClick={() => setShowPassModal(true)}>Đổi mật khẩu</button>
                    </div>
                </div>
            </div>

            {/* 2. CẤU HÌNH GIAO DIỆN (Client-side) */}
            <div className="card-stat" style={{ marginTop: '20px' }}>
                <h4 style={{ marginTop: 0, color: '#F97350', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <i className="fa-solid fa-paint-roller"></i> Giao diện & Hệ thống
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '15px', alignItems: 'center' }}>
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
                    <button className="btn soft" onClick={handleSaveConfig}>Lưu cấu hình local</button>
                </div>
            </div>

            {/* MODAL ĐỔI MẬT KHẨU */}
            {showPassModal && (
                <div className="modal-bg" onClick={() => setShowPassModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <h3 style={{ color: '#F97350', textAlign: 'center' }}>Đổi mật khẩu</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mật khẩu hiện tại</label>
                                <input type="password"
                                    value={passData.current}
                                    onChange={(e) => setPassData({ ...passData, current: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mật khẩu mới</label>
                                <input type="password"
                                    value={passData.new}
                                    onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Xác nhận mật khẩu mới</label>
                                <input type="password"
                                    value={passData.confirm}
                                    onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                            </div>
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