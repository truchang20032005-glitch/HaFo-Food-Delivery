import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom'; // 1. Đã thêm useLocation
import { useCart } from '../context/CartContext';


function Navbar({ onOpenLogin, onSearch }) {
    const [user, setUser] = useState(null);
    const { totalCount } = useCart();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const location = useLocation(); // 2. Khởi tạo hook để lấy URL hiện tại

    const isRestaurant = user?.role === "restaurant";

    // 3. Kiểm tra nếu URL hiện tại có chứa 'register' hoặc 'merchant'
    // (Đây là các trang đăng ký kinh doanh)
    const isRegistrationPage = location.pathname.includes('register') || location.pathname.includes('merchant');

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
        <header className="thanh-tren" style={{ 
            position: 'sticky', // Hoặc 'relative' tùy giao diện của bạn
            top: 0, 
            zIndex: 9999,      // Phải có z-index cho cả cái thanh header này
            overflow: 'visible' // CỰC KỲ QUAN TRỌNG: Phải là visible để menu con "thò" ra ngoài được
        }}>
            <div className="hop dieu-huong">
                {/* LEFT: Logo */}
                <div className="ben-trai">
                    <div className="nut-menu"><span>☰</span></div>
                    <Link className="thuong-hieu" to={user ? "/home" : "/"} style={{ textDecoration: 'none' }}>
                        <img
                            src="/images/logo.png"
                            alt="HaFo"
                            style={{
                                width: '32px',
                                height: '32px',
                                marginRight: '8px',
                                verticalAlign: 'middle',
                                objectFit: 'contain'
                            }}
                        />
                    </Link>
                </div>

                {/* MIDDLE & RIGHT: Thay đổi tùy theo trạng thái đăng nhập */}
                {user ? (
                    // --- GIAO DIỆN ĐÃ ĐĂNG NHẬP ---
                    <>
                        {/* Thanh tìm kiếm – Chỉ hiện khi: KHÔNG phải nhà hàng VÀ KHÔNG phải trang đăng ký */}
                        {!isRestaurant && !isRegistrationPage && (
                            <div
                                className="search"
                                style={{
                                    height: '40px',
                                    width: '100%',           // Cho phép co giãn theo khung
                                    maxWidth: '600px',       // Giới hạn chiều rộng tối đa (chỉnh con số này để ngắn hơn nữa)
                                    margin: '0 10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '0 14px',
                                    background: '#f7f4ef',
                                    border: '1px solid #e0d9cc',
                                    borderRadius: '20px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                    transition: '0.2s'
                                }}
                            >
                                <span style={{ marginRight: '8px', opacity: 0.6 }}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Tìm quán, món ăn, địa chỉ..."
                                    onChange={(e) => onSearch(e.target.value)}
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        outline: 'none',
                                        width: '100%',
                                        color: 'var(--chu)',
                                        fontSize: '14px'
                                    }}
                                    onFocus={(e) =>
                                        e.target.parentElement.style.border = '1px solid #ff7a00'
                                    }
                                    onBlur={(e) =>
                                        e.target.parentElement.style.border = '1px solid #e0d9cc'
                                    }
                                />
                            </div>
                        )}

                        <div className="ben-phai">
                            {/* Profile Dropdown */}
                            <div className="profile" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                                <div className="avatar" style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#ddd', border: '2px solid var(--vang)', backgroundImage: 'url(/images/avt.jpg)', backgroundSize: 'cover' }}></div>
                                <span style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {user.fullName || user.username} ▾
                                </span>

                                {/* Dropdown Menu */}
                                {showProfileMenu && (
                                    <div
                                        className="profile-menu"
                                        style={{
                                            position: 'absolute',
                                            top: '120%',
                                            right: 0,
                                            background: '#fff',
                                            border: '1px solid #e5dfd2',
                                            borderRadius: '12px',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                            padding: '8px',
                                            minWidth: '200px',
                                            zIndex: 2147483647,      // Đảm bảo số này rất lớn để nổi lên trên cùng
                                            visibility: 'visible',
                                            opacity: 1,
                                            display: 'block'
                                        }}
                                    >
                                        {!isRestaurant && (
                                            <>
                                                <Link
                                                    to="/profile"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        padding: '10px',
                                                        textDecoration: 'none',
                                                        color: '#333',
                                                        fontWeight: '600',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <i className="fa-regular fa-user"></i> Hồ sơ cá nhân
                                                </Link>

                                                <Link
                                                    to="/history"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                        padding: '10px',
                                                        textDecoration: 'none',
                                                        color: '#333',
                                                        fontWeight: '600',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <i className="fa-regular fa-clock"></i> Lịch sử mua hàng
                                                </Link>

                                                <div style={{ borderTop: '1px solid #eee', margin: '6px 0' }} />
                                            </>
                                        )}

                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                width: '100%',
                                                textAlign: 'left',
                                                padding: '10px',
                                                background: 'none',
                                                border: 'none',
                                                color: '#EF4444',
                                                fontWeight: '700',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                borderRadius: '8px'
                                            }}
                                        >
                                            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Giỏ hàng – Chỉ hiện khi: KHÔNG phải nhà hàng VÀ KHÔNG phải trang đăng ký */}
                            {!isRestaurant && !isRegistrationPage && (
                                <Link
                                    to="/cart"
                                    className="cart-btn"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        background: '#fff',
                                        border: '1px solid #ded6c7',
                                        borderRadius: '999px',
                                        padding: '8px 12px',
                                        textDecoration: 'none',
                                        fontWeight: '700'
                                    }}
                                >
                                    <i className="fa-solid fa-cart-shopping"></i>
                                    <span className="cart-count">{totalCount}</span>
                                </Link>
                            )}
                        </div>
                    </>
                ) : (
                    // --- GIAO DIỆN CHƯA ĐĂNG NHẬP (Landing Page) ---
                    <nav className="ben-phai" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        
                        {/* 1. Trở thành đối tác: Dẫn về trang đăng ký merchant hoặc một trang trung gian nếu bạn có */}
                        <Link to="/become-partner" style={{ color: 'var(--chu)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
                             Trở thành Đối tác
                        </Link>

                        {/* 2. Trung tâm hỗ trợ: Dẫn về route /support (như đã hướng dẫn ở bước trước) */}
                        <Link to="/support" style={{ color: 'var(--chu)', textDecoration: 'none', fontWeight: '600', fontSize: '14px' }}>
                            Trung tâm Hỗ trợ
                        </Link>

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