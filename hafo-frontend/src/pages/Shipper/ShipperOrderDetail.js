import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

// --- STYLES ĐÃ FIX LỖI TRÀN NÚT TRÊN MÀN HÌNH TO ---
const styles = {
    container: {
        background: '#f3f4f6',
        minHeight: '100vh',
        paddingBottom: '100px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        // --- THÊM: Căn giữa giao diện App trên màn hình to ---
        maxWidth: '500px',
        margin: '0 auto',
        boxShadow: '0 0 15px rgba(0,0,0,0.05)' // Thêm bóng cho đẹp
    },
    header: {
        background: 'white',
        padding: '12px 15px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 20
    },
    backBtn: {
        background: 'none', border: 'none', fontSize: '22px', color: '#333', cursor: 'pointer', padding: '5px'
    },
    statusBanner: (status) => ({
        background: status === 'pickup' ? '#8B5CF6' : (status === 'ready' ? '#F59E0B' : '#10B981'),
        color: 'white',
        padding: '12px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '15px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    }),
    section: {
        background: 'white', marginTop: '10px', padding: '15px',
        borderTop: '1px solid #eee', borderBottom: '1px solid #eee'
    },
    sectionHeader: {
        fontSize: '13px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase',
        marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px'
    },
    bigText: { fontSize: '17px', fontWeight: '700', color: '#111827', lineHeight: '1.3' },
    subText: { fontSize: '14px', color: '#4B5563', marginTop: '4px' },
    callBtn: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: '#EFF6FF', color: '#2563EB', borderRadius: '50px',
        padding: '6px 12px', textDecoration: 'none', fontSize: '13px', fontWeight: '600',
        marginTop: '8px', border: '1px solid #BFDBFE'
    },
    itemRow: { display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px dashed #eee' },
    itemImg: { width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', background: '#eee' },

    // --- KHU VỰC SỬA LỖI TRÀN NÚT (QUAN TRỌNG) ---
    fixedBottom: {
        position: 'fixed',
        bottom: 0, // Nằm sát đáy

        // Căn giữa và giới hạn chiều rộng
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '500px',

        background: 'white',
        padding: '12px 15px',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '10px',

        // 🔥 QUAN TRỌNG: Tăng zIndex lên 9999 để đè lên thanh Menu dưới
        zIndex: 9999
    },
    btn: (variant) => ({
        flex: 1,
        padding: '12px',
        borderRadius: '10px',
        border: 'none',
        fontSize: '15px',
        fontWeight: 'bold',
        color: 'white', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        background: variant === 'primary' ? '#F97350' : (variant === 'success' ? '#10B981' : '#EF4444'),
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    })
};

function ShipperOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const timerRef = useRef(null);

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data);
        } catch (err) { console.error("Lỗi load đơn:", err); }
    };

    useEffect(() => {
        fetchOrder();
        timerRef.current = setInterval(fetchOrder, 5000);
        return () => clearInterval(timerRef.current);
    }, [id]);

    const updateStatus = async (status, reason = '') => {
        try {
            const res = await api.put(`/orders/${id}`, { status, reason });
            setOrder(res.data);
            if (status === 'done') {
                alert("🎉 Đã giao hàng thành công!");
                navigate('/shipper');
            }
        } catch (err) { alert("Lỗi: " + err.message); }
    };

    if (!order) return <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Đang tải dữ liệu...</div>;

    const restaurant = order.restaurantId || {};
    const customerParts = order.customer ? order.customer.split(' | ') : [];
    const custName = customerParts[0] || "Khách hàng";
    const custPhone = customerParts[1] ? customerParts[1].replace('SĐT: ', '') : "";
    const custAddr = customerParts[2] ? customerParts[2].replace('Địa chỉ: ', '') : "";

    const isReady = order.status === 'ready';
    const isPickup = order.status === 'pickup';

    return (
        <div style={styles.container}>
            {/* Header & Back */}
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate('/shipper')}>
                    <i className="fa-solid fa-chevron-left"></i>
                </button>
                <div style={{ fontWeight: 'bold', fontSize: '17px', flex: 1, textAlign: 'center', marginRight: '30px' }}>
                    Đơn #{order._id.slice(-6).toUpperCase()}
                </div>
            </div>

            {/* Status Banner */}
            <div style={styles.statusBanner(order.status)}>
                {isPickup ? <><i className="fa-solid fa-motorcycle"></i> ĐANG GIAO HÀNG</> :
                    isReady ? <><i className="fa-solid fa-check-circle"></i> QUÁN ĐÃ XONG MÓN</> :
                        <><i className="fa-solid fa-fire-burner"></i> QUÁN ĐANG CHUẨN BỊ</>}
            </div>

            {/* 1. ĐIỂM LẤY */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}><i className="fa-solid fa-store" style={{ color: '#F97350' }}></i> ĐIỂM LẤY HÀNG</div>
                <div style={styles.bigText}>{restaurant.name || "Đang tải tên quán..."}</div>
                <div style={styles.subText}>{restaurant.address || "..."}</div>
                {restaurant.phone && (
                    <a href={`tel:${restaurant.phone}`} style={styles.callBtn}>
                        <i className="fa-solid fa-phone"></i> Gọi quán: {restaurant.phone}
                    </a>
                )}
            </div>

            {/* 2. ĐIỂM GIAO */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}><i className="fa-solid fa-location-dot" style={{ color: '#8B5CF6' }}></i> ĐIỂM GIAO HÀNG</div>
                <div style={styles.bigText}>{custName}</div>
                <div style={styles.subText}>{custAddr}</div>
                {order.note && (
                    <div style={{ marginTop: 8, background: '#FFF7ED', padding: 8, borderRadius: 6, color: '#C2410C', fontSize: 13 }}>
                        <b><i className="fa-regular fa-note-sticky"></i> Ghi chú:</b> {order.note}
                    </div>
                )}
                {custPhone && (
                    <a href={`tel:${custPhone}`} style={styles.callBtn}>
                        <i className="fa-solid fa-phone"></i> Gọi khách: {custPhone}
                    </a>
                )}
            </div>

            {/* 3. CHI TIẾT ĐƠN */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}><i className="fa-solid fa-receipt"></i> CHI TIẾT ({Array.isArray(order.items) ? order.items.length : 0} MÓN)</div>
                <div>
                    {Array.isArray(order.items) ? order.items.map((item, idx) => (
                        <div key={idx} style={styles.itemRow}>
                            <img src={item.image ? `http://localhost:5000/${item.image}` : "https://via.placeholder.com/50"}
                                style={styles.itemImg} onError={(e) => e.target.src = 'https://via.placeholder.com/50'} alt="" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>{item.name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>x{item.quantity} {item.options ? `(${item.options})` : ''}</div>
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{(item.price * item.quantity).toLocaleString()}đ</div>
                        </div>
                    )) : (<div style={{ padding: 10, fontSize: 13 }}>{order.items}</div>)}
                </div>
                <div style={{ marginTop: 15, paddingTop: 15, borderTop: '2px dashed #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '15px', color: '#666', fontWeight: '600' }}>TỔNG THU KHÁCH:</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#F97350' }}>{order.total ? order.total.toLocaleString() : 0}đ</div>
                </div>
            </div>

            {/* --- THANH NÚT BẤM CỐ ĐỊNH (ĐÃ FIX: CĂN GIỮA + GIỚI HẠN WIDTH) --- */}
            <div style={styles.fixedBottom}>
                {(order.status === 'prep' || order.status === 'ready') && (
                    <button style={styles.btn('primary')} onClick={() => { if (window.confirm("Xác nhận đã nhận món?")) updateStatus('pickup'); }}>
                        <i className="fa-solid fa-box"></i> {isReady ? 'ĐÃ LẤY MÓN' : 'LẤY MÓN SỚM'}
                    </button>
                )}

                {isPickup && (
                    <>
                        <button style={{ ...styles.btn('danger'), flex: 0.35 }} onClick={() => { const r = prompt("Lý do sự cố:"); if (r) updateStatus('cancel', r); }}>
                            <i className="fa-solid fa-triangle-exclamation"></i> SỰ CỐ
                        </button>
                        <button style={styles.btn('success')} onClick={() => { if (window.confirm("Xác nhận đã giao thành công?")) updateStatus('done'); }}>
                            <i className="fa-solid fa-check-double"></i> HOÀN TẤT ĐƠN
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default ShipperOrderDetail;