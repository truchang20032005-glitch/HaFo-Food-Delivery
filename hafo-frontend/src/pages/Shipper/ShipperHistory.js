import React, { useState, useEffect } from 'react';
import axios from 'axios';

const toVND = (n) => n?.toLocaleString('vi-VN');

function ShipperHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // Gọi API lấy tất cả đơn hàng
            // (Nếu backend bạn đã hỗ trợ ?shipperId=... thì tốt, nếu chưa thì lọc ở client như dưới đây)
            axios.get('http://localhost:5000/api/orders')
                .then(res => {
                    // LỌC DỮ LIỆU THẬT:
                    // 1. Phải là đơn của shipper này (shipperId trùng user.id)
                    // 2. Phải là đơn đã giao xong (status === 'done')
                    const myHistory = res.data.filter(o =>
                        o.shipperId === user.id && o.status === 'done'
                    );

                    // Sắp xếp đơn mới nhất lên đầu
                    myHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                    setOrders(myHistory);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, []);

    if (loading) return <div style={{ textAlign: 'center', padding: 20 }}>Đang tải lịch sử...</div>;

    return (
        <div>
            <div className="profile-panel">
                <div className="profile-head">
                    <i className="fa-solid fa-clock-rotate-left"></i> Lịch sử hoạt động
                </div>
                <div className="profile-body">
                    {/* Bộ lọc đơn giản */}
                    <div className="ship-filter" style={{ marginBottom: '15px', padding: 0, border: 'none' }}>
                        <button className="active">Tất cả</button>
                        <button>Hôm nay</button>
                        <button>Tuần này</button>
                    </div>

                    {orders.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '30px' }}>
                            <i className="fa-solid fa-box-open" style={{ fontSize: '30px', marginBottom: '10px' }}></i>
                            <p>Bạn chưa hoàn thành đơn hàng nào.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {orders.map(order => (
                                <div key={order._id} style={{ borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <div style={{ fontWeight: 'bold' }}>#{order._id.slice(-6).toUpperCase()}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                            {new Date(order.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#444', marginBottom: '5px' }}>
                                        {order.items}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="income-tag" style={{ fontSize: '11px', background: '#dcfce7', color: '#166534' }}>
                                            Hoàn tất
                                        </span>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '11px', color: '#666' }}>Phí ship nhận được</div>
                                            <b style={{ color: '#F97350' }}>{toVND(15000)}đ</b> {/* Giả sử phí ship cố định 15k, hoặc lấy từ DB nếu có */}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ShipperHistory;