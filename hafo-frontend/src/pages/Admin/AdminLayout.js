import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Admin.css';

function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false); // State bật tắt menu logout

    // Hàm kiểm tra link active
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
            {/* SIDEBAR CỐ ĐỊNH */}
            <aside className="sidebar">
                <Link to="/admin/dashboard" className="logo">
                    <i className="fa-solid fa-gear"></i> HaFo Admin
                </Link>

                <Link to="/admin/dashboard" className={`nav-item ${isActive('dashboard')}`}>
                    <i className="fa-solid fa-chart-pie"></i> Dashboard
                </Link>
                <Link to="/admin/users" className={`nav-item ${isActive('users')}`}>
                    <i className="fa-solid fa-users"></i> Người dùng
                </Link>
                <Link to="/admin/shops" className={`nav-item ${isActive('shops')}`}>
                    <i className="fa-solid fa-store"></i> Cửa hàng
                </Link>
                <Link to="/admin/shippers" className={`nav-item ${isActive('shippers')}`}>
                    <i className="fa-solid fa-motorcycle"></i> Shipper
                </Link>
                <Link to="/admin/orders" className={`nav-item ${isActive('orders')}`}>
                    <i className="fa-solid fa-box"></i> Đơn hàng
                </Link>
                <Link to="/admin/pending" className={`nav-item ${isActive('pending')}`}>
                    <i className="fa-solid fa-clock"></i> Chờ xét duyệt
                </Link>
                <Link to="/admin/settings" className={`nav-item ${isActive('settings')}`}>
                    <i className="fa-solid fa-sliders"></i> Cấu hình
                </Link>
            </aside>

            {/* MAIN CONTENT */}
            <div className="main-content">
                {/* HEADER */}
                <header className="header">
                    <div>
                        <b style={{ fontSize: '18px' }}>Hệ thống quản trị</b>
                    </div>
                    <div className="right">
                        <i className="fa-regular fa-bell" style={{ fontSize: '20px', cursor: 'pointer', color: '#666' }}></i>

                        {/* Avatar & Menu */}
                        <div className="avatar" onClick={() => setShowMenu(!showMenu)}>
                            <img src="/images/logo.png" alt="Admin" onError={(e) => e.target.src = 'https://via.placeholder.com/40'} />
                        </div>

                        {/* Dropdown Menu */}
                        <div className={`logout-menu ${showMenu ? 'show' : ''}`}>
                            <button onClick={handleLogout}>
                                <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                            </button>
                        </div>
                    </div>
                </header>

                {/* NỘI DUNG TRANG CON */}
                <div className="content-pad">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;