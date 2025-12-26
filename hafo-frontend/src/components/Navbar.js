import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // 1. Import AuthContext

function Navbar({ onOpenLogin, onSearch }) {
    // 2. Lấy user từ Context thay vì localStorage thủ công
    // Khi Profile gọi login(), biến user ở đây sẽ tự cập nhật
    const { user, logout } = useAuth();

    const { totalCount } = useCart();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [bump, setBump] = useState(false);

    const location = useLocation();
    const isRegisterPage = location.pathname.startsWith('/register');

    // 3. Helper xử lý ảnh avatar (Giống bên Profile)
    const getAvatarUrl = (path) => {
        // Nếu không có path -> trả về ảnh mặc định
        if (!path) return '/images/user.png';
        // Vì dùng Cloudinary, path luôn là URL (https://...), trả về luôn
        return path;
    };

    useEffect(() => {
        const onAdded = () => {
            setBump(true);
            setTimeout(() => setBump(false), 380);
        };
        window.addEventListener('hafo_cart_added', onAdded);
        return () => window.removeEventListener('hafo_cart_added', onAdded);
    }, []);

    const handleLogoutClick = () => {
        logout(); // Gọi hàm logout từ context
        setShowProfileMenu(false);
        window.location.href = '/';
    };

    return (
        <header className="thanh-tren" style={{
            position: 'sticky',
            top: 0,
            zIndex: 9999,
            overflow: 'visible'
        }}>
            <div className="hop dieu-huong">
                {/* LEFT: Logo */}
                <div className="ben-trai">
                    <div className="nut-menu"><span>☰</span></div>
                    <Link className="thuong-hieu" to={user ? "/home" : "/"} style={{ textDecoration: 'none' }}>
                        <img
                            src="/images/logo.png"
                            alt="HaFo"
                            style={{ width: '32px', height: '32px', marginRight: '8px', verticalAlign: 'middle' }}
                        />
                        <span>HaFo</span>
                    </Link>
                </div>

                {/* MIDDLE & RIGHT */}
                {user ? (
                    <>
                        {!isRegisterPage && (
                            <div className="search" style={{
                                flex: 1, maxWidth: '550px', margin: '0 20px', marginLeft: 'auto',
                                display: 'flex', alignItems: 'center', background: '#f8f8f8',
                                border: '1px solid #ccc', borderRadius: '50px', padding: '2px 10px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', transition: 'all 0.3s ease', cursor: 'pointer'
                            }}>
                                <span style={{ marginRight: '12px', opacity: 0.6 }}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Tìm quán, món ăn, địa chỉ..."
                                    style={{
                                        border: 'none', background: 'transparent', outline: 'none', width: '100%',
                                        color: '#333', fontSize: '16px', fontWeight: '500', padding: '8px', borderRadius: '50px',
                                    }}
                                    onFocus={(e) => e.target.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)'}
                                    onBlur={(e) => e.target.style.boxShadow = 'none'}
                                />
                            </div>
                        )}

                        <div className="ben-phai">
                            {/* Profile Dropdown */}
                            <div className="profile" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>

                                {/* 4. CẬP NHẬT PHẦN HIỂN THỊ AVATAR ĐỘNG */}
                                <div className="avatar" style={{
                                    width: '34px', height: '34px', borderRadius: '50%',
                                    background: '#ddd', border: '2px solid var(--vang)',
                                    backgroundImage: `url(${getAvatarUrl(user.avatar)})`, // <-- Dùng hàm getAvatarUrl
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                }}></div>

                                <span style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {user.fullName || user.username} ▾
                                </span>

                                {/* Dropdown Menu */}
                                {showProfileMenu && (
                                    <div className="profile-menu" style={{
                                        position: 'absolute', top: '120%', right: 0, background: '#fff',
                                        border: '1px solid #e5dfd2', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                        padding: '8px', minWidth: '200px', zIndex: 2147483647, display: 'block'
                                    }}
                                    >
                                        {!isRegisterPage && (
                                            <>
                                                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', fontWeight: '600', borderRadius: '8px' }}>
                                                    <i className="fa-regular fa-user"></i> Hồ sơ cá nhân
                                                </Link>
                                                <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', fontWeight: '600', borderRadius: '8px' }}>
                                                    <i className="fa-regular fa-clock"></i> Lịch sử mua hàng
                                                </Link>
                                                <div style={{ borderTop: '1px solid #eee', margin: '6px 0' }} />
                                            </>
                                        )}

                                        <button onClick={handleLogoutClick} style={{ width: '100%', textAlign: 'left', padding: '10px', background: 'none', border: 'none', color: '#EF4444', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px' }}>
                                            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!isRegisterPage && (
                                <Link to="/cart" className="cart-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #ded6c7', borderRadius: 999, padding: '8px 12px', textDecoration: 'none', color: 'inherit', fontWeight: 700, transition: '0.15s' }}>
                                    <span style={{ position: 'relative', width: 26, height: 26, display: 'inline-block' }}>
                                        <img src="/images/cart.png" alt="Giỏ hàng" style={{ width: 26, height: 26, display: 'block' }} />
                                        <span className={`cart-count ${bump ? 'bump' : ''}`} style={{ position: 'absolute', top: -6, right: -8, minWidth: 18, height: 18, lineHeight: '18px', padding: '0 6px', fontSize: 12, fontWeight: 800, textAlign: 'center', color: '#fff', background: 'var(--cam)', borderRadius: 999, border: '2px solid #fff' }}>
                                            {totalCount}
                                        </span>
                                    </span>
                                </Link>
                            )}
                        </div>
                    </>
                ) : (
                    <nav className="ben-phai" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <Link to="/become-partner" style={{ color: 'var(--chu)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>Trở thành Đối tác</Link>
                        <Link to="/support" style={{ color: 'var(--chu)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>Trung tâm Hỗ trợ</Link>
                        <div className="phan-cach" style={{ width: '1px', height: '18px', background: 'var(--xam)' }}></div>
                        <a href="#" style={{ color: 'var(--chu)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>Tiếng Việt ▾</a>
                        <button className="nut-dang-nhap" onClick={onOpenLogin}>Đăng nhập</button>
                    </nav>
                )}
            </div>
        </header>
    );
}

export default Navbar;