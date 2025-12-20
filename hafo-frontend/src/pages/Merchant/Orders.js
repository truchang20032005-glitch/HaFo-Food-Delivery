import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [myShop, setMyShop] = useState(null);

    // 1. LẤY DỮ LIỆU KHI VÀO TRANG
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // Lấy thông tin quán trước
            axios.get(`http://localhost:5000/api/restaurants/my-shop/${user.id}`)
                .then(res => {
                    if (res.data) {
                        setMyShop(res.data);
                        // Có quán rồi thì lấy danh sách đơn của quán đó
                        return axios.get(`http://localhost:5000/api/orders?restaurantId=${res.data._id}`);
                    }
                })
                .then(res => {
                    if (res) setOrders(res.data);
                })
                .catch(err => console.error("Lỗi lấy đơn hàng:", err));
        }
    }, []);

    // 2. XỬ LÝ CHUYỂN TRẠNG THÁI ĐƠN
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await axios.put(`http://localhost:5000/api/orders/${orderId}`, { status: newStatus });

            // Cập nhật lại giao diện ngay lập tức
            setOrders(orders.map(o =>
                o._id === orderId ? { ...o, status: newStatus } : o
            ));
        } catch (error) {
            alert("Lỗi cập nhật trạng thái: " + error.message);
        }
    };

    // Helper hiển thị trạng thái đẹp
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'new': return <span className="tag blue">Mới</span>;
            case 'prep': return <span className="tag orange">Đang làm</span>;
            case 'pickup': return <span className="tag purple">Shipper lấy</span>;
            case 'done': return <span className="tag green">Hoàn tất</span>;
            case 'cancel': return <span className="tag red">Đã hủy</span>;
            default: return <span className="tag gray">{status}</span>;
        }
    };

    if (!myShop) return <div style={{ padding: 20 }}>Đang tải thông tin quán...</div>;

    return (
        <section className="panel">
            <div className="head">Quản lý Đơn hàng</div>
            <div className="body">
                {orders.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Chưa có đơn hàng nào.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                <th style={{ padding: '10px' }}>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Món ăn</th>
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map(order => (
                                <tr key={order._id} style={{ borderBottom: '1px dashed #eee' }}>
                                    <td style={{ padding: '15px 10px', color: '#888' }}>
                                        #{order._id.slice(-6).toUpperCase()}
                                        <div style={{ fontSize: '11px' }}>
                                            {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{order.customer.split('|')[0]}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{order.customer.split('|')[1]}</div>
                                    </td>

                                    {/* --- PHẦN HIỂN THỊ ITEM ĐÃ SỬA --- */}
                                    <td>
                                        {Array.isArray(order.items) ? (
                                            order.items.map((item, index) => (
                                                <div key={index} style={{ marginBottom: '4px' }}>
                                                    <b style={{ color: '#F97350' }}>{item.quantity}x</b> {item.name}
                                                    {item.options && (
                                                        <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginLeft: '20px' }}>
                                                            {item.options}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <span>{order.items}</span> // Fallback cho dữ liệu cũ
                                        )}
                                    </td>
                                    {/* ---------------------------------- */}

                                    <td style={{ fontWeight: 'bold' }}>{order.total.toLocaleString()}đ</td>
                                    <td>{renderStatusBadge(order.status)}</td>

                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
                                            {order.status === 'new' && (
                                                <button className="btn small primary" onClick={() => handleStatusChange(order._id, 'prep')}>
                                                    Xác nhận
                                                </button>
                                            )}
                                            {order.status === 'prep' && (
                                                <button className="btn small success" onClick={() => handleStatusChange(order._id, 'pickup')} style={{ background: '#22C55E', color: 'white' }}>
                                                    Đã xong món
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </section>
    );
}

export default Orders;