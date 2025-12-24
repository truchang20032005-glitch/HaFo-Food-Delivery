import { useState } from 'react';
import Navbar from '../../components/Navbar';
import LoginModal from '../Auth/LoginModal';
import RegisterModal from '../Auth/RegisterModal';

function LandingPage() {
    // State cho Login
    const [showLogin, setShowLogin] = useState(false);

    // State mới cho Register
    const [showRegister, setShowRegister] = useState(false);
    const [registerRole, setRegisterRole] = useState(null);

    // State cho modal chọn vai trò
    const [showRoleModal, setShowRoleModal] = useState(false);

    // Mở modal chọn vai trò
    const handlePartnerClick = () => {
        setShowRoleModal(true);
    };

    // Khi chọn vai trò → Hiện form đăng ký NGAY
    const handleSelectRole = (roleType) => {
        // roleType: 'merchant' hoặc 'shipper' (chỉ là tên gọi)

        // Chuyển đổi thành role pending
        let pendingRole;
        if (roleType === 'merchant') {
            pendingRole = 'pending_merchant';
        } else if (roleType === 'shipper') {
            pendingRole = 'pending_shipper';
        }

        // Lưu role và hiện form đăng ký
        setRegisterRole(pendingRole);
        setShowRoleModal(false);
        setShowRegister(true);
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
                        <p>Dễ dàng đặt món ăn yêu thích từ những quán ngon quanh bạn – chỉ với vài chạm.</p>
                        <button className="nut-chinh" onClick={() => window.scrollTo(0, 500)}>Đặt món ngay</button>
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
            <section className="gioi-thieu" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h2 style={{ color: '#F97350' }}>HaFo – Nhanh, tiện, ngon và thân thiện</h2>
                <p>HaFo mang đến trải nghiệm đặt món nhanh chóng, dễ dùng và đáng tin cậy.
                    Hãy để chúng tôi giao đến bạn hương vị nóng hổi từ những quán ăn yêu thích.</p>
            </section>

            {/* --- MODAL CHỌN VAI TRÒ --- */}
            {showRoleModal && (
                <div className="overlay show" onClick={() => setShowRoleModal(false)}>
                    <div className="role-modal" onClick={e => e.stopPropagation()}>
                        <h2 style={{ marginTop: 0, color: '#F97350' }}>
                            Bạn muốn đăng ký làm?
                        </h2>
                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            Vui lòng chọn vai trò đối tác để tiếp tục
                        </p>

                        {/* CLICK VÀO ĐÂY → HIỆN FORM ĐĂNG KÝ với role pending */}
                        <button
                            className="role-btn"
                            onClick={() => handleSelectRole('merchant')}
                        // ↑ 'merchant' chỉ là tên gọi
                        // ↓ Thực tế set: 'pending_merchant'
                        >
                            <i className="fa-solid fa-store"></i>
                            <div>
                                <div className="role-title">Đối tác Nhà hàng</div>
                                <div style={{ fontSize: '15px', fontWeight: 'normal', color: '#0c0c0cff' }}>Dành cho chủ quán, nhà hàng, cafe...</div>
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
                                <div className="role-title">Đối tác Tài xế</div>
                                <div style={{ fontSize: '15px', fontWeight: 'normal', color: '#0c0c0cff' }}>Dành cho người có xe máy/xe đạp...</div>
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