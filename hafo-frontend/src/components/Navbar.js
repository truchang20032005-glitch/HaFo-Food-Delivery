import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api'; // ✅ Đảm bảo import api

function Navbar({ onOpenLogin, onSearch, searchValue }) {
    const { user, logout } = useAuth();
    const { totalCount } = useCart();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [bump, setBump] = useState(false);
    const prevNotiCount = useRef(0);

    // ✅ STATE CHO THÔNG BÁO
    const [notiList, setNotiList] = useState([]);
    const [notiCount, setNotiCount] = useState(0);
    const [showNoti, setShowNoti] = useState(false);

    const location = useLocation();
    const isRegisterPage = location.pathname.startsWith('/register');

    const getAvatarUrl = (path) => {
        if (!path) return '/images/user.png';
        return path;
    };

    // ✅ HÀM LẤY THÔNG BÁO
    const fetchNotifications = useCallback(async () => {
        const currentUserId = user?._id || user?.id;
        if (!currentUserId) return;
        try {
            const res = await api.get(`/customer-reviews/notifications/customer/${currentUserId}`);
            const newCount = res.data.total;

            // ✅ Bước 3: Nếu số lượng mới lớn hơn số lượng cũ -> Phát âm thanh
            if (newCount > prevNotiCount.current) {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.log("Autoplay blocked"));
            }

            prevNotiCount.current = newCount; // Cập nhật lại số lượng cũ
            setNotiCount(newCount);
            setNotiList(res.data.notifications);
        } catch (err) { console.error(err); }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user, fetchNotifications]);

    useEffect(() => {
        const onAdded = () => {
            setBump(true);
            setTimeout(() => setBump(false), 380);
        };
        window.addEventListener('hafo_cart_added', onAdded);
        return () => window.removeEventListener('hafo_cart_added', onAdded);
    }, []);

    const handleLogoutClick = () => {
        logout();
        setShowProfileMenu(false);
        window.location.href = '/';
    };

    const handleMarkRead = async (type, notificationId) => {
        try {
            await api.put(`/customer-reviews/notifications/mark-read/${type}/${notificationId}`);
            fetchNotifications(); // Gọi lại hàm lấy thông báo để cập nhật số lượng chuông ngay
        } catch (err) {
            console.error("Lỗi đánh dấu đã đọc:", err);
        }
    };

    return (
        <header className="thanh-tren" style={{ position: 'sticky', top: 0, zIndex: 9999, overflow: 'visible' }}>
            <style>{`
                @media (max-width: 768px) {
                    .search { display: none !important; }
                    .ben-phai { gap: 10px !important; }
                    .phan-cach, .ben-phai a:not(.cart-btn) { display: none !important; }
                    .thuong-hieu span { font-size: 16px; }
                }
                .noti-dot { position: absolute; top: 0; right: 0; width: 10px; height: 10px; background: #ef4444; border: 2px solid #fff; borderRadius: 50%; }
            `}</style>

            <div className="hop dieu-huong">
                <div className="ben-trai">
                    <div className="nut-menu"><span>☰</span></div>
                    <Link className="thuong-hieu" to={user ? "/home" : "/"} style={{ textDecoration: 'none' }}>
                        <img src="/images/logo.png" alt="HaFo" style={{ width: '32px', height: '32px', marginRight: '8px', verticalAlign: 'middle' }} />
                        <span>HaFo</span>
                    </Link>
                </div>

                {user ? (
                    <>
                        {!isRegisterPage && (
                            <div className="search" style={{ flex: 1, maxWidth: '550px', margin: '0 20px', marginLeft: 'auto', display: 'flex', alignItems: 'center', background: '#f8f8f8', border: '1px solid #ccc', borderRadius: '50px', padding: '2px 10px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', cursor: 'pointer' }}>
                                <span style={{ marginRight: '12px', opacity: 0.6 }}>🔍</span>
                                <input
                                    type="text"
                                    placeholder="Tìm quán, món ăn, địa chỉ..."
                                    value={searchValue || ""}
                                    onChange={(e) => onSearch(e.target.value)}
                                    style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', color: '#333', fontSize: '16px', fontWeight: '500', padding: '8px', borderRadius: '50px' }}
                                />
                            </div>
                        )}
                        <div className="ben-phai" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                            {/* 🔔 CHUÔNG THÔNG BÁO KHÁCH HÀNG */}
                            {!isRegisterPage && (
                                <div style={{ position: 'relative' }}>
                                    <div
                                        style={{ fontSize: '20px', color: '#666', cursor: 'pointer', position: 'relative', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f1f5f9' }}
                                        onClick={() => { setShowNoti(!showNoti); setShowProfileMenu(false); }}
                                    >
                                        <i className="fa-regular fa-bell"></i>
                                        {notiCount > 0 && <span className="noti-dot" style={{ position: 'absolute', top: '0', right: '0', width: '15px', height: '15px', background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }}></span>}
                                    </div>

                                    {showNoti && (
                                        <div style={{ position: 'absolute', top: '120%', right: 0, width: '300px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 10000, overflow: 'hidden', border: '1px solid #eee' }}>
                                            <div style={{ padding: '12px 15px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                <span>Thông báo cho bạn</span>
                                                <span style={{ color: '#F97350', fontSize: '12px' }}>{notiCount} tin mới</span>
                                            </div>
                                            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                                {notiList.length === 0 ? (
                                                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Không có thông báo nào</div>
                                                ) : (
                                                    notiList.map((n, i) => (
                                                        /* ✅ ĐIỀU HƯỚNG THÔNG MINH: TRUYỀN ID QUA STATE ĐỂ History.js TỰ MỞ MODAL */
                                                        <Link
                                                            key={i}
                                                            to="/history"
                                                            state={{ openOrderId: n.orderId || n.id }}
                                                            onClick={() => {
                                                                setShowNoti(false);
                                                                handleMarkRead(n.type, n.notificationId);
                                                            }}
                                                            style={{ display: 'block', padding: '12px 15px', borderBottom: '1px solid #f8fafc', textDecoration: 'none', color: 'inherit', transition: '0.2s' }}
                                                            onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                                            onMouseOut={e => e.currentTarget.style.background = '#fff'}
                                                        >
                                                            <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                                                <i className={n.type === 'reply' ? "fa-solid fa-comment-dots" : "fa-solid fa-triangle-exclamation"}
                                                                    style={{ color: '#F97350', marginRight: '10px' }}></i>
                                                                {n.msg}
                                                            </div>
                                                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', marginLeft: '24px' }}>
                                                                {new Date(n.time).toLocaleString('vi-VN')}
                                                            </div>
                                                        </Link>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AVATAR VÀ MENU CÁ NHÂN */}
                            <div className="profile" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNoti(false); }}>
                                <div className="avatar" style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#ddd', border: '2px solid var(--vang)', backgroundImage: `url(${getAvatarUrl(user.avatar)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                <span style={{ fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {user.fullName || user.username} ▾
                                </span>
                                {showProfileMenu && (
                                    <div className="profile-menu" style={{ position: 'absolute', top: '120%', right: 0, background: '#fff', border: '1px solid #e5dfd2', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: '8px', minWidth: '200px', zIndex: 2147483647, display: 'block' }}>
                                        {!isRegisterPage && (
                                            <>
                                                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', fontWeight: '600', borderRadius: '8px' }}><i className="fa-regular fa-user"></i> Hồ sơ cá nhân</Link>
                                                <Link to="/history" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', color: '#333', fontWeight: '600', borderRadius: '8px' }}><i className="fa-regular fa-clock"></i> Lịch sử mua hàng</Link>
                                                <div style={{ borderTop: '1px solid #eee', margin: '6px 0' }} />
                                            </>
                                        )}
                                        <button onClick={handleLogoutClick} style={{ width: '100%', textAlign: 'left', padding: '10px', background: 'none', border: 'none', color: '#EF4444', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderRadius: '8px' }}>
                                            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* NÚT GIỎ HÀNG */}
                            {!isRegisterPage && (
                                <Link to="/cart" className="cart-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #ded6c7', borderRadius: 999, padding: '8px 12px', textDecoration: 'none', color: 'inherit', fontWeight: 700 }}>
                                    <span style={{ position: 'relative', width: 26, height: 26, display: 'inline-block' }}>
                                        <img src="/images/cart.png" alt="Giỏ hàng" style={{ width: 26, height: 26, display: 'block' }} />
                                        <span className={`cart-count ${bump ? 'bump' : ''}`} style={{ position: 'absolute', top: -6, right: -8, minWidth: 18, height: 18, lineHeight: '18px', padding: '0 6px', fontSize: 12, fontWeight: 800, textAlign: 'center', color: '#fff', background: 'var(--cam)', borderRadius: 999, border: '2px solid #fff' }}>{totalCount}</span>
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
                        <span style={{ color: 'var(--chu)', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Tiếng Việt ▾</span>
                        <button className="nut-dang-nhap" onClick={onOpenLogin}>Đăng nhập</button>
                    </nav>
                )}
            </div>
        </header>
    );
}
export default Navbar;