import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import RegisterModal from '../Auth/RegisterModal';
import LoginModal from '../Auth/LoginModal';

function BecomePartner() {
    const navigate = useNavigate();

    // --- QUẢN LÝ STATE ---
    const [showRegister, setShowRegister] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [registerRole, setRegisterRole] = useState(null);

    const handleOpenRegister = (roleType) => {
        const pendingRole = roleType === 'merchant' ? 'pending_merchant' : 'pending_shipper';
        setRegisterRole(pendingRole);
        setShowRegister(true);
    };

    return (
        <div className="become-partner-page" style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: 50 }}>
            {/* Inject CSS Styles cho hiệu ứng Hover */}
            <style>
                {`
                    .hover-card { transition: all 0.3s ease; top: 0; position: relative; }
                    .hover-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important; border-color: #F97350 !important; }
                    .step-circle { transition: all 0.3s; }
                    .step-item:hover .step-circle { transform: scale(1.1); background: #F97350 !important; color: #fff !important; }
                    .cta-btn { transition: transform 0.2s; }
                    .cta-btn:active { transform: scale(0.95); }
                `}
            </style>

            <Navbar onOpenLogin={() => setShowLogin(true)} />

            {/* --- 1. HERO SECTION --- */}
            <div style={S.heroWrapper}>
                {/* Ảnh nền có lớp phủ tối */}
                <div style={S.heroOverlay}></div>
                <img src="/images/partner.png" alt="HaFo Partners" style={S.heroImage} />

                <div style={S.heroContent}>
                    <span style={S.tagline}>HỢP TÁC CÙNG HAFO</span>
                    <h1 style={S.heroTitle}>
                        Tăng trưởng doanh thu <br />
                        <span style={{ color: '#F97350' }}>Đột phá lợi nhuận</span>
                    </h1>
                    <p style={S.heroDesc}>
                        Hệ sinh thái giao đồ ăn hàng đầu giúp bạn tiếp cận hàng triệu khách hàng và tối ưu quy trình vận hành.
                    </p>
                    <div style={{ display: 'flex', gap: 15 }}>
                        <button onClick={() => document.getElementById('join-now').scrollIntoView({ behavior: 'smooth' })} style={S.btnPrimary}>
                            Đăng ký ngay
                        </button>
                        <button style={S.btnOutline}>Tìm hiểu thêm</button>
                    </div>
                </div>
            </div>

            {/* --- 2. STATS BAR (Thống kê uy tín) --- */}
            <div style={S.statsBar}>
                <div style={S.statItem}>
                    <div style={S.statNumber}>500+</div>
                    <div style={S.statLabel}>Đối tác nhà hàng</div>
                </div>
                <div style={S.statDivider}></div>
                <div style={S.statItem}>
                    <div style={S.statNumber}>1.2M+</div>
                    <div style={S.statLabel}>Khách hàng tin dùng</div>
                </div>
                <div style={S.statDivider}></div>
                <div style={S.statItem}>
                    <div style={S.statNumber}>30p</div>
                    <div style={S.statLabel}>Thời gian giao trung bình</div>
                </div>
            </div>

            {/* --- 3. BENEFITS SECTION --- */}
            <div style={S.sectionWrapper}>
                <div style={{ textAlign: 'center', marginBottom: 50 }}>
                    <h2 style={S.sectionTitle}>Tại sao chọn HaFo?</h2>
                    <p style={{ color: '#666', maxWidth: 600, margin: '10px auto' }}>Chúng tôi không chỉ là ứng dụng giao đồ ăn, chúng tôi là đối tác chiến lược cho sự phát triển của bạn.</p>
                </div>

                <div style={S.grid3}>
                    {/* Card 1 */}
                    <div className="hover-card" style={S.benefitCard}>
                        <div style={S.iconBox}><i className="fa-solid fa-chart-line"></i></div>
                        <h3 style={S.cardTitle}>Bùng nổ doanh số</h3>
                        <p style={S.cardDesc}>Tiếp cận lượng khách hàng khổng lồ. Tăng đơn hàng vào giờ thấp điểm nhờ các chiến dịch Marketing thông minh.</p>
                    </div>

                    {/* Card 2 */}
                    <div className="hover-card" style={S.benefitCard}>
                        <div style={{ ...S.iconBox, background: '#E6F7FF', color: '#1890FF' }}><i className="fa-solid fa-mobile-screen-button"></i></div>
                        <h3 style={S.cardTitle}>Công nghệ hiện đại</h3>
                        <p style={S.cardDesc}>Ứng dụng quản lý trực quan, báo cáo doanh thu Real-time, nhận đơn và cập nhật menu chỉ trong 30 giây.</p>
                    </div>

                    {/* Card 3 */}
                    <div className="hover-card" style={S.benefitCard}>
                        <div style={{ ...S.iconBox, background: '#FFF7E6', color: '#FA8C16' }}><i className="fa-solid fa-hand-holding-dollar"></i></div>
                        <h3 style={S.cardTitle}>Chi phí tối ưu</h3>
                        <p style={S.cardDesc}>Phí hoa hồng cạnh tranh nhất thị trường. Không phí ẩn, không phí duy trì cửa hàng hàng tháng.</p>
                    </div>
                </div>
            </div>

            {/* --- 4. STEPS SECTION (QUY TRÌNH) --- */}
            <div style={{ background: '#f5e7d9ff', padding: '60px 20px' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <h2 style={{ ...S.sectionTitle, textAlign: 'center', marginBottom: 40 }}>3 Bước để bắt đầu</h2>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                        <div className="step-item" style={S.stepItem}>
                            <div className="step-circle" style={S.stepCircle}>1</div>
                            <h4>Đăng ký Online</h4>
                            <p style={S.stepDesc}>Điền thông tin cơ bản vào biểu mẫu đăng ký bên dưới.</p>
                        </div>
                        <div className="step-item" style={S.stepItem}>
                            <div className="step-circle" style={S.stepCircle}>2</div>
                            <h4>Xác thực hồ sơ</h4>
                            <p style={S.stepDesc}>Đội ngũ HaFo sẽ liên hệ xác minh và ký hợp đồng điện tử.</p>
                        </div>
                        <div className="step-item" style={S.stepItem}>
                            <div className="step-circle" style={S.stepCircle}>3</div>
                            <h4>Bắt đầu bán hàng</h4>
                            <p style={S.stepDesc}>Nhận tài khoản, cài đặt menu và bắt đầu nhận đơn ngay!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 5. CALL TO ACTION (CHỌN VAI TRÒ) --- */}
            <div id="join-now" style={{ padding: '60px 20px', background: '#fff' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: 40, fontSize: '28px', color: '#333' }}>Bạn muốn tham gia với vai trò nào?</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

                        {/* BOX MERCHANT */}
                        <div className="hover-card" style={S.roleCard}>
                            <img src="https://cdn-icons-png.flaticon.com/512/1995/1995609.png" alt="Merchant" style={{ width: 80, marginBottom: 20 }} />
                            <h3 style={{ color: '#F97350', marginBottom: 10 }}>Đối tác Nhà hàng</h3>
                            <p style={{ color: '#666', marginBottom: 20, lineHeight: '1.5' }}>Mở rộng kinh doanh, quản lý dễ dàng và tăng trưởng doanh thu cùng HaFo Food.</p>
                            <ul style={{ textAlign: 'left', color: '#555', marginBottom: 25, listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: 8 }}><i className="fa-solid fa-check" style={{ color: '#F97350', marginRight: 8 }}></i> Phí hoa hồng ưu đãi</li>
                                <li style={{ marginBottom: 8 }}><i className="fa-solid fa-check" style={{ color: '#F97350', marginRight: 8 }}></i> Hỗ trợ chụp ảnh món ăn</li>
                            </ul>
                            <button className="cta-btn" onClick={() => handleOpenRegister('merchant')} style={{ ...S.roleBtn, background: 'linear-gradient(to right, #F97350, #FF5F6D)' }}>
                                Đăng ký Nhà hàng
                            </button>
                        </div>

                        {/* BOX SHIPPER */}
                        <div className="hover-card" style={S.roleCard}>
                            <img src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" alt="Shipper" style={{ width: 80, marginBottom: 20 }} />
                            <h3 style={{ color: '#22C55E', marginBottom: 10 }}>Đối tác Tài xế</h3>
                            <p style={{ color: '#666', marginBottom: 20, lineHeight: '1.5' }}>Thu nhập hấp dẫn, thời gian linh hoạt. Nhận tiền ngay sau mỗi chuyến đi.</p>
                            <ul style={{ textAlign: 'left', color: '#555', marginBottom: 25, listStyle: 'none', padding: 0 }}>
                                <li style={{ marginBottom: 8 }}><i className="fa-solid fa-check" style={{ color: '#22C55E', marginRight: 8 }}></i> Thu nhập lên đến 15tr/tháng</li>
                                <li style={{ marginBottom: 8 }}><i className="fa-solid fa-check" style={{ color: '#22C55E', marginRight: 8 }}></i> Bảo hiểm tai nạn 24/7</li>
                            </ul>
                            <button className="cta-btn" onClick={() => handleOpenRegister('shipper')} style={{ ...S.roleBtn, background: 'linear-gradient(to right, #22C55E, #16A34A)' }}>
                                Đăng ký Tài xế
                            </button>
                        </div>

                    </div>
                </div>
            </div>

            {/* MODALS */}
            <RegisterModal
                isOpen={showRegister}
                onClose={() => setShowRegister(false)}
                role={registerRole}
                onOpenLogin={() => { setShowRegister(false); setShowLogin(true); }}
            />
            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
            />
        </div>
    );
}

// --- STYLES OBJECT ---
const S = {
    heroWrapper: {
        position: 'relative', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#000', overflow: 'hidden'
    },
    heroImage: {
        position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6, zIndex: 1
    },
    heroOverlay: {
        position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8))', zIndex: 2
    },
    heroContent: {
        position: 'relative', zIndex: 3, textAlign: 'center', maxWidth: '800px', padding: '20px',
        display: 'flex', flexDirection: 'column', alignItems: 'center'
    },
    tagline: {
        color: '#F97350', letterSpacing: '2px', fontWeight: 'bold', marginBottom: '15px', display: 'block', textTransform: 'uppercase'
    },
    heroTitle: {
        fontSize: '56px', color: '#fff', fontWeight: '900', lineHeight: '1.2', marginBottom: '20px', textShadow: '0 4px 10px rgba(0,0,0,0.5)'
    },
    heroDesc: {
        fontSize: '18px', color: '#e5e5e5', marginBottom: '30px', maxWidth: '600px', lineHeight: '1.6'
    },
    btnPrimary: {
        padding: '14px 35px', borderRadius: '30px', border: 'none',
        background: 'linear-gradient(90deg, #F97350, #FF5F6D)', color: '#fff',
        fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(249, 115, 80, 0.4)'
    },
    btnOutline: {
        padding: '14px 35px', borderRadius: '30px', border: '2px solid #fff',
        background: 'transparent', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
    },

    // Stats
    statsBar: {
        background: '#fff', maxWidth: '1000px', margin: '-50px auto 0', position: 'relative', zIndex: 4,
        borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '30px',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center'
    },
    statItem: { textAlign: 'center' },
    statNumber: { fontSize: '32px', fontWeight: '900', color: '#333' },
    statLabel: { color: '#666', fontSize: '14px' },
    statDivider: { width: '1px', height: '40px', background: '#eee' },

    // Benefits
    sectionWrapper: { maxWidth: '1200px', margin: '80px auto', padding: '0 20px' },
    sectionTitle: { fontSize: '32px', fontWeight: '800', color: '#333', marginBottom: '10px' },
    grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' },
    benefitCard: {
        background: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #f0f0f0', textAlign: 'center'
    },
    iconBox: {
        width: '60px', height: '60px', borderRadius: '50%', background: '#FFF5F2', color: '#F97350',
        fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
    },
    cardTitle: { fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: '#333' },
    cardDesc: { color: '#666', lineHeight: '1.6', fontSize: '14px' },

    // Steps
    stepItem: { flex: 1, minWidth: '250px', textAlign: 'center', padding: '20px' },
    stepCircle: {
        width: '50px', height: '50px', borderRadius: '50%', background: '#fff', border: '2px solid #F97350',
        color: '#F97350', fontWeight: 'bold', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 15px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
    },
    stepDesc: { fontSize: '14px', color: '#666', marginTop: '5px' },

    // Roles
    roleCard: {
        background: '#fff', borderRadius: '20px', padding: '40px', textAlign: 'center', border: '1px solid #eee',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center'
    },
    roleBtn: {
        width: '100%', padding: '15px', border: 'none', color: '#fff', borderRadius: '12px',
        fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: 'auto', boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
    }
};

export default BecomePartner;