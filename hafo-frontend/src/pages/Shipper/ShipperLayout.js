import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Shipper.css';

function ShipperLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const isActive = (path) => location.pathname.includes(path);

    // State bật tắt menu
    const [showMenu, setShowMenu] = useState(false);

    let title = "Đơn có thể nhận";
    if (isActive('history')) title = "Lịch sử hoạt động";
    if (isActive('profile')) title = "Hồ sơ tài xế";
    if (isActive('wallet')) title = "Ví tiền";

    // Hàm đăng xuất chung
    const handleLogout = () => {
        if (window.confirm("Đăng xuất tài khoản Shipper?")) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
            window.location.reload();
        }
    };

    return (
        <div className="shipper-app">
            {/* Header */}
            <header className="ship-header">
                <Link to="/shipper/dashboard" className="ship-logo">
                    <i className="fa-solid fa-motorcycle"></i> HaFo Shipper
                </Link>
                <div style={{ fontWeight: 800 }}>{title}</div>

                {/* AVATAR & DROPDOWN */}
                <div
                    className="ship-avatar"
                    style={{ position: 'relative' }}
                    onClick={() => setShowMenu(!showMenu)} // Bấm vào để bật/tắt
                >
                    <img src="/images/shipper.jpg" alt="Shipper" onError={(e) => e.target.src = 'https://via.placeholder.com/40'} />

                    {/* Menu Dropdown */}
                    {showMenu && (
                        <div style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            background: '#fff',
                            border: '1px solid #e5dfd2',
                            borderRadius: '8px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            minWidth: '150px',
                            zIndex: 1000, // Đảm bảo nổi lên trên cùng
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation(); // Tránh sự kiện nổi bọt
                                    handleLogout();
                                }}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '12px',
                                    background: '#fff',
                                    border: 'none',
                                    color: '#d00',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '14px'
                                }}
                            >
                                <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main>
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <Link to="/shipper/dashboard" className={`nav-item ${isActive('dashboard') ? 'active' : ''}`}>
                    <i className="fa-solid fa-list-ul"></i><span>Săn đơn</span>
                </Link>
                <Link to="/shipper/history" className={`nav-item ${isActive('history') ? 'active' : ''}`}>
                    <i className="fa-solid fa-clock-rotate-left"></i><span>Lịch sử</span>
                </Link>
                <Link to="/shipper/wallet" className={`nav-item ${isActive('wallet') ? 'active' : ''}`}>
                    <i className="fa-solid fa-wallet"></i><span>Ví tiền</span>
                </Link>
                <Link to="/shipper/profile" className={`nav-item ${isActive('profile') ? 'active' : ''}`}>
                    <i className="fa-regular fa-user"></i><span>Tôi</span>
                </Link>
            </nav>
        </div>
    );
}

export default ShipperLayout;