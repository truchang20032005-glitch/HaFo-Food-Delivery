import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';

function ShipperRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const [data, setData] = useState({
        fullName: '', phone: '', email: '', dob: '', city: 'TP. Hồ Chí Minh', district: '', address: '',
        vehicleType: 'Xe máy', licensePlate: '', driverLicense: '',
        bankName: '', bankAccount: '', bankOwner: '', bankBranch: '',
        area: '', workTime: 'Toàn thời gian'
    });

    const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return alert("Vui lòng đăng nhập!");

            await axios.post('http://localhost:5000/api/pending/shipper', {
                ...data,
                userId: user.id
            });
            alert("Gửi hồ sơ Shipper thành công! Vui lòng chờ duyệt.");
            navigate('/');
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    const steps = ["Cá nhân", "Phương tiện", "Giấy tờ", "Ngân hàng", "Hoạt động", "Gửi"];

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
                                <div className="f-group"><label className="f-label">Tỉnh/Thành phố</label><input className="f-input" name="city" value={data.city} onChange={handleChange} /></div>
                                <div className="f-group"><label className="f-label">Quận/Huyện</label><input className="f-input" name="district" value={data.district} onChange={handleChange} /></div>
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
                            <div className="upload-box">Chụp ảnh Cà vẹt xe</div>
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
                                <div className="upload-box">Mặt trước CCCD</div>
                                <div className="upload-box">Mặt sau CCCD</div>
                            </div>
                            <div className="upload-box" style={{ marginTop: 15 }}>Ảnh bằng lái xe (Mặt trước)</div>
                            <div className="upload-box" style={{ marginTop: 15 }}>Ảnh chân dung (Selfie)</div>
                        </div>
                    )}

                    {/* BƯỚC 4: NGÂN HÀNG */}
                    {step === 4 && (
                        <div>
                            <div className="form-title">Bước 4: Tài khoản nhận thu nhập</div>
                            <div className="f-group"><label className="f-label">Ngân hàng</label><input className="f-input" name="bankName" value={data.bankName} onChange={handleChange} /></div>
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
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 60, color: '#22C55E', marginBottom: 20 }}><i className="fa-solid fa-file-shield"></i></div>
                            <h3>Cam kết & Gửi hồ sơ</h3>
                            <p style={{ marginBottom: 20 }}>Tôi cam kết các thông tin trên là sự thật và chịu trách nhiệm trước pháp luật.</p>

                            <div style={{ textAlign: 'left', background: '#f9f9f9', padding: 20, borderRadius: 12, border: '1px dashed #ccc' }}>
                                <div><b>Tài xế:</b> {data.fullName}</div>
                                <div><b>SĐT:</b> {data.phone}</div>
                                <div><b>Xe:</b> {data.vehicleType} - {data.licensePlate}</div>
                                <div><b>Khu vực:</b> {data.area}</div>
                                <div><b>Ngân hàng:</b> {data.bankName} - {data.bankAccount}</div>
                            </div>
                        </div>
                    )}

                    <div className="form-actions">
                        {step > 1 && <button className="btn soft" onClick={() => setStep(step - 1)}>Quay lại</button>}
                        <div style={{ marginLeft: 'auto' }}>
                            {step < 6 && <button className="btn primary" onClick={() => setStep(step + 1)}>Tiếp tục</button>}
                            {step === 6 && <button className="btn primary" onClick={handleSubmit}>Gửi hồ sơ</button>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShipperRegister;