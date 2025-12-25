import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Admin.css';

function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [user, setUser] = useState({ fullName: 'Admin', role: 'Quản trị viên' });

    // Lấy thông tin User từ localStorage
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    // Logic xác định tiêu đề trang dựa trên URL
    const getPageTitle = (path) => {
        if (path.includes('/dashboard')) return 'Tổng quan hệ thống';
        if (path.includes('/users')) return 'Quản lý người dùng';
        if (path.includes('/shops')) return 'Quản lý cửa hàng';
        if (path.includes('/shippers')) return 'Quản lý tài xế';
        if (path.includes('/orders')) return 'Danh sách đơn hàng';
        if (path.includes('/pending')) return 'Xét duyệt đối tác';
        if (path.includes('/settings')) return 'Cấu hình hệ thống';
        return 'Hệ thống quản trị';
    };

    const currentTitle = getPageTitle(location.pathname);
    const isActive = (path) => location.pathname.includes(path) ? 'active' : '';

    const handleLogout = () => {
        if (window.confirm("Đăng xuất khỏi trang quản trị?")) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
            window.location.reload();
        }
    };

    return (
        <div className="admin-body">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <Link to="/admin/dashboard" className="logo">
                    <i className="fa-solid fa-bolt" style={{ color: '#F97350' }}></i> HaFo Admin
                </Link>

                <div className="nav-group">
                    <small>CHÍNH</small>
                    <Link to="/admin/dashboard" className={`nav-item ${isActive('dashboard')}`}>
                        <i className="fa-solid fa-chart-pie"></i> Dashboard
                    </Link>
                    <Link to="/admin/orders" className={`nav-item ${isActive('orders')}`}>
                        <i className="fa-solid fa-box"></i> Đơn hàng
                    </Link>
                </div>

                <div className="nav-group">
                    <small>QUẢN LÝ</small>
                    <Link to="/admin/users" className={`nav-item ${isActive('users')}`}>
                        <i className="fa-solid fa-users"></i> Người dùng
                    </Link>
                    <Link to="/admin/shops" className={`nav-item ${isActive('shops')}`}>
                        <i className="fa-solid fa-store"></i> Cửa hàng
                    </Link>
                    <Link to="/admin/shippers" className={`nav-item ${isActive('shippers')}`}>
                        <i className="fa-solid fa-motorcycle"></i> Shipper
                    </Link>
                </div>

                <div className="nav-group">
                    <small>HỆ THỐNG</small>
                    <Link to="/admin/pending" className={`nav-item ${isActive('pending')}`}>
                        <i className="fa-solid fa-clock"></i> Xét duyệt
                        {/* Badge demo số lượng chờ */}
                        <span className="nav-badge">3</span>
                    </Link>
                    <Link to="/admin/settings" className={`nav-item ${isActive('settings')}`}>
                        <i className="fa-solid fa-sliders"></i> Cấu hình
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="main-content">
                {/* --- HEADER HIỆN ĐẠI --- */}
                <header className="header">
                    {/* Bên trái: Tiêu đề & Breadcrumb */}
                    <div className="header-left">
                        <div className="page-title">{currentTitle}</div>
                        <div className="breadcrumb">Admin / {currentTitle}</div>
                    </div>

                    {/* Ở giữa: Thanh tìm kiếm */}
                    <div className="header-search">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input type="text" placeholder="Tìm kiếm đơn hàng, user..." />
                    </div>

                    {/* Bên phải: Thông báo & Profile */}
                    <div className="header-right">
                        <div className="icon-btn">
                            <i className="fa-regular fa-bell"></i>
                            <span className="dot"></span>
                        </div>

                        <div className="profile-box" onClick={() => setShowMenu(!showMenu)}>
                            <div className="info">
                                <div className="name">{user.fullName}</div>
                                <div className="role">Admin</div>
                            </div>
                            <div className="avatar">
                                <img src="/images/admin.png" alt="Admin" onError={(e) => e.target.src = 'https://via.placeholder.com/40'} />
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        <div className={`logout-menu ${showMenu ? 'show' : ''}`}>
                            <button onClick={handleLogout}>
                                <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                            </button>
                        </div>
                    </div>
                </header>

                <div className="content-pad">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;