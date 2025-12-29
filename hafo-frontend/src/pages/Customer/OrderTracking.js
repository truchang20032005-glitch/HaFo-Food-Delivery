import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useMap, MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import Chat from '../../components/Chat';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

const iconMarker = (url, size = [40, 40]) => L.icon({
    iconUrl: url,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]]
});

const shipperIcon = iconMarker('/images/bike-icon.png', [45, 45]);
const restaurantIcon = iconMarker('/images/store-icon.png', [35, 35]);
const customerIcon = iconMarker('/images/home-icon.png', [35, 35]);

function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.setView(position, map.getZoom());
    }, [position, map]);
    return null;
}

const toVND = (n) => n?.toLocaleString('vi-VN');
const toClock = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function OrderTracking() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [shipper, setShipper] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [hasNewMsg, setHasNewMsg] = useState(false);
    const [isShipperChatOpen, setIsShipperChatOpen] = useState(false);
    const [shipperPos, setShipperPos] = useState([10.762, 106.660]);
    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL;
    const [lastNotifiedMsgId, setLastNotifiedMsgId] = useState(null);
    const socket = io(SOCKET_URL, {
        transports: ['websocket'], // Ép dùng websocket để Render chạy mượt hơn
        withCredentials: true
    });


    const fetchData = useCallback(async () => {
        try {
            const resOrder = await api.get(`/orders/${id}`);
            const orderData = resOrder.data;
            setOrder(orderData);
            if (orderData.restaurantId) {
                const resRest = await api.get(`/restaurants/${orderData.restaurantId}`);
                setRestaurant(resRest.data.restaurant || resRest.data);
            }
            if (orderData.shipperId) {
                const resShip = await api.get(`/shippers/profile/${orderData.shipperId}`);
                setShipper(resShip.data);
            }
        } catch (err) { console.error("Lỗi đồng bộ:", err); }
    }, [id]);

    const checkNewMessages = useCallback(async () => {
        try {
            const res = await api.get(`/messages/${id}`);
            const messages = res.data;
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                const currentUserId = localStorage.getItem('userId');

                if (lastMsg.senderId !== currentUserId && lastMsg._id !== lastNotifiedMsgId) {
                    const audio = new Audio('/sounds/message.mp3');
                    audio.play().catch(e => console.log("Autoplay blocked"));
                    setLastNotifiedMsgId(lastMsg._id);
                    setHasNewMsg(true);
                }
            }
        } catch (err) { console.error(err); }
    }, [id, lastNotifiedMsgId]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    useEffect(() => {
        checkNewMessages();
        const interval = setInterval(checkNewMessages, 5000);
        return () => clearInterval(interval);
    }, [checkNewMessages]);

    useEffect(() => {
        if (!socket || !id) return; // Bảo vệ nếu id hoặc socket chưa sẵn sàng

        socket.on(`tracking_order_${id}`, (data) => {
            setShipperPos([data.lat, data.lng]);
        });

        return () => socket.off(`tracking_order_${id}`);
    }, [id, socket]);

    const realStats = useMemo(() => {
        if (!order) return { distance: 0, eta: 0 };
        const fromLat = shipper?.lat || restaurant?.lat;
        const fromLng = shipper?.lng || restaurant?.lng;
        const dist = calculateDistance(fromLat, fromLng, order.lat, order.lng);
        return { distance: dist.toFixed(1), eta: Math.ceil(dist * 4 + 3) };
    }, [order, shipper, restaurant]);

    const handleReceiveOrder = async () => {
        try {
            await api.put(`/orders/${id}`, { status: 'done' });
            setShowModal(false); fetchData(); alert("🎉 Đã nhận đơn hàng!");
        } catch (err) { alert(err.message); }
    };

    if (!order) return <div style={{ padding: '80px', textAlign: 'center', background: '#F7F2E5', minHeight: '100vh' }}>Đang tải...</div>;

    const currentStepIndex = order.status === 'new' ? 0 : order.status === 'prep' ? 2 : order.status === 'ready' ? 3 : order.status === 'pickup' ? 4 : order.status === 'done' ? 5 : 0;
    const steps = [
        { title: 'Đã nhận đơn', icon: 'fa-check' }, { title: 'Xác nhận', icon: 'fa-store' },
        { title: 'Đang làm món', icon: 'fa-fire-burner' }, { title: 'Chờ shipper', icon: 'fa-box' },
        { title: 'Đang giao hàng', icon: 'fa-motorcycle' }, { title: 'Hoàn tất đơn hàng', icon: 'fa-flag-checkered' }
    ];

    // ✅ COPY 100% STYLE TỪ CHECKOUT.JS
    const S = {
        container: { background: '#F7F2E5', minHeight: '100vh', paddingBottom: '50px' },
        wrapper: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 450px', gap: '30px', alignItems: 'start' },
        card: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' },
        header: { margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' },
        floatingChatContainer: {
            position: 'fixed',
            right: '20px', // Đổi từ 30px thành 20px để khớp với lề chuẩn của các widget web
            bottom: '20px',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            pointerEvents: 'none' // Để không chặn click vào các thành phần bên dưới
        },

        chatBoxWrapper: {
            pointerEvents: 'auto',
            position: 'fixed',
            right: '20px',
            // Đẩy lên cao hẳn: 20 (đáy) + 60 (nút AI) + 15 (gap) + 60 (nút Shipper) + 15 (gap) = 170px
            bottom: '170px',
            width: '400px',
            height: '550px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            borderRadius: '20px',
            overflow: 'hidden',
            background: '#fff',
            zIndex: 10000
        },

        circleBtn: {
            pointerEvents: 'auto',
            position: 'fixed',
            right: '20px', // PHẢI KHỚP VỚI RIGHT CỦA CHATBOT.CSS
            bottom: '95px', // Cách đáy 95px (để né nút AI ở dưới có bottom khoảng 20px)
            width: '60px',  // Kích thước chuẩn của nút tròn
            height: '60px',
            borderRadius: '50%',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            transition: 'all 0.3s'
        },

        redDotBadge: {
            position: 'absolute',
            top: '5px',
            right: '5px',
            width: '12px',
            height: '12px',
            background: 'red',
            borderRadius: '50%',
            border: '2px solid white'
        }
    };

    return (
        <div style={S.container}>
            <Navbar />

            {/* Link quay lại cũng nằm trong khung 1200px */}
            <div style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 20px' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#F97350', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-chevron-left"></i> Tiếp tục mua sắm
                </Link>
            </div>

            <main style={S.wrapper}>
                {/* CỘT TRÁI: TIẾN ĐỘ & BẢN ĐỒ */}
                <section style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div style={{ ...S.card, display: 'flex', alignItems: 'center', gap: '30px', background: 'linear-gradient(135deg, #fff 0%, #FFF8F5 100%)' }}>
                        <div style={{ background: '#F97350', color: '#fff', padding: '18px 28px', borderRadius: '18px', textAlign: 'center' }}>
                            <div style={{ fontSize: '32px', fontWeight: '900' }}>{realStats.eta}</div>
                            <div style={{ fontSize: '11px', fontWeight: '800' }}>PHÚT</div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <b style={{ fontSize: '20px' }}>{steps[currentStepIndex].title}</b>
                                <span style={{ color: '#F97350', fontWeight: '900' }}><i className="fa-solid fa-map-location-dot"></i> {realStats.distance} km</span>
                            </div>
                            <div style={{ fontSize: '13px', color: '#888', marginTop: '6px' }}>Mã đơn: <span style={{ fontWeight: '700' }}>#{order._id.slice(-6).toUpperCase()}</span></div>
                            <div style={{ marginTop: '18px', height: '10px', background: '#eee', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${(currentStepIndex / 5) * 100}%`, height: '100%', background: '#F97350', transition: 'width 1s' }}></div>
                            </div>
                        </div>
                    </div>

                    <div style={{ ...S.card, height: '400px', padding: 0 }}>
                        <MapContainer center={shipperPos} zoom={15} style={{ height: '400px', borderRadius: '16px' }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                            {/* ✅ Tự động xoay bản đồ theo Shipper */}
                            <RecenterMap position={shipperPos} />

                            {/* 1. Marker của Shipper (Vị trí thực từ Socket) */}
                            <Marker position={shipperPos} icon={shipperIcon} />

                            {/* 2. Marker của Quán ăn (Tọa độ từ DB) */}
                            {restaurant?.location?.coordinates && (
                                <Marker
                                    position={[restaurant.location.coordinates[1], restaurant.location.coordinates[0]]}
                                    icon={restaurantIcon}
                                />
                            )}

                            {/* 3. Marker của Khách hàng (Điểm giao hàng) */}
                            {order?.lat && order?.lng && (
                                <Marker position={[order.lat, order.lng]} icon={customerIcon} />
                            )}
                        </MapContainer>
                    </div>

                    <div style={S.card}>
                        <h4 style={{ ...S.header, margin: '0 0 20px', borderLeft: '4px solid #F97350', paddingLeft: '12px' }}>Tiến độ đơn hàng</h4>
                        <div className="timeline">
                            {steps.map((step, i) => (
                                <div key={i} className={`step ${i < currentStepIndex ? 'done' : (i === currentStepIndex ? 'current' : '')}`}>
                                    <div className="dot"><i className={`fa-solid ${step.icon}`}></i></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{step.title}</div>
                                        <div style={{ fontSize: '12px', color: '#999' }}>{i <= currentStepIndex ? toClock(order.createdAt) : '--:--'}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CỘT PHẢI: CHI TIẾT ĐÚNG 450PX */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '450px' }}>
                    <div style={S.card}>
                        <h3 style={S.header}><i className="fa-solid fa-motorcycle" style={{ color: '#F97350' }}></i> Thông tin vận chuyển</h3>
                        <div style={{ minHeight: '120px' }}>
                            {order.shipperId && typeof order.shipperId === 'object' ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                    <img
                                        src={order.shipperId.avatar || 'https://via.placeholder.com/75'}
                                        alt="Ava"
                                        style={{ width: '75px', height: '75px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFF1ED' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '900', fontSize: '18px' }}>{order.shipperId.fullName}</div>
                                        <div style={{ fontSize: '14px', color: '#F97350', fontWeight: 'bold', margin: '4px 0' }}>
                                            <i className="fa-solid fa-phone"></i> {order.shipperId.phone || "Đang cập nhật..."}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                                            <a href={`tel:${order.shipperId.phone}`} style={{ textDecoration: 'none', padding: '5px 12px', background: '#eee', borderRadius: '15px', color: '#333', fontSize: '12px', fontWeight: 'bold' }}>Gọi điện</a>
                                            <div
                                                onClick={() => setIsShipperChatOpen(true)} // Mở hộp chat khi click
                                                style={{
                                                    cursor: 'pointer',
                                                    textDecoration: 'none',
                                                    padding: '5px 12px',
                                                    background: '#F97350',
                                                    borderRadius: '15px',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold',
                                                    position: 'relative'
                                                }}
                                            >
                                                Nhắn tin
                                                {hasNewMsg && (
                                                    <span style={{ /* style chấm đỏ cũ của bạn */ }} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <i className="fa-solid fa-spinner fa-spin" style={{ color: '#F97350', fontSize: '32px', marginBottom: '15px' }}></i>
                                    <div style={{ fontSize: '15px', color: '#666', fontWeight: '700' }}>Đang tìm tài xế gần bạn...</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={S.card}>
                        <h3 style={S.header}><i className="fa-solid fa-basket-shopping" style={{ color: '#F97350' }}></i> Chi tiết món ăn</h3>
                        <div style={{ maxHeight: '350px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                            {order.items.map((it, i) => (
                                <div key={i} style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #f5f5f5', paddingBottom: '15px' }}>
                                    <img src={it.image || 'https://via.placeholder.com/65'} alt="food" style={{ width: '65px', height: '65px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #eee' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                                            <span>{it.quantity}x {it.name}</span>
                                            <span style={{ color: '#F97350' }}>{toVND(it.price * it.quantity)}đ</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>{it.options}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '20px 0 0', borderTop: '2px solid #F7F2E5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '800', fontSize: '18px' }}>TỔNG CỘNG</span>
                            <span style={{ fontWeight: '900', fontSize: '26px', color: '#F97350' }}>{toVND(order.total)}đ</span>
                        </div>
                    </div>

                    <button
                        className={`btn-receive-big ${order.status === 'pickup' ? 'active' : ''}`}
                        disabled={order.status !== 'pickup'}
                        onClick={() => setShowModal(true)}
                        style={{
                            width: '100%', padding: '18px', borderRadius: '40px', border: 'none',
                            fontSize: '17px', fontWeight: '900', cursor: order.status === 'pickup' ? 'pointer' : 'not-allowed',
                            background: order.status === 'pickup' ? 'linear-gradient(to right, #22C55E, #16A34A)' : '#e2e8f0',
                            color: order.status === 'pickup' ? '#fff' : '#94a3b8',
                            boxShadow: order.status === 'pickup' ? '0 10px 25px rgba(34, 197, 94, 0.3)' : 'none'
                        }}
                    >
                        {order.status === 'done' ? 'ĐƠN HÀNG ĐÃ HOÀN TẤT' : 'ĐÃ NHẬN ĐƯỢC HÀNG'}
                    </button>
                </aside>
            </main>
            <div style={S.floatingChatContainer}>
                {/* 1. Hộp Chat hiện ra khi nhấn nút */}
                {isShipperChatOpen && (
                    <div style={S.chatBoxWrapper}>
                        <Chat
                            orderId={id}
                            onClose={() => setIsShipperChatOpen(false)}
                            partnerAvatar={order.shipperId?.avatar}
                        />
                    </div>
                )}

                {/* 2. Nút tròn nhắn tin với Shipper (Nằm trên nút AI) */}
                <button
                    onClick={() => setIsShipperChatOpen(!isShipperChatOpen)}
                    className={hasNewMsg ? 'vibrate-active' : ''} // Thêm class rung khi có tin nhắn
                    style={{
                        ...S.circleBtn,
                        background: isShipperChatOpen ? '#666' : '#F97350', // Đổi màu khi mở
                    }}
                >
                    <i className={`fa-solid ${isShipperChatOpen ? 'fa-xmark' : 'fa-motorcycle'}`}></i>
                    {hasNewMsg && <span style={S.redDotBadge}></span>}
                </button>
            </div>

            {/* MODAL XÁC NHẬN */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div style={{ background: '#fff', width: '420px', borderRadius: '32px', padding: '40px', textAlign: 'center' }}>
                        <div style={{ fontSize: '50px', marginBottom: '15px' }}>😋</div>
                        <h3 style={{ marginTop: 0, fontSize: '22px', fontWeight: '900' }}>Đồ ăn đã tới nơi?</h3>
                        <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>Má hãy kiểm tra món và xác nhận cho shipper nha!</p>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button style={{ flex: 1, padding: '15px', borderRadius: '16px', border: '1px solid #eee', cursor: 'pointer' }} onClick={() => setShowModal(false)}>Chưa có</button>
                            <button style={{ flex: 1, padding: '15px', borderRadius: '16px', border: 'none', background: '#22C55E', color: '#fff', fontWeight: '800', cursor: 'pointer' }} onClick={handleReceiveOrder}>Đã nhận rồi!</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderTracking;