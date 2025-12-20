import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';

function MerchantRegister() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isSuccess, setIsSuccess] = useState(false);

    // Dữ liệu form tổng hợp
    const [formData, setFormData] = useState({
        serviceType: 'food',
        name: '', phone: '', city: 'TP. Hồ Chí Minh', district: '', address: '',
        repName: '', repEmail: '', repPhone: '',
        bankName: '', bankAccount: '', bankOwner: '',
        openTime: '07:00', closeTime: '22:00'
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        try {
            // Lấy userId từ localStorage để gắn vào hồ sơ
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return alert("Vui lòng đăng nhập trước!");

            await axios.post('http://localhost:5000/api/pending/merchant', {
                ...formData,
                userId: user.id
            });
            setIsSuccess(true);
            window.scrollTo(0, 0);
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    const steps = ["Loại hình", "Thông tin quán", "Người đại diện", "Ngân hàng", "Kiểm tra"];

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: 50 }}>
            <Navbar />
            <div className="hop" style={{ maxWidth: 900, marginTop: 30 }}>

                {/* 1. THANH TIẾN TRÌNH */}
                <div className="wizard-steps">
                    {steps.map((name, idx) => (
                        <div key={idx} className={`wizard-step ${step === idx + 1 ? 'active' : (step > idx + 1 ? 'done' : '')}`} onClick={() => step > idx + 1 && setStep(idx + 1)}>
                            <div className="num">{idx + 1}</div> {name}
                        </div>
                    ))}
                </div>

                {/* 2. NỘI DUNG FORM */}
                {isSuccess ? (
                    <div className="wizard-body" style={{ textAlign: 'center', padding: 40 }}>
                        <i className="fa-solid fa-circle-check" style={{ fontSize: 60, color: '#22C55E', marginBottom: 20 }}></i>
                        <h2>Gửi yêu cầu thành công!</h2>
                        <p>Hồ sơ của bạn đã được chuyển đến Admin. Kết quả sẽ được gửi qua email trong 1-3 ngày.</p>
                        <button className="btn primary" onClick={() => navigate('/')}>Về trang chủ</button>
                    </div>
                ) : (
                    <div className="wizard-body">
                        <div className="wizard-head">
                            <i className="fa-solid fa-pen-to-square"></i> Bước {step}: {steps[step - 1]}
                        </div>
                        <div className="wizard-content">

                            {/* BƯỚC 1: LOẠI HÌNH */}
                            {step === 1 && (
                                <div>
                                    <div className={`sel-card ${formData.serviceType === 'food' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, serviceType: 'food' })}>
                                        <input type="radio" checked={formData.serviceType === 'food'} readOnly />
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Giao đồ ăn</div>
                                            <div style={{ fontSize: 13, color: '#666' }}>Nhà hàng, quán ăn, cafe, trà sữa...</div>
                                        </div>
                                    </div>
                                    <div className={`sel-card ${formData.serviceType === 'mart' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, serviceType: 'mart' })}>
                                        <input type="radio" checked={formData.serviceType === 'mart'} readOnly />
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>Giao thực phẩm</div>
                                            <div style={{ fontSize: 13, color: '#666' }}>Siêu thị, cửa hàng tiện lợi, bách hóa...</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* BƯỚC 2: THÔNG TIN QUÁN */}
                            {step === 2 && (
                                <div>
                                    <label className="wiz-label">Tên quán *</label>
                                    <input className="wiz-input" name="name" value={formData.name} onChange={handleChange} placeholder="Ví dụ: Bún Bò Hằng Nga" />

                                    <div className="wiz-grid" style={{ marginTop: 15 }}>
                                        <div><label className="wiz-label">Thành phố</label>
                                            <select className="wiz-input" name="city" value={formData.city} onChange={handleChange}>
                                                <option>TP. Hồ Chí Minh</option><option>Hà Nội</option>
                                            </select></div>
                                        <div><label className="wiz-label">Quận/Huyện</label>
                                            <input className="wiz-input" name="district" value={formData.district} onChange={handleChange} /></div>
                                    </div>

                                    <label className="wiz-label">Địa chỉ chi tiết *</label>
                                    <input className="wiz-input" name="address" value={formData.address} onChange={handleChange} placeholder="Số nhà, tên đường..." />

                                    <label className="wiz-label" style={{ marginTop: 15 }}>Số điện thoại quán</label>
                                    <input className="wiz-input" name="phone" value={formData.phone} onChange={handleChange} />
                                </div>
                            )}

                            {/* BƯỚC 3: NGƯỜI ĐẠI DIỆN */}
                            {step === 3 && (
                                <div>
                                    <div className="wiz-note">Thông tin này dùng để xác thực chủ sở hữu và đối soát thanh toán.</div>
                                    <div className="wiz-grid">
                                        <div><label className="wiz-label">Họ tên chủ quán</label><input className="wiz-input" name="repName" value={formData.repName} onChange={handleChange} /></div>
                                        <div><label className="wiz-label">Số điện thoại cá nhân</label><input className="wiz-input" name="repPhone" value={formData.repPhone} onChange={handleChange} /></div>
                                    </div>
                                    <label className="wiz-label">Email liên hệ</label>
                                    <input className="wiz-input" name="repEmail" value={formData.repEmail} onChange={handleChange} />
                                </div>
                            )}

                            {/* BƯỚC 4: NGÂN HÀNG */}
                            {step === 4 && (
                                <div>
                                    <div className="wiz-grid">
                                        <div><label className="wiz-label">Ngân hàng</label><input className="wiz-input" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="VD: MB Bank" /></div>
                                        <div><label className="wiz-label">Chi nhánh</label><input className="wiz-input" name="bankBranch" value={formData.bankBranch} onChange={handleChange} /></div>
                                    </div>
                                    <div className="wiz-grid">
                                        <div><label className="wiz-label">Số tài khoản</label><input className="wiz-input" name="bankAccount" value={formData.bankAccount} onChange={handleChange} /></div>
                                        <div><label className="wiz-label">Tên chủ tài khoản</label><input className="wiz-input" name="bankOwner" value={formData.bankOwner} onChange={handleChange} placeholder="Viết hoa không dấu" /></div>
                                    </div>
                                </div>
                            )}

                            {/* BƯỚC 5: KIỂM TRA & GỬI */}
                            {step === 5 && (
                                <div>
                                    <div className="wiz-note" style={{ color: '#15803d', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
                                        <i className="fa-solid fa-circle-info"></i> Vui lòng kiểm tra kỹ thông tin trước khi gửi.
                                    </div>
                                    <table className="review-table">
                                        <tbody>
                                            <tr><td>Tên quán</td><td>{formData.name}</td></tr>
                                            <tr><td>Địa chỉ</td><td>{formData.address}, {formData.district}, {formData.city}</td></tr>
                                            <tr><td>SĐT Quán</td><td>{formData.phone}</td></tr>
                                            <tr><td>Chủ quán</td><td>{formData.repName}</td></tr>
                                            <tr><td>Ngân hàng</td><td>{formData.bankName} - {formData.bankAccount}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* NÚT ĐIỀU HƯỚNG */}
                            <div className="wizard-actions">
                                {step > 1 && <button className="btn soft" onClick={() => setStep(step - 1)}>Quay lại</button>}
                                {step < 5 && <button className="btn primary" onClick={() => setStep(step + 1)}>Tiếp tục</button>}
                                {step === 5 && <button className="btn primary" onClick={handleSubmit}><i className="fa-solid fa-paper-plane"></i> Gửi hồ sơ</button>}
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MerchantRegister;