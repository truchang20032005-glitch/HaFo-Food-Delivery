import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import { alertSuccess, alertError, alertWarning, confirmDialog } from '../../utils/hafoAlert';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper di chuyển tâm bản đồ
function RecenterMap({ lat, lng }) {
    const map = useMap();
    useEffect(() => { if (lat && lng) map.setView([lat, lng], 16); }, [lat, lng, map]);
    return null;
}

function Profile() {
    const { login } = useAuth(); // Để cập nhật lại localStorage sau khi save
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null); // Dữ liệu gốc từ DB

    // State xử lý ảnh
    const [previewAvatar, setPreviewAvatar] = useState('');
    const [avatarFile, setAvatarFile] = useState(null); // File ảnh thực tế để upload

    const [showTierModal, setShowTierModal] = useState(false);
    const [showOffersModal, setShowOffersModal] = useState(false);

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
    const [editingIndex, setEditingIndex] = useState(null);
    const [newAddrLabel, setNewAddrLabel] = useState('Nhà riêng');
    const [newAddrValue, setNewAddrValue] = useState('');
    const [newCoords, setNewCoords] = useState({ lat: 10.762, lng: 106.660 });

    // State đổi mật khẩu
    const [showPassModal, setShowPassModal] = useState(false);
    const [passData, setPassData] = useState({ oldPass: '', newPass: '', confirmPass: '' });

    // Helper: Lấy URL ảnh
    const getAvatarUrl = (path) => {
        if (!path) return '/images/default-avatar.png';
        return path; // Trả về link Cloudinary trực tiếp
    };

    const handleEditAddress = (idx) => {
        const addr = formData.addresses[idx];
        setNewAddrLabel(addr.label);
        setNewAddrValue(addr.value);
        setNewCoords({ lat: addr.lat || 10.762, lng: addr.lng || 106.660 });
        setEditingIndex(idx);
        setIsAdding(true); // Mở khung nhập liệu lên
    };

    const handleSearchAddress = async () => {
        if (!newAddrValue) return;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAddrValue)}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setNewCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
            }
        } catch (err) { console.error(err); }
    };
    // Hàm này để khi click vào map thì tự điền chữ vào ô input
    function LocationMarker() {
        useMapEvents({
            async click(e) {
                const { lat, lng } = e.latlng;
                setNewCoords({ lat, lng });
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
                const data = await res.json();
                if (data && data.display_name) setNewAddrValue(data.display_name);
            }
        });
        return <Marker position={[newCoords.lat, newCoords.lng]} />;
    }

    // TẢI DỮ LIỆU USER THẬT
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

        const phoneRegex = /^\d{10}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!phoneRegex.test(formData.phone)) {
            return alertWarning("SĐT không hợp lệ", "Số điện thoại phải có đúng 10 chữ số!");
        }
        if (formData.email && !emailRegex.test(formData.email)) {
            return alertWarning("Email không hợp lệ", "Vui lòng nhập đúng định dạng email (ví dụ: abc@gmail.com)!");
        }

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

            await alertSuccess("Cập nhật hồ sơ thành công!");
            setUser(updatedUser);
            setAvatarFile(null); // Reset file
        } catch (err) {
            console.error(err);
            alertError("Lỗi cập nhật: " + (err.response?.data?.message || err.message));
        }
    };

    // 4. XỬ LÝ ĐỊA CHỈ
    const confirmAddAddress = () => {
        if (!newAddrValue.trim()) return;
        const newAddressObj = { label: newAddrLabel, value: newAddrValue, lat: newCoords.lat, lng: newCoords.lng };

        if (editingIndex !== null) {
            // Nếu đang sửa: cập nhật lại đúng vị trí index đó
            const updatedAdrs = [...formData.addresses];
            updatedAdrs[editingIndex] = newAddressObj;
            setFormData({ ...formData, addresses: updatedAdrs });
        } else {
            // Nếu thêm mới: push vào cuối mảng như cũ
            setFormData({ ...formData, addresses: [...formData.addresses, newAddressObj] });
        }

        // Reset mọi thứ về mặc định
        setNewAddrValue('');
        setIsAdding(false);
        setEditingIndex(null);
    };

    const handleRemoveAddress = async (index) => {
        const isConfirmed = await confirmDialog(
            "Xóa địa chỉ?",
            "Bạn có chắc chắn muốn xóa địa chỉ này khỏi danh sách không?"
        );

        if (isConfirmed) {
            // 3. Thực hiện logic lọc địa chỉ
            const newAdrs = formData.addresses.filter((_, i) => i !== index);
            setFormData({ ...formData, addresses: newAdrs });

            // 4. Thông báo thành công mượt mà (Tùy chọn)
            await alertSuccess("Đã xóa!", "Địa chỉ đã được gỡ bỏ thành công.");
        }
    };

    // 5. ĐỔI MẬT KHẨU
    const handleChangePassword = async () => {
        // Validate cơ bản tại Client
        if (!passData.oldPass || !passData.newPass) return alertWarning("Thiếu thông tin", "Vui lòng nhập đầy đủ mật khẩu cũ và mới!");
        if (passData.newPass !== passData.confirmPass) return alertWarning("Mật khẩu xác nhận không khớp!");

        try {
            const res = await api.post('/auth/change-password', {
                userId: user._id, // Gửi ID của user đang đăng nhập
                oldPass: passData.oldPass,
                newPass: passData.newPass
            });

            await alertSuccess("✅ " + res.data.message);
            setShowPassModal(false);
            setPassData({ oldPass: '', newPass: '', confirmPass: '' });
        } catch (err) {
            // Hiển thị lỗi từ Backend (ví dụ: Mật khẩu cũ sai)
            alertError("❌ " + (err.response?.data?.message || "Có lỗi xảy ra"));
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: 50 }}>Đang tải hồ sơ...</div>;

    const labelStyle = {
        display: 'block',
        fontSize: '12px',
        fontWeight: '700',
        color: '#64748B',
        marginBottom: '6px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    };

    const inputContainerStyle = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    };

    const iconStyle = {
        position: 'absolute',
        left: '15px',
        color: '#94A3B8',
        fontSize: '14px'
    };

    const enhancedInputStyle = {
        width: '100%',
        padding: '12px 15px 12px 42px',
        borderRadius: '12px',
        border: '1.5px solid #E2E8F0',
        outline: 'none',
        fontSize: '14px',
        transition: 'all 0.2s ease',
        background: '#FDFDFD'
    };

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
                    {(() => {
                        // Logic tính toán hạng tiếp theo và phần trăm
                        const spending = user?.totalSpending || 0;
                        let nextTier = "Silver";
                        let nextLimit = 1000000;
                        let currentTierName = "THÀNH VIÊN ĐỒNG";
                        let tierColor = 'linear-gradient(135deg, #F97350 0%, #FF5F6D 100%)'; // Basic

                        if (spending >= 15000000) {
                            currentTierName = "THÀNH VIÊN KIM CƯƠNG";
                            tierColor = 'linear-gradient(135deg, #0f172a 0%, #334155 100%)';
                            nextTier = "Max"; nextLimit = 15000000;
                        } else if (spending >= 5000000) {
                            currentTierName = "THÀNH VIÊN VÀNG";
                            tierColor = 'linear-gradient(135deg, #ca8a04 0%, #facc15 100%)';
                            nextTier = "Diamond"; nextLimit = 15000000;
                        } else if (spending >= 1000000) {
                            currentTierName = "THÀNH VIÊN BẠC";
                            tierColor = 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)';
                            nextTier = "Gold"; nextLimit = 5000000;
                        }

                        const progress = Math.min((spending / nextLimit) * 100, 100);
                        const remaining = nextLimit - spending;

                        return (
                            <div style={{
                                background: tierColor,
                                borderRadius: '28px',
                                padding: '28px',
                                color: '#fff',
                                marginBottom: '35px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                {/* Họa tiết trang trí chìm */}
                                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
                                <i className="fa-solid fa-crown" style={{ position: 'absolute', right: '-15px', bottom: '-15px', fontSize: '140px', opacity: 0.08, transform: 'rotate(-15deg)' }}></i>

                                <div style={{ position: 'relative', zIndex: 2 }}>
                                    {/* Header Thẻ */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                                        <div>
                                            <div style={{ fontSize: '10px', fontWeight: '800', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Membership Card</div>
                                            <div style={{ fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {currentTierName}
                                            </div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '14px', backdropFilter: 'blur(10px)' }}>
                                            <img src="/images/logo.png" alt="HaFo" style={{ width: '32px', filter: 'brightness(0) invert(1)' }} />
                                        </div>
                                    </div>

                                    {/* Thông tin Chi tiêu & Progress */}
                                    <div style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                                            <div>
                                                <span style={{ fontSize: '13px', opacity: 0.8 }}>Tổng tích lũy chi tiêu</span>
                                                <div style={{ fontSize: '22px', fontWeight: '800' }}>{spending.toLocaleString('vi-VN')}đ</div>
                                            </div>
                                            {nextTier !== "Max" && (
                                                <div style={{ fontSize: '11px', textAlign: 'right', opacity: 0.9, fontWeight: '600' }}>
                                                    Còn {(remaining).toLocaleString('vi-VN')}đ để lên <b>{nextTier}</b>
                                                </div>
                                            )}
                                        </div>

                                        {/* Thanh Progress cực mượt */}
                                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.15)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${progress}%`, height: '100%', background: '#fff', borderRadius: '10px', boxShadow: '0 0 15px rgba(255,255,255,0.5)', transition: 'width 1s ease-in-out' }}></div>
                                        </div>
                                    </div>

                                    {/* Nhóm Nút bấm Glassmorphism */}
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            onClick={() => setShowTierModal(true)}
                                            style={{
                                                flex: 1,
                                                background: 'rgba(255,255,255,0.15)',
                                                backdropFilter: 'blur(15px)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: '#fff',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                padding: '12px',
                                                borderRadius: '16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                transition: '0.3s'
                                            }}
                                        >
                                            <i className="fa-solid fa-circle-info"></i> Quyền lợi
                                        </button>
                                        <button
                                            onClick={() => setShowOffersModal(true)}
                                            style={{
                                                flex: 1,
                                                background: '#fff',
                                                border: 'none',
                                                color: '#1e293b',
                                                fontSize: '13px',
                                                fontWeight: '800',
                                                padding: '12px',
                                                borderRadius: '16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                boxShadow: '0 8px 15px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            <i className="fa-solid fa-gift" style={{ color: '#F97350' }}></i> Kho ưu đãi ({user?.systemVouchers?.filter(v => !v.isUsed).length || 0})
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

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

                                {/* NHÓM NÚT HÀNH ĐỘNG */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => handleEditAddress(idx)} style={{ border: 'none', background: 'none', color: '#F97350', cursor: 'pointer', fontSize: '16px' }}>
                                        <i className="fa-solid fa-pen-to-square"></i>
                                    </button>
                                    <button onClick={() => handleRemoveAddress(idx)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>
                                        <i className="fa-regular fa-trash-can"></i>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {isAdding ? (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                                background: '#fffaf5',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '1px solid #F97350'
                            }}>
                                {/* HÀNG 1: CHỌN LOẠI VÀ CÁC NÚT THAO TÁC */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#666' }}>Loại:</span>
                                        <select
                                            value={newAddrLabel}
                                            onChange={e => setNewAddrLabel(e.target.value)}
                                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}
                                        >
                                            <option>Nhà riêng</option>
                                            <option>Văn phòng</option>
                                            <option>Khác</option>
                                        </select>
                                    </div>

                                    {/* NHÓM NÚT: Đã chỉnh lại để nút Hủy rõ ràng hơn */}
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => setIsAdding(false)}
                                            className="btn soft"
                                            style={{ padding: '8px 20px', border: '1px solid #ccc', background: '#fff' }}
                                        >
                                            Hủy bỏ
                                        </button>
                                        <button
                                            onClick={confirmAddAddress}
                                            className="btn primary"
                                            style={{ padding: '8px 25px' }}
                                        >
                                            Lưu địa chỉ này
                                        </button>
                                    </div>
                                </div>

                                {/* HÀNG 2: Ô HIỂN THỊ ĐỊA CHỈ (ĐÂY LÀ Ô ĐỂ XEM BẠN CẦN) */}
                                <div>
                                    <label style={{ fontSize: '13px', fontWeight: '700', display: 'block', marginBottom: '8px', color: '#F97350' }}>
                                        <i className="fa-solid fa-location-dot"></i> {editingIndex !== null ? "Chỉnh sửa địa chỉ:" : "Địa chỉ chi tiết (Tự nhập hoặc chọn trên bản đồ):"}
                                    </label>
                                    <input
                                        placeholder="Đang chờ chọn vị trí..."
                                        value={newAddrValue}
                                        onChange={e => setNewAddrValue(e.target.value)}
                                        onBlur={handleSearchAddress}
                                        style={{
                                            width: '100%',
                                            padding: '12px 15px',
                                            borderRadius: '10px',
                                            border: '1.5px solid #F97350',
                                            background: '#fff',
                                            fontSize: '14px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>

                                {/* HÀNG 3: BẢN ĐỒ HIỂN THỊ */}
                                <div style={{ height: '250px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <MapContainer center={[newCoords.lat, newCoords.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <RecenterMap lat={newCoords.lat} lng={newCoords.lng} />
                                        <LocationMarker />
                                    </MapContainer>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setIsAdding(true)} style={{ width: '100%', padding: '15px', border: '2px dashed #ddd', background: '#fff', borderRadius: '10px', color: '#888', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>
                                <i className="fa-solid fa-plus"></i> Thêm địa chỉ nhận hàng mới
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
                <div className="modal-bg" onClick={() => setShowPassModal(false)} style={{
                    position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '15px'
                }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{
                        maxWidth: '420px', width: '100%', background: '#fff',
                        borderRadius: '24px', padding: '30px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        position: 'relative', overflow: 'hidden'
                    }}>
                        {/* Header trang trí */}
                        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <div style={{
                                width: '60px', height: '60px', background: '#FFF5F2',
                                color: '#F97350', borderRadius: '50%', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', fontSize: '24px',
                                margin: '0 auto 15px'
                            }}>
                                <i className="fa-solid fa-shield-halved"></i>
                            </div>
                            <h3 style={{ color: '#1E293B', margin: 0, fontSize: '22px', fontWeight: '800' }}>Thiết lập mật khẩu</h3>
                            <p style={{ color: '#64748B', fontSize: '13px', marginTop: '5px' }}>Đảm bảo tài khoản của bạn được bảo mật an toàn</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {/* Mật khẩu cũ */}
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Mật khẩu hiện tại</label>
                                <div style={inputContainerStyle}>
                                    <i className="fa-solid fa-lock" style={iconStyle}></i>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={passData.oldPass}
                                        onChange={e => setPassData({ ...passData, oldPass: e.target.value })}
                                        style={enhancedInputStyle}
                                    />
                                </div>
                            </div>

                            {/* Mật khẩu mới */}
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Mật khẩu mới</label>
                                <div style={inputContainerStyle}>
                                    <i className="fa-solid fa-key" style={iconStyle}></i>
                                    <input
                                        type="password"
                                        value={passData.newPass}
                                        onChange={e => setPassData({ ...passData, newPass: e.target.value })}
                                        style={enhancedInputStyle}
                                    />
                                </div>
                            </div>

                            {/* Nhập lại mật khẩu mới */}
                            <div style={{ position: 'relative' }}>
                                <label style={labelStyle}>Xác nhận mật khẩu</label>
                                <div style={inputContainerStyle}>
                                    <i className="fa-solid fa-check-double" style={iconStyle}></i>
                                    <input
                                        type="password"
                                        placeholder="Nhập lại mật khẩu mới"
                                        value={passData.confirmPass}
                                        onChange={e => setPassData({ ...passData, confirmPass: e.target.value })}
                                        style={enhancedInputStyle}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nhóm nút bấm */}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '30px' }}>
                            <button
                                className="btn soft"
                                onClick={() => setShowPassModal(false)}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px',
                                    fontWeight: '700', fontSize: '14px', border: '1px solid #E2E8F0',
                                    background: '#F8FAFC', color: '#64748B', cursor: 'pointer'
                                }}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                className="btn primary"
                                onClick={handleChangePassword}
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px',
                                    fontWeight: '800', fontSize: '14px', border: 'none',
                                    background: 'linear-gradient(135deg, #F97350 0%, #FF5F6D 100%)',
                                    color: '#fff', cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(249, 115, 80, 0.3)'
                                }}
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showTierModal && (
                <div style={S.overlay}>
                    <div style={{ ...S.sheet, maxWidth: '500px', padding: '0', overflow: 'hidden', border: 'none' }}>
                        {/* Header Modal với Gradient đồng bộ với App */}
                        <div style={{
                            padding: '30px 25px',
                            background: 'linear-gradient(135deg, #F97350 0%, #FF5F6D 100%)',
                            color: '#fff',
                            textAlign: 'center',
                            position: 'relative'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                                <i className="fa-solid fa-crown" style={{ marginRight: '10px' }}></i>
                                Đặc Quyền Thành Viên
                            </h3>
                            <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.9 }}>Tích lũy chi tiêu để mở khóa các ưu đãi hấp dẫn</p>

                            {/* Nút đóng X phía trên góc phải */}
                            <button onClick={() => setShowTierModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ padding: '25px' }}>
                            {[
                                { name: 'ĐỒNG (Basic)', limit: 'Dưới 1.000.000đ', gift: 'Hạng khởi đầu', color: '#F97350', icon: 'fa-award' },
                                { name: 'BẠC (Silver)', limit: 'Từ 1.000.000đ', gift: 'Tặng 2 mã giảm 20k', color: '#94A3B8', icon: 'fa-medal' },
                                { name: 'VÀNG (Gold)', limit: 'Từ 5.000.000đ', gift: 'Tặng 3 mã giảm 50k', color: '#FACC15', icon: 'fa-crown' },
                                { name: 'KIM CƯƠNG (Diamond)', limit: 'Từ 15.000.000đ', gift: 'Tặng 5 mã giảm 100k', color: '#0F172A', icon: 'fa-gem' }
                            ].map((t, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '16px',
                                    marginBottom: '12px',
                                    borderRadius: '18px',
                                    background: '#f8fafc',
                                    borderLeft: `6px solid ${t.color}`,
                                    transition: '0.3s'
                                }}>
                                    {/* Biểu tượng hạng tương ứng */}
                                    <div style={{
                                        width: '45px', height: '45px', borderRadius: '14px', background: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '20px', color: t.color, boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                                    }}>
                                        <i className={`fa-solid ${t.icon}`}></i>
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <b style={{ fontSize: '15px', color: '#1e293b' }}>{t.name}</b>
                                            <div style={{
                                                fontSize: '11px',
                                                color: '#fff',
                                                background: t.color,
                                                padding: '3px 10px',
                                                borderRadius: '20px',
                                                fontWeight: '800'
                                            }}>
                                                ƯU ĐÃI
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                            <i className="fa-solid fa-check-circle" style={{ marginRight: '5px', fontSize: '10px' }}></i>
                                            {t.gift}
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', fontWeight: '600' }}>
                                            Mốc chi tiêu: {t.limit}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ padding: '0 25px 25px' }}>
                            <button
                                className="btn primary"
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    borderRadius: '16px',
                                    fontWeight: '900',
                                    fontSize: '16px',
                                    background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', // Nút màu tối cho sang
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                                }}
                                onClick={() => setShowTierModal(false)}
                            >
                                Đã hiểu, tiếp tục mua sắm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showOffersModal && (
                <div style={S.overlay}>
                    <div style={{ ...S.sheet, maxWidth: '480px', padding: '0', overflow: 'hidden' }}>
                        {/* Header Modal - Thêm nút đóng X cho chuyên nghiệp */}
                        <div style={{ padding: '25px 25px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="fa-solid fa-gift" style={{ color: '#F97350' }}></i> Kho voucher của bạn
                            </h3>
                            <button onClick={() => setShowOffersModal(false)} style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: '#64748b' }}>×</button>
                        </div>

                        <div className="checkout-scroll-container" style={{ maxHeight: '450px', overflowY: 'auto', padding: '25px', background: '#f8fafc' }}>
                            {user?.systemVouchers?.filter(v => !v.isUsed).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <i className="fa-solid fa-ticket-simple" style={{ fontSize: '50px', color: '#cbd5e1', marginBottom: '15px' }}></i>
                                    <p style={{ color: '#94a3b8', fontSize: '15px' }}>Bạn chưa có mã giảm giá nào trong kho quà tặng.</p>
                                </div>
                            ) : (
                                user?.systemVouchers?.filter(v => !v.isUsed).map((v, i) => (
                                    /* GIAO DIỆN VÉ (TICKET) */
                                    <div key={i} style={{
                                        display: 'flex',
                                        marginBottom: '15px',
                                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))',
                                        position: 'relative',
                                        height: '100px'
                                    }}>
                                        {/* Phần trái: Giá trị */}
                                        <div style={{
                                            width: '120px',
                                            background: 'linear-gradient(135deg, #F97350 0%, #FF5F6D 100%)',
                                            borderRadius: '15px 0 0 15px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            position: 'relative'
                                        }}>
                                            <span style={{ fontSize: '10px', fontWeight: '700', opacity: 0.8 }}>GIẢM NGAY</span>
                                            <b style={{ fontSize: '20px', fontWeight: '900' }}>{v.value / 1000}K</b>

                                            {/* Nét đứt ngăn cách */}
                                            <div style={{ position: 'absolute', right: '-1px', top: '10%', bottom: '10%', borderRight: '2px dashed rgba(255,255,255,0.3)', zIndex: 2 }}></div>
                                        </div>

                                        {/* Phần phải: Thông tin */}
                                        <div style={{
                                            flex: 1,
                                            background: '#fff',
                                            borderRadius: '0 15px 15px 0',
                                            padding: '15px 20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            border: '1px solid #edf2f7',
                                            borderLeft: 'none'
                                        }}>
                                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', marginBottom: '4px' }}>Mã: {v.code}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Đơn tối thiểu: {v.minOrder?.toLocaleString()}đ</div>
                                            <div style={{ fontSize: '11px', color: '#F97350', fontWeight: '700', marginTop: '8px' }}>
                                                <i className="fa-regular fa-clock" style={{ marginRight: '4px' }}></i>
                                                HSD: {new Date(v.endDate).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>

                                        {/* Các lỗ tròn khuyết tạo hiệu ứng vé */}
                                        <div style={{ position: 'absolute', left: '112px', top: '-8px', width: '16px', height: '16px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #edf2f7', borderTop: 'none' }}></div>
                                        <div style={{ position: 'absolute', left: '112px', bottom: '-8px', width: '16px', height: '16px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #edf2f7', borderBottom: 'none' }}></div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div style={{ padding: '15px 25px', background: '#fff', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                            <p style={{ margin: '0 0 15px', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>* Mã giảm giá này chỉ áp dụng cho dịch vụ của HaFo</p>
                            <button className="btn primary" style={{ width: '100%', borderRadius: '12px', height: '45px', fontWeight: '800' }} onClick={() => setShowOffersModal(false)}>Đã hiểu</button>
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

const S = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(5px)',
        padding: '20px'
    },
    sheet: {
        background: '#fff',
        width: '100%',
        maxWidth: '450px',
        borderRadius: '24px',
        padding: '30px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        position: 'relative'
    }
};

export default Profile;