import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import 'leaflet/dist/leaflet.css';
import { useOutletContext } from 'react-router-dom';

// Fix icon Marker Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component để tự động di chuyển tâm bản đồ khi tọa độ thay đổi
function RecenterMap({ lat, lng }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], 16);
        }
    }, [lat, lng, map]);
    return null;
}

function Storefront() {
    const { setMyShop } = useOutletContext();
    const [shop, setShop] = useState(null);
    const [owner, setOwner] = useState(null);

    // Form Quán
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [formData, setFormData] = useState({ lat: 10.762, lng: 106.660, address: '' });

    // Form Chủ quán
    const [userFormData, setUserFormData] = useState({});
    const [userAvatarFile, setUserAvatarFile] = useState(null);
    const [userAvatarPreview, setUserAvatarPreview] = useState('');
    const [newCuisine, setNewCuisine] = useState('');

    const [loadingUser, setLoadingUser] = useState(false);
    const [loadingShop, setLoadingShop] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Hàm lọc địa chỉ sạch từ dữ liệu của OpenStreetMap
    const formatCleanAddress = (addressObj) => {
        if (!addressObj) return "";

        // Lấy các thành phần quan trọng
        const houseNumber = addressObj.house_number || "";
        const road = addressObj.road || "";

        // Phường/Xã: OSM thường trả về suburb, quarter hoặc neighbourhood
        const ward = addressObj.suburb || addressObj.quarter || addressObj.neighbourhood || "";

        // Quận/Huyện: Ưu tiên district
        const district = addressObj.district || addressObj.city_district || "";

        // Thành phố: Thường là city hoặc state
        const city = addressObj.city || addressObj.state || "";

        // Ghép lại thành chuỗi, loại bỏ các phần rỗng và các phần bị lặp (như Thủ Đức ở Quận 1)
        const parts = [];

        if (houseNumber && road) parts.push(`${houseNumber} ${road}`);
        else if (road) parts.push(road);

        if (ward) parts.push(ward);

        // Logic đặc biệt: Nếu đã có District 1 (Quận 1) thì không thêm "Saigon" hay "Thủ Đức" lắt nhắt vào giữa
        if (district) parts.push(district);

        if (city) parts.push(city);

        return parts.join(", ");
    };

    // --- HÀM 1: TỪ TỌA ĐỘ -> ĐỊA CHỈ (Khi click Map) ---
    const fetchAddressFromCoords = async (lat, lng) => {
        try {
            // Lưu ý: Nominatim trả về object 'address' rất chi tiết khi dùng format jsonv2
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const data = await res.json();

            if (data && data.address) {
                // ✅ DÙNG HÀM LỌC ĐỊA CHỈ SẠCH TẠI ĐÂY
                const cleanAddr = formatCleanAddress(data.address);
                setFormData(prev => ({ ...prev, address: cleanAddr }));
            }
        } catch (err) {
            console.error("Lỗi lấy địa chỉ:", err);
        }
    };

    // --- HÀM 2: TỪ ĐỊA CHỈ -> TỌA ĐỘ (Khi nhập text) ---
    const handleSearchAddress = async () => {
        if (!formData.address) return;
        setIsGeocoding(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&q=${encodeURIComponent(formData.address)}`);
            const data = await res.json();

            if (data && data.length > 0) {
                const firstResult = data[0];
                const cleanAddr = formatCleanAddress(firstResult.address); // ✅ Lọc địa chỉ sạch

                setFormData(prev => ({
                    ...prev,
                    lat: parseFloat(firstResult.lat),
                    lng: parseFloat(firstResult.lon),
                    address: cleanAddr // ✅ Cập nhật lại ô input bằng địa chỉ đã lọc
                }));
            } else {
                alert("Không tìm thấy tọa độ cho địa chỉ này!");
            }
        } catch (err) {
            console.error("Lỗi tìm tọa độ:", err);
        } finally {
            setIsGeocoding(false);
        }
    };

    function LocationMarker() {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                setFormData(prev => ({ ...prev, lat, lng }));
                fetchAddressFromCoords(lat, lng); // Cập nhật luôn địa chỉ string
            },
        });
        return formData.lat ? <Marker position={[formData.lat, formData.lng]} /> : null;
    }

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const userId = user?.id || user?._id;
        if (user) {
            api.get(`/restaurants/my-shop/${userId}`)
                .then(res => {
                    const shopData = res.data;
                    setShop(shopData);
                    // Đảm bảo lấy đủ lat, lng, address từ DB
                    setFormData({
                        ...shopData,
                        cuisine: shopData.cuisine || [],
                        lat: shopData.location?.coordinates[1] || 10.762, // index 1 là Latitude
                        lng: shopData.location?.coordinates[0] || 106.660, // index 0 là Longitude
                        address: shopData.address || '',
                        phone: shopData.phone || ''
                    });
                    if (shopData.image) setImagePreview(shopData.image);
                    return api.get(`/users/${userId}`);
                })
                .then(res => {
                    setOwner(res.data);
                    setUserFormData(res.data);
                    if (res.data.avatar) setUserAvatarPreview(res.data.avatar);
                })
                .catch(err => console.error(err));
        }
    }, []);

    const handleSaveUser = async () => {
        setLoadingUser(true);
        try {
            const data = new FormData();
            data.append('fullName', userFormData.fullName);
            data.append('phone', userFormData.phone);
            data.append('email', userFormData.email);
            if (userAvatarFile) data.append('avatar', userAvatarFile);

            // Gọi API cập nhật thông tin NGƯỜI DÙNG (Chủ quán)
            const res = await api.put(`/users/${owner._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 1. Cập nhật state để giao diện thay đổi ngay
            setOwner(res.data);

            // ✅ 2. QUAN TRỌNG: Cập nhật lại localStorage để khi F5 không bị mất ảnh
            const currentUser = JSON.parse(localStorage.getItem('user'));
            const updatedUser = { ...currentUser, ...res.data };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // 3. Reset lại trạng thái chọn file
            if (res.data.avatar) {
                setUserAvatarPreview(res.data.avatar);
                setUserAvatarFile(null);
            }

            alert("✅ Đã cập nhật thông tin chủ quán!");
        } catch (err) {
            alert(err.message);
        } finally {
            setLoadingUser(false);
        }
    };

    const addCuisine = () => {
        if (newCuisine.trim() && !formData.cuisine.includes(newCuisine.trim())) {
            setFormData({ ...formData, cuisine: [...formData.cuisine, newCuisine.trim()] });
            setNewCuisine(''); // Xóa ô nhập sau khi thêm
        }
    };

    const removeCuisine = (tagToRemove) => {
        setFormData({
            ...formData,
            cuisine: formData.cuisine.filter(tag => tag !== tagToRemove)
        });
    };

    const handleSaveShop = async () => {
        setLoadingShop(true);
        try {
            const data = new FormData();
            // Chỉ append nếu có giá trị để tránh gửi "undefined" lên server
            data.append('name', formData.name || '');
            data.append('phone', formData.phone || '');
            data.append('address', formData.address || '');
            data.append('openTime', formData.openTime || '');
            data.append('closeTime', formData.closeTime || '');
            data.append('lat', formData.lat);
            data.append('lng', formData.lng);

            if (formData.cuisine && formData.cuisine.length > 0) {
                formData.cuisine.forEach(item => data.append('cuisine', item));
            }

            if (imageFile) data.append('image', imageFile);

            // 1. Gọi API cập nhật
            const res = await api.put(`/restaurants/${shop._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // ✅ 2. CẬP NHẬT STATE SHOP ĐỂ UI THAY ĐỔI NGAY
            setShop(res.data);
            setMyShop(res.data);

            // ✅ 3. ĐỒNG BỘ LOCALSTORAGE (Nếu bạn lưu restaurantId/name trong user object)
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (currentUser) {
                const updatedUser = { ...currentUser, restaurant: res.data._id };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            // 4. Reset file đã chọn
            if (imageFile) setImageFile(null);

            alert("✅ Đã cập nhật thông tin cửa hàng thành công!");
        } catch (err) {
            alert("❌ Lỗi cập nhật quán: " + (err.response?.data?.message || err.message));
        } finally {
            setLoadingShop(false);
        }
    };

    if (!shop || !owner) return <div style={{ padding: '20px' }}>Đang tải...</div>;

    const S = {
        label: { display: 'block', fontWeight: '700', fontSize: '13px', color: '#64748b', marginBottom: '6px' },
        avatarCircle: { width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #FFF1ED', margin: '0 auto 10px', background: '#f8fafc' },
        uploadLink: { fontSize: '12px', color: '#F97350', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }
    };

    return (
        <div className="storefront-container">
            {/* PHẦN 1: THÔNG TIN CHỦ QUÁN */}
            <section className="panel">
                <div className="head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-user-gear" style={{ color: '#F97350' }}></i>
                        <span>Thông tin chủ sở hữu</span>
                    </div>
                    <button className="btn primary small" onClick={handleSaveUser} disabled={loadingUser}>
                        {loadingUser ? 'Đang lưu...' : 'Cập nhật cá nhân'}
                    </button>
                </div>
                <div className="body">
                    <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
                        <div style={{ textAlign: 'center', width: '140px' }}>
                            <div style={S.avatarCircle}>
                                <img src={userAvatarPreview || 'https://via.placeholder.com/100'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Owner" />
                            </div>
                            <label htmlFor="user-avatar" style={S.uploadLink}>Đổi ảnh đại diện</label>
                            <input id="user-avatar" type="file" hidden onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) { setUserAvatarFile(file); setUserAvatarPreview(URL.createObjectURL(file)); }
                            }} accept="image/*" />
                        </div>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={S.label}>Họ và tên</label>
                                <input className="f-input" value={userFormData.fullName || ''} onChange={e => setUserFormData({ ...userFormData, fullName: e.target.value })} />
                            </div>
                            <div>
                                <label style={S.label}>Số điện thoại</label>
                                <input className="f-input" value={userFormData.phone || ''} onChange={e => setUserFormData({ ...userFormData, phone: e.target.value })} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={S.label}>Email liên hệ</label>
                                <input className="f-input" value={userFormData.email || ''} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PHẦN 2: THÔNG TIN CỬA HÀNG */}
            <section className="panel">
                <div className="head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-store" style={{ color: '#F97350' }}></i>
                        <span>Thông tin cửa hàng</span>
                    </div>
                    <button className="btn primary small" onClick={handleSaveShop} disabled={loadingShop}>
                        {loadingShop ? 'Đang lưu...' : 'Lưu thay đổi quán'}
                    </button>
                </div>
                <div className="body">
                    <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                        <div style={{ width: '200px', textAlign: 'center' }}>
                            <div style={{ width: '100%', height: '160px', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #e2e8f0', marginBottom: '10px' }}>
                                <img src={imagePreview || 'https://via.placeholder.com/200'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Shop" />
                            </div>
                            <label htmlFor="shop-img" style={S.uploadLink}>Đổi ảnh bìa quán</label>
                            <input id="shop-img" type="file" hidden onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                            }} accept="image/*" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={S.label}>Tên quán hiển thị</label>
                                    <input
                                        className="f-input"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ví dụ: Cà phê Tấn Tài"
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={S.label}>Số điện thoại quán</label>
                                    <input
                                        className="f-input"
                                        name="phone"
                                        value={formData.phone || ''}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Ví dụ: 090xxxxxxx"
                                    />
                                </div>
                            </div>

                            <label style={{ ...S.label, marginTop: '15px' }}>Địa chỉ kinh doanh</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    className="f-input"
                                    placeholder="Nhập địa chỉ để tìm trên bản đồ..."
                                    name="address"
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                                />
                                <button
                                    className="btn"
                                    style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                                    onClick={handleSearchAddress}
                                    disabled={isGeocoding}
                                >
                                    <i className="fa-solid fa-location-dot"></i> Tìm vị trí
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={S.label}>Giờ mở cửa</label>
                                    <input type="time" className="f-input" value={formData.openTime || ''} onChange={e => setFormData({ ...formData, openTime: e.target.value })} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={S.label}>Giờ đóng cửa</label>
                                    <input type="time" className="f-input" value={formData.closeTime || ''} onChange={e => setFormData({ ...formData, closeTime: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ marginTop: '20px' }}>
                                <label style={S.label}>Loại món ăn phục vụ (VD: Bún bò, Cà phê, Tráng miệng...)</label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                                    <input
                                        className="f-input"
                                        placeholder="Nhập loại món rồi nhấn Thêm..."
                                        value={newCuisine}
                                        onChange={(e) => setNewCuisine(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCuisine())}
                                    />
                                    <button className="btn" onClick={addCuisine} type="button">Thêm</button>
                                </div>

                                {/* Hiển thị danh sách các Tag món ăn */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {formData.cuisine && formData.cuisine.map((tag, idx) => (
                                        <span key={idx} style={{
                                            background: '#FFF1ED', color: '#F97350', padding: '5px 12px',
                                            borderRadius: '20px', fontSize: '13px', fontWeight: '700',
                                            display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #F97350'
                                        }}>
                                            {tag}
                                            <i className="fa-solid fa-xmark"
                                                style={{ cursor: 'pointer', fontSize: '14px' }}
                                                onClick={() => removeCuisine(tag)}></i>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* MAP SECTION */}
                    <div style={{ marginTop: '30px', borderTop: '1px dashed #e2e8f0', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <label style={S.label}>Vị trí GPS (Click vào bản đồ để cập nhật tọa độ & địa chỉ)</label>
                            <div style={{ marginBottom: '6px', fontSize: '11px', color: '#94a3b8' }}>
                                Tọa độ: {formData.lat?.toFixed(6)} , {formData.lng?.toFixed(6)}
                            </div>
                        </div>
                        <div style={{ height: '350px', borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #e2e8f0', marginTop: '10px' }}>
                            <MapContainer
                                center={[formData.lat || 10.762, formData.lng || 106.660]}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                            >
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <RecenterMap lat={formData.lat} lng={formData.lng} />
                                <LocationMarker />
                            </MapContainer>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Storefront;