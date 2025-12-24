import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

const toVND = (n) => n?.toLocaleString('vi-VN');
const toClock = (d) => new Date(d).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

function OrderTracking() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [shipper, setShipper] = useState(null);
    const [showModal, setShowModal] = useState(false); // Modal xác nhận

    const fetchOrder = async () => {
        try {
            //const res = await axios.get(`http://localhost:5000/api/orders/${id}`);
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data);
            if (res.data.shipperId) {
                fetchShipperInfo(res.data.shipperId);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchShipperInfo = async (shipperId) => {
        try {
            //const res = await axios.get(`http://localhost:5000/api/shippers/profile/${shipperId}`);
            const res = await api.get(`/shippers/profile/${shipperId}`);
            setShipper(res.data);
        } catch (err) {
            console.error("Chưa tìm thấy thông tin tài xế");
        }
    };

    useEffect(() => {
        fetchOrder();
        const interval = setInterval(fetchOrder, 3000); // Cập nhật nhanh hơn (3s)
        return () => clearInterval(interval);
    }, [id]);

    // HÀM XỬ LÝ KHI BẤM "ĐÃ NHẬN HÀNG"
    const handleReceiveOrder = async () => {
        try {
            // Gọi API cập nhật trạng thái thành 'done'
            //await axios.put(`http://localhost:5000/api/orders/${id}`, { status: 'done' });
            await api.put(`/orders/${id}`, { status: 'done' });
            setShowModal(false); // Tắt modal
            fetchOrder(); // Load lại dữ liệu mới
            alert("Cảm ơn bạn đã mua hàng! Đơn hàng đã hoàn tất.");
        } catch (err) {
            alert("Lỗi cập nhật: " + err.message);
        }
    };

    if (!order) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải...</div>;

    // --- LOGIC MAPPING 6 BƯỚC ---
    // Backend status: new -> prep -> pickup -> done
    // Timeline 6 bước: 
    // 0: Đã nhận | 1: Xác nhận | 2: Chuẩn bị | 3: TX nhận | 4: Đang giao | 5: Đã giao

    let currentStepIndex = 0;
    if (order.status === 'new') currentStepIndex = 0;
    if (order.status === 'prep') currentStepIndex = 2; // Nhảy qua bước xác nhận
    if (order.status === 'pickup') currentStepIndex = 4; // Nhảy qua bước TX nhận
    if (order.status === 'done') currentStepIndex = 5;

    const steps = [
        { title: 'Đã nhận đơn', icon: 'fa-check', note: 'Chờ nhà hàng xác nhận' },
        { title: 'Nhà hàng xác nhận', icon: 'fa-store', note: 'Đang chuẩn bị món' },
        { title: 'Đang chuẩn bị', icon: 'fa-fire-burner', note: 'Bếp đang nấu' },
        { title: 'Tìm tài xế', icon: 'fa-user-clock', note: 'Đang tìm tài xế gần bạn' },
        { title: 'Đang giao hàng', icon: 'fa-motorcycle', note: 'Tài xế đang đến' },
        { title: 'Giao thành công', icon: 'fa-flag-checkered', note: 'Bạn đã nhận món' }
    ];

    // Nút nhận hàng chỉ sáng khi đang giao (pickup)
    const canReceive = order.status === 'pickup';

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar />

            <header className="header" style={{ background: '#fff', borderBottom: '1px solid #e9e4d8', padding: '10px 0' }}>
                <div className="container hop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>Theo dõi đơn hàng</h3>
                    <Link to="/" style={{ textDecoration: 'none', color: '#6b625d', fontWeight: 'bold' }}>← Về trang chủ</Link>
                </div>
            </header>

            <main className="hop" style={{ margin: '20px auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>

                {/* CỘT TRÁI */}
                <section>
                    {/* Thẻ trạng thái chính */}
                    <div className="status">
                        <div className="badge-eta">
                            <div style={{ fontSize: '20px', fontWeight: '900' }}>20</div>
                            <small>phút</small>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <div><b>{steps[currentStepIndex].title}</b> <span style={{ color: '#666', fontSize: '13px' }}>| #{order._id.slice(-6).toUpperCase()}</span></div>
                                <div style={{ fontSize: '12px' }}><i className="fa-solid fa-location-dot"></i> 2,1 km</div>
                            </div>
                            <div className="progress">
                                <span style={{ width: `${(currentStepIndex / 5) * 100}%` }}></span>
                            </div>
                        </div>
                    </div>

                    {/* Bản đồ */}
                    <div className="map-wrap" style={{ marginTop: '15px', borderRadius: '14px', overflow: 'hidden', border: '1px solid #e5dfd2', height: '220px' }}>
                        <img src="/images/map.jpg" onError={(e) => e.target.src = 'https://via.placeholder.com/800x400?text=Map'} alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>

                    {/* Timeline 6 Bước */}
                    <div className="card" style={{ marginTop: '15px', background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #eadfcd' }}>
                        <h4 style={{ marginTop: 0, paddingBottom: '10px', borderBottom: '1px solid #eee' }}>Tiến trình chi tiết</h4>
                        <div className="timeline">
                            {steps.map((step, i) => (
                                <div key={i} className={`step ${i < currentStepIndex ? 'done' : (i === currentStepIndex ? 'current' : '')}`}>
                                    <div className="dot"><i className={`fa-solid ${step.icon}`}></i></div>
                                    <div>
                                        <div className="title">{step.title}</div>
                                        <div className="meta">{step.note}</div>
                                    </div>
                                    <div className="time">
                                        {/* Giả lập thời gian: Hiện giờ thật cho bước 1 và bước hiện tại */}
                                        {(i === 0 || i === currentStepIndex) ? toClock(order.createdAt) : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* BANNER CẢM ƠN & ĐÁNH GIÁ */}
                    {order.status === 'done' && (
                        <div className="thank show" style={{ marginTop: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <i className="fa-solid fa-circle-check" style={{ color: '#22C55E', fontSize: '24px' }}></i>
                                <div>
                                    <b>Đơn hàng đã hoàn tất! Cảm ơn bạn.</b>
                                    <div style={{ fontSize: '13px', marginTop: '4px', color: '#666' }}>Hãy đánh giá để chúng tôi phục vụ tốt hơn.</div>
                                </div>
                            </div>
                            <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
                                <Link to={`/review/${order._id}`} className="btn primary" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                    Viết đánh giá
                                </Link>
                                <Link to="/" className="btn soft" style={{ textDecoration: 'none', display: 'inline-block' }}>
                                    Về trang chủ
                                </Link>
                            </div>
                        </div>
                    )}
                </section>

                {/* CỘT PHẢI */}
                <aside>
                    {/* Tài xế */}
                    {/* --- THÔNG TIN TÀI XẾ (Chỉ hiện khi có shipperId) --- */}
                    <div className="card" style={{ background: '#fff', padding: '16px', borderRadius: '14px', border: '1px solid #eadfcd', marginBottom: '15px' }}>
                        <h4 style={{ marginTop: 0 }}><i className="fa-solid fa-motorcycle"></i> Tài xế</h4>

                        {order.shipperId && shipper ? (
                            <>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '10px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#ddd', backgroundImage: `url(${shipper.avatar || '/images/shipper.jpg'})`, backgroundSize: 'cover' }}></div>
                                    <div>
                                        <div style={{ fontWeight: '800' }}>{shipper.user?.fullName || 'Tài xế HaFo'}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{shipper.licensePlate} · {shipper.vehicleType}</div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                    <button className="btn soft" style={{ flex: 1 }}>Gọi điện</button>
                                    <button className="btn soft" style={{ flex: 1 }}>Nhắn tin</button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: '#666', fontSize: '13px' }}>
                                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px', color: '#F97350' }}></i>
                                <div>Đang tìm tài xế gần bạn...</div>
                            </div>
                        )}
                    </div>

                    {/* NÚT NHẬN HÀNG */}
                    <div className="card" style={{ background: '#fff', padding: '16px', borderRadius: '14px', border: '1px solid #eadfcd', marginBottom: '15px' }}>
                        <h4 style={{ marginTop: 0 }}><i className="fa-solid fa-bolt"></i> Trạng thái</h4>

                        {/* Nếu status = done thì hiện đã nhận, ngược lại hiện nút bấm */}
                        {order.status === 'done' ? (
                            <button className="btn receive active" disabled style={{ cursor: 'default' }}>
                                <i className="fa-solid fa-check-double"></i> Đã nhận hàng thành công
                            </button>
                        ) : (
                            <button
                                className={`btn receive ${canReceive ? 'active' : ''}`}
                                disabled={!canReceive}
                                onClick={() => setShowModal(true)}
                            >
                                <i className="fa-solid fa-box-open"></i> Xác nhận đã nhận hàng
                            </button>
                        )}

                        <div style={{ fontSize: '12px', color: '#888', marginTop: '8px', textAlign: 'center' }}>
                            {canReceive ? 'Chỉ bấm khi bạn đã cầm món trên tay.' : 'Nút sẽ sáng lên khi tài xế đến nơi.'}
                        </div>
                    </div>

                    {/* Tóm tắt */}
                    <div className="card" style={{ background: '#fff', padding: '16px', borderRadius: '14px', border: '1px solid #eadfcd' }}>
                        <h4 style={{ marginTop: 0 }}>Tóm tắt đơn</h4>
                        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#333' }}>
                            {/* SỬA ĐOẠN NÀY */}
                            {Array.isArray(order.items) ? (
                                <ul style={{ paddingLeft: 15, margin: 0 }}>
                                    {order.items.map((it, i) => (
                                        <li key={i}>{it.quantity}x {it.name} <small>{it.options}</small></li>
                                    ))}
                                </ul>
                            ) : order.items}
                        </div>
                        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '16px' }}>
                            <span>Tổng cộng</span>
                            <span>{toVND(order.total)}đ</span>
                        </div>
                    </div>
                </aside>
            </main>

            {/* MODAL XÁC NHẬN */}
            <div className={`overlay ${showModal ? 'show' : ''}`} style={{ display: showModal ? 'flex' : 'none' }}>
                <div className="modal-box">
                    <div style={{ padding: '16px', background: '#FFFCF5', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
                        Xác nhận đã nhận hàng
                    </div>
                    <div style={{ padding: '20px' }}>
                        <div style={{ fontWeight: '700', marginBottom: '8px' }}>Bạn đã nhận đủ món từ tài xế?</div>
                        <div style={{ fontSize: '13px', color: '#666' }}>Hành động này sẽ hoàn tất đơn hàng và thanh toán cho tài xế.</div>

                        <div className="act-row">
                            <button className="btn soft" onClick={() => setShowModal(false)} style={{ border: '1px solid #ddd', background: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Để sau</button>

                            <button
                                onClick={handleReceiveOrder}
                                style={{ background: '#22C55E', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <i className="fa-solid fa-circle-check"></i> Đã nhận hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default OrderTracking;