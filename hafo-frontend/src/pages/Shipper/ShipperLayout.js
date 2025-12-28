import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Shipper.css';

function ShipperLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    // ✅ Định nghĩa hàm isActive (dùng includes để nhận diện cả trang con)
    const isActive = (path) => location.pathname.includes(path);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    const [showMenu, setShowMenu] = useState(false);

    const getAvatarUrl = (path) => {
        if (!path) return '/images/user.png';
        return path;
    };

    // ✅ SỬA TẠI ĐÂY: Xài hàm isActive thay vì viết dài
    let title = "Đơn có thể nhận";
    if (isActive('history')) title = "Lịch sử hoạt động";
    else if (isActive('profile')) title = "Hồ sơ tài xế";
    else if (isActive('wallet')) title = "Ví tiền của tôi";

    const handleLogout = () => {
        if (window.confirm("Đăng xuất tài khoản Shipper?")) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
            window.location.reload();
        }
    };

    useEffect(() => {
        setShowMenu(false);
    }, [location.pathname]);

    return (
        <div className="shipper-app" style={{
            paddingBottom: '70px',
            paddingTop: '60px',
            minHeight: '100vh',
            background: '#F7F2E5'
        }}>
            <header className="ship-header" style={{
                position: 'fixed', top: 0, left: 0, right: 0,
                zIndex: 1000, display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '0 15px', height: '60px',
                background: '#fff', borderBottom: '1px solid #eee'
            }}>
                <Link to="/shipper/dashboard" className="ship-logo" style={{ textDecoration: 'none', color: '#F97350', fontWeight: '900', fontSize: '18px' }}>
                    <i className="fa-solid fa-motorcycle"></i> HaFo
                </Link>

                <div style={{ fontWeight: 800, fontSize: '15px' }}>{title}</div>

                <div style={{ position: 'relative' }}>
                    <div
                        className="ship-avatar"
                        onClick={() => setShowMenu(!showMenu)}
                        style={{
                            width: '35px', height: '35px', borderRadius: '50%',
                            backgroundImage: `url(${getAvatarUrl(user.avatar)})`,
                            backgroundSize: 'cover', backgroundPosition: 'center',
                            border: '2px solid #F97350', cursor: 'pointer'
                        }}
                    ></div>

                    {showMenu && (
                        <div style={{
                            position: 'absolute', top: '45px', right: 0,
                            background: '#fff', borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            padding: '10px', minWidth: '180px', zIndex: 9999
                        }}>
                            <div style={{ padding: '5px 10px', borderBottom: '1px solid #f5f5f5', marginBottom: '5px' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{user.fullName || 'Tài xế'}</div>
                                <div style={{ fontSize: '11px', color: '#888' }}>{user.phone}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                style={{
                                    width: '100%', border: 'none', background: 'none',
                                    color: '#EF4444', fontWeight: 'bold', textAlign: 'left',
                                    padding: '8px 10px', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', gap: '8px', fontSize: '14px'
                                }}
                            >
                                <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main style={{ width: '100%' }}>
                <Outlet />
            </main>

            <nav className="bottom-nav" style={{
                position: 'fixed', bottom: 0, left: 0, right: 0,
                height: '65px', background: '#fff', borderTop: '1px solid #eee',
                display: 'flex', justifyContent: 'space-around', alignItems: 'center',
                zIndex: 1000
            }}>
                {/* ✅ SỬA TẠI ĐÂY: Xài hàm isActive cho các nút Menu */}
                <Link to="/shipper/dashboard" className={`nav-item ${isActive('dashboard') ? 'active' : ''}`} style={S.navLink}>
                    <i className="fa-solid fa-list-ul" style={S.icon}></i><span style={S.text}>Săn đơn</span>
                </Link>
                <Link to="/shipper/history" className={`nav-item ${isActive('history') ? 'active' : ''}`} style={S.navLink}>
                    <i className="fa-solid fa-clock-rotate-left" style={S.icon}></i><span style={S.text}>Lịch sử</span>
                </Link>
                <Link to="/shipper/wallet" className={`nav-item ${isActive('wallet') ? 'active' : ''}`} style={S.navLink}>
                    <i className="fa-solid fa-wallet" style={S.icon}></i><span style={S.text}>Ví tiền</span>
                </Link>
                <Link to="/shipper/profile" className={`nav-item ${isActive('profile') ? 'active' : ''}`} style={S.navLink}>
                    <i className="fa-regular fa-user" style={S.icon}></i><span style={S.text}>Tôi</span>
                </Link>
            </nav>
        </div>
    );
}

const S = {
    navLink: {
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textDecoration: 'none', color: '#000000ff', gap: '4px', flex: 1
    },
    icon: { fontSize: '20px' },
    text: { fontSize: '11px', fontWeight: '700' }
};

export default ShipperLayout;