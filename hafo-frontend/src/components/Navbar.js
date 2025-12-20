import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function Navbar({ onOpenLogin }) {
    const [user, setUser] = useState(null);
    const { totalCount } = useCart();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Kiểm tra đăng nhập khi load trang
    useEffect(() => {
        const loggedInUser = localStorage.getItem('user');
        if (loggedInUser) {
            setUser(JSON.parse(loggedInUser));
        }
    }, []);

    // Xử lý đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/'; // Quay về trang Landing Page
    };

    return (
        <header className="thanh-tren">
            <div className="hop dieu-huong">
                {/* LEFT: Logo */}
                <div className="ben-trai">
                    <div className="nut-menu"><span>☰</span></div>
                    <Link className="thuong-hieu" to={user ? "/home" : "/"} style={{ textDecoration: 'none' }}>
                        <img src="/images/logo.png" alt="HaFo" style={{ width: '32px', height: '32px', marginRight: '8px', verticalAlign: 'middle' }} />

                    </Link>
                </div>

                {/* MIDDLE & RIGHT: Thay đổi tùy theo trạng thái đăng nhập */}
                {user ? (
                    // --- GIAO DIỆN ĐÃ ĐĂNG NHẬP ---
                    <>
                        {/* Thanh tìm kiếm ở giữa (chỉ hiện khi đã đăng nhập) */}
                        <div className="search" style={{ gap: '10px', flex: 1, maxWidth: '260px', margin: '0 20px', display: 'flex', alignItems: 'center', background: 'var(--kem)', border: '1px solid var(--xam)', borderRadius: '999px', padding: '8px 12px' }}>
                            <span style={{ marginRight: '8px', opacity: 0.6 }}>🔍</span>
                            <input
                                type="text"
                                placeholder="Tìm quán, món ăn, địa chỉ..."
                                style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: 'var(--chu)', fontSize: '14px' }}
                            />
                        </div>

                        <div className="ben-phai">
                            {/* Profile Dropdown */}
                            <div className="profile" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                                <div className="avatar" style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#ddd', border: '2px solid var(--vang)', backgroundImage: 'url(/images/avt.jpg)', backgroundSize: 'cover' }}></div>
                                <span style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {user.fullName || user.username} ▾
                                </span>

                                {/* Dropdown Menu */}
                                {showProfileMenu && (
                                    <div className="profile-menu" style={{ position: 'absolute', top: '120%', right: 0, background: '#fff', border: '1px solid #e5dfd2', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '8px', minWidth: '200px', zIndex: 100 }}>
                                        <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', fontWeight: '600', borderRadius: '8px' }}>
                                            <i className="fa-regular fa-user"></i> Hồ sơ cá nhân
                                        </Link>
                                        <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', fontWeight: '600', borderRadius: '8px' }}>
                                            <i className="fa-regular fa-clock"></i> Lịch sử mua hàng
                                        </Link>
                                        <div style={{ borderTop: '1px solid #eee', margin: '5px 0' }}></div>
                                        <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '10px', background: 'none', border: 'none', color: '#EF4444', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px' }}>
                                            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Nút Giỏ hàng */}
                            <Link to="/cart" className="cart-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #ded6c7', borderRadius: '999px', padding: '8px 12px', textDecoration: 'none', color: 'inherit', fontWeight: '700', transition: '0.15s' }}>
                                <i className="fa-solid fa-cart-shopping" style={{ color: '#6c635b', fontSize: '16px' }}></i>
                                <span className="cart-count" style={{ minWidth: '18px', height: '18px', lineHeight: '18px', padding: '0 6px', fontSize: '12px', fontWeight: '800', textAlign: 'center', color: '#fff', background: 'var(--cam)', borderRadius: '999px' }}>
                                    {totalCount}
                                </span>
                            </Link>
                        </div>
                    </>
                ) : (
                    // --- GIAO DIỆN CHƯA ĐĂNG NHẬP (Landing Page) ---
                    <nav className="ben-phai" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <a href="#" style={{ color: 'var(--chu)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>Trở thành Đối tác</a>
                        <a href="#" style={{ color: 'var(--chu)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>Trung tâm Hỗ trợ</a>
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