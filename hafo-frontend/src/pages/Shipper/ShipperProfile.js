import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { alertError, alertSuccess, confirmDialog } from '../../utils/hafoAlert';

function ShipperProfile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        vehicleType: '',
        licensePlate: '',
        currentLocation: ''
    });

    const fetchProfile = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            try {
                const res = await api.get(`/shippers/profile/${user.id || user._id}`);
                setProfile(res.data);
                setFormData({
                    fullName: res.data.user.fullName || '',
                    phone: res.data.user.phone || '',
                    email: res.data.user.email || '',
                    vehicleType: res.data.vehicleType || '',
                    licensePlate: res.data.licensePlate || '',
                    currentLocation: res.data.currentLocation || ''
                });
            } catch (err) {
                console.error("Lỗi lấy hồ sơ:", err);
            }
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarClick = () => { fileInputRef.current.click(); };

    // ✅ ĐÃ SỬA: Theo phong cách Storefront.js để up ảnh chuẩn xác
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('avatar', file); // Khớp với uploadCloud.single('avatar') ở backend

        try {
            setLoading(true);
            // Gửi kèm header multipart/form-data như bên nhà hàng
            const res = await api.put(`/users/${profile.user._id}`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const updatedUser = res.data;

            // 1. Cập nhật localStorage
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser) {
                localStorage.setItem('user', JSON.stringify({ ...localUser, avatar: updatedUser.avatar }));
            }

            // 2. Cập nhật State cực mạnh để ép UI đổi ảnh
            setProfile(prev => ({
                ...prev,
                user: updatedUser // Ghi đè nguyên object user mới từ server
            }));

            alertSuccess("Đã đổi ảnh đại diện thành công!");
        } catch (err) {
            alertError("Lỗi up ảnh", (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);

            // ✅ Gửi formData (đã bao gồm fullName mới)
            const res = await api.put(`/shippers/profile/${profile.user._id}`, formData);

            // 1. Cập nhật localStorage để các trang khác (như Navbar) thấy tên mới
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser) {
                localStorage.setItem('user', JSON.stringify({
                    ...localUser,
                    fullName: formData.fullName // Cập nhật tên mới vào đây
                }));
            }

            // 2. Cập nhật state để UI thay đổi ngay lập tức
            setProfile(res.data);
            alertSuccess("Đã cập nhật hồ sơ và họ tên thành công!");
            setIsEditing(false);
        } catch (err) {
            alertError("Lỗi", (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        // 2. Sử dụng confirmDialog thay cho window.confirm (Nhớ có await)
        const isConfirmed = await confirmDialog(
            "Đăng xuất Shipper?",
            "Bạn có chắc chắn muốn thoát khỏi phiên làm việc không?"
        );

        if (isConfirmed) {
            // 3. Xóa dữ liệu phiên đăng nhập
            localStorage.removeItem('user');
            localStorage.removeItem('token');

            // 4. Thông báo thành công và ĐỢI 2 giây cho mượt
            await alertSuccess(
                "Đã đăng xuất!",
                "Chúc bạn một ngày làm việc tốt lành. Hẹn gặp lại!"
            );

            // 5. Điều hướng về trang chủ và tải lại trang
            navigate('/');
            window.location.reload();
        }
    };

    if (!profile) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải...</div>;

    return (
        <div className="profile-panel">
            <div className="profile-head">
                <i className="fa-regular fa-user"></i> Hồ sơ cá nhân
            </div>

            <div className="profile-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '25px' }}>
                    <div className="ship-avatar" style={{ width: '80px', height: '80px', position: 'relative', cursor: 'pointer' }} onClick={handleAvatarClick}>
                        <img
                            // Dùng timestamp để phá cache trình duyệt
                            src={profile.user.avatar ? `${profile.user.avatar}?t=${new Date().getTime()}` : "/images/shipper.jpg"}
                            alt="Avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '2px solid #F97350' }}
                        />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#F97350', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '12px', border: '2px solid #fff' }}>
                            <i className="fa-solid fa-camera"></i>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                    </div>
                    <div>
                        {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {/* Ô nhập Họ tên mới */}
                                <input
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    placeholder="Nhập họ tên mới"
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '2px solid #F97350',
                                        fontSize: '18px',
                                        fontWeight: '700'
                                    }}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="ship-btn" onClick={() => setIsEditing(false)} disabled={loading}>Hủy</button>
                                    <button className="ship-btn primary" onClick={handleSaveProfile} disabled={loading} style={{ background: '#F97350', color: '#fff' }}>
                                        {loading ? 'Đang lưu...' : 'Lưu'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ fontWeight: '900', fontSize: '22px' }}>{profile.user.fullName}</div>
                        )}
                        <div style={{ fontSize: '12px', background: '#F1F5F9', padding: '4px 12px', borderRadius: '99px', marginTop: '6px', fontWeight: '700', color: '#64748b' }}>
                            Mã: {profile._id.slice(-6).toUpperCase()}
                        </div>
                    </div>
                </div>

                <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '30px' }}>
                    <div className="kpi-box" style={{ background: '#F0FDF4', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                        <small style={{ color: '#166534' }}>Thu nhập</small>
                        <div style={{ fontWeight: '800', color: '#166534' }}>{profile.income?.toLocaleString()}đ</div>
                    </div>
                    <div className="kpi-box" style={{ background: '#FFFBEB', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                        <small style={{ color: '#92400E' }}>Đánh giá</small>
                        <div style={{ fontWeight: '800', color: '#F5A524' }}>{profile.rating} ★</div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {[
                        { label: 'Điện thoại', name: 'phone', val: profile.user.phone },
                        { label: 'Email', name: 'email', val: profile.user.email },
                        { label: 'Phương tiện', name: 'vehicleType', val: profile.vehicleType },
                        { label: 'Biển số', name: 'licensePlate', val: profile.licensePlate }
                    ].map((row, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748B', fontSize: '14px' }}>{row.label}</span>
                            {isEditing ? (
                                <input name={row.name} value={formData[row.name]} onChange={handleInputChange} style={{ padding: '6px', borderRadius: '6px', border: '1px solid #ddd', width: '60%' }} />
                            ) : (
                                <span style={{ fontWeight: '700' }}>{row.val}</span>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '40px' }}>
                    {isEditing ? (
                        <>
                            <button className="ship-btn" onClick={() => setIsEditing(false)}>Hủy</button>
                            <button className="ship-btn primary" onClick={handleSaveProfile} style={{ background: '#F97350', color: '#fff' }}>Lưu</button>
                        </>
                    ) : (
                        <>
                            {/* ✅ ĐÃ FIX: whiteSpace: 'nowrap' để không bị xuống dòng */}
                            <button
                                className="ship-btn soft"
                                onClick={() => setIsEditing(true)}
                                style={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}
                            >
                                <i className="fa-solid fa-user-pen"></i> Chỉnh sửa hồ sơ
                            </button>
                            <button className="ship-btn soft" onClick={handleLogout} style={{ color: '#EF4444' }}>
                                <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ShipperProfile;