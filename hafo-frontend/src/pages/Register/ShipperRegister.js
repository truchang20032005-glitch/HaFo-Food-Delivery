import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

function ShipperRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);
    const [cities, setCities] = useState([]);

    const [data, setData] = useState(() => {
        const savedData = localStorage.getItem('shipper_draft');
        return savedData ? JSON.parse(savedData) : {
            fullName: '', phone: '', email: '', dob: '', address: '',
            vehicleType: 'Xe máy', licensePlate: '', driverLicense: '',
            bankName: '', bankAccount: '', bankOwner: '',

            // SỬA TÊN BIẾN CHO KHỚP
            avatar: null,
            vehicleRegImage: null,
            licenseImage: null,
            cccdFront: null,
            cccdBack: null
        }
    });

    // Tự động lưu nháp mỗi khi nhập liệu (trừ file ảnh)
    useEffect(() => {
        const dataToSave = { ...data, avatar: null, idCardFront: null, idCardBack: null, businessLicense: null };
        localStorage.setItem('merchant_draft', JSON.stringify(dataToSave));
    }, [data]);

    // Kiểm tra User & Trạng thái duyệt khi vào trang
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            alert("Vui lòng đăng nhập!");
            navigate('/');
            return;
        }
        // Nếu đã nộp đơn rồi (pending) -> Chuyển sang trang thông báo
        if (user.approvalStatus === 'pending') {
            navigate('/pending-approval');
        }

        // Lấy cities
        //axios.get('http://localhost:5000/api/cities').then(res => setCities(res.data)).catch(() => { });
        api.get('/cities')
            .then(res => setCities(res.data)).catch(() => { });
    }, [navigate]);

    const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

    const handleCityChange = (e) => {
        const selectedCity = e.target.value;
        const cityData = cities.find(city => city.name === selectedCity);
        setData({ ...data, city: selectedCity, district: cityData ? cityData.districts[0] : '' });
    };

    const handleDistrictChange = (e) => setData({ ...data, district: e.target.value });

    // Xử lý chọn file ảnh (MỚI)
    const handleFileChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        // 1. Kiểm tra định dạng (Chỉ cho ảnh và PDF)
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            alert("❌ Định dạng sai! Chỉ chấp nhận file ảnh (JPG, PNG) hoặc PDF.");
            e.target.value = ''; // Reset ô input
            return;
        }

        // 2. Kiểm tra dung lượng (Ví dụ: Tối đa 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert("❌ File quá lớn! Vui lòng chọn file dưới 5MB.");
            e.target.value = ''; // Reset ô input
            return;
        }

        // Nếu OK thì lưu vào state
        setData(prevData => ({ ...prevData, [e.target.name]: file }));
    };

    // --- HÀM KIỂM TRA DỮ LIỆU ---
    const handleNext = () => {
        if (step === 1) { // Cá nhân
            if (!data.fullName || !data.phone || !data.dob || !data.address) return alert("Vui lòng điền đủ thông tin cá nhân!");
            // Validate SDT
            const phoneRegex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/;
            if (!phoneRegex.test(data.phone)) return alert("Số điện thoại không hợp lệ (Phải có 10 số, bắt đầu bằng 0)!");
            // Validate Email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) return alert("Địa chỉ Email không hợp lệ!");

            if (!data.avatar) return alert("Vui lòng tải ảnh chân dung!");
        }
        if (step === 2) { // Phương tiện
            if (!data.licensePlate) return alert("Vui lòng nhập biển số xe!");
            if (!data.vehicleRegImage) return alert("Vui lòng tải ảnh Cà vẹt xe!");
        }
        if (step === 3) { // Giấy tờ
            if (!data.driverLicense) return alert("Vui lòng nhập số bằng lái!");
            if (!data.licenseImage) return alert("Vui lòng tải ảnh bằng lái!");
            if (!data.idCardFront || !data.idCardBack) return alert("Vui lòng tải đủ 2 mặt CCCD!");
        }
        if (step === 4) { // Ngân hàng
            if (!data.bankName || !data.bankAccount || !data.bankOwner) return alert("Vui lòng nhập thông tin ngân hàng!");
        }

        setStep(step + 1);
    };

    const handleSubmit = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return alert("Vui lòng đăng nhập!");

            /*await axios.post('http://localhost:5000/api/pending/shipper', {
                ...data,
                userId: user.id
            });*/
            await api.post('/pending/shipper', {
                ...data,
                userId: user.id
            });
            // Xóa bản nháp sau khi gửi thành công
            localStorage.removeItem('merchant_draft');

            // Cập nhật trạng thái user ở localStorage để chuyển trang
            const updatedUser = { ...user, approvalStatus: 'pending' };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert("Gửi hồ sơ Shipper thành công! Vui lòng chờ duyệt.");
            navigate('/');
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    const steps = ["Cá nhân", "Phương tiện", "Giấy tờ", "Ngân hàng", "Hoạt động", "Gửi"];

    // Danh sách ngân hàng
    const banks = [
        "Vietcombank", "VietinBank", "MB Bank", "BIDV", "Sacombank", "Techcombank",
        "ACB", "Eximbank", "SHB", "OceanBank", "TPBank", "VPBank", "HDBank", "SeABank"
    ];

    const renderPreview = (file, label) => (
        <div style={{ marginBottom: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{label}</div>
            {file ? <img src={URL.createObjectURL(file)} alt="Preview" style={{ height: 70, borderRadius: 6, border: '1px solid #ddd' }} /> : <div style={{ fontSize: 11, color: '#d00' }}>Thiếu</div>}
        </div>
    );

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar />
            <div className="wizard-container">
                <div className="steps-header">
                    {steps.map((label, idx) => (
                        <div key={idx} className={`step-node ${step === idx + 1 ? 'active' : (step > idx + 1 ? 'done' : '')}`}>
                            <div className="step-num">{idx + 1}</div>
                            <div className="step-name">{label}</div>
                        </div>
                    ))}
                </div>

                {isSuccess ? (
                    <div className="form-card" style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-circle-check" style={{ fontSize: 60, color: '#22C55E', marginBottom: 20 }}></i>
                        <h2>Gửi hồ sơ Shipper thành công!</h2>
                        <button className="btn primary" onClick={() => navigate('/')}>Về trang chủ</button>
                    </div>
                ) : (

                    <div className="form-card">
                        {/* BƯỚC 1: CÁ NHÂN */}
                        {step === 1 && (
                            <div>
                                <div className="form-title">Bước 1: Thông tin cá nhân</div>
                                <div className="form-grid">
                                    <div className="f-group"><label className="f-label">Họ và tên</label><input className="f-input" name="fullName" value={data.fullName} onChange={handleChange} /></div>
                                    <div className="f-group"><label className="f-label">Ngày sinh</label><input type="date" className="f-input" name="dob" value={data.dob} onChange={handleChange} /></div>
                                </div>
                                <div className="form-grid">
                                    <div className="f-group"><label className="f-label">Số điện thoại</label><input className="f-input" name="phone" value={data.phone} onChange={handleChange} /></div>
                                    <div className="f-group"><label className="f-label">Email</label><input className="f-input" name="email" value={data.email} onChange={handleChange} /></div>
                                </div>
                                <div className="f-group"><label className="f-label">Địa chỉ thường trú</label><input className="f-input" name="address" value={data.address} onChange={handleChange} /></div>
                                <div className="form-grid">
                                    <div className="f-group">
                                        <label className="f-label">Thành phố</label>
                                        <select className="f-select" name="city" value={data.city} onChange={handleCityChange}>
                                            {cities.map(city => (
                                                <option key={city.name} value={city.name}>{city.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Quận/Huyện</label>
                                        <select className="f-select" name="district" value={data.district} onChange={handleDistrictChange}>
                                            {cities.find(city => city.name === data.city)?.districts.map(district => (
                                                <option key={district} value={district}>{district}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BƯỚC 2: PHƯƠNG TIỆN */}
                        {step === 2 && (
                            <div>
                                <div className="form-title">Bước 2: Thông tin phương tiện</div>
                                <label className="f-label">Loại xe đăng ký</label>
                                <div style={{ display: 'flex', gap: 15, marginBottom: 20 }}>
                                    <div className={`check-card ${data.vehicleType === 'Xe máy' ? 'checked' : ''}`} onClick={() => setData({ ...data, vehicleType: 'Xe máy' })}>
                                        <input type="radio" checked={data.vehicleType === 'Xe máy'} readOnly /> <b>Xe máy</b>
                                    </div>
                                    <div className={`check-card ${data.vehicleType === 'Xe điện' ? 'checked' : ''}`} onClick={() => setData({ ...data, vehicleType: 'Xe điện' })}>
                                        <input type="radio" checked={data.vehicleType === 'Xe điện'} readOnly /> <b>Xe điện</b>
                                    </div>
                                </div>
                                <div className="f-group"><label className="f-label">Biển số xe</label><input className="f-input" name="licensePlate" value={data.licensePlate} onChange={handleChange} placeholder="VD: 59-X1 123.45" /></div>
                                <div className="upload-box" style={{ position: 'relative' }}>
                                    <input type="file" name="vehicleRegImage" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 24, marginBottom: 10 }}></i>
                                    <div>{data.vehicleRegImage ? data.vehicleRegImage.name : "Ảnh cà vẹt xe"}</div>
                                </div>
                            </div>
                        )}

                        {/* BƯỚC 3: GIẤY TỜ */}
                        {step === 3 && (
                            <div>
                                <div className="form-title">Bước 3: Giấy tờ tùy thân & Bằng lái</div>
                                <div className="form-grid">
                                    <div className="f-group"><label className="f-label">Số CCCD / CMND</label><input className="f-input" /></div>
                                    <div className="f-group"><label className="f-label">Số Giấy phép lái xe</label><input className="f-input" name="driverLicense" value={data.driverLicense} onChange={handleChange} /></div>
                                </div>
                                <div className="form-grid">
                                    <div className="upload-box" style={{ position: 'relative' }}>
                                        <input type="file" name="cccdFront" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        <div>{data.cccdFront ? data.cccdFront.name : "Mặt trước CCCD"}</div>
                                    </div>
                                    <div className="upload-box" style={{ position: 'relative' }}>
                                        <input type="file" name="cccdBack" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        <div>{data.cccdBack ? data.cccdBack.name : "Mặt sau CCCD"}</div>
                                    </div>
                                </div>
                                <div className="upload-box" style={{ position: 'relative', marginTop: 15 }}>
                                    <input type="file" name="licenseImage" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 24, marginBottom: 10 }}></i>
                                    <div>{data.licenseImage ? data.licenseImage.name : "Ảnh bằng lái xe"}</div>
                                </div>
                                <div className="upload-box" style={{ position: 'relative', marginTop: 15 }}>
                                    <input type="file" name="avatar" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 24, marginBottom: 10 }}></i>
                                    <div>{data.avatar ? data.avatar.name : "Ảnh chân dung"}</div>
                                </div>
                            </div>
                        )}

                        {/* BƯỚC 4: NGÂN HÀNG */}
                        {step === 4 && (
                            <div>
                                <div className="form-title">Bước 4: Tài khoản nhận thu nhập</div>
                                <div className="f-group"><label className="f-label">Ngân hàng</label>
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
                                    <div className="f-group"><label className="f-label">Tên chủ thẻ</label><input className="f-input" name="bankOwner" value={data.bankOwner} onChange={handleChange} /></div>
                                </div>
                            </div>
                        )}

                        {/* BƯỚC 5: HOẠT ĐỘNG */}
                        {step === 5 && (
                            <div>
                                <div className="form-title">Bước 5: Khu vực & Thời gian</div>
                                <div className="f-group">
                                    <label className="f-label">Khu vực hoạt động mong muốn</label>
                                    <input className="f-input" name="area" value={data.area} onChange={handleChange} placeholder="VD: Quận 1, Quận 3..." />
                                </div>
                                <label className="f-label">Hình thức đăng ký</label>
                                <div style={{ display: 'flex', gap: 15 }}>
                                    <div className={`check-card ${data.workTime === 'Toàn thời gian' ? 'checked' : ''}`} onClick={() => setData({ ...data, workTime: 'Toàn thời gian' })}>
                                        <input type="radio" checked={data.workTime === 'Toàn thời gian'} readOnly /> <b>Toàn thời gian</b>
                                    </div>
                                    <div className={`check-card ${data.workTime === 'Bán thời gian' ? 'checked' : ''}`} onClick={() => setData({ ...data, workTime: 'Bán thời gian' })}>
                                        <input type="radio" checked={data.workTime === 'Bán thời gian'} readOnly /> <b>Bán thời gian</b>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* BƯỚC 6: GỬI */}
                        {step === 6 && (
                            <div>
                                <div className="form-title" style={{ borderBottom: 'none', textAlign: 'center', color: '#22C55E' }}>
                                    <i className="fa-solid fa-id-card-clip" style={{ fontSize: 40, marginBottom: 10 }}></i><br />
                                    Kiểm tra hồ sơ Shipper
                                </div>

                                <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: 12, border: '1px solid #eee', fontSize: 14 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 10px', color: '#F97350' }}>1. Cá nhân</h4>
                                            <p><b>Họ tên:</b> {data.fullName}</p>
                                            <p><b>SĐT:</b> {data.phone}</p>
                                            <p><b>Email:</b> {data.email}</p>
                                            <p><b>Địa chỉ:</b> {data.address}</p>
                                        </div>
                                        <div>
                                            <h4 style={{ margin: '0 0 10px', color: '#F97350' }}>2. Phương tiện</h4>
                                            <p><b>Loại xe:</b> {data.vehicleType}</p>
                                            <p><b>Biển số:</b> {data.licensePlate}</p>
                                            <p><b>Bằng lái:</b> {data.driverLicense}</p>
                                            <p><b>Ngân hàng:</b> {data.bankName} - {data.bankAccount}</p>
                                        </div>
                                    </div>
                                    <div style={{ height: 1, background: '#ddd', margin: '15px 0' }}></div>
                                    <div>
                                        <h4 style={{ margin: '0 0 10px', color: '#F97350' }}>3. Hồ sơ ảnh</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                            {renderPreview(data.avatar, "Chân dung")}
                                            {renderPreview(data.vehicleRegImage, "Cà vẹt")}
                                            {renderPreview(data.licenseImage, "Bằng lái")}
                                            {renderPreview(data.cccdFront, "CCCD Trước")}
                                            {renderPreview(data.cccdBack, "CCCD Sau")}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                    <button className="btn primary" onClick={handleSubmit} style={{ padding: '12px 30px', fontSize: 16 }}>Xác nhận & Gửi</button>
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            {step > 1 && <button className="btn soft" onClick={() => setStep(step - 1)}>Quay lại</button>}
                            <div style={{ marginLeft: 'auto' }}>
                                {step < 6 && <button className="btn primary" onClick={handleNext}>Tiếp tục</button>}
                                {step === 6 && <button className="btn primary" onClick={handleSubmit}>Gửi hồ sơ</button>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShipperRegister;