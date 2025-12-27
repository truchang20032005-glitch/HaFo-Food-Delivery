import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

function ShipperProfile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // State quản lý form chỉnh sửa
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
                const res = await api.get(`/shippers/profile/${user.id}`);
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

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    // ✅ FIX: Cập nhật ảnh đại diện và đồng bộ ngay lập tức
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('avatar', file);

        try {
            setLoading(true);
            const res = await api.put(`/users/${profile.user._id}`, uploadData);
            const updatedUser = res.data;

            // 1. Cập nhật localStorage ngay lập tức
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser) {
                localStorage.setItem('user', JSON.stringify({ ...localUser, avatar: updatedUser.avatar }));
            }

            // 2. Cập nhật State để UI thay đổi ảnh ngay
            setProfile(prev => ({
                ...prev,
                user: { ...prev.user, avatar: updatedUser.avatar }
            }));

            alert("✅ Cập nhật ảnh đại diện thành công!");
        } catch (err) {
            alert("❌ Lỗi khi tải ảnh lên: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ✅ FIX: Cập nhật thông tin và đồng bộ localStorage
    const handleSaveProfile = async () => {
        try {
            setLoading(true);
            const res = await api.put(`/shippers/profile/${profile.user._id}`, formData);

            // Đồng bộ lại tên mới vào localStorage
            const localUser = JSON.parse(localStorage.getItem('user'));
            if (localUser) {
                localStorage.setItem('user', JSON.stringify({ ...localUser, fullName: formData.fullName }));
            }

            alert("✅ Cập nhật thông tin hồ sơ thành công!");
            setIsEditing(false);
            fetchProfile(); // Tải lại để đảm bảo dữ liệu khớp DB
        } catch (err) {
            alert("❌ Lỗi khi cập nhật hồ sơ: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        if (window.confirm("Bạn muốn đăng xuất?")) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
            window.location.reload();
        }
    };

    if (!profile) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải hồ sơ...</div>;

    return (
        <div className="profile-panel">
            <div className="profile-head">
                <i className="fa-regular fa-user"></i> Hồ sơ cá nhân
            </div>

            <div className="profile-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '25px' }}>
                    <div className="ship-avatar" style={{ width: '80px', height: '80px', position: 'relative', cursor: 'pointer' }} onClick={handleAvatarClick}>
                        <img
                            // Thêm timestamp ngẫu nhiên để ép trình duyệt tải lại ảnh mới
                            src={profile.user.avatar ? `${profile.user.avatar}?t=${new Date().getTime()}` : "/images/shipper.jpg"}
                            alt="Avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '2px solid #F97350' }}
                            onError={(e) => e.target.src = 'https://via.placeholder.com/80'}
                        />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#F97350', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '12px', border: '2px solid #fff' }}>
                            <i className="fa-solid fa-camera"></i>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/*" />
                    </div>
                    <div>
                        {isEditing ? (
                            <input
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '18px', fontWeight: '800', width: '200px' }}
                            />
                        ) : (
                            <div style={{ fontWeight: '900', fontSize: '22px', color: '#1e293b' }}>{profile.user.fullName}</div>
                        )}
                        <div style={{ fontSize: '12px', background: '#F1F5F9', padding: '4px 12px', borderRadius: '99px', display: 'inline-block', marginTop: '6px', fontWeight: '700', color: '#64748b' }}>
                            <i className="fa-solid fa-id-card"></i> Mã: {profile._id.slice(-6).toUpperCase()}
                        </div>
                    </div>
                </div>

                <div className="kpi-grid" style={{ marginBottom: '30px' }}>
                    <div className="kpi-box" style={{ background: '#F0FDF4', border: '1px solid #DCFCE7' }}>
                        <div className="kpi-label" style={{ color: '#166534' }}>Tổng thu nhập</div>
                        <div className="kpi-val" style={{ color: '#166534' }}>{(profile.income || 0).toLocaleString()}đ</div>
                    </div>
                    <div className="kpi-box" style={{ background: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                        <div className="kpi-label" style={{ color: '#92400E' }}>Đánh giá trung bình</div>
                        <div className="kpi-val" style={{ color: '#F5A524' }}>{profile.rating} <small style={{ fontSize: '14px' }}>★</small></div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {[
                        { label: 'Số điện thoại', name: 'phone', val: profile.user.phone },
                        { label: 'Email', name: 'email', val: profile.user.email },
                        { label: 'Phương tiện', name: 'vehicleType', val: profile.vehicleType },
                        { label: 'Biển số xe', name: 'licensePlate', val: profile.licensePlate },
                        { label: 'Khu vực hoạt động', name: 'currentLocation', val: profile.currentLocation }
                    ].map((row, idx) => (
                        <div key={idx} className="info-row" style={{ borderBottom: idx === 4 ? 'none' : '1px solid #F1F5F9', padding: '15px 0' }}>
                            <span className="info-label" style={{ color: '#64748B', fontWeight: '600', width: '150px' }}>{row.label}</span>
                            {isEditing ? (
                                <input
                                    name={row.name}
                                    value={formData[row.name]}
                                    onChange={handleInputChange}
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }}
                                />
                            ) : (
                                <span className="info-val" style={{ fontWeight: '700', color: '#1E293B' }}>{row.val}</span>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ height: '1px', background: '#F1F5F9', margin: '30px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    {isEditing ? (
                        <>
                            <button className="ship-btn soft" onClick={() => setIsEditing(false)} disabled={loading} style={{ width: 'auto', padding: '10px 25px' }}>Hủy bỏ</button>
                            <button className="ship-btn primary" onClick={handleSaveProfile} disabled={loading} style={{ width: 'auto', padding: '10px 25px', background: '#F97350', color: '#fff', border: 'none' }}>
                                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="ship-btn soft" onClick={() => setIsEditing(true)} style={{ fontSize: '14px', width: 'auto', padding: '10px 25px', fontWeight: '700' }}>
                                <i className="fa-solid fa-user-pen"></i> Chỉnh sửa hồ sơ
                            </button>
                            <button
                                onClick={handleLogout}
                                className="ship-btn soft"
                                style={{ fontSize: '14px', width: 'auto', padding: '10px 25px', color: '#EF4444', border: '1px solid #FEE2E2', background: '#fff', fontWeight: '700' }}
                            >
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