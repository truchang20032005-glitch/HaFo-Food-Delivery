import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';

function MerchantRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);

    // State dữ liệu
    const [data, setData] = useState({
        serviceType: 'food',
        name: '', phone: '', email: '', city: 'TP. Hồ Chí Minh', district: '', address: '',
        cuisine: [], signatureDish: '',
        openTime: '07:00', closeTime: '22:00', priceRange: '20.000đ - 50.000đ', parkingFee: 'Miễn phí',

        ownerName: '', idCard: '',
        bankName: '', bankAccount: '', bankOwner: '', bankBranch: '',

        // FILE ẢNH (Khởi tạo null) - Tên biến khớp với Backend
        avatar: null,
        idCardFront: null,
        idCardBack: null,
        businessLicense: null
    });

    const [cities, setCities] = useState([]);

    // Xử lý nhập text
    const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

    // Xử lý chọn file ảnh (ĐÃ SỬA LỖI GHI ĐÈ)
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

    // Xử lý chọn nhiều loại ẩm thực
    const handleCuisine = (val) => {
        const current = data.cuisine.includes(val)
            ? data.cuisine.filter(c => c !== val)
            : [...data.cuisine, val];
        setData({ ...data, cuisine: current });
    };

    // Lấy dữ liệu thành phố và quận/huyện từ API
    useEffect(() => {
        axios.get('http://localhost:5000/api/cities')
            .then(response => setCities(response.data))
            .catch(error => console.error('Error fetching cities:', error));
    }, []);

    const handleCityChange = (e) => {
        const selectedCity = e.target.value;
        const cityData = cities.find(city => city.name === selectedCity);
        setData({ ...data, city: selectedCity, district: cityData ? cityData.districts[0] : '' });
    };

    const handleDistrictChange = (e) => setData({ ...data, district: e.target.value });

    // Danh sách ngân hàng
    const banks = [
        "Vietcombank", "VietinBank", "MB Bank", "BIDV", "Sacombank", "Techcombank",
        "ACB", "Eximbank", "SHB", "OceanBank", "TPBank", "VPBank", "HDBank", "SeABank"
    ];

    // --- HÀM KIỂM TRA DỮ LIỆU TRƯỚC KHI NEXT (MỚI) ---
    const handleNext = () => {
        // Bước 1: Loại hình
        if (step === 1) {
            if (!data.serviceType) return alert("Vui lòng chọn loại hình kinh doanh!");
        }

        // Bước 2: Thông tin cơ bản
        if (step === 2) {
            if (!data.name.trim()) return alert("Vui lòng nhập tên quán!");

            // Validate SDT
            if (!data.phone.trim()) return alert("Vui lòng nhập số điện thoại!");
            const phoneRegex = /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/;
            if (!phoneRegex.test(data.phone)) return alert("Số điện thoại không hợp lệ (Phải có 10 số, bắt đầu bằng 0)!");

            // Validate Email
            if (!data.email.trim()) return alert("Vui lòng nhập Email!");
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email)) return alert("Địa chỉ Email không hợp lệ!");

            if (!data.address.trim()) return alert("Vui lòng nhập địa chỉ!");
            if (!data.city || !data.district) return alert("Vui lòng chọn Tỉnh/Thành và Quận/Huyện!");
        }

        // Bước 3: Vận hành
        if (step === 3) {
            if (data.cuisine.length === 0) return alert("Vui lòng chọn ít nhất 1 loại hình ẩm thực!");
            if (!data.openTime || !data.closeTime) return alert("Vui lòng nhập giờ mở/đóng cửa!");
            if (!data.avatar) return alert("Vui lòng tải lên ảnh mặt tiền quán!");
        }

        // Bước 4: Pháp lý
        if (step === 4) {
            if (!data.ownerName.trim()) return alert("Vui lòng nhập họ tên chủ quán!");
            if (!data.idCard.trim()) return alert("Vui lòng nhập số CCCD/CMND!");
            if (!data.idCardFront || !data.idCardBack) return alert("Vui lòng tải lên ảnh 2 mặt CCCD!");
        }

        // Bước 5: Ngân hàng
        if (step === 5) {
            if (!data.bankName.trim()) return alert("Vui lòng nhập tên ngân hàng!");
            if (!data.bankAccount.trim()) return alert("Vui lòng nhập số tài khoản!");
            if (!data.bankOwner.trim()) return alert("Vui lòng nhập tên chủ tài khoản!");
        }

        // Nếu qua hết các bài kiểm tra thì cho Next
        setStep(step + 1);
    };

    // Gửi form
    const handleSubmit = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return alert("Vui lòng đăng nhập!");

            // Tạo FormData để gửi file
            const formData = new FormData();
            formData.append('userId', user.id);

            // Duyệt qua state data để append vào formData
            Object.keys(data).forEach(key => {
                if (key === 'cuisine') {
                    // Mảng cần append từng phần tử
                    data.cuisine.forEach(c => formData.append('cuisine', c));
                } else if (data[key] !== null) {
                    formData.append(key, data[key]);
                }
            });

            // Gửi API
            await axios.post('http://localhost:5000/api/pending/merchant', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.error || err.message));
        }
    };

    const steps = ["Loại hình", "Thông tin", "Vận hành", "Pháp lý", "Ngân hàng", "Gửi"];

    // Helper hiển thị ảnh preview
    const renderPreview = (file, label) => (
        <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</div>
            {file ? (
                <img src={URL.createObjectURL(file)} alt="Preview" style={{ height: 80, borderRadius: 8, border: '1px solid #ddd' }} />
            ) : (
                <div style={{ fontSize: 12, color: 'red', fontStyle: 'italic' }}>Chưa tải lên</div>
            )}
        </div>
    );

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: 50 }}>
            <Navbar />
            <div className="wizard-container">
                {/* 1. THANH TIẾN TRÌNH */}
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
                        <h2>Gửi hồ sơ thành công!</h2>
                        <p>Vui lòng chờ Admin xét duyệt.</p>
                        <button className="btn primary" onClick={() => navigate('/')}>Về trang chủ</button>
                    </div>
                ) : (
                    <div className="form-card">
                        {step === 1 && (
                            <div>
                                <div className="form-title">Bước 1: Chọn loại hình kinh doanh</div>
                                <div className={`check-card ${data.serviceType === 'food' ? 'checked' : ''}`} onClick={() => setData({ ...data, serviceType: 'food' })}>
                                    <input type="radio" checked={data.serviceType === 'food'} readOnly />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>Giao đồ ăn (Food Delivery)</div>
                                        <div style={{ fontSize: 13, color: '#666' }}>Nhà hàng, quán ăn, cafe, trà sữa...</div>
                                    </div>
                                </div>
                                <div className={`check-card ${data.serviceType === 'mart' ? 'checked' : ''}`} onClick={() => setData({ ...data, serviceType: 'mart' })}>
                                    <input type="radio" checked={data.serviceType === 'mart'} readOnly />
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>Giao thực phẩm (Mart)</div>
                                        <div style={{ fontSize: 13, color: '#666' }}>Siêu thị, cửa hàng tiện lợi, bách hóa...</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div>
                                <div className="form-title">Bước 2: Thông tin cơ bản</div>
                                <div className="f-grid">
                                    <div className="f-group">
                                        <label className="f-label">Tên nhà hàng/quán ăn *</label>
                                        <input className="f-input" name="name" value={data.name} onChange={handleChange} placeholder="VD: Cơm Tấm Sài Gòn" />
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Số điện thoại liên hệ *</label>
                                        <input className="f-input" name="phone" value={data.phone} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="f-group">
                                    <label className="f-label">Địa chỉ chính xác *</label>
                                    <input className="f-input" name="address" value={data.address} onChange={handleChange} placeholder="Số nhà, tên đường, phường/xã..." />
                                </div>
                                <div className="form-grid">
                                    <div className="f-group">
                                        <label className="f-label">Thành phố</label>
                                        <select className="f-select" name="city" value={data.city} onChange={handleCityChange}>
                                            <option value="">Chọn thành phố</option>
                                            {cities.map(city => (
                                                <option key={city.name} value={city.name}>{city.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="f-group">
                                        <label className="f-label">Quận/Huyện</label>
                                        <select className="f-select" name="district" value={data.district} onChange={handleDistrictChange}>
                                            <option value="">Chọn quận/huyện</option>
                                            {cities.find(city => city.name === data.city)?.districts.map(district => (
                                                <option key={district} value={district}>{district}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="f-group">
                                    <label className="f-label">Email nhận thông báo</label>
                                    <input className="f-input" name="email" value={data.email} onChange={handleChange} />
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div>
                                <div className="form-title">Bước 3: Vận hành & Thực đơn</div>
                                <label className="f-label">Loại hình ẩm thực (Chọn nhiều)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                                    {['Cơm', 'Bún/Phở', 'Đồ uống', 'Ăn vặt', 'Món Á', 'Món Âu', 'Chay', 'Bánh mì'].map(c => (
                                        <div key={c} className={`check-card ${data.cuisine.includes(c) ? 'checked' : ''}`} onClick={() => handleCuisine(c)}>
                                            <input type="checkbox" checked={data.cuisine.includes(c)} readOnly /> {c}
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
                                <div className="upload-box" style={{ position: 'relative' }}>
                                    <input type="file" name="avatar" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 24, marginBottom: 10 }}></i>
                                    <div>{data.avatar ? data.avatar.name : "Tải lên ảnh mặt tiền quán"}</div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div>
                                <div className="form-title">Bước 4: Thông tin pháp lý (Chủ sở hữu)</div>
                                <div className="f-group">
                                    <label className="f-label">Họ tên chủ quán (trên CCCD)</label>
                                    <input className="f-input" name="ownerName" value={data.ownerName} onChange={handleChange} />
                                </div>
                                <div className="f-group">
                                    <label className="f-label">Số CCCD / CMND</label>
                                    <input className="f-input" name="idCard" value={data.idCard} onChange={handleChange} />
                                </div>
                                <div className="form-grid">
                                    <div className="upload-box" style={{ position: 'relative' }}>
                                        <input type="file" name="idCardFront" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        <div>{data.idCardFront ? data.idCardFront.name : "Mặt trước CCCD"}</div>
                                    </div>
                                    <div className="upload-box" style={{ position: 'relative' }}>
                                        <input type="file" name="idCardBack" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        <div>{data.idCardBack ? data.idCardBack.name : "Mặt sau CCCD"}</div>
                                    </div>
                                </div>
                                <div className="upload-box" style={{ position: 'relative', marginTop: 20 }}>
                                    <input type="file" name="businessLicense" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                    <div>{data.businessLicense ? data.businessLicense.name : "Giấy phép kinh doanh (nếu có)"}</div>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div>
                                <div className="form-title">Bước 5: Tài khoản ngân hàng (Nhận doanh thu)</div>
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
                                <div className="form-title" style={{ borderBottom: 'none', textAlign: 'center', color: '#22C55E' }}>
                                    <i className="fa-solid fa-clipboard-list" style={{ fontSize: 40, marginBottom: 10 }}></i><br />
                                    Xác nhận thông tin hồ sơ
                                </div>

                                <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: 12, border: '1px solid #eee', fontSize: 14 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 10px', color: '#F97350' }}>1. Thông tin quán</h4>
                                            <p><b>Tên quán:</b> {data.name}</p>
                                            <p><b>SĐT:</b> {data.phone}</p>
                                            <p><b>Email:</b> {data.email}</p>
                                            <p><b>Địa chỉ:</b> {data.address}, {data.district}, {data.city}</p>
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

                        {/* ACTIONS */}
                        <div className="form-actions">
                            {step > 1 && <button className="btn soft" onClick={() => setStep(step - 1)}>Quay lại</button>}
                            <div style={{ marginLeft: 'auto' }}>
                                {step < 6 && <button className="btn primary" onClick={handleNext}>Tiếp tục</button>}
                                {step === 6 && <button className="btn primary" onClick={handleSubmit}>Gửi hồ sơ đăng ký</button>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MerchantRegister;