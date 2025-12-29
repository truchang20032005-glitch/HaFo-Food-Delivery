import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import LoginModal from '../Auth/LoginModal';
import RegisterModal from '../Auth/RegisterModal';

function LandingPage() {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [registerRole, setRegisterRole] = useState(null);
    const [showRoleModal, setShowRoleModal] = useState(false);

    // ✅ Logic nhận diện Mobile
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePartnerClick = () => { setShowRoleModal(true); };

    const handleSelectRole = (roleType) => {
        let pendingRole = roleType === 'merchant' ? 'pending_merchant' : 'pending_shipper';
        setRegisterRole(pendingRole);
        setShowRoleModal(false);
        setShowRegister(true);
    };

    return (
        <div className="landing-page-container" style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url('/images/banner.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* ✅ CHỈ KÍCH HOẠT KHI XEM TRÊN ĐIỆN THOẠI - GIỮ NGUYÊN LAPTOP */}
            <style>{`
                @media (max-width: 768px) {
                    /* 1. Banner ngắn lại cực đại */
                    .mo-dau__noi-dung { 
                        flex-direction: column !important; 
                        padding: 150px 15px !important; /* Giảm cực sâu để banner ngắn lại */
                        text-align: center !important; 
                    }
                    .mo-dau__van-ban h1 { font-size: 24px !important; margin-bottom: 5px !important; }
                    .mo-dau__van-ban p { font-size: 13px !important; display: none; } /* Ẩn bớt text mô tả trên mobile cho gọn */

                    /* 2. Nút trở thành đối tác nhỏ lại */
                    .the-doi-tac { 
                        margin-top: 20px !important; 
                        padding: 8px 15px !important; 
                        min-width: 150px !important;
                        border-radius: 12px !important;
                    }
                    .the-doi-tac b { font-size: 13px !important; line-height: 1.2 !important; }
                    .the-doi-tac small { font-size: 10px !important; }

                    /* 3. Tiêu đề Khám phá ẩm thực nhỏ lại */
                    .category-section h2.trust-title-center { 
                        font-size: 18px !important; 
                        margin: 15px 0 !important; 
                    }

                    /* 4. 4 hình tròn và chữ món ăn nhỏ lại */
                    .category-grid { 
                        grid-template-columns: repeat(4, 1fr) !important; /* Để 4 món 1 hàng cho ngắn trang */
                        gap: 15px !important; 
                        padding: 15px 10px !important; 
                    }
                    .cat-circle { 
                        width: 75px !important; /* Bóp nhỏ hình tròn */
                        height: 75px !important; 
                        border-width: 2px !important;
                    }
                    .cat-item h4 { 
                        font-size: 11px !important; 
                        margin-top: 4px !important; 
                    }
                    
                    .trust-grid { grid-template-columns: 1fr !important; }
                    .bottom-info-grid .max-width-container { flex-direction: column !important; align-items: center; }
                    .info-box { width: 100% !important; margin-bottom: 30px; }
                    .info-box.app-mockup { display: none; }
                    .nut-chinh {
                        margin-top: 30px !important; /* Số càng to thì nút càng xích xuống dưới nha má */
                        padding: 11px 25px !important; /* Tiện thể bóp cái nút lại xíu cho xinh trên mobile */
                        font-size: 14px !important;
                    }
                    .trust-header { 
                        padding: 0 10px !important; 
                        margin-bottom: 25px !important; 
                        text-align: center !important;
                    }
                    h2.trust-title-center { 
                        font-size: 22px !important; /* Hạ size vừa đủ để không quá dài */
                        line-height: 1.5 !important; /* ✅ KHOẢNG CÁCH DÒNG: Để dòng trên không đè dòng dưới */
                        margin-bottom: 15px !important; /* ✅ ĐẨY XUỐNG: Để không đè lên đoạn văn ở dưới */
                        display: block !important;
                    }
                    .section-subtitle { 
                        font-size: 14px !important; 
                        line-height: 1.6 !important; /* ✅ Cho đoạn văn thoáng ra */
                        margin: 10px 0 25px 0 !important; 
                        display: block !important;
                        color: #d97706 !important; /* Màu cam đậm cho dễ đọc trên nền vàng */
                    }
                }
            `}</style>

            <Navbar onOpenLogin={() => setShowLogin(true)} />

            <div className="mo-dau" style={{ backgroundImage: 'url(/images/banner.jpg)' }}>
                <div className="mo-dau__noi-dung">
                    <div className="mo-dau__van-ban">
                        <h1>HaFo – Giao món ngon tận tay!</h1>
                        <p>Dễ dàng đặt món ăn yêu thích từ những quán ngon quanh bạn – chỉ với vài chạm.</p>
                        <button className="nut-chinh" onClick={() => setShowLogin(true)}>Đặt món ngay</button>
                    </div>

                    <div className="the-doi-tac" onClick={handlePartnerClick} style={{
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.9)',
                        padding: '20px',
                        borderRadius: '20px',
                        textAlign: 'center'
                    }}>
                        <b>Trở thành<br />Đối tác Nhà hàng / Shipper</b>
                        <small style={{ display: 'block' }}>Đăng ký ngay để tăng thu nhập</small>
                    </div>
                </div>
            </div>

            <section className="category-section">
                <section style={{ background: '#fef4b1ff', width: '100%', padding: '10px 0' }}>
                    <div className="max-width-container">
                        <h2 className="trust-title-center" style={{ margin: '6px 0 10px' }}>Khám Phá Ẩm Thực</h2>
                        <div className="category-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: isMobile ? 15 : 70,
                            padding: '0 20px'
                        }}>
                            {['Món Á', 'Món Âu', 'Chay', 'Đồ uống'].map((cat, idx) => (
                                <div key={idx} className="cat-item spin-on-hover" style={{ textAlign: 'center' }}>
                                    <div className="cat-circle" style={{
                                        width: isMobile ? '80px' : '150px', // ✅ Nhỏ lại khi là mobile
                                        height: isMobile ? '80px' : '150px', // ✅ Nhỏ lại khi là mobile
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        margin: '0 auto',
                                        border: '5px solid #fff'
                                    }}>
                                        <img src={`/images/cat-${idx + 1}.jpg`} alt={cat} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <h4 style={{ margin: '8px 0 0' }}>{cat}</h4>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section style={{ background: 'linear-gradient(180deg, #fef4b1ff 20%, #275b26ff 100%)', width: '100%', padding: '20px 0', }}>
                    <div className="max-width-container">
                        <div className="trust-header">
                            <h2 className="trust-title-center">Vì sao hàng triệu khách hàng tin chọn HaFo?</h2>
                            <p className="section-subtitle">Chúng tôi không chỉ giao món ăn, chúng tôi trao gửi sự tận tâm và trách nhiệm.</p>
                        </div>

                        <div className="trust-grid">
                            <div className="trust-card">
                                <div className="card-bg-icon">🛡️</div>
                                <div className="trust-icon-wrapper"><i className="fa-solid fa-shield-halved"></i></div>
                                <h3>Quyền Lợi Tối Thượng</h3>
                                <p>Mọi giao dịch và thông tin cá nhân của bạn đều được mã hóa. Hoàn tiền 100% nếu đơn hàng gặp sự cố lỗi từ hệ thống.</p>
                                <div className="card-status">Bảo Vệ Người Dùng</div>
                            </div>

                            <div className="trust-card active">
                                <div className="card-bg-icon">⭐</div>
                                <div className="trust-icon-wrapper"><i className="fa-solid fa-medal"></i></div>
                                <h3>Chất Lượng Món Ăn</h3>
                                <p>HaFo không ngừng hợp tác với các đối tác uy tín để mang đến những bữa ăn an toàn, vệ sinh và ngon miệng nhất.</p>
                                <div className="card-status">Chất Lượng Hàng Đầu</div>
                            </div>

                            <div className="trust-card">
                                <div className="card-bg-icon">🚀</div>
                                <div className="trust-icon-wrapper"><i className="fa-solid fa-bolt-lightning"></i></div>
                                <h3>Tầm Nhìn Phát Triển</h3>
                                <p>Với mục tiêu vươn xa, HaFo luôn lắng nghe phản hồi để nâng cấp hệ thống mỗi ngày, mang lại tiện ích tối đa cho bạn.</p>
                                <div className="card-status">Phát triển bền vững</div>
                            </div>
                        </div>
                    </div>
                </section>
            </section>

            <section className="bottom-info-grid" style={{ background: '#275b26ff', width: '100%', padding: '80px 0' }}>
                <div className="max-width-container" style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                    <article className="info-box testimonial" style={{ flex: 1, textAlign: 'center', color: '#000000ff' }}>
                        <h3>Khách hàng nói gì?</h3>
                        <div className="user-quote">
                            <img src="/images/avatar.png" alt="user" style={{ width: isMobile ? '120px' : '200px', height: isMobile ? '120px' : '200px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', margin: '0 auto' }} />
                            <div><p>"HaFo là ứng dụng giao hàng tuyệt vời nhất!"</p><b>- Minh Anh, Quận 1</b></div>
                        </div>
                    </article>

                    <article className="info-box app-mockup" style={{ flex: 1, textAlign: 'center' }}>
                        <img src="/images/phone.jpg" alt="phone" style={{ width: '250px', borderRadius: '30px' }} />
                        <div className="app-desc" style={{ color: '#000000ff', marginTop: '15px' }}><h3>Trải Nghiệm Siêu Mượt</h3><p>Theo dõi đơn hàng, thanh toán một chạm dễ dàng.</p></div>
                    </article>

                    <article className="info-box testimonial" style={{ flex: 1, textAlign: 'center', color: '#000000ff' }}>
                        <h3>Khách hàng nói gì?</h3>
                        <div className="user-quote">
                            <img src="/images/avatar1.jpg" alt="user" style={{ width: isMobile ? '120px' : '200px', height: isMobile ? '120px' : '200px', borderRadius: '50%', objectFit: 'cover', marginBottom: '10px', margin: '0 auto' }} />
                            <div><p>"HaFo là ứng dụng dễ sử dụng và rất tiện ích."</p><b>- Alex, Quận Tân Bình</b></div>
                        </div>
                    </article>
                </div>
            </section>

            {showRoleModal && (
                <div className="overlay show" onClick={() => setShowRoleModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="role-modal" onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: '30px', borderRadius: '25px', width: '90%', maxWidth: '400px' }}>
                        <h2 style={{ marginTop: 0, color: '#F97350', textAlign: 'center' }}>Bạn muốn đăng ký làm?</h2>
                        <p style={{ marginBottom: '20px', color: '#666', textAlign: 'center' }}>Vui lòng chọn vai trò đối tác để tiếp tục</p>
                        <button className="role-btn" onClick={() => handleSelectRole('merchant')} style={{ width: '100%', padding: '15px', margin: '10px 0', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #eee', background: '#fff', cursor: 'pointer', borderRadius: '15px' }}>
                            <i className="fa-solid fa-store" style={{ fontSize: '24px', color: '#F97350' }}></i>
                            <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold', fontSize: '16px' }}>Đối tác Nhà hàng</div><div style={{ fontSize: '13px', color: '#666' }}>Dành cho chủ quán, nhà hàng, cafe...</div></div>
                        </button>
                        <button className="role-btn" onClick={() => handleSelectRole('shipper')} style={{ width: '100%', padding: '15px', margin: '10px 0', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #eee', background: '#fff', cursor: 'pointer', borderRadius: '15px' }}>
                            <i className="fa-solid fa-motorcycle" style={{ fontSize: '24px', color: '#22C55E' }}></i>
                            <div style={{ textAlign: 'left' }}><div style={{ fontWeight: 'bold', fontSize: '16px' }}>Đối tác Tài xế</div><div style={{ fontSize: '13px', color: '#666' }}>Dành cho người có xe máy/xe đạp...</div></div>
                        </button>
                    </div>
                </div>
            )}

            <RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} role={registerRole} onOpenLogin={() => { setShowRegister(false); setShowLogin(true); }} />
            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onOpenRegister={() => { setShowLogin(false); setShowRegister(true); }} />
        </div>
    );
}
export default LandingPage;