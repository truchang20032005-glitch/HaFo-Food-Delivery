import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import LoginModal from '../Auth/LoginModal';

function LandingPage() {
    const [showLogin, setShowLogin] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [targetRole, setTargetRole] = useState(null); // Lưu vai trò muốn đăng ký

    // Hàm mở modal chọn vai trò
    const handlePartnerClick = () => {
        setShowRoleModal(true);
    };

    // Hàm khi chọn vai trò -> Mở login
    const handleSelectRole = (role) => {
        setTargetRole(role);
        setShowRoleModal(false);
        setShowLogin(true); // Bắt buộc đăng nhập trước
    };

    return (
        <div className="landing-page">
            {/* Truyền hàm mở Role Modal xuống Navbar nếu nút nằm trên đó */}
            <Navbar onOpenLogin={() => { setTargetRole(null); setShowLogin(true); }} />

            {/* Hero Section có nút đăng ký */}
            <div className="mo-dau" style={{ backgroundImage: 'url(/images/banner.jpg)' }}>
                <div className="mo-dau__noi-dung">
                    <div className="mo-dau__van-ban">
                        <h1>HaFo – Giao món ngon tận tay!</h1>
                        <p>Dễ dàng đặt món ăn yêu thích...</p>
                        <button className="nut-chinh" onClick={() => window.scrollTo(0, 500)}>Đặt món ngay</button>
                    </div>
                    {/* Nút Trở thành đối tác */}
                    <div className="the-doi-tac" onClick={handlePartnerClick} style={{ cursor: 'pointer' }}>
                        <b>Trở thành<br />Đối tác Nhà hàng / Shipper</b>
                        <small style={{ display: 'block' }}>Đăng ký ngay để tăng thu nhập</small>
                    </div>
                </div>
            </div>

            {/* --- MODAL CHỌN VAI TRÒ --- */}
            {showRoleModal && (
                <div className="overlay show" style={{ display: 'flex' }} onClick={() => setShowRoleModal(false)}>
                    <div className="role-modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0, color: '#F97350' }}>Bạn muốn đăng ký làm?</h2>
                        <p style={{ marginBottom: '20px', color: '#666' }}>Vui lòng chọn vai trò đối tác để tiếp tục</p>

                        <button className="role-btn" onClick={() => handleSelectRole('merchant')}>
                            <i className="fa-solid fa-store"></i>
                            <div>
                                <div>Đối tác Nhà hàng</div>
                                <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>Dành cho chủ quán, nhà hàng, cafe...</div>
                            </div>
                        </button>

                        <button className="role-btn" onClick={() => handleSelectRole('shipper')}>
                            <i className="fa-solid fa-motorcycle"></i>
                            <div>
                                <div>Đối tác Tài xế</div>
                                <div style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>Dành cho người có xe máy/xe đạp...</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Login Modal có truyền targetRole */}
            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                targetRole={targetRole}
            />
        </div>
    );
}

export default LandingPage;