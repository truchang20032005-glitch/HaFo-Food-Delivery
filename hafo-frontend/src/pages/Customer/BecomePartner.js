import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import RegisterModal from '../Auth/RegisterModal';
import LoginModal from '../Auth/LoginModal';

function BecomePartner() {
    const [showRegister, setShowRegister] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [registerRole, setRegisterRole] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleOpenRegister = (roleType) => {
        const pendingRole = roleType === 'merchant' ? 'pending_merchant' : 'pending_shipper';
        setRegisterRole(pendingRole);
        setShowRegister(true);
    };

    const S = {
        heroWrapper: {
            position: 'relative', height: isMobile ? '400px' : '600px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#000', overflow: 'hidden'
        },
        heroTitle: {
            fontSize: isMobile ? '32px' : '56px', color: '#fff', fontWeight: '900', lineHeight: '1.2', marginBottom: '20px', textAlign: 'center'
        },
        statsBar: {
            background: '#fff', maxWidth: '1000px', margin: isMobile ? '20px auto' : '-50px auto 0', position: 'relative', zIndex: 4,
            borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: isMobile ? '20px' : '30px',
            display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '20px' : '0', justifyContent: 'space-around', alignItems: 'center'
        },
        grid3: {
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px',
            maxWidth: '1200px', margin: '40px auto', padding: '0 15px'
        },
        roleGrid: {
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px',
            maxWidth: '900px', margin: '0 auto'
        }
    };

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: 50 }}>
            <style>{`.hover-card { transition: 0.3s; position: relative; } .hover-card:hover { transform: translateY(-10px); }`}</style>
            <Navbar onOpenLogin={() => setShowLogin(true)} />

            <div style={S.heroWrapper}>
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2 }}></div>
                <img src="/images/partner.png" alt="Hero" style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
                <div style={{ position: 'relative', zIndex: 3, padding: '20px', textAlign: 'center' }}>
                    <h1 style={S.heroTitle}>Tăng trưởng doanh thu <br /><span style={{ color: '#F97350' }}>Đột phá lợi nhuận</span></h1>
                    <button onClick={() => document.getElementById('join-now').scrollIntoView({ behavior: 'smooth' })}
                        style={{ padding: '14px 30px', borderRadius: '30px', border: 'none', background: '#F97350', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                        Đăng ký ngay
                    </button>
                </div>
            </div>

            <div style={S.statsBar}>
                {[{ n: '500+', l: 'Đối tác' }, { n: '1.2M+', l: 'Khách hàng' }, { n: '30p', l: 'Giao hàng' }].map((item, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{item.n}</div>
                        <div style={{ color: '#666', fontSize: '13px' }}>{item.l}</div>
                    </div>
                ))}
            </div>

            <div style={{ padding: '60px 15px' }}>
                <h2 style={{ textAlign: 'center', fontSize: '28px', marginBottom: '30px' }}>Tại sao chọn HaFo?</h2>
                <div style={S.grid3}>
                    <div className="hover-card" style={{ padding: '30px', border: '1px solid #eee', borderRadius: '20px', textAlign: 'center' }}>
                        <i className="fa-solid fa-chart-line" style={{ fontSize: '30px', color: '#F97350' }}></i>
                        <h4 style={{ margin: '15px 0' }}>Bùng nổ doanh số</h4>
                        <p style={{ fontSize: '14px', color: '#666' }}>Tiếp cận hàng triệu khách hàng mục tiêu.</p>
                    </div>
                    <div className="hover-card" style={{ padding: '30px', border: '1px solid #eee', borderRadius: '20px', textAlign: 'center' }}>
                        <i className="fa-solid fa-mobile-screen" style={{ fontSize: '30px', color: '#1890FF' }}></i>
                        <h4 style={{ margin: '15px 0' }}>Công nghệ hiện đại</h4>
                        <p style={{ fontSize: '14px', color: '#666' }}>Quản lý đơn hàng dễ dàng qua ứng dụng.</p>
                    </div>
                    <div className="hover-card" style={{ padding: '30px', border: '1px solid #eee', borderRadius: '20px', textAlign: 'center' }}>
                        <i className="fa-solid fa-hand-holding-dollar" style={{ fontSize: '30px', color: '#FA8C16' }}></i>
                        <h4 style={{ margin: '15px 0' }}>Chi phí tối ưu</h4>
                        <p style={{ fontSize: '14px', color: '#666' }}>Hoa hồng cạnh tranh, không phí ẩn.</p>
                    </div>
                </div>
            </div>

            <div id="join-now" style={{ padding: '60px 15px', background: '#f9f9f9' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '40px' }}>Bạn muốn tham gia vai trò nào?</h2>
                <div style={S.roleGrid}>
                    <div className="hover-card" style={{ background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/1995/1995609.png" width="60" alt="" />
                        <h3 style={{ margin: '15px 0', color: '#F97350' }}>Đối tác Nhà hàng</h3>
                        <button onClick={() => handleOpenRegister('merchant')} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#F97350', color: '#fff', fontWeight: 'bold' }}>Đăng ký ngay</button>
                    </div>
                    <div className="hover-card" style={{ background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center' }}>
                        <img src="https://cdn-icons-png.flaticon.com/512/3063/3063822.png" width="60" alt="" />
                        <h3 style={{ margin: '15px 0', color: '#22C55E' }}>Đối tác Tài xế</h3>
                        <button onClick={() => handleOpenRegister('shipper')} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#22C55E', color: '#fff', fontWeight: 'bold' }}>Tham gia ngay</button>
                    </div>
                </div>
            </div>

            <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} role={registerRole} onOpenLogin={() => { setShowRegister(false); setShowLogin(true); }} />
            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
        </div>
    );
}

export default BecomePartner;