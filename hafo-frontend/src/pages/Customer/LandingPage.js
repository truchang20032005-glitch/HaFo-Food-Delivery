import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
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
                        <p>Dễ dàng đặt món ăn yêu thích từ những quán ngon quanh bạn – chỉ với vài chạm.</p>
                        <button className="nut-chinh" onClick={() => window.scrollTo(0, 500)}>Đặt món ngay</button>
                    </div>
                    {/* Nút Trở thành đối tác */}
                    <div className="the-doi-tac" onClick={handlePartnerClick} style={{ cursor: 'pointer' }}>
                        <b>Trở thành<br />Đối tác Nhà hàng / Shipper</b>
                        <small style={{ display: 'block' }}>Đăng ký ngay để tăng thu nhập</small>
                    </div>
                </div>
            </div>

            <section className="gioi-thieu" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h2 style={{ color: '#F97350' }}>HaFo – Nhanh, tiện, ngon và thân thiện</h2>
                <p>HaFo mang đến trải nghiệm đặt món nhanh chóng, dễ dùng và đáng tin cậy.
                    Hãy để chúng tôi giao đến bạn hương vị nóng hổi từ những quán ăn yêu thích.</p>
            </section>

            {/* --- MODAL CHỌN VAI TRÒ --- */}
            {showRoleModal && (
                <div className="overlay show" onClick={() => setShowRoleModal(false)}>
                    <div className="role-modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0, color: '#F97350' }}>Bạn muốn đăng ký làm?</h2>
                        <p style={{ marginBottom: '20px', color: '#666' }}>Vui lòng chọn vai trò đối tác để tiếp tục</p>

                        <button className="role-btn" onClick={() => handleSelectRole('merchant')}>
                            <i className="fa-solid fa-store"></i>
                            <div>
                                <div className="role-title">Đối tác Nhà hàng</div>
                                <div style={{ fontSize: '15px', fontWeight: 'normal', color: '#0c0c0cff' }}>Dành cho chủ quán, nhà hàng, cafe...</div>
                            </div>
                        </button>

                        <button className="role-btn" onClick={() => handleSelectRole('shipper')}>
                            <i className="fa-solid fa-motorcycle"></i>
                            <div>
                                <div className="role-title">Đối tác Tài xế</div>
                                <div style={{ fontSize: '15px', fontWeight: 'normal', color: '#0c0c0cff' }}>Dành cho người có xe máy/xe đạp...</div>
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