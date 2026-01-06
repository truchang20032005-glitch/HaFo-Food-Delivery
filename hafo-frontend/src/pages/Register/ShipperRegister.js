import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../../context/AuthContext';

// Fix icon Marker Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { alertError, alertWarning } from '../../utils/hafoAlert';
let DefaultIcon = L.icon({
    iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper di chuyển tâm bản đồ khi tọa độ thay đổi
function RecenterMap({ lat, lng }) {
    const map = useMap();
    useEffect(() => { if (lat && lng) map.setView([lat, lng], 16); }, [lat, lng, map]);
    return null;
}

function ShipperRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const { updateUser } = useAuth();

    const [data, setData] = useState(() => {
        const savedData = localStorage.getItem('shipper_draft');
        return savedData ? JSON.parse(savedData) : {
            fullName: '', phone: '', email: '', dob: '', address: '',
            city: '', district: '', // Đã sửa thành rỗng để bắt buộc chọn
            vehicleType: 'Xe máy', licensePlate: '', driverLicense: '',
            bankName: '', bankAccount: '', bankOwner: '', bankBranch: '',
            workTime: 'Toàn thời gian',
            avatar: null, vehicleRegImage: null, licenseImage: null, cccdFront: null, cccdBack: null,
            lat: 10.762622, lng: 106.660172
        };
    });

    // --- LOGIC ĐỊA CHỈ & MAP ---
    const fetchAddressFromCoords = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
            const result = await res.json();
            if (result && result.display_name) {
                setData(prev => ({ ...prev, address: result.display_name, lat, lng }));
            }
        } catch (err) { console.error(err); }
    };

    const handleSearchAddress = async () => {
        if (!data.address) return;
        setIsGeocoding(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.address)}`);
            const result = await res.json();
            if (result && result.length > 0) {
                setData(prev => ({ ...prev, lat: parseFloat(result[0].lat), lng: parseFloat(result[0].lon) }));
            }
        } catch (err) { console.error(err); }
        finally { setIsGeocoding(false); }
    };

    function LocationMarker() {
        useMapEvents({ click(e) { fetchAddressFromCoords(e.latlng.lat, e.latlng.lng); } });
        return <Marker position={[data.lat, data.lng]} />;
    }

    // Lưu bản nháp (trừ file)
    useEffect(() => {
        const dataToSave = { ...data, avatar: null, vehicleRegImage: null, licenseImage: null, cccdFront: null, cccdBack: null };
        localStorage.setItem('shipper_draft', JSON.stringify(dataToSave));
    }, [data]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) { navigate('/'); return; }
        if (user.approvalStatus === 'pending') navigate('/pending-approval');
        api.get('/cities').then(res => setCities(res.data)).catch(() => { });
    }, [navigate]);

    const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) setData(prev => ({ ...prev, [e.target.name]: file }));
    };

    const handleNext = () => {
        if (step === 1) {
            if (!data.fullName || !data.phone || !data.email) return alertWarning("Vui lòng điền đủ thông tin cá nhân!");
            const phoneRegex = /^(02|03|05|07|08|09|01[2|6|8|9])[0-9]{8}$/;
            if (!phoneRegex.test(data.phone)) return alertWarning("Số điện thoại không hợp lệ!");
            if (!data.city) return alertWarning("Vui lòng chọn Tỉnh/Thành phố!");
            if (!data.avatar) return alertWarning("Vui lòng tải ảnh chân dung!");
        }
        if (step === 2) {
            if (!data.licensePlate) return alertWarning("Vui lòng nhập biển số xe!");
            if (!data.vehicleRegImage) return alertWarning("Vui lòng tải ảnh cà vẹt!");
        }
        if (step === 3) {
            if (!data.driverLicense || !data.licenseImage) return alertWarning("Vui lòng nhập số và tải ảnh bằng lái!");
            if (!data.cccdFront || !data.cccdBack) return alertWarning("Vui lòng tải đủ 2 mặt CCCD!");
        }
        if (step === 5 && !data.address) return alertWarning("Vui lòng xác định vị trí hoạt động!");
        setStep(step + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const formData = new FormData();
            formData.append('userId', user.id || user._id);
            Object.keys(data).forEach(key => { if (data[key] !== null) formData.append(key, data[key]); });

            await api.post('/pending/shipper', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            localStorage.removeItem('shipper_draft');
            updateUser({
                role: 'pending_shipper',
                approvalStatus: 'pending'
            });
            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (err) { alertError("Lỗi", err.message); }
        finally { setLoading(false); }
    };

    const steps = ["Cá nhân", "Phương tiện", "Giấy tờ", "Ngân hàng", "Hoạt động", "Xác nhận"];

    // Hàm render ảnh nhỏ cho bước 6 (giữ nguyên)
    const renderFinalPreview = (file, label) => (
        <div style={{ marginBottom: 10, width: '100px' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4, fontWeight: 'bold' }}>{label}</div>
            {file ? (
                <div style={{ width: '100%', height: '80px', borderRadius: 8, border: '1px solid #ddd', overflow: 'hidden', background: '#f1f5f9' }}>
                    <img src={URL.createObjectURL(file)} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            ) : <div style={{ fontSize: 10, color: 'red' }}>Trống</div>}
        </div>
    );

    // --- STYLE CHO UPLOAD BOX CÓ PREVIEW ---
    const uploadBoxStyle = (hasFile) => ({
        position: 'relative',
        marginTop: 15,
        border: hasFile ? 'none' : '2px dashed #F97350',
        background: hasFile ? 'transparent' : '#fff9f7',
        height: hasFile ? '180px' : 'auto', // Chiều cao cố định khi có ảnh để hiện preview đẹp
        padding: hasFile ? 0 : '30px',
        borderRadius: '12px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden',
        transition: 'all 0.3s ease'
    });

    // --- COMPONENT CON ĐỂ RENDER KHUNG UPLOAD CÓ PREVIEW ---
    const UploadWithPreview = ({ name, file, label, icon }) => (
        <div className="upload-box" style={uploadBoxStyle(file)}>
            <input type="file" name={name} onChange={handleFileChange} accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} />
            {file ? (
                // TRẠNG THÁI 1: ĐÃ CHỌN ẢNH -> HIỆN PREVIEW
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px', background: '#f8fafc', border: '1px solid #eee' }}
                    />
                    {/* Lớp phủ khi hover để báo hiệu đổi ảnh */}
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s' }}
                        onMouseOver={e => e.currentTarget.style.opacity = 1}
                        onMouseOut={e => e.currentTarget.style.opacity = 0}>
                        <i className="fa-solid fa-camera-rotate" style={{ fontSize: '24px', marginBottom: 5 }}></i>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>Nhấn để thay đổi ảnh</span>
                    </div>
                </div>
            ) : (
                // TRẠNG THÁI 2: CHƯA CHỌN -> HIỆN ICON VÀ CHỮ
                <div style={{ textAlign: 'center', color: '#F97350' }}>
                    <i className={`fa-solid ${icon}`} style={{ fontSize: '32px', marginBottom: '10px' }}></i>
                    <div style={{ fontWeight: '700', fontSize: '15px' }}>{label}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>(Nhấn vào để chọn ảnh)</div>
                </div>
            )}
        </div>
    );


    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: 50 }}>
            <Navbar />
            <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>

                {/* THANH TIẾN TRÌNH */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '15px', left: 0, right: 0, height: '2px', background: '#e5dfd2', zIndex: 0 }}></div>
                    {steps.map((label, idx) => (
                        <div key={idx} style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '60px' }}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%', margin: '0 auto 8px',
                                background: step > idx + 1 ? '#22C55E' : (step === idx + 1 ? '#F97350' : '#fff'),
                                color: step >= idx + 1 ? '#fff' : '#999',
                                border: '2px solid', borderColor: step >= idx + 1 ? 'transparent' : '#ccc',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px'
                            }}>
                                {step > idx + 1 ? <i className="fa-solid fa-check"></i> : idx + 1}
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: step === idx + 1 ? '#F97350' : '#888' }}>{label}</div>
                        </div>
                    ))}
                </div>

                {isSuccess ? (
                    <div className="panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ width: '80px', height: '80px', background: '#eafbf1', color: '#22C55E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '40px' }}>
                            <i className="fa-solid fa-circle-check"></i>
                        </div>
                        <h2 style={{ color: '#333' }}>Đã gửi hồ sơ Shipper thành công!</h2>
                        <p style={{ color: '#666', marginTop: 10 }}>Vui lòng chờ quản trị viên xét duyệt trong 24-48h.</p>
                        <button className="btn primary" onClick={() => navigate('/')} style={{ padding: '12px 40px', marginTop: 30 }}>Về trang chủ</button>
                    </div>
                ) : (
                    <div className="panel" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: 'none' }}>
                        <div className="body" style={{ padding: '40px' }}>

                            {/* BƯỚC 1: CÁ NHÂN */}
                            {step === 1 && (
                                <div className="animate-pop-in">
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-user"></i> Thông tin cá nhân</h3>
                                    <div className="form-grid">
                                        <div className="f-group"><label className="f-label">Họ và tên *</label><input className="f-input" name="fullName" value={data.fullName} onChange={handleChange} /></div>
                                        <div className="f-group"><label className="f-label">Ngày sinh</label><input type="date" className="f-input" name="dob" value={data.dob} onChange={handleChange} /></div>
                                    </div>
                                    <div className="form-grid">
                                        <div className="f-group"><label className="f-label">Số điện thoại *</label><input className="f-input" name="phone" value={data.phone} onChange={handleChange} /></div>
                                        <div className="f-group"><label className="f-label">Email cá nhân *</label><input className="f-input" name="email" value={data.email} onChange={handleChange} /></div>
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Tỉnh / Thành phố cư trú *</label>
                                        <select className="f-select" name="city" value={data.city} onChange={handleChange}>
                                            <option value="">-- Chọn Tỉnh/Thành phố --</option>
                                            {cities.map(c => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>

                                    {/* UPLOAD CÓ PREVIEW */}
                                    <UploadWithPreview name="avatar" file={data.avatar} label="Tải ảnh chân dung chính chủ" icon="fa-camera" />
                                </div>
                            )}

                            {/* BƯỚC 2: PHƯƠNG TIỆN */}
                            {step === 2 && (
                                <div className="animate-pop-in">
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-motorcycle"></i> Thông tin phương tiện</h3>
                                    <label className="f-label">Loại xe đăng ký</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                        <div onClick={() => setData({ ...data, vehicleType: 'Xe máy' })} className={`check-card ${data.vehicleType === 'Xe máy' ? 'checked' : ''}`}>
                                            <input type="radio" checked={data.vehicleType === 'Xe máy'} readOnly /> <b>Xe máy</b>
                                        </div>
                                        <div onClick={() => setData({ ...data, vehicleType: 'Xe điện' })} className={`check-card ${data.vehicleType === 'Xe điện' ? 'checked' : ''}`}>
                                            <input type="radio" checked={data.vehicleType === 'Xe điện'} readOnly /> <b>Xe điện</b>
                                        </div>
                                    </div>
                                    <div className="f-group"><label className="f-label">Biển số xe *</label><input className="f-input" name="licensePlate" value={data.licensePlate} onChange={handleChange} placeholder="59-X1 123.45" /></div>

                                    {/* UPLOAD CÓ PREVIEW */}
                                    <UploadWithPreview name="vehicleRegImage" file={data.vehicleRegImage} label="Tải ảnh Cà vẹt xe (Mặt có biển số)" icon="fa-image" />
                                </div>
                            )}

                            {/* BƯỚC 3: GIẤY TỜ */}
                            {step === 3 && (
                                <div className="animate-pop-in">
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-id-card"></i> Giấy tờ pháp lý</h3>
                                    <div className="f-group"><label className="f-label">Số bằng lái xe *</label><input className="f-input" name="driverLicense" value={data.driverLicense} onChange={handleChange} /></div>

                                    {/* UPLOAD CÓ PREVIEW - BẰNG LÁI */}
                                    <UploadWithPreview name="licenseImage" file={data.licenseImage} label="Tải ảnh Bằng lái xe (Mặt trước)" icon="fa-id-badge" />

                                    <div className="form-grid" style={{ marginTop: 20 }}>
                                        {/* UPLOAD CÓ PREVIEW - CCCD TRƯỚC */}
                                        <UploadWithPreview name="cccdFront" file={data.cccdFront} label="CCCD Mặt trước" icon="fa-address-card" />
                                        {/* UPLOAD CÓ PREVIEW - CCCD SAU */}
                                        <UploadWithPreview name="cccdBack" file={data.cccdBack} label="CCCD Mặt sau" icon="fa-address-card" />
                                    </div>
                                </div>
                            )}

                            {/* BƯỚC 4: NGÂN HÀNG (GIỮ NGUYÊN) */}
                            {step === 4 && (
                                <div className="animate-pop-in">
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-building-columns"></i> Tài khoản nhận thu nhập</h3>
                                    <div className="f-group"><label className="f-label">Ngân hàng</label><input className="f-input" name="bankName" value={data.bankName} onChange={handleChange} placeholder="VD: Vietcombank" /></div>
                                    <div className="form-grid">
                                        <div className="f-group"><label className="f-label">Số tài khoản</label><input className="f-input" name="bankAccount" value={data.bankAccount} onChange={handleChange} /></div>
                                        <div className="f-group"><label className="f-label">Tên chủ tài khoản (Không dấu)</label><input className="f-input" name="bankOwner" value={data.bankOwner} onChange={handleChange} placeholder="NGUYEN VAN A" /></div>
                                    </div>
                                </div>
                            )}

                            {/* BƯỚC 5: HOẠT ĐỘNG (MAP - GIỮ NGUYÊN) */}
                            {step === 5 && (
                                <div className="animate-pop-in">
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-map-location-dot"></i> Khu vực hoạt động</h3>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label className="f-label">Địa chỉ xuất phát mặc định (Nhập chữ hoặc chấm trên Map) *</label>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                            <input className="f-input" name="address" value={data.address} onChange={handleChange} onBlur={handleSearchAddress} placeholder="Nhập địa chỉ của bạn..." style={{ flex: 1 }} />
                                            <button className="btn soft" onClick={handleSearchAddress} disabled={isGeocoding} style={{ borderStyle: 'solid', whiteSpace: 'nowrap' }}><i className="fa-solid fa-magnifying-glass"></i> Tìm vị trí</button>
                                        </div>
                                        <div style={{ height: '350px', borderRadius: '15px', overflow: 'hidden', border: '1px solid #ddd', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)' }}>
                                            <MapContainer center={[data.lat, data.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <RecenterMap lat={data.lat} lng={data.lng} />
                                                <LocationMarker />
                                            </MapContainer>
                                        </div>
                                    </div>
                                    <label className="f-label">Hình thức hoạt động</label>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div onClick={() => setData({ ...data, workTime: 'Toàn thời gian' })} className={`check-card ${data.workTime === 'Toàn thời gian' ? 'checked' : ''}`} style={{ flex: 1 }}>
                                            <input type="radio" checked={data.workTime === 'Toàn thời gian'} readOnly /> <b>Toàn thời gian</b>
                                        </div>
                                        <div onClick={() => setData({ ...data, workTime: 'Bán thời gian' })} className={`check-card ${data.workTime === 'Bán thời gian' ? 'checked' : ''}`} style={{ flex: 1 }}>
                                            <input type="radio" checked={data.workTime === 'Bán thời gian'} readOnly /> <b>Bán thời gian</b>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BƯỚC 6: XÁC NHẬN (UPDATE GIAO DIỆN CHO ĐẸP) */}
                            {step === 6 && (
                                <div className="animate-pop-in">
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-check-double"></i> Xác nhận thông tin</h3>
                                    <div style={{ background: '#fffaf5', padding: '30px', borderRadius: '20px', border: '1px solid #eee' }}>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                            {/* Cột thông tin chữ */}
                                            <div>
                                                <h4 style={{ color: '#F97350', marginBottom: 15, borderBottom: '1px dashed #F97350', paddingBottom: 10 }}>Thông tin đăng ký</h4>
                                                <p><b>Họ tên:</b> {data.fullName}</p>
                                                <p><b>SĐT:</b> {data.phone} | <b>Email:</b> {data.email}</p>
                                                <p><b>Khu vực:</b> {data.city}</p>
                                                <p style={{ marginTop: 10 }}><b>Loại xe:</b> {data.vehicleType} - <b>Biển số:</b> {data.licensePlate}</p>
                                                <p><b>Hình thức:</b> {data.workTime}</p>
                                                <p style={{ marginTop: 10, fontStyle: 'italic', color: '#666' }}><i className="fa-solid fa-location-dot"></i> {data.address}</p>
                                            </div>

                                            {/* Cột hình ảnh preview */}
                                            <div>
                                                <h4 style={{ color: '#F97350', marginBottom: 15, borderBottom: '1px dashed #F97350', paddingBottom: 10 }}>Hồ sơ ảnh</h4>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                    {renderFinalPreview(data.avatar, "Chân dung")}
                                                    {renderFinalPreview(data.vehicleRegImage, "Cà vẹt xe")}
                                                    {renderFinalPreview(data.licenseImage, "Bằng lái")}
                                                    <div style={{ gridColumn: 'span 2', display: 'flex', gap: 15 }}>
                                                        {renderFinalPreview(data.cccdFront, "CCCD Trước")}
                                                        {renderFinalPreview(data.cccdBack, "CCCD Sau")}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>

                        {/* NÚT ĐIỀU HƯỚNG */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '25px 40px', borderTop: '1px solid #eee', background: '#fafafa', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
                            {step > 1 && <button className="btn soft" onClick={() => setStep(step - 1)} disabled={loading} style={{ borderStyle: 'solid', padding: '12px 25px' }}><i className="fa-solid fa-arrow-left"></i> Quay lại</button>}
                            <div style={{ marginLeft: 'auto' }}>
                                {step < 6 ? (
                                    <button className="btn primary" onClick={handleNext} style={{ padding: '12px 40px', fontSize: '16px' }}>Tiếp theo <i className="fa-solid fa-arrow-right"></i></button>
                                ) : (
                                    <button className="btn primary" onClick={handleSubmit} disabled={loading} style={{ padding: '12px 40px', fontSize: '16px', boxShadow: '0 4px 15px rgba(249, 115, 80, 0.3)' }}>
                                        {loading ? <span><i className="fa-solid fa-spinner fa-spin"></i> Đang gửi...</span> : <span>Xác nhận & Gửi hồ sơ <i className="fa-solid fa-paper-plane"></i></span>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShipperRegister;