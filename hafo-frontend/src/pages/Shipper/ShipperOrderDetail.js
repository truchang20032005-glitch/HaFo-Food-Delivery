import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const toVND = (n) => n?.toLocaleString('vi-VN');

function ShipperOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);

    // Gọi API lấy chi tiết đơn
    const fetchOrder = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/orders/${id}`);
            setOrder(res.data);
        } catch (err) {
            alert("Lỗi tải đơn hàng");
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    // Xử lý: Đã lấy hàng (Chuyển sang trạng thái đang giao)
    const handlePickedUp = async () => {
        try {
            // Ở đây logic đơn giản: prep -> pickup (đang giao)
            // Thực tế có thể chia nhỏ hơn: arriving -> picked_up -> delivering
            await axios.put(`http://localhost:5000/api/orders/${id}`, { status: 'pickup' });
            alert("Đã xác nhận lấy món! Bắt đầu đi giao.");
            fetchOrder();
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    // Xử lý: Giao thành công
    const handleDelivered = async () => {
        if (window.confirm("Xác nhận đã giao hàng thành công và nhận tiền?")) {
            try {
                await axios.put(`http://localhost:5000/api/orders/${id}`, { status: 'done' });
                alert("Chúc mừng! Bạn đã hoàn thành đơn hàng.");
                navigate('/shipper/dashboard'); // Quay về săn đơn tiếp
            } catch (err) {
                alert("Lỗi: " + err.message);
            }
        }
    };

    // Xử lý: Hủy đơn (Sự cố)
    const handleCancel = async () => {
        const reason = prompt("Nhập lý do hủy đơn:");
        if (reason) {
            try {
                await axios.put(`http://localhost:5000/api/orders/${id}`, { status: 'cancel' });
                alert("Đã hủy đơn.");
                navigate('/shipper/dashboard');
            } catch (err) {
                alert("Lỗi: " + err.message);
            }
        }
    };

    if (!order) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải thông tin...</div>;

    return (
        <div style={{ paddingBottom: '20px' }}>
            {/* Nút quay lại */}
            <Link to="/shipper/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#666', marginBottom: '15px', fontWeight: '600' }}>
                <i className="fa-solid fa-arrow-left"></i> Quay lại danh sách
            </Link>

            {/* Card thông tin chính */}
            <div className="ship-card" style={{ margin: '0 0 15px 0' }}>
                <h2 style={{ margin: '0 0 5px', fontSize: '18px', color: '#333' }}>Đơn #{order._id.slice(-6).toUpperCase()}</h2>
                <div style={{ color: '#22C55E', fontWeight: 'bold', marginBottom: '10px' }}>
                    {order.status === 'pickup' ? 'ĐANG GIAO HÀNG...' : 'ĐANG LẤY HÀNG...'}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <i className="fa-solid fa-store" style={{ color: '#F97350', fontSize: '20px' }}></i>
                        <div style={{ width: '2px', height: '30px', background: '#eee' }}></div>
                        <i className="fa-solid fa-location-dot" style={{ color: '#22C55E', fontSize: '20px' }}></i>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>Bún Bò Mỹ Huệ</div>
                            <div style={{ fontSize: '13px', color: '#666' }}>393 Trần Hưng Đạo, Q1</div>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            {/* Tên khách hàng & Địa chỉ */}
                            <div style={{ fontWeight: 'bold' }}>{order.customer.split('|')[0] || 'Khách hàng'}</div>
                            <div style={{ fontSize: '13px', color: '#666' }}>{order.customer.split('|')[2] || 'Địa chỉ giao hàng'}</div>
                        </div>
                    </div>
                </div>

                {/* Nút gọi điện nhanh */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <a href={`tel:${order.customer.split('|')[1]}`} className="ship-btn soft" style={{ textDecoration: 'none', flex: 1 }}>
                        <i className="fa-solid fa-phone"></i> Gọi khách
                    </a>
                    <button className="ship-btn soft" style={{ flex: 1 }}>
                        <i className="fa-regular fa-message"></i> Nhắn tin
                    </button>
                </div>
            </div>

            {/* Chi tiết món ăn */}
            <div className="ship-card" style={{ margin: '0 0 15px 0' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>Chi tiết đơn hàng</div>
                <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#444' }}>
                    {order.items}
                </div>
                <div className="ship-money">
                    <span>Thu tiền khách (COD):</span>
                    <span style={{ fontSize: '18px', color: '#F97350' }}>{toVND(order.total)}</span>
                </div>
            </div>

            {/* ACTIONS: CÁC NÚT BẤM THEO TRẠNG THÁI */}
            <div style={{ position: 'fixed', bottom: '80px', left: '0', right: '0', padding: '0 15px', maxWidth: '480px', margin: '0 auto' }}>
                {order.status === 'prep' && (
                    <button
                        onClick={handlePickedUp}
                        className="ship-btn primary"
                        style={{ boxShadow: '0 4px 15px rgba(249, 115, 80, 0.4)' }}
                    >
                        ĐÃ LẤY MÓN - BẮT ĐẦU GIAO
                    </button>
                )}

                {order.status === 'pickup' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleCancel}
                            className="ship-btn soft"
                            style={{ background: '#fee2e2', color: '#ef4444', border: 'none', flex: 1 }}
                        >
                            Báo sự cố
                        </button>
                        <button
                            onClick={handleDelivered}
                            className="ship-btn primary"
                            style={{ flex: 2, background: '#22C55E', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)' }}
                        >
                            GIAO THÀNH CÔNG
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ShipperOrderDetail;