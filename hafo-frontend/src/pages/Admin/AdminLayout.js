import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Admin.css';

function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [user, setUser] = useState({ fullName: 'Admin', role: 'Quản trị viên' });

    // State lưu số lượng chờ duyệt thực tế
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const savedConfig = localStorage.getItem('adminConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (config.theme === 'dark') {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }
    }, []);

    // Lấy thông tin User & Số lượng pending
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUser(storedUser);
        }

        // --- GỌI API ĐẾM SỐ LƯỢNG ---
        const fetchPendingCount = async () => {
            try {
                // Gọi endpoint /count vừa tạo ở backend
                const res = await api.get('/pending/count');
                setPendingCount(res.data.total);
            } catch (err) {
                console.error("Lỗi lấy số lượng chờ:", err);
            }
        };

        fetchPendingCount();

        // (Tùy chọn) Có thể set interval để tự động cập nhật mỗi 30s
        const interval = setInterval(fetchPendingCount, 30000);
        return () => clearInterval(interval);

    }, []);

    // Logic tiêu đề trang
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
                        {/* Wrapper để định vị badge */}
                        <div style={{ position: 'relative', display: 'flex' }}>
                            <i className="fa-solid fa-clock"></i>

                            {/* CHỈ HIỂN THỊ KHI CÓ ĐƠN CHỜ (>0) */}
                            {pendingCount > 0 && (
                                <span className="badge-on-icon">{pendingCount}</span>
                            )}
                        </div>
                        <span style={{ marginLeft: '12px' }}>Xét duyệt</span>
                    </Link>
                    <Link to="/admin/settings" className={`nav-item ${isActive('settings')}`}>
                        <i className="fa-solid fa-sliders"></i> Cấu hình
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT (Giữ nguyên phần Header đẹp đã làm ở câu trước) */}
            <div className="main-content">
                <header className="header">
                    <div className="header-left">
                        <div className="page-title">{currentTitle}</div>
                        <div className="breadcrumb">Admin / {currentTitle}</div>
                    </div>

                    <div className="header-search">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input type="text" placeholder="Tìm kiếm đơn hàng, user..." />
                    </div>

                    <div className="header-right">
                        <div className="icon-btn">
                            <i className="fa-regular fa-bell"></i>
                            {/* Logic thông báo giả định, sau này có thể thay bằng pendingCount */}
                            {pendingCount > 0 && <span className="dot"></span>}
                        </div>

                        <div className="profile-box" onClick={() => setShowMenu(!showMenu)}>
                            <div className="info">
                                <div className="name">{user.fullName}</div>
                                <div className="role">Admin</div>
                            </div>
                            <div className="avatar">
                                <img src={user.avatar || "/images/admin.png"} alt="Admin" onError={(e) => e.target.src = 'https://via.placeholder.com/40'} />
                            </div>
                        </div>

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