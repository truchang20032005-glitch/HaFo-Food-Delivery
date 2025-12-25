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
        <div className="landing-page-container" style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('/images/banner.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed', // Giữ ảnh cố định khi cuộn chuột
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'

        }}>
            <Navbar onOpenLogin={() => setShowLogin(true)} />

            {/* --- SECTION 1: HERO & QUICK FEATURES --- */}
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

            {/* --- SECTION 2: MAIN CONTENT (Phần Beige bo góc) --- */}
            <section>
                {/* Sub-section: Danh mục món ăn */}
                <section
                    style={{
                        background: '#fef4b1ff',
                        width: '100%',
                        padding: '10px 0'
                    }}
                >
                    <div className="max-width-container">
                        <h2
                            className="trust-title-center"
                            style={{ margin: '6px 0 10px' }}
                        >
                            Khám Phá Ẩm Thực
                        </h2>

                        <div className="category-grid" style={{ gap: 70 }}> {/* ✅ nếu grid đang quá rộng */}
                            {['Món Á', 'Món Âu', 'Chay', 'Đồ uống'].map((cat, idx) => (
                                <div key={idx} className="cat-item spin-on-hover">
                                    <div className="cat-circle">
                                        <img src={`/images/cat-${idx + 1}.jpg`} alt={cat} />
                                    </div>
                                    <h4 style={{ margin: '8px 0 0' }}>{cat}</h4> {/* ✅ giảm margin h4 */}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* --- SECTION: CAM KẾT NIỀM TIN (TRUST & COMMITMENT) --- */}
                <section style={{ background: 'linear-gradient(180deg, #fef4b1ff 20%, #275b26ff 100%)', width: '100%', padding: '20px 0', }}>
                    <div className="max-width-container">
                        <div className="trust-header">
                            <h2 className="trust-title-center">Vì sao hàng triệu khách hàng tin chọn HaFo?</h2>
                            <p className="section-subtitle">Chúng tôi không chỉ giao món ăn, chúng tôi trao gửi sự tận tâm và trách nhiệm.</p>
                        </div>

                        <div className="trust-grid">
                            {/* Thẻ 1: Bảo mật & Quyền lợi */}
                            <div className="trust-card">
                                <div className="card-bg-icon">🛡️</div>
                                <div className="trust-icon-wrapper">
                                    <i className="fa-solid fa-shield-halved"></i>
                                </div>
                                <h3>Quyền Lợi Tối Thượng</h3>
                                <p>Mọi giao dịch và thông tin cá nhân của bạn đều được mã hóa. Hoàn tiền 100% nếu đơn hàng gặp sự cố lỗi từ hệ thống.</p>
                                <div className="card-status">Bảo Vệ Người Dùng</div>
                            </div>

                            {/* Thẻ 2: Chất lượng đối tác */}
                            <div className="trust-card active">
                                <div className="card-bg-icon">⭐</div>
                                <div className="trust-icon-wrapper">
                                    <i className="fa-solid fa-medal"></i>
                                </div>
                                <h3>Chất Lượng Món Ăn</h3>
                                <p>HaFo không ngừng hợp tác với các đối tác uy tín để mang đến những bữa ăn an toàn, vệ sinh và ngon miệng nhất.</p>
                                <div className="card-status">Chất Lượng Hàng Đầu</div>
                            </div>

                            {/* Thẻ 3: Tốc độ & Tương lai */}
                            <div className="trust-card">
                                <div className="card-bg-icon">🚀</div>
                                <div className="trust-icon-wrapper">
                                    <i className="fa-solid fa-bolt-lightning"></i>
                                </div>
                                <h3>Tầm Nhìn Phát Triển</h3>
                                <p>Với mục tiêu vươn xa, HaFo luôn lắng nghe phản hồi để nâng cấp hệ thống mỗi ngày, mang lại tiện ích tối đa cho bạn.</p>
                                <div className="card-status">Phát triển bền vững</div>
                            </div>
                        </div>
                    </div>
                </section>

            </section>
            {/* Sub-section: Bottom Grid (Review, App, Download) */}
            <section className="bottom-info-grid" style={{ background: '#275b26ff', width: '100%', padding: '80px 0' }}  >
                <div className="max-width-container" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <article className="info-box testimonial">
                        <h3>Khách hàng nói gì?</h3>
                        <div className="user-quote">
                            <img src="/images/avatar.png" alt="user"
                                style={{
                                    width: '200px',      /* Chỉnh độ rộng nhỏ lại */
                                    height: '200px',     /* Chiều cao bằng chiều rộng */
                                    borderRadius: '50%', /* Làm tròn hình ảnh */
                                    objectFit: 'cover',  /* Giúp ảnh không bị méo */
                                    marginBottom: '10px'
                                }}
                            />
                            <div>
                                <p>"HaFo là ứng dụng giao hàng tuyệt vời nhất!"</p>
                                <b>- Minh Anh, Quận 1</b>
                            </div>
                        </div>
                    </article>

                    <article className="info-box app-mockup">
                        <img src="/images/phone.jpg" alt="phone" className="app-img" />
                        <div className="app-desc">
                            <h3>Trải Nghiệm Siêu Mượt</h3>
                            <p>Theo dõi đơn hàng, thanh toán một chạm dễ dàng.</p>
                        </div>
                    </article>
                    <article className="info-box testimonial">
                        <h3>Khách hàng nói gì?</h3>
                        <div className="user-quote ">
                            <img src="/images/avatar1.jpg" alt="user"
                                style={{
                                    width: '200px',      /* Chỉnh độ rộng nhỏ lại */
                                    height: '200px',     /* Chiều cao bằng chiều rộng */
                                    borderRadius: '50%', /* Làm tròn hình ảnh */
                                    objectFit: 'cover',  /* Giúp ảnh không bị méo */
                                    marginBottom: '10px'
                                }}
                            />
                            <div>
                                <p>"HaFo là ứng dụng dễ sử dụng và rất tiện ích."</p>
                                <b>- Alex, Quận Tân Bình</b>
                            </div>
                        </div>
                    </article>
                </div>
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
                onOpenRegister={() => {
                    setShowLogin(false); // Tắt hộp Login
                    setShowRegister(true); // Mở hộp Register
                }}
            />
        </div>
    );
}
export default LandingPage;