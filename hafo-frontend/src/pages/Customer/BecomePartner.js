import React, { useState } from 'react'; // Đã thêm useState
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import RegisterModal from '../Auth/RegisterModal'; 
import LoginModal from '../Auth/LoginModal';       

function BecomePartner() {
    const navigate = useNavigate();

    // --- QUẢN LÝ STATE CHO MODAL ---
    const [showRegister, setShowRegister] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [registerRole, setRegisterRole] = useState(null);

    // Hàm mở Modal đăng ký với vai trò tương ứng
    const handleOpenRegister = (roleType) => {
        const pendingRole = roleType === 'merchant' ? 'pending_merchant' : 'pending_shipper';
        setRegisterRole(pendingRole);
        setShowRegister(true);
    };

    return (
        <div className="become-partner-page" style={{ backgroundColor: '#fdfaf5', minHeight: '100vh' }}>
            {/* Truyền hàm mở Login cho Navbar nếu cần */}
            <Navbar onOpenLogin={() => setShowLogin(true)} />

            {/* --- HERO SECTION (BANNER RỘNG) --- */}
            <div className="partner-hero" style={heroWrapperStyle}>
                <img 
                    src="/images/partner.png" 
                    alt="HaFo Partners" 
                    style={heroImageStyle} 
                />
                
                <div style={heroOverlayStyle}></div>

                <div style={heroContentBoxStyle}>
                    <h1 style={heroTitleStyle}>
                        Trở thành đối tác <span style={{color: '#ff7a00'}}>HaFo</span>
                    </h1>
                    
                    <div style={heroDividerStyle}></div>

                    <p style={heroTextStyle}>
                        Cùng nhau phát triển, mang ẩm thực tới mọi nhà. Làm chủ thời gian và gia tăng thu nhập đột phá ngay hôm nay.
                    </p>
                    
                    <button 
                        style={registerMainBtnStyle}
                        onClick={() => {
                            const section = document.getElementById('registration-section');
                            section?.scrollIntoView({ behavior: 'smooth' });
                        }}
                    >
                        Đăng ký ngay
                    </button>
                </div>
            </div>

            {/* --- BENEFITS SECTION --- */}
            <div className="benefits-section" style={sectionWrapperStyle}>
                <h2 style={sectionTitleStyle}>Lợi ích vượt trội khi đồng hành cùng HaFo</h2>
                
                <div style={benefitsGridStyle}>
                    <div className="benefit-card" style={benefitCardStyle}>
                        <div style={benefitIconStyle}>📈</div>
                        <strong style={benefitNameStyle}>Bùng nổ doanh số</strong>
                        <p style={benefitDetailStyle}>Tiếp cận 500,000+ người dùng. Tối ưu công suất bếp vào giờ thấp điểm.</p>
                    </div>

                    <div className="benefit-card" style={benefitCardStyle}>
                        <div style={benefitIconStyle}>⚙️</div>
                        <strong style={benefitNameStyle}>Vận hành thông minh</strong>
                        <p style={benefitDetailStyle}>Hệ thống realtime giúp giảm sai sót. Cập nhật thực đơn trong 30 giây.</p>
                    </div>

                    <div className="benefit-card" style={benefitCardStyle}>
                        <div style={benefitIconStyle}>📢</div>
                        <strong style={benefitNameStyle}>Marketing 0 đồng</strong>
                        <p style={benefitDetailStyle}>Tham gia các chiến dịch lớn trên Facebook, TikTok mà không tốn phí riêng.</p>
                    </div>

                    <div className="benefit-card" style={benefitCardStyle}>
                        <div style={benefitIconStyle}>🕒</div>
                        <strong style={benefitNameStyle}>Làm chủ thời gian</strong>
                        <p style={benefitDetailStyle}>Chủ động bật/tắt ứng dụng nhận đơn bất cứ lúc nào bạn muốn.</p>
                    </div>

                    <div className="benefit-card" style={benefitCardStyle}>
                        <div style={benefitIconStyle}>🏆</div>
                        <strong style={benefitNameStyle}>Thưởng doanh thu</strong>
                        <p style={benefitDetailStyle}>Chương trình thưởng quý và cuối năm hấp dẫn cho đối tác xuất sắc.</p>
                    </div>

                    <div className="benefit-card" style={benefitCardStyle}>
                        <div style={benefitIconStyle}>🎧</div>
                        <strong style={benefitNameStyle}>Hỗ trợ 24/7</strong>
                        <p style={benefitDetailStyle}>Tổng đài hỗ trợ luôn sẵn sàng giải quyết mọi vấn đề vận hành.</p>
                    </div>
                </div>
            </div>

            {/* --- CALL TO ACTION SECTION --- */}
            <div id="registration-section" className="cta-section" style={ctaWrapperStyle}>
                <div style={ctaInnerStyle}>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>Sẵn sàng hợp tác cùng HaFo?</h2>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button 
                            style={ctaBtnStyle} 
                            onClick={() => handleOpenRegister('merchant')}
                        >
                            Đăng ký Nhà hàng
                        </button>

                        <button 
                            style={{ ...ctaBtnStyle, backgroundColor: '#333' }} 
                            onClick={() => handleOpenRegister('shipper')}
                        >
                            Đăng ký Tài xế
                        </button>
                    </div>
                </div>
            </div>

            {/* --- CÁC MODAL --- */}
            <RegisterModal
                isOpen={showRegister}
                onClose={() => setShowRegister(false)}
                role={registerRole}
                onOpenLogin={() => {
                    setShowRegister(false);
                    setShowLogin(true);
                }}
            />

            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
            />
        </div>
    );
}

// --- HỆ THỐNG STYLES ---
const heroWrapperStyle = {
    position: 'relative',
    width: '100%',
    height: '550px', 
    display: 'flex', 
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#000'
};

const heroImageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover', 
    objectPosition: 'right center', // Đẩy nhân vật sang phải để không bị chữ che
    zIndex: 1,
    opacity: '0.8'
};

const heroOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0) 100%)',
    zIndex: 2
};

const heroContentBoxStyle = { 
    position: 'relative', 
    zIndex: 3, 
    marginLeft: '8%', 
    maxWidth: '550px', 
    color: '#fff',
    padding: '30px'
};

const heroTitleStyle = { fontSize: '48px', fontWeight: 'bold', marginBottom: '15px', lineHeight: '1.2' };
const heroDividerStyle = { width: '50px', height: '4px', background: '#ff7a00', marginBottom: '20px' };
const heroTextStyle = { fontSize: '18px', marginBottom: '30px', lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' };

const registerMainBtnStyle = {
    padding: '15px 40px',
    backgroundColor: '#247d3c',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 5px 15px rgba(17, 255, 0, 0.22)'
};

const sectionWrapperStyle = { maxWidth: '1200px', margin: '60px auto', padding: '0 20px' };
const sectionTitleStyle = { fontSize: '28px', textAlign: 'center', marginBottom: '40px', color: '#333' };

const benefitsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '25px'
};

const benefitCardStyle = {
    backgroundColor: '#E8F5E9',
    padding: '30px',
    borderRadius: '20px',
    border: '1px solid #f0f0f0',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)',
    textAlign: 'left'
};

const benefitIconStyle = { fontSize: '35px', marginBottom: '15px' };
const benefitNameStyle = { display: 'block', fontSize: '18px', marginBottom: '10px', color: '#333' };
const benefitDetailStyle = { fontSize: '14px', color: '#888', lineHeight: '1.5', margin: 0 };

const ctaWrapperStyle = { backgroundColor: '#ff7a00', padding: '50px 0', marginTop: '80px', color: '#fff' };
const ctaInnerStyle = { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' };
const ctaBtnStyle = { padding: '14px 30px', backgroundColor: '#fff', color: '#ff7a00', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };

export default BecomePartner;