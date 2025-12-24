import { useState } from 'react';
import api from '../../services/api';

function Settings() {
    // State cho thông tin Admin
    const [adminInfo, setAdminInfo] = useState({
        name: 'Admin HaFo',
        email: 'happyfoodcskh2025@gmail.com',
        phone: '0357913676'
    });

    // State cho cấu hình hệ thống
    const [systemConfig, setSystemConfig] = useState({
        timeout: 15,
        maxOrders: 500,
        theme: 'light',
        language: 'vi'
    });

    // State cho đổi mật khẩu
    const [showPassModal, setShowPassModal] = useState(false);
    const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });

    // Xử lý lưu thông tin (Demo)
    const handleSaveInfo = () => {
        alert(`✅ Đã lưu thông tin Admin:\nTên: ${adminInfo.name}\nEmail: ${adminInfo.email}\nSĐT: ${adminInfo.phone}`);
    };

    // Xử lý lưu cấu hình (Demo)
    const handleSaveConfig = () => {
        alert(`⚙️ Cấu hình đã lưu:\nThời gian chờ: ${systemConfig.timeout} phút\nGiới hạn đơn: ${systemConfig.maxOrders}/ngày\nGiao diện: ${systemConfig.theme}`);
    };

    // --- HÀM ĐỔI MẬT KHẨU THẬT (GỌI API) ---
    const handleChangePass = async () => {
        // 1. Validate
        if (!passData.current || !passData.new || !passData.confirm) {
            alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        if (passData.new !== passData.confirm) {
            alert("❌ Mật khẩu xác nhận không khớp!");
            return;
        }

        // 2. Gọi API
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return alert("Vui lòng đăng nhập lại!");

            /*const res = await axios.post('http://localhost:5000/api/auth/change-password', {
                userId: user.id,
                oldPass: passData.current,
                newPass: passData.new
            });*/
            const res = await api.post('/auth/change-password', {
                userId: user.id,
                oldPass: passData.current,
                newPass: passData.new
            });

            alert("✅ " + res.data.message);
            setShowPassModal(false);
            setPassData({ current: '', new: '', confirm: '' });

            // (Tùy chọn) Đăng xuất để bắt đăng nhập lại bằng pass mới
            // localStorage.clear();
            // window.location.href = '/';

        } catch (err) {
            alert("❌ Lỗi: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Cấu hình hệ thống</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Quản trị thông tin tài khoản và các thông số cài đặt cho hệ thống HaFo.</p>

            {/* 1. THÔNG TIN TÀI KHOẢN */}
            <div className="card-stat" style={{ marginTop: '20px' }}>
                <h4 style={{ marginTop: 0, color: '#F97350', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <i className="fa-solid fa-user-gear"></i> Thông tin tài khoản
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '15px', alignItems: 'center' }}>
                    <label style={{ fontWeight: '600' }}>Tên quản trị viên</label>
                    <input
                        value={adminInfo.name}
                        onChange={(e) => setAdminInfo({ ...adminInfo, name: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />

                    <label style={{ fontWeight: '600' }}>Email</label>
                    <input
                        value={adminInfo.email}
                        onChange={(e) => setAdminInfo({ ...adminInfo, email: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />

                    <label style={{ fontWeight: '600' }}>Số điện thoại</label>
                    <input
                        value={adminInfo.phone}
                        onChange={(e) => setAdminInfo({ ...adminInfo, phone: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />

                    <div></div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn primary" onClick={handleSaveInfo}>Lưu thay đổi</button>
                        <button className="btn" onClick={() => setShowPassModal(true)}>Đổi mật khẩu</button>
                    </div>
                </div>
            </div>

            {/* 2. CẤU HÌNH GIAO DIỆN */}
            <div className="card-stat" style={{ marginTop: '20px' }}>
                <h4 style={{ marginTop: 0, color: '#F97350', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <i className="fa-solid fa-paint-roller"></i> Giao diện hệ thống
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '15px', alignItems: 'center' }}>
                    <label style={{ fontWeight: '600' }}>Chủ đề</label>
                    <select
                        value={systemConfig.theme}
                        onChange={(e) => setSystemConfig({ ...systemConfig, theme: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    >
                        <option value="light">Sáng</option>
                        <option value="dark">Tối</option>
                        <option value="orange">Cam HaFo</option>
                    </select>

                    <label style={{ fontWeight: '600' }}>Ngôn ngữ hiển thị</label>
                    <select
                        value={systemConfig.language}
                        onChange={(e) => setSystemConfig({ ...systemConfig, language: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    >
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            {/* 3. THÔNG SỐ HỆ THỐNG */}
            <div className="card-stat" style={{ marginTop: '20px' }}>
                <h4 style={{ marginTop: 0, color: '#F97350', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <i className="fa-solid fa-sliders"></i> Tham số vận hành
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '15px', alignItems: 'center' }}>
                    <label style={{ fontWeight: '600' }}>Thời gian chờ (phút)</label>
                    <input
                        type="number"
                        value={systemConfig.timeout}
                        onChange={(e) => setSystemConfig({ ...systemConfig, timeout: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />

                    <label style={{ fontWeight: '600' }}>Giới hạn đơn/ngày</label>
                    <input
                        type="number"
                        value={systemConfig.maxOrders}
                        onChange={(e) => setSystemConfig({ ...systemConfig, maxOrders: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    />

                    <div></div>
                    <button className="btn primary" onClick={handleSaveConfig}>Lưu cấu hình</button>
                </div>
            </div>

            {/* MODAL ĐỔI MẬT KHẨU */}
            {showPassModal && (
                <div className="modal-bg" onClick={() => setShowPassModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <h3 style={{ color: '#F97350' }}>Đổi mật khẩu</h3>

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