import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Shipper.css';
import { alertSuccess, confirmDialog } from '../../utils/hafoAlert';

function ShipperLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

    // State cho thông báo
    const [notiList, setNotiList] = useState([]);
    const [notiCount, setNotiCount] = useState(0);
    const [showNoti, setShowNoti] = useState(false);
    const prevNotiCount = useRef(0);

    const isActive = (path) => location.pathname.includes(path);
    const user = JSON.parse(localStorage.getItem('user')) || {};

    const getAvatarUrl = (path) => {
        if (!path) return '/images/user.png';
        return path;
    };

    let title = "Đơn có thể nhận";
    if (isActive('history')) title = "Lịch sử hoạt động";
    else if (isActive('profile')) title = "Hồ sơ tài xế";
    else if (isActive('wallet')) title = "Ví tiền của tôi";

    // Hàm lấy dữ liệu thông báo từ Backend
    const fetchNotifications = useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        const uid = user?.id || user?._id;
        if (!uid) return;

        try {
            // Đổi từ /reports/notifications/partner/... thành /notifications/partner/...
            const res = await api.get(`/notifications/partner/${uid}`);
            const data = res.data || [];

            if (data.length > prevNotiCount.current) {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.log("Autoplay blocked"));
            }
            prevNotiCount.current = data.length;
            setNotiList(data);
            setNotiCount(data.length);
        } catch (err) { console.error("Lỗi lấy thông báo Shipper:", err); }
    }, []);

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const handleLogout = async () => {
        // 2. Sử dụng confirmDialog thay cho window.confirm (Nhớ có await)
        const isConfirmed = await confirmDialog(
            "Đăng xuất Shipper?",
            "Bạn có chắc chắn muốn thoát khỏi phiên làm việc không?"
        );

        if (isConfirmed) {
            // 3. Xóa dữ liệu phiên đăng nhập
            localStorage.removeItem('user');
            localStorage.removeItem('token');

            // 4. Thông báo thành công và ĐỢI 2 giây cho mượt
            await alertSuccess(
                "Đã đăng xuất!",
                "Chúc bạn một ngày làm việc tốt lành. Hẹn gặp lại!"
            );

            // 5. Điều hướng về trang chủ và tải lại trang
            navigate('/');
            window.location.reload();
        }
    };

    useEffect(() => {
        setShowMenu(false);
        setShowNoti(false); // Đóng thông báo khi chuyển trang
    }, [location.pathname]);

    const handleMarkRead = async (type, notificationId) => {
        try {
            // Đổi từ /reports/mark-read-partner/... thành /notifications/mark-read/...
            await api.put(`/notifications/mark-read/${type}/${notificationId}`);
            fetchNotifications();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="shipper-app" style={{ paddingBottom: '70px', paddingTop: '60px', minHeight: '100vh', background: '#F7F2E5' }}>

            {/* HEADER CỐ ĐỊNH PHÍA TRÊN */}
            <header className="ship-header" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px', height: '60px', background: '#fff', borderBottom: '1px solid #eee' }}>

                <Link to="/shipper/dashboard" className="ship-logo" style={{ textDecoration: 'none', color: '#F97350', fontWeight: '900', fontSize: '18px' }}>
                    <i className="fa-solid fa-motorcycle"></i> HaFo
                </Link>

                <div style={{ fontWeight: 800, fontSize: '15px' }}>{title}</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

                    {/* 🔔 CHUÔNG THÔNG BÁO MOBILE-FRIENDLY */}
                    <div style={{ position: 'relative' }}>
                        <div
                            style={{ fontSize: '20px', color: '#64748b', cursor: 'pointer', position: 'relative' }}
                            onClick={() => { setShowNoti(!showNoti); setShowMenu(false); }}
                        >
                            <i className="fa-regular fa-bell"></i>
                            {notiCount > 0 && (
                                <span style={{ position: 'absolute', top: '-5px', right: '-5px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '1.5px solid #fff' }}></span>
                            )}
                        </div>

                        {showNoti && (
                            <div style={{
                                position: 'fixed', // Sử dụng fixed để căn giữa chuẩn mobile
                                top: '65px',
                                left: '10px',
                                right: '10px',
                                background: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                zIndex: 2000,
                                overflow: 'hidden',
                                border: '1px solid #eee',
                                maxWidth: '400px', // Giới hạn chiều rộng nếu dùng tablet/pc
                                margin: '0 auto'
                            }}>
                                <div style={{ padding: '15px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                    <span>Thông báo mới</span>
                                    <span style={{ color: '#F97350', fontSize: '12px' }}>{notiCount} mục</span>
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {notiList.length === 0 ? (
                                        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Chưa có thông báo nào</div>
                                    ) : (
                                        notiList.map((n, i) => (
                                            <Link
                                                key={i}
                                                to={n.link || '/shipper/history'}
                                                state={{ openId: n.id }}
                                                style={{ display: 'block', padding: '15px', borderBottom: '1px solid #f8fafc', textDecoration: 'none', color: 'inherit' }}
                                                onClick={() => {
                                                    setShowNoti(false);
                                                    // ✅ GỌI HÀM ĐÁNH DẤU ĐÃ ĐỌC
                                                    if (n.notificationId || n.id) {
                                                        handleMarkRead(n.type, n.id);
                                                    }
                                                }}
                                            >
                                                <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                                                    <i className={n.type === 'review' ? "fa-solid fa-star" : "fa-solid fa-circle-check"} style={{ color: '#F97350', marginRight: '10px' }}></i>
                                                    {n.msg}
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', marginLeft: '24px' }}>
                                                    {new Date(n.time).toLocaleString('vi-VN')}
                                                </div>
                                            </Link>
                                        ))
                                    )}
                                </div>
                                <div style={{ padding: '10px', textAlign: 'center', background: '#f8fafc', fontSize: '11px', color: '#94a3b8' }} onClick={() => setShowNoti(false)}>Đóng thông báo</div>
                            </div>
                        )}
                    </div>

                    {/* AVATAR SHIPPER */}
                    <div style={{ position: 'relative' }}>
                        <div
                            className="ship-avatar"
                            onClick={() => { setShowMenu(!showMenu); setShowNoti(false); }}
                            style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundImage: `url(${getAvatarUrl(user.avatar)})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '2px solid #F97350', cursor: 'pointer' }}
                        ></div>

                        {showMenu && (
                            <div style={{ position: 'absolute', top: '45px', right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '10px', minWidth: '180px', zIndex: 9999 }}>
                                <div style={{ padding: '5px 10px', borderBottom: '1px solid #f5f5f5', marginBottom: '5px' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{user.fullName || 'Tài xế'}</div>
                                    <div style={{ fontSize: '11px', color: '#888' }}>{user.phone}</div>
                                </div>
                                <button onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'none', color: '#EF4444', fontWeight: 'bold', textAlign: 'left', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                    <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main style={{ width: '100%' }}>
                <Outlet />
            </main>

            {/* THANH ĐIỀU HƯỚNG DƯỚI CÙNG (BOTTOM NAV) */}
            <nav className="bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '65px', background: '#fff', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 1000 }}>
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
    navLink: { display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', color: '#64748b', gap: '4px', flex: 1 },
    icon: { fontSize: '20px' },
    text: { fontSize: '11px', fontWeight: '700' }
};

export default ShipperLayout;