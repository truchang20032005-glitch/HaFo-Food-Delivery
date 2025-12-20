import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const toVND = (n) => n?.toLocaleString('vi-VN');

function ShipperDashboard() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/orders');
            // Chỉ lấy những đơn mà Nhà hàng đang chuẩn bị (prep) -> Sẵn sàng để Shipper nhận
            const availableOrders = res.data.filter(o => o.status === 'prep');
            setOrders(availableOrders);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleAccept = async (id) => {
        // Lấy thông tin tài xế đang đăng nhập
        const user = JSON.parse(localStorage.getItem('user'));

        if (window.confirm("Bạn chắc chắn muốn nhận đơn này?")) {
            try {
                // Cập nhật: Gửi thêm shipperId
                await axios.put(`http://localhost:5000/api/orders/${id}`, {
                    status: 'pickup',
                    shipperId: user ? user.id : 'test_shipper_id' // <-- QUAN TRỌNG: Lưu vết tài xế
                });

                alert("Đã nhận đơn! Chuyển đến màn hình giao hàng.");
                navigate(`/shipper/order/${id}`);
            } catch (err) {
                alert("Lỗi: " + err.message);
            }
        }
    };

    return (
        <div>
            {/* Bộ lọc */}
            <div className="ship-filter">
                <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Tất cả</button>
                <button className={filter === 'near' ? 'active' : ''} onClick={() => setFilter('near')}>Gần đây</button>
                <button className={filter === 'high' ? 'active' : ''} onClick={() => setFilter('high')}>Giá cao</button>
            </div>

            {/* Danh sách đơn */}
            <div style={{ paddingBottom: '20px' }}>
                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                        <i className="fa-solid fa-box-open" style={{ fontSize: '40px', marginBottom: '10px' }}></i>
                        <p>Hiện chưa có đơn hàng mới</p>
                    </div>
                ) : (
                    orders.map(order => {
                        const shipFee = 15000;
                        const income = 13500;

                        return (
                            <div key={order._id} className="ship-card">
                                <div style={{ margin: '10px 0' }}>
                                    {Array.isArray(order.items) ? (
                                        order.items.map((item, idx) => (
                                            <div key={idx} style={{ fontSize: '14px', fontWeight: '500' }}>
                                                • {item.quantity}x {item.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div>{order.items}</div>
                                    )}
                                </div>

                                <div className="ship-meta">
                                    <i className="fa-solid fa-store" style={{ color: '#F97350' }}></i>
                                    <b>Bún Bò Mỹ Huệ</b> · 2.1 km
                                </div>
                                <div className="ship-meta">
                                    <i className="fa-solid fa-location-dot" style={{ color: '#22C55E' }}></i>
                                    {order.customer.split('|')[2] || 'Địa chỉ khách hàng'}
                                </div>

                                <div className="ship-money">
                                    <span>Tổng đơn: {toVND(order.total)}</span>
                                    <span>Ship: {toVND(shipFee)}</span>
                                </div>
                                <div className="ship-money" style={{ border: 0, padding: 0, marginBottom: 15 }}>
                                    <span className="income-tag">Thu nhập: +{toVND(income)}</span>
                                </div>

                                <button className="ship-btn primary" onClick={() => handleAccept(order._id)}>
                                    NHẬN ĐƠN
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default ShipperDashboard;