import { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Admin.css';

function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [user, setUser] = useState({ fullName: 'Admin', role: 'Quản trị viên' });

    // ✅ TÁCH BIỆT 2 LOẠI COUNT ĐỂ ĐÚNG LOGIC
    const [regCount, setRegCount] = useState(0);             // Chỉ dành cho Sidebar "Xét duyệt"
    const [totalNotiCount, setTotalNotiCount] = useState(0);   // Dấu đỏ trên Chuông thông báo
    const [notiList, setNotiList] = useState([]);            // Danh sách nội dung thông báo
    const [showNoti, setShowNoti] = useState(false);         // Trạng thái đóng/mở menu thông báo
    const prevNotiCount = useRef(0);

    // ✅ HÀM LẤY DỮ LIỆU TỔNG HỢP (REFRESH SAU MỖI 30S)
    const refreshAdminData = async () => {
        try {
            const resNoti = await api.get('/pending/notifications');
            const newCount = resNoti.data.total;

            // ✅ Bước 3: Phát âm thanh nếu tổng thông báo tăng lên
            if (newCount > prevNotiCount.current) {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.log("Admin sound error"));
            }

            prevNotiCount.current = newCount;
            setTotalNotiCount(newCount);
            setNotiList(resNoti.data.notifications);

            const resReg = await api.get('/pending/count');
            setRegCount(resReg.data.total);
        } catch (err) { console.error(err); }
    };

    // Khởi tạo dữ liệu ban đầu
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) setUser(storedUser);

        const savedConfig = localStorage.getItem('adminConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            if (config.theme === 'dark') document.body.classList.add('dark');
            else document.body.classList.remove('dark');
        }

        refreshAdminData();
        const interval = setInterval(refreshAdminData, 30000); // Tự động cập nhật mỗi 30 giây
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
        if (path.includes('/reports')) return 'Báo cáo & Khiếu nại';
        if (path.includes('/transactions')) return 'Đối soát & Rút tiền';
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
                    <Link to="/admin/reports" className={`nav-item ${isActive('reports')}`}>
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <span>Báo cáo & Khiếu nại</span>
                    </Link>
                </div>

                <div className="nav-group">
                    <small>HỆ THỐNG</small>
                    <Link to="/admin/pending" className={`nav-item ${isActive('pending')}`}>
                        <div style={{ position: 'relative', display: 'flex' }}>
                            <i className="fa-solid fa-clock"></i>
                            {/* badge cho Sidebar: Chỉ hiện khi có ĐƠN ĐĂNG KÝ mới */}
                            {regCount > 0 && (
                                <span className="badge-on-icon" style={{ background: '#F97350', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', position: 'absolute', top: '-8px', right: '-12px' }}>{regCount}</span>
                            )}
                        </div>
                        <span style={{ marginLeft: '12px' }}>Xét duyệt</span>
                    </Link>
                    <Link to="/admin/transactions" className={`nav-item ${isActive('transactions')}`}>
                        <i className="fa-solid fa-money-bill-transfer"></i>
                        <span>Đối soát & Rút tiền</span>
                    </Link>
                    <Link to="/admin/settings" className={`nav-item ${isActive('settings')}`}>
                        <i className="fa-solid fa-sliders"></i> Cấu hình
                    </Link>
                </div>
            </aside>

            {/* MAIN CONTENT */}
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
                        {/* CHUÔNG THÔNG BÁO KIỂU FACEBOOK */}
                        <div className="icon-btn" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNoti(!showNoti)}>
                            <i className="fa-regular fa-bell"></i>
                            {/* Dấu đỏ chuông: Hiện khi có BẤT KỲ thông báo nào */}
                            {totalNotiCount > 0 && <span className="dot" style={{ position: 'absolute', top: '0', right: '0', width: '15px', height: '15px', background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }}></span>}

                            {showNoti && (
                                <div style={{
                                    position: 'absolute', top: '120%', right: 0, width: '320px',
                                    background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                    zIndex: 1000, overflow: 'hidden', border: '1px solid #eee'
                                }} onClick={(e) => e.stopPropagation()}>
                                    <div style={{ padding: '15px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Thông báo mới</span>
                                        <span style={{ color: '#F97350', fontSize: '12px' }}>{totalNotiCount} mục</span>
                                    </div>

                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {notiList.length === 0 ? (
                                            <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Không có thông báo mới</div>
                                        ) : (
                                            notiList.map((n, i) => (
                                                /* ✅ ĐIỀU HƯỚNG THÔNG MINH: Chuyển div thành Link và truyền state */
                                                <Link
                                                    key={i}
                                                    to={n.link}
                                                    state={{ openId: n.id }}
                                                    onClick={() => setShowNoti(false)}
                                                    style={{ display: 'block', padding: '12px 15px', borderBottom: '1px solid #f8fafc', textDecoration: 'none', color: 'inherit', transition: '0.2s' }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = '#f0f9ff'}
                                                    onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                                                >
                                                    <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                                        <i className={n.type === 'reg' ? "fa-solid fa-user-plus" : (n.type === 'report' ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-money-bill")}
                                                            style={{ color: '#F97350', marginRight: '8px' }}></i>
                                                        {n.msg}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>
                                                        {new Date(n.time).toLocaleString('vi-VN')}
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>

                                    <Link to="/admin/pending" onClick={() => setShowNoti(false)} style={{ display: 'block', padding: '12px', textAlign: 'center', background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>
                                        Xem tất cả yêu cầu chờ duyệt
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="profile-box" onClick={() => setShowMenu(!showMenu)} style={{ cursor: 'pointer' }}>
                            <div className="info">
                                <div className="name">{user.fullName}</div>
                                <div className="role">Admin</div>
                            </div>
                            <div className="avatar">
                                <img src={user.avatar || "/images/admin.png"} alt="Admin" onError={(e) => e.target.src = 'https://via.placeholder.com/40'} />
                            </div>
                        </div>

                        <div className={`logout-menu ${showMenu ? 'show' : ''}`} style={{ display: showMenu ? 'block' : 'none', position: 'absolute', top: '70px', right: '20px', zIndex: 1001 }}>
                            <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
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