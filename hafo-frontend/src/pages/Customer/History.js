import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

const toVND = (n) => n?.toLocaleString('vi-VN');

function History() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all'); // all, danggiao, damua, dahuy

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // Gọi API lấy lịch sử của riêng user này
            //axios.get(`http://localhost:5000/api/orders?userId=${user.id}`)
            api.get(`/orders?userId=${user.id}`)
                .then(res => {
                    // Nếu API trả về tất cả đơn, ta lọc lại ở client cho chắc
                    const myOrders = res.data.filter(o => o.userId === user.id || o.userId === user._id);
                    // Sắp xếp đơn mới nhất lên đầu
                    myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setOrders(myOrders);
                })
                .catch(err => console.error(err));
        }
    }, []);

    // Logic lọc tab
    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        if (filter === 'danggiao') return ['new', 'prep', 'pickup'].includes(o.status);
        if (filter === 'damua') return o.status === 'done';
        if (filter === 'dahuy') return o.status === 'cancel';
        return true;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'new': return <span className="tag" style={{ background: '#fff7e5', color: '#f59e0b' }}>Chờ xác nhận</span>;
            case 'prep': return <span className="tag" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>Đang chuẩn bị</span>;
            case 'pickup': return <span className="tag" style={{ background: '#f3e8ff', color: '#9333ea' }}>Đang giao</span>;
            case 'done': return <span className="tag" style={{ background: '#dcfce7', color: '#16a34a' }}>Hoàn thành</span>;
            case 'cancel': return <span className="tag" style={{ background: '#fee2e2', color: '#ef4444' }}>Đã hủy</span>;
            default: return null;
        }
    };

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: '40px' }}>
            <Navbar />

            <div className="container" style={{ maxWidth: '800px', margin: '20px auto', padding: '0 15px' }}>
                <h2 style={{ color: '#333', marginBottom: '20px' }}>Lịch sử đơn hàng</h2>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto' }}>
                    {['all', 'danggiao', 'damua', 'dahuy'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={filter === f ? 'btn primary' : 'btn soft'}
                            style={{
                                padding: '8px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap',
                                background: filter === f ? '#F97350' : '#fff',
                                color: filter === f ? '#fff' : '#666',
                                border: filter === f ? 'none' : '1px solid #ddd'
                            }}
                        >
                            {f === 'all' && 'Tất cả'}
                            {f === 'danggiao' && 'Đang xử lý'}
                            {f === 'damua' && 'Đã hoàn thành'}
                            {f === 'dahuy' && 'Đã hủy'}
                        </button>
                    ))}
                </div>

                {/* Danh sách đơn */}
                <div className="order-list">
                    {filteredOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '12px' }}>
                            <p>Chưa có đơn hàng nào.</p>
                            <Link to="/home" className="btn primary" style={{ textDecoration: 'none', background: '#F97350', color: '#fff', padding: '10px 20px', borderRadius: '8px' }}>Đặt món ngay</Link>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order._id} style={{ background: '#fff', borderRadius: '12px', padding: '16px', marginBottom: '15px', border: '1px solid #e9e4d8' }}>
                                {/* Header đơn hàng */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
                                    <div>
                                        <b style={{ fontSize: '15px' }}>Đơn #{order._id.slice(-6).toUpperCase()}</b>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {getStatusBadge(order.status)}
                                        <div style={{ fontWeight: '900', color: '#F97350', marginTop: '4px' }}>
                                            {toVND(order.total)}đ
                                        </div>
                                    </div>
                                </div>

                                {/* --- PHẦN HIỂN THỊ ITEM ĐÃ SỬA --- */}
                                <div style={{ fontSize: '14px', color: '#444', marginBottom: '15px' }}>
                                    {Array.isArray(order.items) ? (
                                        order.items.map((item, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span>
                                                    <b>{item.quantity}x</b> {item.name}
                                                    {item.options && <span style={{ color: '#888', fontSize: '12px' }}> ({item.options})</span>}
                                                </span>
                                                {/* Nếu muốn hiện giá từng món thì bỏ comment dòng dưới */}
                                                {/* <span>{toVND(item.price)}</span> */}
                                            </div>
                                        ))
                                    ) : (
                                        <div>{order.items}</div>
                                    )}
                                </div>
                                {/* ---------------------------------- */}

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                                    {['new', 'prep', 'pickup'].includes(order.status) && (
                                        <Link to={`/tracking/${order._id}`} className="btn primary" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', background: '#F97350', color: 'white', fontSize: '13px', fontWeight: 'bold' }}>
                                            Theo dõi đơn
                                        </Link>
                                    )}
                                    {order.status === 'done' && (
                                        <Link to={`/review/${order._id}`} className="btn soft" style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', color: '#333', fontSize: '13px', fontWeight: 'bold' }}>
                                            Viết đánh giá
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default History;