import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const toVND = (n) => n?.toLocaleString('vi-VN');

function ShipperDashboard() {
    const [orders, setOrders] = useState([]);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    const fetchOrders = async () => {
        try {
            //const res = await axios.get('http://localhost:5000/api/orders');
            const res = await api.get('api/orders');
            // LỌC ĐƠN CHUẨN: Trạng thái 'prep' VÀ chưa có shipperId
            // (Lưu ý: Backend trả về tất cả đơn, ta lọc ở client cho nhanh)
            const availableOrders = res.data.filter(o =>
                o.status === 'prep' && !o.shipperId
            );
            setOrders(availableOrders);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 3000); // Polling nhanh 3s
        return () => clearInterval(interval);
    }, []);

    const handleAccept = async (id) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (window.confirm("Bạn chắc chắn muốn nhận đơn này?")) {
            try {
                // Cập nhật: Chuyển sang 'pickup' VÀ gán shipperId
                /*await axios.put(`http://localhost:5000/api/orders/${id}`, {
                    status: 'pickup',
                    shipperId: user.id
                });*/
                await api.put(`/orders/${id}`, {
                    status: 'pickup',
                    shipperId: user.id
                });

                alert("Đã nhận đơn thành công!");
                navigate(`/shipper/order/${id}`);
            } catch (err) {
                alert("Lỗi: " + err.message);
            }
        }
    };

    return (
        <div>
            <div className="ship-filter">
                <button className={filter === 'all' ? 'active' : ''}>Tất cả</button>
                <button>Gần đây</button>
                <button>Giá cao</button>
            </div>

            <div style={{ paddingBottom: '20px' }}>
                {orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                        <p>Hiện chưa có đơn hàng nào cần giao.</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order._id} className="ship-card">
                            <h3>{Array.isArray(order.items) ? order.items[0].name : order.items}</h3>
                            <div className="ship-meta">
                                <i className="fa-solid fa-location-dot" style={{ color: '#22C55E' }}></i>
                                {order.customer.split('|')[2] || 'Địa chỉ khách'}
                            </div>
                            <div className="ship-money">
                                <span>Tổng đơn: {toVND(order.total)}</span>
                            </div>
                            <button className="ship-btn primary" onClick={() => handleAccept(order._id)}>NHẬN ĐƠN</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ShipperDashboard;