import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import './Merchant.css';
import { alertSuccess, confirmDialog } from '../../utils/hafoAlert';
import { io } from 'socket.io-client';

// Kết nối đến Server (Thay URL bằng link backend của bạn)
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;
const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    withCredentials: true
});

function MerchantLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // State cho quán và thông báo
    const [myShop, setMyShop] = useState(null);
    const [notiList, setNotiList] = useState([]);
    const [notiCount, setNotiCount] = useState(0);
    const [showNoti, setShowNoti] = useState(false);
    const prevNotiCount = useRef(-1);

    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || ''; // Lấy từ khóa từ URL
    const [localSearch, setLocalSearch] = useState(searchQuery);

    const isActive = (path) => location.pathname.includes(path) ? 'active' : '';

    const handleSearchChange = (e) => {
        setLocalSearch(e.target.value);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearch) {
                setSearchParams({ q: localSearch });
            } else {
                setSearchParams({});
            }
        }, 400); // 400ms là khoảng thời gian lý tưởng

        return () => clearTimeout(timer);
    }, [localSearch, setSearchParams]);

    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    // Hàm lấy dữ liệu thông báo
    const fetchNotifications = useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        const uid = user?.id || user?._id;
        if (!uid) return;

        try {
            const res = await api.get(`/notifications/partner/${uid}`);
            const data = res.data || [];

            if (prevNotiCount.current !== -1 && data.length > prevNotiCount.current) {
                const audio = new Audio('/sounds/notification.mp3');
                audio.play().catch(e => console.log("Autoplay blocked"));
            }
            prevNotiCount.current = data.length;
            setNotiList(data);
            setNotiCount(data.length);
        } catch (err) { console.error("Lỗi lấy thông báo Merchant:", err); }
    }, []);

    useEffect(() => {
        const unlockAudio = () => {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0; // Phát tiếng im lặng để "xin phép" trình duyệt
            audio.play()
                .then(() => {
                    window.removeEventListener('click', unlockAudio);
                    console.log("🔊 Audio đã được kích hoạt cho trang Nhà hàng!");
                })
                .catch(() => { });
        };
        window.addEventListener('click', unlockAudio);
        return () => window.removeEventListener('click', unlockAudio);
    }, []);

    // Khi vào trang, gọi API để lấy thông tin quán
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            api.get(`/restaurants/my-shop/${user.id || user._id}`).then(res => {
                if (res.data) {
                    setMyShop(res.data);
                    const shopId = res.data._id;

                    socket.emit('join-restaurant', shopId);

                    // ✅ 2. GỌI NGAY LÚC VỪA VÀO TRANG: Để lấy các đơn 'new' đang chờ
                    fetchNotifications(shopId);

                    // 3. Lắng nghe thông báo mới từ Socket
                    socket.off('new-notification');
                    socket.on('new-notification', () => {
                        console.log("🔔 Có tín hiệu thông báo mới từ Socket!");
                        fetchNotifications(shopId);
                    });
                }
            });
        }

        // ✅ Chỉ ngắt kết nối khi Merchant thực sự đăng xuất hoặc rời khỏi layout này
        return () => {
            socket.off('new-notification');
            // Không nhất thiết phải disconnect() nếu bạn muốn socket duy trì xuyên suốt app
        };
    }, [fetchNotifications]);

    const handleLogout = async () => {
        const isConfirmed = await confirmDialog(
            "Đăng xuất?",
            "Bạn có chắc chắn muốn rời khỏi tài khoản của mình không?"
        );

        if (isConfirmed) {
            // 3. Xóa thông tin đăng nhập
            localStorage.removeItem('user');
            localStorage.removeItem('token');

            // 4. Hiển thị lời chào tạm biệt và ĐỢI 2 giây (để user kịp đọc)
            await alertSuccess(
                "Đã đăng xuất!",
                "Hẹn gặp lại bạn sớm với những món ăn ngon nhé!"
            );

            // 5. Điều hướng và làm mới trạng thái ứng dụng
            navigate('/');
            window.location.reload();
        }
    };

    const handleMarkRead = async (type, notificationId) => {
        try {
            // Đổi đường dẫn cho khớp với notification.js
            await api.put(`/notifications/mark-read/${type}/${notificationId}`);
            fetchNotifications();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="merchant-app" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            {/* HEADER */}
            <header className="top" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                <div className="top-inner">
                    {/* LOGO BÊN TRÁI */}
                    <div className="brand">
                        <Link to="/merchant/dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img src="/images/logo.png" alt="HaFo" style={{ width: '32px' }} />
                            <span>HaFo Merchant</span>
                        </Link>
                    </div>

                    {/* THANH TÌM KIẾM Ở GIỮA */}
                    <div className="search">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input
                            type="text"
                            placeholder="Tìm kiếm đơn hàng, khách hàng..."
                            value={localSearch}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {/* KHU VỰC CHUÔNG VÀ AVATAR BÊN PHẢI */}
                    <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                        {/* 🔔 CHUÔNG THÔNG BÁO (MỚI THÊM) */}
                        <div style={{ position: 'relative' }}>
                            <div
                                style={{ fontSize: '20px', color: '#64748b', cursor: 'pointer', position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#f1f5f9' }}
                                onClick={() => setShowNoti(!showNoti)}
                            >
                                <i className="fa-regular fa-bell"></i>
                                {notiCount > 0 && (
                                    <span style={{ position: 'absolute', top: '8px', right: '8px', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }}></span>
                                )}
                            </div>

                            {/* DROPDOWN THÔNG BÁO */}
                            {showNoti && (
                                <div style={{
                                    position: 'absolute', top: '120%', right: 0, width: '300px',
                                    background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                                    zIndex: 2000, overflow: 'hidden', border: '1px solid #eee'
                                }}>
                                    <div style={{ padding: '15px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                        <span>Thông báo</span>
                                        <span style={{ color: '#F97350', fontSize: '12px' }}>{notiCount} tin mới</span>
                                    </div>

                                    <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                        {(notiList || []).length === 0 ? (
                                            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                                                <i className="fa-solid fa- Inbox" style={{ display: 'block', fontSize: '24px', marginBottom: '10px', opacity: 0.2 }}></i>
                                                Chưa có thông báo nào
                                            </div>
                                        ) : (
                                            notiList.map((n, i) => (
                                                <Link
                                                    key={i}
                                                    to={n.link}
                                                    state={{ openId: n.id }}
                                                    onClick={() => {
                                                        setShowNoti(false);
                                                        // ✅ GỌI HÀM ĐÁNH DẤU ĐÃ ĐỌC
                                                        if (n.notificationId || n.id) {
                                                            handleMarkRead(n.type, n.id);
                                                        }
                                                    }}
                                                    style={{ display: 'block', padding: '12px 15px', borderBottom: '1px solid #f8fafc', textDecoration: 'none', transition: '0.2s', background: '#fff' }}
                                                    onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                                    onMouseOut={e => e.currentTarget.style.background = '#fff'}
                                                >
                                                    <div style={{ fontSize: '13px', color: '#1e293b', lineHeight: '1.4' }}>
                                                        <i className={n.type === 'order' ? "fa-solid fa-box" : "fa-solid fa-star"}
                                                            style={{ color: '#F97350', marginRight: '10px' }}></i>
                                                        {n.msg}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px', marginLeft: '24px' }}>
                                                        {new Date(n.time).toLocaleString('vi-VN')}
                                                    </div>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                    <div style={{ padding: '10px', textAlign: 'center', background: '#f8fafc', fontSize: '12px', borderTop: '1px solid #eee' }}>
                                        HaFo Merchant System
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AVATAR QUÁN */}
                        <div className="profile" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <img
                                className="avatar"
                                src={myShop?.image || "https://via.placeholder.com/40"}
                                alt="Avatar"
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                            />

                            {showProfileMenu && (
                                <div style={{ position: 'absolute', top: '120%', right: 0, background: '#fff', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: '200px', zIndex: 1000, overflow: 'hidden' }}>
                                    <div style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#64748b', background: '#f8fafc' }}>
                                        Quán: <b>{myShop?.name || 'Đối tác'}</b>
                                    </div>
                                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '12px', background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="wrap">
                <div className="grid">
                    {/* SIDEBAR */}
                    <aside>
                        <section className="panel">
                            <div className="head">Cửa hàng của bạn</div>
                            <div className="body">
                                <div className="row">
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <img
                                            style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }}
                                            src={myShop?.image || "https://via.placeholder.com/40?text=Shop"}
                                            alt=""
                                        />
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '15px', lineHeight: '1.2' }}>
                                                {myShop ? myShop.name : "Đang cập nhật..."}
                                            </div>
                                            <div className="legend" style={{ fontSize: '10px', marginTop: '2px' }}>
                                                {myShop ? `ID: ${myShop._id.slice(-6).toUpperCase()}` : "Chưa có ID"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="hr"></div>

                                <div className="list-col">
                                    <Link to="/merchant/dashboard" className={`btn ${isActive('dashboard') ? 'active' : ''}`}><i className="fa-solid fa-chart-line"></i> Tổng quan</Link>
                                    <Link to="/merchant/menu" className={`btn ${isActive('menu') ? 'active' : ''}`}><i className="fa-solid fa-utensils"></i> Quản lý Menu</Link>
                                    <Link to="/merchant/orders" className={`btn ${isActive('orders') ? 'active' : ''}`}><i className="fa-solid fa-clock-rotate-left"></i> Đơn hàng</Link>
                                    <Link to="/merchant/storefront" className={`btn ${isActive('storefront') ? 'active' : ''}`}><i className="fa-solid fa-store"></i> Thông tin quán</Link>
                                    <Link to="/merchant/reviews" className={`btn ${isActive('reviews') ? 'active' : ''}`}><i className="fa-solid fa-star"></i> Đánh giá</Link>
                                    <Link to="/merchant/promos" className={`btn ${isActive('promos') ? 'active' : ''}`}><i className="fa-solid fa-tag"></i> Khuyến mãi</Link>
                                    <Link to="/merchant/wallet" className={`btn ${isActive('wallet') ? 'active' : ''}`}><i className="fa-solid fa-wallet"></i> Ví & Đối soát</Link>
                                </div>
                            </div>
                        </section>
                    </aside>

                    <div className="main-content">
                        {/* Truyền setMyShop qua context của Outlet để đồng bộ ảnh khi cập nhật ở Storefront */}
                        <Outlet context={{ setMyShop }} />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default MerchantLayout;