import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

const toVND = (n) => n?.toLocaleString('vi-VN');

function History() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, danggiao, damua, dahuy

    useEffect(() => {
        const fetchHistory = async () => {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) return;

            try {
                const res = await api.get(`/orders?userId=${user.id}`);
                // Lọc đơn của user và sắp xếp mới nhất lên đầu
                const myOrders = res.data.filter(o => o.userId === user.id || o.userId === user._id);
                myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(myOrders);
            } catch (err) {
                console.error("Lỗi tải lịch sử:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    // Hàm xử lý ảnh (Để hiển thị ảnh đại diện cho đơn hàng)
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/80?text=HaFo';
        return path;
    };

    // Logic lọc tab
    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'danggiao') return ['new', 'prep', 'pickup'].includes(o.status);
        if (filter === 'damua') return o.status === 'done';
        if (filter === 'dahuy') return o.status === 'cancel';
        return true;
    });

    const getStatusBadge = (status) => {
        const styles = {
            padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block'
        };
        switch (status) {
            case 'new': return <span style={{ ...styles, background: '#FFF7E6', color: '#FA8C16' }}>⏳ Chờ xác nhận</span>;
            case 'prep': return <span style={{ ...styles, background: '#E6F7FF', color: '#1890FF' }}>👨‍🍳 Đang chuẩn bị</span>;
            case 'pickup': return <span style={{ ...styles, background: '#F9F0FF', color: '#722ED1' }}>🛵 Đang giao</span>;
            case 'done': return <span style={{ ...styles, background: '#F6FFED', color: '#52C41A' }}>✅ Hoàn thành</span>;
            case 'cancel': return <span style={{ ...styles, background: '#FFF1F0', color: '#F5222D' }}>❌ Đã hủy</span>;
            default: return <span style={{ ...styles, background: '#eee', color: '#666' }}>Không rõ</span>;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: '60px' }}>
            <Navbar />

            <div className="container" style={{ maxWidth: '800px', margin: '20px auto', padding: '0 15px' }}>
                <h2 style={{ color: '#3A2E2E', marginBottom: '20px', fontSize: '24px' }}>📜 Lịch sử đơn hàng</h2>

                {/* TABS BỘ LỌC */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none' }}>
                    {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'danggiao', label: 'Đang xử lý' },
                        { id: 'damua', label: 'Hoàn thành' },
                        { id: 'dahuy', label: 'Đã hủy' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            style={{
                                padding: '8px 18px',
                                borderRadius: '25px',
                                fontWeight: '700',
                                fontSize: '14px',
                                whiteSpace: 'nowrap',
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: filter === tab.id ? '#F97350' : '#fff',
                                color: filter === tab.id ? '#fff' : '#666',
                                boxShadow: filter === tab.id ? '0 4px 10px rgba(249, 115, 80, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* DANH SÁCH ĐƠN */}
                <div className="order-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>Đang tải lịch sử...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                            <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-7359557-6024626.png" alt="Empty" style={{ width: '150px', opacity: 0.7, marginBottom: '15px' }} />
                            <p style={{ fontSize: '16px', color: '#555', fontWeight: 'bold' }}>Chưa có đơn hàng nào ở mục này.</p>
                            <Link to="/home" style={{ display: 'inline-block', marginTop: '15px', textDecoration: 'none', background: '#F97350', color: '#fff', padding: '10px 25px', borderRadius: '25px', fontWeight: 'bold' }}>
                                Đặt món ngay
                            </Link>
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            // Lấy ảnh của món đầu tiên để làm đại diện cho Card
                            const firstItemImage = order.items && order.items.length > 0 ? order.items[0].image : null;

                            return (
                                <div key={order._id} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>

                                    {/* Header Card */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}>
                                                <i className="fa-regular fa-clock"></i> {formatDate(order.createdAt)}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '2px' }}>#{order._id.slice(-8).toUpperCase()}</div>
                                        </div>
                                        <div>{getStatusBadge(order.status)}</div>
                                    </div>

                                    {/* Body Card */}
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        {/* Ảnh đại diện (Vuông bo góc) */}
                                        <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0', background: '#f9f9f9' }}>
                                            <img
                                                src={getImageUrl(firstItemImage)}
                                                alt="Food"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=HaFo'}
                                            />
                                        </div>

                                        {/* Danh sách món */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '5px' }}>
                                                {/* Hiển thị tên món đầu tiên + số lượng món khác */}
                                                {order.items[0]?.name}
                                                {order.items.length > 1 && <span style={{ fontWeight: 'normal', color: '#666', fontSize: '13px' }}> (+{order.items.length - 1} món khác)</span>}
                                            </div>

                                            <div style={{ fontSize: '13px', color: '#666' }}>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                        <span>{item.quantity}x {item.name}</span>
                                                    </div>
                                                )).slice(0, 2)} {/* Chỉ hiện tối đa 2 dòng món */}
                                                {order.items.length > 2 && <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#999' }}>...và các món khác</div>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Card */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f5f5f5' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Tổng tiền</div>
                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#F97350' }}>{toVND(order.total)}đ</div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {/* Nút hành động tùy theo trạng thái */}
                                            {['new', 'prep', 'pickup'].includes(order.status) && (
                                                <Link to={`/tracking/${order._id}`} style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', background: '#e0f2fe', color: '#0070f3', fontSize: '13px', fontWeight: 'bold' }}>
                                                    Theo dõi
                                                </Link>
                                            )}
                                            {order.status === 'done' && (
                                                <>
                                                    <button style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                        Mua lại
                                                    </button>
                                                    <Link to={`/review/${order._id}`} style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', background: '#F97350', color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
                                                        Đánh giá
                                                    </Link>
                                                </>
                                            )}
                                            {order.status === 'cancel' && (
                                                <button style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                    Đặt lại
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default History;