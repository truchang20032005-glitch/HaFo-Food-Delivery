import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
const toVND = (n) => n?.toLocaleString('vi-VN');

function ShipperDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};

    // --- CÁC STATE QUẢN LÝ ---
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'recent', 'price'
    const [isWorking, setIsWorking] = useState(false); // Trạng thái bật/tắt trực
    const [myLocation, setMyLocation] = useState(null); // Lưu tọa độ hiện tại
    const [currentOrderId, setCurrentOrderId] = useState(null);

    // --- 1. LOGIC LẤY ĐƠN HÀNG ---
    const fetchOrders = useCallback(async () => {
        if (!isWorking || !myLocation) return;

        try {
            // Sử dụng API lọc đơn theo bán kính (5km) dựa trên tọa độ shipper
            const res = await api.get('/orders/available-orders', {
                params: {
                    lat: myLocation.lat,
                    lng: myLocation.lng,
                    radius: 5000 // Quét trong vòng 5km
                }
            });

            let data = res.data;

            // Áp dụng bộ lọc sắp xếp (Client-side sorting)
            if (filter === 'recent') {
                data = [...data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else if (filter === 'price') {
                data = [...data].sort((a, b) => b.total - a.total);
            }

            setOrders(data);
        } catch (err) {
            console.error("Lỗi tìm đơn:", err);
        }
    }, [isWorking, myLocation, filter]);

    // --- 2. THEO DÕI VỊ TRÍ (Chỉ chạy khi đang làm việc) ---
    useEffect(() => {
        let watchId = null;

        if (isWorking && "geolocation" in navigator && user.id) {
            watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setMyLocation(coords);

                    // Phát tín hiệu Socket cho khách hàng theo dõi
                    socket.emit('shipper_update_location', {
                        shipperId: user.id,
                        ...coords,
                        orderId: currentOrderId
                    });

                    // Cập nhật vị trí vào DB để hệ thống biết shipper đang ở đâu
                    api.put(`/shippers/location/${user.id}`, coords).catch(e => { });
                },
                (err) => console.error("Lỗi GPS:", err),
                { enableHighAccuracy: true, distanceFilter: 10 }
            );
        }

        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, [isWorking, currentOrderId, user.id]);

    // Tự động cập nhật danh sách đơn mỗi 5 giây nếu đang bật trực
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // --- 3. XỬ LÝ NHẬN ĐƠN ---
    const handleAccept = async (orderId) => {
        if (window.confirm("Bạn chắc chắn muốn nhận đơn này?")) {
            try {
                // Gán shipperId cho đơn hàng
                await api.put(`/orders/${orderId}`, { shipperId: user.id });
                setCurrentOrderId(orderId);
                alert("🎉 Nhận đơn thành công! Hãy đi lấy hàng nào.");
                navigate(`/shipper/order/${orderId}`);
            } catch (err) {
                alert("❌ Lỗi nhận đơn: " + (err.response?.data?.message || err.message));
            }
        }
    };

    return (
        <div style={{ padding: '15px' }}>
            {/* TRẠNG THÁI LÀM VIỆC */}
            <div style={{
                background: isWorking ? '#F0FDF4' : '#FFF1F2',
                padding: '20px', borderRadius: '16px', textAlign: 'center', marginBottom: '20px',
                border: `1px solid ${isWorking ? '#BBF7D0' : '#FECDD3'}`
            }}>
                <h2 style={{ margin: '0 0 10px', fontSize: '18px', color: isWorking ? '#166534' : '#991B1B' }}>
                    {isWorking ? '🟢 Đang trực tuyến' : '🔴 Đang ngoại tuyến'}
                </h2>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                    {isWorking ? 'Hệ thống đang tìm kiếm đơn hàng xung quanh bạn...' : 'Bật trực để bắt đầu nhận đơn hàng từ các quán gần bạn.'}
                </p>
                <button
                    onClick={() => setIsWorking(!isWorking)}
                    style={{
                        padding: '12px 30px', borderRadius: '30px', border: 'none',
                        background: isWorking ? '#EF4444' : '#22C55E', color: '#fff',
                        fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                >
                    {isWorking ? 'NGHỈ NGƠI (OFFLINE)' : 'BẮT ĐẦU LÀM VIỆC'}
                </button>
            </div>

            {isWorking && (
                <>
                    {/* BỘ LỌC */}
                    <div className="ship-filter" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tất cả</button>
                        <button className={filter === 'recent' ? 'active' : ''} onClick={() => setFilter('recent')}>Gần đây</button>
                        <button className={filter === 'price' ? 'active' : ''} onClick={() => setFilter('price')}>Giá cao</button>
                    </div>

                    {/* DANH SÁCH ĐƠN */}
                    <div style={{ paddingBottom: '20px' }}>
                        {orders.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                                <i className="fa-solid fa-box-open" style={{ fontSize: '40px', marginBottom: '10px' }}></i>
                                <p>Chưa có đơn hàng nào quanh đây.</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order._id} className="ship-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '12px', background: '#FFF7ED', color: '#C2410C', padding: '4px 8px', borderRadius: '6px', fontWeight: '700' }}>
                                            {order.restaurantId?.name}
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#999' }}>
                                            <i className="fa-regular fa-clock"></i> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h3>{Array.isArray(order.items) ? order.items[0].name + (order.items.length > 1 ? ` +${order.items.length - 1}` : '') : 'Đơn hàng'}</h3>
                                    <div className="ship-meta">
                                        <i className="fa-solid fa-location-dot" style={{ color: '#22C55E' }}></i>
                                        {order.customer.split('|')[2] || 'Địa chỉ khách'}
                                    </div>
                                    <div className="ship-money" style={{ borderTop: '1px dashed #eee', paddingTop: '10px', marginTop: '10px' }}>
                                        <span style={{ fontWeight: '800', color: '#F97350', fontSize: '18px' }}>{toVND(order.total)}</span>
                                        <button className="ship-btn primary" onClick={() => handleAccept(order._id)}>NHẬN ĐƠN</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default ShipperDashboard;