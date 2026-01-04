import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import 'leaflet/dist/leaflet.css';

// Fix icon Marker Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { alertWarning } from '../../utils/hafoAlert';
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

function MerchantRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [customCuisine, setCustomCuisine] = useState(''); //
    const presets = ['Cơm', 'Bún/Phở', 'Đồ uống', 'Ăn vặt', 'Món Á', 'Món Âu', 'Chay', 'Bánh mì']; // Danh sách mẫu

    const [data, setData] = useState(() => {
        const savedData = localStorage.getItem('merchant_draft');
        return savedData ? JSON.parse(savedData) : {
            serviceType: 'food',
            name: '', phone: '', email: '', city: 'TP. Hồ Chí Minh', district: '', address: '',
            cuisine: [], signatureDish: '',
            openTime: '07:00', closeTime: '22:00', priceRange: '20.000đ - 50.000đ', parkingFee: 'Miễn phí',
            ownerName: '', idCard: '',
            bankName: '', bankAccount: '', bankOwner: '', bankBranch: '',
            avatar: null, idCardFront: null, idCardBack: null, businessLicense: null,
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

    const handleAddCustomCuisine = () => {
        const val = customCuisine.trim();
        if (!val) return;
        if (data.cuisine.includes(val)) {
            setCustomCuisine('');
            return;
        }
        setData({ ...data, cuisine: [...data.cuisine, val] }); // Thêm vào mảng cuisine
        setCustomCuisine(''); // Xóa ô input sau khi thêm
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
        useMapEvents({
            click(e) { fetchAddressFromCoords(e.latlng.lat, e.latlng.lng); }
        });
        return <Marker position={[data.lat, data.lng]} />;
    }

    useEffect(() => {
        const dataToSave = { ...data, avatar: null, idCardFront: null, idCardBack: null, businessLicense: null };
        localStorage.setItem('merchant_draft', JSON.stringify(dataToSave));
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
        if (!file) return;
        setData(prev => ({ ...prev, [e.target.name]: file }));
    };

    const handleCuisine = (val) => {
        const current = data.cuisine.includes(val) ? data.cuisine.filter(c => c !== val) : [...data.cuisine, val];
        setData({ ...data, cuisine: current });
    };

    // Danh sách ngân hàng
    const banks = [
        "Vietcombank", "VietinBank", "MB Bank", "BIDV", "Sacombank", "Techcombank",
        "ACB", "Eximbank", "SHB", "OceanBank", "TPBank", "VPBank", "HDBank", "SeABank"
    ];

    // --- HÀM KIỂM TRA DỮ LIỆU TRƯỚC KHI NEXT (MỚI) ---
    const handleNext = () => {
        // Bước 1: Loại hình
        if (step === 1) {
            if (!data.serviceType) return alertWarning("Vui lòng chọn loại hình kinh doanh!");
        }

        // Bước 2: Thông tin cơ bản
        if (step === 2) {
            if (!data.name.trim()) return alertWarning("Vui lòng nhập tên quán!");

            // Validate SDT
            if (!data.phone.trim()) return alertWarning("Vui lòng nhập số điện thoại!");
            const phoneRegex = /^(02|03|05|07|08|09|01[2|6|8|9])[0-9]{8}$/;
            if (!phoneRegex.test(data.phone)) return alertWarning("Số điện thoại không hợp lệ (Phải có 10 số, bắt đầu bằng 0)!");

            // Validate Email
            if (!data.email.trim()) return alertWarning("Vui lòng nhập Email!");
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) return alertWarning("Địa chỉ Email không hợp lệ!");

            if (!data.address.trim()) return alertWarning("Vui lòng nhập địa chỉ!");
        }

        // Bước 3: Vận hành
        if (step === 3) {
            // MẸO: Tạo một mảng tạm để kiểm tra dữ liệu thực tế
            let finalCuisines = [...data.cuisine];

            // Nếu ô nhập tay đang có chữ mà khách quên nhấn "Thêm", ta tự thêm hộ luôn
            const manualInput = customCuisine.trim();
            if (manualInput && !finalCuisines.includes(manualInput)) {
                finalCuisines.push(manualInput);

                // Cập nhật lại state tổng để dữ liệu được lưu vào hồ sơ gửi đi
                setData(prev => ({ ...prev, cuisine: finalCuisines }));
                setCustomCuisine(''); // Xóa trắng ô nhập tay
            }

            // Bây giờ mới check: nếu sau khi đã "gom" cả hàng nhập tay mà vẫn trống thì mới báo lỗi
            if (finalCuisines.length === 0) {
                return alertWarning("Vui lòng chọn ít nhất 1 loại hình ẩm thực hoặc nhập tay vào ô!");
            }

            if (!data.openTime || !data.closeTime) return alertWarning("Vui lòng nhập giờ mở/đóng cửa!");
            if (!data.avatar) return alertWarning("Vui lòng tải lên ảnh mặt tiền quán!");
        }

        // Bước 4: Pháp lý
        if (step === 4) {
            if (!data.ownerName.trim()) return alertWarning("Vui lòng nhập họ tên chủ quán!");
            if (!data.idCard.trim()) return alertWarning("Vui lòng nhập số CCCD/CMND!");
            if (!data.idCardFront || !data.idCardBack) return alertWarning("Vui lòng tải lên ảnh 2 mặt CCCD!");
        }

        // Bước 5: Ngân hàng
        if (step === 5) {
            if (!data.bankName.trim()) return alertWarning("Vui lòng nhập tên ngân hàng!");
            if (!data.bankAccount.trim()) return alertWarning("Vui lòng nhập số tài khoản!");
            if (!data.bankOwner.trim()) return alertWarning("Vui lòng nhập tên chủ tài khoản!");
        }

        // Nếu qua hết các bài kiểm tra thì cho Next
        setStep(step + 1);
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const formData = new FormData();
            formData.append('userId', user.id || user._id);
            Object.keys(data).forEach(key => {
                if (key === 'cuisine') data.cuisine.forEach(c => formData.append('cuisine', c));
                else if (data[key] !== null) formData.append(key, data[key]);
            });
            await api.post('/pending/merchant', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            localStorage.removeItem('merchant_draft');
            const updatedUser = { ...user, approvalStatus: 'pending' };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (err) { alertWarning("Lỗi", err.message); }
        finally { setLoading(false); }
    };

    // Helper hiển thị ảnh preview
    const renderPreview = (file, label) => {
        // Check nếu là file PDF
        const isPdf = file?.type === 'application/pdf';

        return (
            <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
                {file ? (
                    isPdf ? (
                        // Nếu là PDF thì hiện Icon hoặc Box text
                        <div style={{
                            height: 80, borderRadius: 8, border: '1px solid #ddd',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '12px', color: '#F97350', fontWeight: 'bold'
                        }}>
                            <i className="fa-solid fa-file-pdf" style={{ marginRight: 5 }}></i> PDF File
                        </div>
                    ) : (
                        // Nếu là Ảnh thì hiện như cũ
                        <img src={URL.createObjectURL(file)} alt="Preview" style={{ height: 80, borderRadius: 8, border: '1px solid #ddd' }} />
                    )
                ) : (
                    <div style={{ fontSize: 12, color: 'red', fontStyle: 'italic' }}>Chưa tải lên</div>
                )}
            </div>
        );
    };

    const steps = ["Loại hình", "Thông tin", "Vận hành", "Pháp lý", "Ngân hàng", "Xác nhận"];

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: 50 }}>
            <Navbar />
            <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>

                {/* 1. THANH TIẾN TRÌNH - HIỆN ĐẠI HƠN */}
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
                            <i className="fa-solid fa-paper-plane"></i>
                        </div>
                        <h2 style={{ color: '#333' }}>Đã gửi hồ sơ thành công!</h2>
                        <p style={{ color: '#666', marginBottom: '30px' }}>Hệ thống HaFo sẽ phản hồi kết quả qua email của bạn trong vòng 24h-48h tới.</p>
                        <button className="btn primary" onClick={() => navigate('/')} style={{ padding: '12px 40px' }}>Về trang chủ</button>
                    </div>
                ) : (
                    <div className="panel" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: 'none' }}>
                        <div className="body" style={{ padding: '40px' }}>

                            {/* BƯỚC 1: CHỌN LOẠI HÌNH */}
                            {step === 1 && (
                                <div className="animate-pop-in">
                                    <h3 style={{ marginBottom: '25px', textAlign: 'center', color: '#F97350' }}>Bạn muốn kinh doanh gì trên HaFo?</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div onClick={() => setData({ ...data, serviceType: 'food' })} style={{
                                            padding: '30px', borderRadius: '20px', border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: '0.3s',
                                            borderColor: data.serviceType === 'food' ? '#F97350' : '#eee',
                                            background: data.serviceType === 'food' ? '#fff9f7' : '#fff'
                                        }}>
                                            <i className="fa-solid fa-utensils" style={{ fontSize: '40px', color: '#F97350', marginBottom: '15px' }}></i>
                                            <div style={{ fontWeight: '800', fontSize: '18px' }}>Giao đồ ăn</div>
                                            <p style={{ fontSize: '13px', color: '#777', marginTop: '8px' }}>Nhà hàng, Quán ăn, Cafe...</p>
                                        </div>
                                        <div onClick={() => setData({ ...data, serviceType: 'mart' })} style={{
                                            padding: '30px', borderRadius: '20px', border: '2px solid', cursor: 'pointer', textAlign: 'center', transition: '0.3s',
                                            borderColor: data.serviceType === 'mart' ? '#F97350' : '#eee',
                                            background: data.serviceType === 'mart' ? '#fff9f7' : '#fff'
                                        }}>
                                            <i className="fa-solid fa-basket-shopping" style={{ fontSize: '40px', color: '#F97350', marginBottom: '15px' }}></i>
                                            <div style={{ fontWeight: '800', fontSize: '18px' }}>Siêu thị & Mart</div>
                                            <p style={{ fontSize: '13px', color: '#777', marginTop: '8px' }}>Thực phẩm, Đồ gia dụng...</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BƯỚC 2: THÔNG TIN & MAP (KHÚC BẠN CẦN NHẤT) */}
                            {step === 2 && (
                                <div className="animate-pop-in">
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-circle-info"></i> Thông tin cơ bản</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                        <div><label style={LBL}>Tên quán đăng ký *</label><input className="f-input" name="name" value={data.name} onChange={handleChange} placeholder="VD: HaFo Coffee & Bakery" /></div>
                                        <div><label style={LBL}>Số điện thoại quán *</label><input className="f-input" name="phone" value={data.phone} onChange={handleChange} /></div>
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={LBL}>Địa chỉ chi tiết (Nhập chữ hoặc chấm trên Map) *</label>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                            <input className="f-input" name="address" value={data.address} onChange={handleChange} onBlur={handleSearchAddress} placeholder="Số nhà, tên đường, phường..." style={{ flex: 1 }} />
                                            <button className="btn soft" onClick={handleSearchAddress} disabled={isGeocoding}><i className="fa-solid fa-location-crosshairs"></i> Tìm</button>
                                        </div>

                                        {/* BẢN ĐỒ TÍCH HỢP */}
                                        <div style={{ height: '300px', borderRadius: '15px', overflow: 'hidden', border: '1px solid #ddd' }}>
                                            <MapContainer center={[data.lat, data.lng]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                <RecenterMap lat={data.lat} lng={data.lng} />
                                                <LocationMarker />
                                            </MapContainer>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div><label style={LBL}>Tỉnh / Thành phố</label>
                                            <select className="f-select" name="city" value={data.city} onChange={handleChange}>
                                                {cities.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div><label style={LBL}>Email nhận thông báo</label><input className="f-input" name="email" value={data.email} onChange={handleChange} /></div>
                                    </div>
                                </div>
                            )}

                            {/* BƯỚC 3, 4, 5, 6: Giữ logic cũ nhưng update UI field-group */}
                            {step === 3 && (
                                <div className="animate-pop-in">
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-circle-info"></i> Vận hành và thực đơn</h3>
                                    <label className="f-label">Loại hình ẩm thực (Chọn nhiều)</label>
                                    {/* 1. Vùng các option có sẵn */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 15 }}>
                                        {presets.map(c => (
                                            <div key={c} className={`check-card ${data.cuisine.includes(c) ? 'checked' : ''}`} onClick={() => handleCuisine(c)}>
                                                <input type="checkbox" checked={data.cuisine.includes(c)} readOnly /> {c}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 2. Ô nhập tay thêm loại hình mới */}
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <input
                                            className="f-input"
                                            placeholder="Nhập loại hình khác... (VD: Pizza, Đồ Hàn)"
                                            value={customCuisine}
                                            onChange={(e) => setCustomCuisine(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomCuisine();
                                                }
                                            }}
                                        />
                                        <button type="button" className="btn soft" onClick={handleAddCustomCuisine} style={{ whiteSpace: 'nowrap' }}>
                                            <i className="fa-solid fa-plus"></i> Thêm
                                        </button>
                                    </div>

                                    {/* 3. Hiển thị các loại hình nhập tay đã thêm (để dễ quản lý/xóa) */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                                        {data.cuisine.filter(c => !presets.includes(c)).map(c => (
                                            <div
                                                key={c}
                                                className="check-card checked"
                                                onClick={() => handleCuisine(c)}
                                                style={{ padding: '8px 12px', cursor: 'pointer' }}
                                                title="Bấm để xóa"
                                            >
                                                <i className="fa-solid fa-xmark" style={{ marginRight: 6, fontSize: 12 }}></i> {c}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Món đặc trưng (Signature)</label>
                                        <input className="f-input" name="signatureDish" value={data.signatureDish} onChange={handleChange} placeholder="VD: Cơm sườn bì chả" />
                                    </div>
                                    <div className="form-grid">
                                        <div className="f-group"><label className="f-label">Giờ mở cửa</label><input type="time" className="f-input" name="openTime" value={data.openTime} onChange={handleChange} /></div>
                                        <div className="f-group"><label className="f-label">Giờ đóng cửa</label><input type="time" className="f-input" name="closeTime" value={data.closeTime} onChange={handleChange} /></div>
                                    </div>
                                    <div className="form-grid">
                                        <div className="f-group">
                                            <label className="f-label">Khoảng giá trung bình</label>
                                            <select className="f-select" name="priceRange" value={data.priceRange} onChange={handleChange}>
                                                <option>Dưới 20.000đ</option>
                                                <option>20.000đ - 50.000đ</option>
                                                <option>50.000đ - 100.000đ</option>
                                                <option>Trên 100.000đ</option>
                                            </select>
                                        </div>
                                        <div className="f-group">
                                            <label className="f-label">Phí gửi xe</label>
                                            <input className="f-input" name="parkingFee" value={data.parkingFee} onChange={handleChange} />
                                        </div>
                                    </div>
                                    {/* UPLOAD ẢNH MẶT TIỀN (avatar) */}
                                    <div className="upload-box" style={{ position: 'relative', minHeight: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <input type="file" name="avatar" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }} />

                                        {data.avatar ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <img
                                                    src={URL.createObjectURL(data.avatar)}
                                                    alt="Preview"
                                                    style={{ maxWidth: '100%', maxHeight: '120px', borderRadius: '8px', marginBottom: '10px' }}
                                                />
                                                <div style={{ fontSize: '12px', color: '#22C55E' }}><i className="fa-solid fa-check"></i> {data.avatar.name}</div>
                                            </div>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 24, marginBottom: 10 }}></i>
                                                <div>Tải lên ảnh mặt tiền quán</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 4 && (
                                <div>
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-circle-info"></i> Thông tin pháp lý</h3>
                                    <div className="f-group">
                                        <label className="f-label">Họ tên chủ quán (trên CCCD)</label>
                                        <input className="f-input" name="ownerName" value={data.ownerName} onChange={handleChange} />
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Số CCCD / CMND</label>
                                        <input className="f-input" name="idCard" value={data.idCard} onChange={handleChange} />
                                    </div>
                                    <div className="form-grid">
                                        <div className="upload-box" style={{ position: 'relative', minHeight: '120px' }}>
                                            <input type="file" name="idCardFront" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }} />
                                            {data.idCardFront ? (
                                                <img src={URL.createObjectURL(data.idCardFront)} alt="CCCD Front" style={{ height: '80px', borderRadius: '5px' }} />
                                            ) : (
                                                <div>Mặt trước CCCD</div>
                                            )}
                                        </div>

                                        <div className="upload-box" style={{ position: 'relative', minHeight: '120px' }}>
                                            <input type="file" name="idCardBack" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }} />
                                            {data.idCardBack ? (
                                                <img src={URL.createObjectURL(data.idCardBack)} alt="CCCD Back" style={{ height: '80px', borderRadius: '5px' }} />
                                            ) : (
                                                <div>Mặt sau CCCD</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="upload-box" style={{ position: 'relative', marginTop: 20, minHeight: '120px' }}>
                                        <input type="file" name="businessLicense" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }} />
                                        {data.businessLicense ? (
                                            <div style={{ textAlign: 'center' }}>
                                                {data.businessLicense.type === 'application/pdf' ? (
                                                    <div style={{ color: '#F97350' }}><i className="fa-solid fa-file-pdf"></i> File PDF đã chọn</div>
                                                ) : (
                                                    <img src={URL.createObjectURL(data.businessLicense)} alt="License" style={{ height: '80px', borderRadius: '5px' }} />
                                                )}
                                                <div style={{ fontSize: '12px' }}>{data.businessLicense.name}</div>
                                            </div>
                                        ) : (
                                            <div>Giấy phép kinh doanh (nếu có)</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {step === 5 && (
                                <div>
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-circle-info"></i> Thông tin ngân hàng</h3>
                                    <div className="f-group"><label className="f-label">Tên Ngân hàng</label>
                                        <select className="f-select" name="bankName" value={data.bankName} onChange={handleChange}>
                                            <option value="">Chọn ngân hàng</option>
                                            {banks.map(bank => (
                                                <option key={bank} value={bank}>{bank}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="f-group"><label className="f-label">Chi nhánh</label><input className="f-input" name="bankBranch" value={data.bankBranch} onChange={handleChange} /></div>
                                    <div className="form-grid">
                                        <div className="f-group"><label className="f-label">Số tài khoản</label><input className="f-input" name="bankAccount" value={data.bankAccount} onChange={handleChange} /></div>
                                        <div className="f-group"><label className="f-label">Tên chủ tài khoản</label><input className="f-input" name="bankOwner" value={data.bankOwner} onChange={handleChange} placeholder="VIET HOA KHONG DAU" /></div>
                                    </div>
                                </div>
                            )}

                            {step === 6 && (
                                <div>
                                    <h3 style={{ marginBottom: '25px', color: '#F97350' }}><i className="fa-solid fa-circle-info"></i> Xác nhận thông tin</h3>

                                    <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: 12, border: '1px solid #eee', fontSize: 14 }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 10px', color: '#F97350' }}>1. Thông tin quán</h4>
                                                <p><b>Tên quán:</b> {data.name}</p>
                                                <p><b>SĐT:</b> {data.phone}</p>
                                                <p><b>Email:</b> {data.email}</p>
                                                <p><b>Địa chỉ:</b> {data.address}</p>
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 10px', color: '#F97350' }}>2. Vận hành</h4>
                                                <p><b>Loại hình:</b> {data.cuisine.join(', ')}</p>
                                                <p><b>Giờ hoạt động:</b> {data.openTime} - {data.closeTime}</p>
                                                <p><b>Mức giá:</b> {data.priceRange}</p>
                                                <p><b>Món Signature:</b> {data.signatureDish}</p>
                                            </div>
                                        </div>
                                        <div style={{ height: 1, background: '#ddd', margin: '15px 0' }}></div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 10px', color: '#F97350' }}>3. Chủ sở hữu</h4>
                                                <p><b>Họ tên:</b> {data.ownerName}</p>
                                                <p><b>CCCD:</b> {data.idCard}</p>
                                                <p><b>Ngân hàng:</b> {data.bankName}</p>
                                                <p><b>STK:</b> {data.bankAccount} ({data.bankOwner})</p>
                                            </div>
                                            <div>
                                                <h4 style={{ margin: '0 0 10px', color: '#F97350' }}>4. Hồ sơ ảnh</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                                    {renderPreview(data.avatar, "Mặt tiền")}
                                                    {renderPreview(data.idCardFront, "CCCD Trước")}
                                                    {renderPreview(data.idCardBack, "CCCD Sau")}
                                                    {renderPreview(data.businessLicense, "GPKD")}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'center', margin: '20px 0', fontSize: 13, color: '#666' }}>
                                        Bằng việc nhấn "Gửi hồ sơ", bạn cam kết các thông tin trên là chính xác.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* NÚT ĐIỀU HƯỚNG */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 40px', borderTop: '1px solid #eee', background: '#fafafa' }}>
                            {step > 1 && <button className="btn soft" onClick={() => setStep(step - 1)} disabled={loading}>Quay lại</button>}
                            <div style={{ marginLeft: 'auto' }}>
                                {step < 6 ? (
                                    <button className="btn primary" onClick={handleNext} style={{ padding: '10px 40px' }}>Tiếp theo <i className="fa-solid fa-arrow-right"></i></button>
                                ) : (
                                    <button className="btn primary" onClick={handleSubmit} disabled={loading} style={{ padding: '10px 40px' }}>
                                        {loading ? 'Đang xử lý...' : 'Xác nhận & Gửi hồ sơ'}
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

const LBL = { display: 'block', fontWeight: '800', fontSize: '13px', color: '#555', marginBottom: '8px' };

export default MerchantRegister;