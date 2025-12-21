import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import LoginModal from '../Auth/LoginModal';
import RegisterModal from '../Auth/RegisterModal'; // ✅ IMPORT MỚI

function LandingPage() {
    // State cho Login
    const [showLogin, setShowLogin] = useState(false);
    
    // ✅ State mới cho Register
    const [showRegister, setShowRegister] = useState(false);
    const [registerRole, setRegisterRole] = useState(null);
    
    // State cho modal chọn vai trò
    const [showRoleModal, setShowRoleModal] = useState(false);

    // Mở modal chọn vai trò
    const handlePartnerClick = () => {
        setShowRoleModal(true);
    };

    // ✅ HÀM MỚI: Khi chọn vai trò → Hiện form đăng ký NGAY
    const handleSelectRole = (roleType) => {
        // roleType: 'merchant' hoặc 'shipper' (chỉ là tên gọi)
        
        // Chuyển đổi thành role pending
        let pendingRole;
        if (roleType === 'merchant') {
            pendingRole = 'pending_merchant'; // ✅ Chờ duyệt Merchant
        } else if (roleType === 'shipper') {
            pendingRole = 'pending_shipper'; // ✅ Chờ duyệt Shipper
        }
        
        // Lưu role và hiện form đăng ký
        setRegisterRole(pendingRole);
        setShowRoleModal(false);
        setShowRegister(true); // ✅ HIỆN REGISTER, KHÔNG PHẢI LOGIN
    };

    return (
        <div className="landing-page">
            {/* Navbar */}
            <Navbar onOpenLogin={() => setShowLogin(true)} />

            {/* Hero Section */}
            <div className="mo-dau" style={{ backgroundImage: 'url(/images/banner.jpg)' }}>
                <div className="mo-dau__noi-dung">
                    <div className="mo-dau__van-ban">
                        <h1>HaFo – Giao món ngon tận tay!</h1>
                        <p>Dễ dàng đặt món ăn yêu thích...</p>
                        <button className="nut-chinh" onClick={() => window.scrollTo(0, 500)}>
                            Đặt món ngay
                        </button>
                    </div>
                    
                    {/* Nút Trở thành đối tác */}
                    <div 
                        className="the-doi-tac" 
                        onClick={handlePartnerClick} 
                        style={{ cursor: 'pointer' }}
                    >
                        <b>Trở thành<br />Đối tác Nhà hàng / Shipper</b>
                        <small style={{ display: 'block' }}>
                            Đăng ký ngay để tăng thu nhập
                        </small>
                    </div>
                </div>
            </div>

            {/* ===================================== */}
            {/* MODAL CHỌN VAI TRÒ */}
            {/* ===================================== */}
            {showRoleModal && (
                <div 
                    className="overlay show" 
                    style={{ display: 'flex' }} 
                    onClick={() => setShowRoleModal(false)}
                >
                    <div className="role-modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0, color: '#F97350' }}>
                            Bạn muốn đăng ký làm?
                        </h2>
                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            Vui lòng chọn vai trò đối tác để tiếp tục
                        </p>

                        {/* ✅ CLICK VÀO ĐÂY → HIỆN FORM ĐĂNG KÝ với role pending */}
                        <button 
                            className="role-btn" 
                            onClick={() => handleSelectRole('merchant')}
                            // ↑ 'merchant' chỉ là tên gọi
                            // ↓ Thực tế set: 'pending_merchant'
                        >
                            <i className="fa-solid fa-store"></i>
                            <div>
                                <div>Đối tác Nhà hàng</div>
                                <div style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 'normal', 
                                    color: '#666' 
                                }}>
                                    Dành cho chủ quán, nhà hàng, cafe...
                                </div>
                            </div>
                        </button>

                        <button 
                            className="role-btn" 
                            onClick={() => handleSelectRole('shipper')}
                            // ↑ 'shipper' chỉ là tên gọi
                            // ↓ Thực tế set: 'pending_shipper'
                        >
                            <i className="fa-solid fa-motorcycle"></i>
                            <div>
                                <div>Đối tác Tài xế</div>
                                <div style={{ 
                                    fontSize: '12px', 
                                    fontWeight: 'normal', 
                                    color: '#666' 
                                }}>
                                    Dành cho người có xe máy/xe đạp...
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* ===================================== */}
            {/* ✅ MODAL ĐĂNG KÝ MỚI */}
            {/* ===================================== */}
            <RegisterModal
                isOpen={showRegister}
                onClose={() => setShowRegister(false)}
                role={registerRole}
                onOpenLogin={() => {
                    setShowRegister(false); // đóng đăng ký
                    setShowLogin(true);     // mở đăng nhập
                }}
            />


            {/* ===================================== */}
            {/* MODAL ĐĂNG NHẬP (cho user đã có tài khoản) */}
            {/* ===================================== */}
            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
            />
        </div>
    );
}

export default LandingPage;