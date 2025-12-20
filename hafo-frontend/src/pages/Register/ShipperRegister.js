import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';

function ShipperRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '', phone: '', email: '', dob: '', address: '',
        vehicleType: 'Xe máy', licensePlate: '', driverLicense: '',
        bankName: '', bankAccount: '', bankOwner: '',
        city: 'TP. Hồ Chí Minh', district: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return alert("Vui lòng đăng nhập trước!");

            await axios.post('http://localhost:5000/api/pending/shipper', {
                ...formData,
                userId: user.id
            });
            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    const steps = ["Điều kiện", "Cá nhân", "Xe & Giấy tờ", "Ngân hàng", "Gửi"];

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: 50 }}>
            <Navbar />
            <div className="hop" style={{ maxWidth: 900, marginTop: 30 }}>
                <div className="wizard-steps">
                    {steps.map((name, idx) => (
                        <div key={idx} className={`wizard-step ${step === idx + 1 ? 'active' : (step > idx + 1 ? 'done' : '')}`} onClick={() => step > idx + 1 && setStep(idx + 1)}>
                            <div className="num">{idx + 1}</div> {name}
                        </div>
                    ))}
                </div>

                {isSuccess ? (
                    <div className="wizard-body" style={{ textAlign: 'center', padding: 40 }}>
                        <i className="fa-solid fa-check-circle" style={{ fontSize: 60, color: 'green', marginBottom: 20 }}></i>
                        <h2>Đã gửi hồ sơ Shipper!</h2>
                        <p>Mã hồ sơ: <b>HF-SHP-{Math.floor(Math.random() * 10000)}</b>. Vui lòng chờ xét duyệt.</p>
                        <button className="btn primary" onClick={() => navigate('/')}>Về trang chủ</button>
                    </div>
                ) : (
                    <div className="wizard-body">
                        <div className="wizard-head">Đăng ký Shipper - Bước {step}</div>
                        <div className="wizard-content">
                            {/* BƯỚC 1: ĐIỀU KIỆN */}
                            {step === 1 && (
                                <div>
                                    <div className="wiz-note"><b>Yêu cầu cơ bản:</b><br />- Đủ 18 tuổi<br />- Có xe máy và bằng lái<br />- Điện thoại Android/iOS</div>
                                    <label className="sel-card active"><input type="checkbox" defaultChecked /> Tôi đã đọc và đáp ứng đủ điều kiện.</label>
                                </div>
                            )}

                            {/* BƯỚC 2: CÁ NHÂN */}
                            {step === 2 && (
                                <div className="wiz-grid">
                                    <div><label className="wiz-label">Họ và tên</label><input className="wiz-input" name="fullName" value={formData.fullName} onChange={handleChange} /></div>
                                    <div><label className="wiz-label">Số điện thoại</label><input className="wiz-input" name="phone" value={formData.phone} onChange={handleChange} /></div>
                                    <div><label className="wiz-label">Email</label><input className="wiz-input" name="email" value={formData.email} onChange={handleChange} /></div>
                                    <div><label className="wiz-label">Ngày sinh</label><input type="date" className="wiz-input" name="dob" value={formData.dob} onChange={handleChange} /></div>
                                </div>
                            )}

                            {/* BƯỚC 3: XE */}
                            {step === 3 && (
                                <div>
                                    <label className="wiz-label">Loại xe</label>
                                    <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                                        <div className={`sel-card ${formData.vehicleType === 'Xe máy' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, vehicleType: 'Xe máy' })} style={{ flex: 1 }}>Xe máy</div>
                                        <div className={`sel-card ${formData.vehicleType === 'Xe đạp' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, vehicleType: 'Xe đạp' })} style={{ flex: 1 }}>Xe đạp</div>
                                    </div>
                                    <div className="wiz-grid">
                                        <div><label className="wiz-label">Biển số xe</label><input className="wiz-input" name="licensePlate" value={formData.licensePlate} onChange={handleChange} /></div>
                                        <div><label className="wiz-label">Số bằng lái</label><input className="wiz-input" name="driverLicense" value={formData.driverLicense} onChange={handleChange} /></div>
                                    </div>
                                </div>
                            )}

                            {/* BƯỚC 4: NGÂN HÀNG */}
                            {step === 4 && (
                                <div className="wiz-grid">
                                    <div><label className="wiz-label">Ngân hàng</label><input className="wiz-input" name="bankName" value={formData.bankName} onChange={handleChange} /></div>
                                    <div><label className="wiz-label">Số tài khoản</label><input className="wiz-input" name="bankAccount" value={formData.bankAccount} onChange={handleChange} /></div>
                                </div>
                            )}

                            {/* BƯỚC 5: GỬI */}
                            {step === 5 && (
                                <div>
                                    <table className="review-table">
                                        <tbody>
                                            <tr><td>Họ tên</td><td>{formData.fullName}</td></tr>
                                            <tr><td>SĐT</td><td>{formData.phone}</td></tr>
                                            <tr><td>Xe</td><td>{formData.vehicleType} - {formData.licensePlate}</td></tr>
                                            <tr><td>Ngân hàng</td><td>{formData.bankName} - {formData.bankAccount}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <div className="wizard-actions">
                                {step > 1 && <button className="btn soft" onClick={() => setStep(step - 1)}>Quay lại</button>}
                                {step < 5 && <button className="btn primary" onClick={() => setStep(step + 1)}>Tiếp tục</button>}
                                {step === 5 && <button className="btn primary" onClick={handleSubmit}>Gửi hồ sơ</button>}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShipperRegister;