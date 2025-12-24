import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

function ShipperProfile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // Gọi API lấy thông tin Shipper thật
            //axios.get(`http://localhost:5000/api/shippers/profile/${user.id}`)
            api.get(`/shippers/profile/${user.id}`)
                .then(res => setProfile(res.data))
                .catch(err => console.error("Lỗi lấy hồ sơ:", err));
        }
    }, []);

    const handleLogout = () => {
        if (window.confirm("Bạn muốn đăng xuất?")) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
            window.location.reload();
        }
    };

    if (!profile) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải hồ sơ...</div>;

    // profile.user chứa thông tin chung (Tên, SĐT)
    // profile chứa thông tin nghề nghiệp (Xe, Biển số)
    return (
        <div className="profile-panel">
            <div className="profile-head">
                <i className="fa-regular fa-user"></i> Hồ sơ cá nhân
            </div>
            <div className="profile-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div className="ship-avatar" style={{ width: '64px', height: '64px' }}>
                        <img src="/images/shipper.jpg" alt="" onError={(e) => e.target.src = 'https://via.placeholder.com/64'} />
                    </div>
                    <div>
                        <div style={{ fontWeight: '800', fontSize: '18px' }}>{profile.user.fullName}</div>
                        <div style={{ fontSize: '12px', background: '#eee', padding: '4px 8px', borderRadius: '99px', display: 'inline-block', marginTop: '4px' }}>
                            <i className="fa-solid fa-id-card"></i> Mã: {profile._id.slice(-6).toUpperCase()}
                        </div>
                    </div>
                </div>

                <div className="kpi-grid">
                    <div className="kpi-box">
                        <div className="kpi-label">Thu nhập</div>
                        <div className="kpi-val" style={{ color: '#22C55E' }}>{(profile.income || 0).toLocaleString()}đ</div>
                    </div>
                    <div className="kpi-box">
                        <div className="kpi-label">Đánh giá</div>
                        <div className="kpi-val" style={{ color: '#F5A524' }}>{profile.rating} <small style={{ fontSize: '14px' }}>★</small></div>
                    </div>
                </div>

                <div style={{ height: '1px', background: '#eee', margin: '20px 0' }}></div>

                {/* THÔNG TIN THẬT TỪ DATABASE */}
                <div className="info-row">
                    <span className="info-label">Số điện thoại</span>
                    <span className="info-val">{profile.user.phone}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-val">{profile.user.email}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Phương tiện</span>
                    <span className="info-val">{profile.vehicleType}</span>
                </div>
                <div className="info-row">
                    <span className="info-label">Biển số xe</span>
                    <span className="info-val">{profile.licensePlate}</span>
                </div>
                <div className="info-row" style={{ border: 0 }}>
                    <span className="info-label">Khu vực</span>
                    <span className="info-val">{profile.currentLocation}</span>
                </div>

                <div style={{ height: '1px', background: '#eee', margin: '20px 0' }}></div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button className="ship-btn soft" style={{ fontSize: '13px', width: 'auto' }}>Sửa hồ sơ</button>
                    <button
                        onClick={handleLogout}
                        className="ship-btn soft"
                        style={{ fontSize: '13px', width: 'auto', color: '#d00', border: '1px solid #d00', background: '#fff' }}
                    >
                        Đăng xuất
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ShipperProfile;