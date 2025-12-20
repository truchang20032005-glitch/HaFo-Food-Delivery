import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';

function MerchantRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const [data, setData] = useState({
        serviceType: 'food',
        name: '', phone: '', email: '', city: 'TP. Hồ Chí Minh', district: '', address: '',
        cuisine: [], signatureDish: '',
        openTime: '07:00', closeTime: '22:00', priceRange: '20.000đ - 50.000đ', parkingFee: 'Miễn phí',
        ownerName: '', idCard: '',
        bankName: '', bankAccount: '', bankOwner: '', bankBranch: ''
    });

    const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

    // Xử lý chọn nhiều loại ẩm thực
    const handleCuisine = (val) => {
        const current = data.cuisine.includes(val)
            ? data.cuisine.filter(c => c !== val)
            : [...data.cuisine, val];
        setData({ ...data, cuisine: current });
    };

    const handleSubmit = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return alert("Vui lòng đăng nhập!");

            await axios.post('http://localhost:5000/api/pending/merchant', {
                ...data,
                userId: user.id
            });
            alert("Gửi hồ sơ thành công! Vui lòng chờ duyệt.");
            navigate('/');
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    const steps = ["Loại hình", "Thông tin", "Vận hành", "Pháp lý", "Ngân hàng", "Gửi"];

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
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

                {/* 2. NỘI DUNG FORM */}
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
                            <div className="form-grid">
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
                                    <select className="f-select" name="city" value={data.city} onChange={handleChange}>
                                        <option>TP. Hồ Chí Minh</option>
                                        <option>Hà Nội</option>
                                        <option>Đà Nẵng</option>
                                    </select>
                                </div>
                                <div className="f-group">
                                    <label className="f-label">Quận/Huyện</label>
                                    <input className="f-input" name="district" value={data.district} onChange={handleChange} />
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
                            <div className="upload-box">
                                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: 24, marginBottom: 10 }}></i>
                                <div>Tải lên ảnh mặt tiền quán</div>
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
                                <div className="upload-box">Mặt trước CCCD</div>
                                <div className="upload-box">Mặt sau CCCD</div>
                            </div>
                            <div className="upload-box" style={{ marginTop: 20 }}>Giấy phép kinh doanh (nếu có)</div>
                        </div>
                    )}

                    {step === 5 && (
                        <div>
                            <div className="form-title">Bước 5: Tài khoản ngân hàng (Nhận doanh thu)</div>
                            <div className="f-group"><label className="f-label">Tên Ngân hàng</label><input className="f-input" name="bankName" value={data.bankName} onChange={handleChange} placeholder="VD: MB Bank, Vietcombank" /></div>
                            <div className="f-group"><label className="f-label">Chi nhánh</label><input className="f-input" name="bankBranch" value={data.bankBranch} onChange={handleChange} /></div>
                            <div className="form-grid">
                                <div className="f-group"><label className="f-label">Số tài khoản</label><input className="f-input" name="bankAccount" value={data.bankAccount} onChange={handleChange} /></div>
                                <div className="f-group"><label className="f-label">Tên chủ tài khoản</label><input className="f-input" name="bankOwner" value={data.bankOwner} onChange={handleChange} placeholder="VIET HOA KHONG DAU" /></div>
                            </div>
                        </div>
                    )}

                    {step === 6 && (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 60, color: '#22C55E', marginBottom: 20 }}><i className="fa-solid fa-file-contract"></i></div>
                            <h3>Xác nhận thông tin</h3>
                            <p style={{ marginBottom: 30, color: '#666' }}>Vui lòng kiểm tra kỹ các thông tin trước khi gửi. Hồ sơ sẽ được duyệt trong 1-3 ngày làm việc.</p>

                            <div style={{ textAlign: 'left', background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px dashed #ccc' }}>
                                <div style={{ marginBottom: 8 }}><b>Tên quán:</b> {data.name}</div>
                                <div style={{ marginBottom: 8 }}><b>Địa chỉ:</b> {data.address}, {data.district}, {data.city}</div>
                                <div style={{ marginBottom: 8 }}><b>SĐT:</b> {data.phone}</div>
                                <div style={{ marginBottom: 8 }}><b>Chủ quán:</b> {data.ownerName} ({data.idCard})</div>
                                <div><b>Ngân hàng:</b> {data.bankName} - {data.bankAccount}</div>
                            </div>
                        </div>
                    )}

                    {/* ACTIONS */}
                    <div className="form-actions">
                        {step > 1 && <button className="btn soft" onClick={() => setStep(step - 1)}>Quay lại</button>}
                        <div style={{ marginLeft: 'auto' }}>
                            {step < 6 && <button className="btn primary" onClick={() => setStep(step + 1)}>Tiếp tục</button>}
                            {step === 6 && <button className="btn primary" onClick={handleSubmit}>Gửi hồ sơ đăng ký</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MerchantRegister;