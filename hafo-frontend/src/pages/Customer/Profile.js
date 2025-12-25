import { useState, useEffect } from 'react';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext'; // Dùng context để cập nhật header sau khi đổi tên/ảnh

function Profile() {
    const { login } = useAuth(); // Để cập nhật lại localStorage sau khi save
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null); // Dữ liệu gốc từ DB

    // State xử lý ảnh
    const [previewAvatar, setPreviewAvatar] = useState('');
    const [avatarFile, setAvatarFile] = useState(null); // File ảnh thực tế để upload

    // State Form
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        gender: 'Khác',
        birthday: '',
        addresses: []
    });

    // State thêm địa chỉ
    const [isAdding, setIsAdding] = useState(false);
    const [newAddrLabel, setNewAddrLabel] = useState('Nhà riêng');
    const [newAddrValue, setNewAddrValue] = useState('');

    // State đổi mật khẩu
    const [showPassModal, setShowPassModal] = useState(false);
    const [passData, setPassData] = useState({ oldPass: '', newPass: '', confirmPass: '' });

    // Helper: Lấy URL ảnh
    const getAvatarUrl = (path) => {
        if (!path) return '/images/default-avatar.png'; // Ảnh mặc định nếu chưa có
        if (path.startsWith('http')) return path;
        return `http://localhost:5000/${path}`;
    };

    // 1. TẢI DỮ LIỆU USER THẬT
    useEffect(() => {
        const fetchProfile = async () => {
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (!localUser) return;

            try {
                const res = await api.get(`/users/${localUser.id}`);
                const u = res.data;
                setUser(u);

                // Fill dữ liệu vào Form
                setFormData({
                    fullName: u.fullName || '',
                    phone: u.phone || '',
                    email: u.email || '',
                    gender: u.gender || 'Khác',
                    birthday: u.birthday ? u.birthday.split('T')[0] : '', // Format ngày cho input date
                    addresses: u.addresses || []
                });

                // Set avatar preview từ DB
                setPreviewAvatar(getAvatarUrl(u.avatar));
            } catch (err) {
                console.error("Lỗi tải profile:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // 2. XỬ LÝ CHỌN ẢNH
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file); // Lưu file để lát gửi lên server
            setPreviewAvatar(URL.createObjectURL(file)); // Hiện preview ngay lập tức
        }
    };

    // 3. XỬ LÝ LƯU (QUAN TRỌNG: DÙNG FORMDATA)
    const handleSave = async () => {
        if (!user) return;

        try {
            const data = new FormData();
            data.append('fullName', formData.fullName);
            data.append('phone', formData.phone);
            data.append('email', formData.email);
            data.append('gender', formData.gender);
            data.append('birthday', formData.birthday);

            // Addresses là mảng object, cần stringify khi gửi qua FormData
            data.append('addresses', JSON.stringify(formData.addresses));

            // Nếu có chọn ảnh mới thì mới gửi lên
            if (avatarFile) {
                data.append('avatar', avatarFile);
            }

            const res = await api.put(`/users/${user._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Cập nhật lại localStorage để các component khác (Navbar) nhận diện thay đổi
            const updatedUser = res.data;
            const token = localStorage.getItem('token');
            // Cập nhật Context (giả lập login lại với data mới)
            login({ ...updatedUser, id: updatedUser._id }, token);

            alert("✅ Cập nhật hồ sơ thành công!");
            setUser(updatedUser);
            setAvatarFile(null); // Reset file
        } catch (err) {
            console.error(err);
            alert("❌ Lỗi cập nhật: " + (err.response?.data?.message || err.message));
        }
    };

    // 4. XỬ LÝ ĐỊA CHỈ
    const confirmAddAddress = () => {
        if (!newAddrValue.trim()) return;
        const newAddressObj = { label: newAddrLabel, value: newAddrValue };
        setFormData({ ...formData, addresses: [...formData.addresses, newAddressObj] });
        setNewAddrValue('');
        setIsAdding(false);
    };

    const handleRemoveAddress = (index) => {
        if (window.confirm("Bạn muốn xóa địa chỉ này?")) {
            const newAdrs = formData.addresses.filter((_, i) => i !== index);
            setFormData({ ...formData, addresses: newAdrs });
        }
    };

    // 5. ĐỔI MẬT KHẨU
    const handleChangePassword = async () => {
        if (!passData.oldPass || !passData.newPass) return alert("Vui lòng nhập đầy đủ!");
        if (passData.newPass !== passData.confirmPass) return alert("Mật khẩu xác nhận không khớp!");

        try {
            await api.post('/auth/change-password', {
                userId: user._id,
                oldPass: passData.oldPass,
                newPass: passData.newPass
            });
            alert("✅ Đổi mật khẩu thành công!");
            setShowPassModal(false);
            setPassData({ oldPass: '', newPass: '', confirmPass: '' });
        } catch (err) {
            alert("❌ " + (err.response?.data?.message || err.message));
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 50 }}>Đang tải hồ sơ...</div>;

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: 50 }}>
            <Navbar />

            <div className="hop" style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>

                {/* CỘT TRÁI: AVATAR */}
                <aside style={{ background: '#fff', padding: '30px 20px', borderRadius: '16px', border: '1px solid #eadfcd', textAlign: 'center', height: 'fit-content', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 20px' }}>
                        <img
                            src={previewAvatar}
                            alt="Avatar"
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                            onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                        />
                        <label style={{
                            position: 'absolute', bottom: 5, right: 5,
                            background: '#F97350', color: '#fff', width: '36px', height: '36px',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}>
                            <i className="fa-solid fa-camera"></i>
                            <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                        </label>
                    </div>

                    <h2 style={{ fontSize: '20px', color: '#333', margin: '0 0 5px' }}>{formData.fullName || 'Chưa đặt tên'}</h2>
                    <div style={{ color: '#888', fontSize: '14px', marginBottom: '20px' }}>@{user?.username}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button className="btn soft" onClick={() => setShowPassModal(true)} style={{ width: '100%' }}>
                            <i className="fa-solid fa-key"></i> Đổi mật khẩu
                        </button>
                    </div>
                </aside>

                {/* CỘT PHẢI: FORM INFO */}
                <section style={{ background: '#fff', padding: '30px', borderRadius: '16px', border: '1px solid #eadfcd', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <h3 style={{ margin: '0 0 20px', borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#F97350' }}>
                        <i className="fa-solid fa-address-card"></i> Thông tin cá nhân
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="field-group">
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: 5 }}>Họ và tên</label>
                            <input
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div className="field-group">
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: 5 }}>Giới tính</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                style={inputStyle}
                            >
                                <option>Nam</option>
                                <option>Nữ</option>
                                <option>Khác</option>
                            </select>
                        </div>
                        <div className="field-group">
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: 5 }}>Số điện thoại</label>
                            <input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div className="field-group">
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: 5 }}>Email</label>
                            <input
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div className="field-group">
                            <label style={{ fontWeight: '600', display: 'block', marginBottom: 5 }}>Ngày sinh</label>
                            <input
                                type="date"
                                value={formData.birthday}
                                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <h3 style={{ margin: '30px 0 15px', borderBottom: '1px solid #eee', paddingBottom: '15px', color: '#F97350' }}>
                        <i className="fa-solid fa-location-dot"></i> Sổ địa chỉ
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {formData.addresses.map((addr, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#f9f9f9', padding: '12px', borderRadius: '10px', border: '1px solid #eee' }}>
                                <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', marginRight: '10px' }}>
                                    {addr.label}
                                </span>
                                <span style={{ flex: 1, color: '#333' }}>{addr.value}</span>
                                <button onClick={() => handleRemoveAddress(idx)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>
                                    <i className="fa-regular fa-trash-can"></i>
                                </button>
                            </div>
                        ))}

                        {isAdding ? (
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#fff5f2', padding: '15px', borderRadius: '10px', border: '1px dashed #F97350' }}>
                                <select
                                    value={newAddrLabel}
                                    onChange={e => setNewAddrLabel(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #F97350', outline: 'none' }}
                                >
                                    <option>Nhà riêng</option>
                                    <option>Văn phòng</option>
                                    <option>Khác</option>
                                </select>
                                <input
                                    autoFocus
                                    placeholder="Nhập địa chỉ chi tiết..."
                                    value={newAddrValue}
                                    onChange={e => setNewAddrValue(e.target.value)}
                                    style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #F97350', outline: 'none' }}
                                />
                                <button onClick={confirmAddAddress} className="btn primary" style={{ padding: '8px 15px' }}>Lưu</button>
                                <button onClick={() => setIsAdding(false)} className="btn soft" style={{ padding: '8px 15px' }}>Hủy</button>
                            </div>
                        ) : (
                            <button onClick={() => setIsAdding(true)} style={{ width: '100%', padding: '12px', border: '2px dashed #ddd', background: '#fff', borderRadius: '10px', color: '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                                + Thêm địa chỉ mới
                            </button>
                        )}
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
                        <button className="btn soft" onClick={() => window.location.reload()}>Hủy bỏ</button>
                        <button className="btn primary" onClick={handleSave} style={{ padding: '10px 30px', fontSize: '16px' }}>
                            <i className="fa-solid fa-floppy-disk"></i> Lưu thay đổi
                        </button>
                    </div>
                </section>
            </div>

            {/* MODAL ĐỔI MẬT KHẨU */}
            {showPassModal && (
                <div className="modal-bg" onClick={() => setShowPassModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <h3 style={{ color: '#F97350', textAlign: 'center' }}>Đổi mật khẩu</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                            <input type="password" placeholder="Mật khẩu cũ" value={passData.oldPass} onChange={e => setPassData({ ...passData, oldPass: e.target.value })} style={inputStyle} />
                            <input type="password" placeholder="Mật khẩu mới" value={passData.newPass} onChange={e => setPassData({ ...passData, newPass: e.target.value })} style={inputStyle} />
                            <input type="password" placeholder="Nhập lại mật khẩu mới" value={passData.confirmPass} onChange={e => setPassData({ ...passData, confirmPass: e.target.value })} style={inputStyle} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button className="btn soft" onClick={() => setShowPassModal(false)}>Hủy</button>
                            <button className="btn primary" onClick={handleChangePassword}>Cập nhật</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// CSS Inline gọn
const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    outline: 'none',
    fontSize: '14px',
    transition: 'border-color 0.2s',
};

export default Profile;