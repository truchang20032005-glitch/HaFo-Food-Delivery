import { useEffect, useState, useCallback, useRef } from 'react'; // Thêm useCallback
import { useParams, useNavigate } from 'react-router-dom';
import Chat from '../../components/Chat';
import api from '../../services/api';
import { alertError, alertSuccess, confirmDialog } from '../../utils/hafoAlert';

const styles = {
    container: {
        background: '#f3f4f6',
        minHeight: '100vh',
        // ✅ GIẢM paddingBottom xuống vì nút đã hạ thấp
        paddingBottom: '100px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        maxWidth: '500px',
        margin: '0 auto',
        boxShadow: '0 0 15px rgba(0,0,0,0.05)'
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
    itemImg: {
        width: '65px',
        height: '65px',
        borderRadius: '12px',
        objectFit: 'cover',
        background: '#eee',
        flexShrink: 0
    },
    chatBtn: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: '#F97350', color: '#fff', borderRadius: '50px',
        padding: '6px 15px', textDecoration: 'none', fontSize: '13px', fontWeight: '600',
        marginTop: '8px', border: 'none', cursor: 'pointer', marginLeft: '10px'
    },
    fixedBottom: {
        position: 'fixed',
        // ✅ ĐƯA XUỐNG DƯỚI (Thay vì 100px) để shipper dễ bấm bằng ngón cái
        bottom: '66px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '92%',
        maxWidth: '460px',
        display: 'flex',
        gap: '12px',
        zIndex: 9999
    },
    btn: (variant) => ({
        flex: 1,
        padding: '16px', // Tăng độ dày cho nút dễ bấm hơn
        borderRadius: '20px', // Bo tròn nhiều hơn cho hiện đại
        border: 'none',
        fontSize: '16px',
        fontWeight: '800',
        color: 'white',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px',
        // ✅ SỬ DỤNG GRADIENT cho variant primary (Đã lấy món)
        background: variant === 'primary'
            ? 'linear-gradient(135deg, #F97350 0%, #f08c2eff 100%)'
            : (variant === 'success' ? '#10B981' : '#EF4444'),
        // ✅ TĂNG ĐỘ ĐẬM CỦA ĐỔ BÓNG
        boxShadow: variant === 'primary'
            ? '0 8px 20px rgba(249, 115, 80, 0.4)'
            : '0 4px 15px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease'
    }),
    chatOverlay: {
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '450px', height: '80vh',
        background: 'white', zIndex: 10000,
        boxShadow: '0 -10px 30px rgba(0,0,0,0.2)',
        borderRadius: '24px 24px 0 0', overflow: 'hidden',
        transition: 'transform 0.3s ease-out'
    },
    mapBtn: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff', color: '#F97350', borderRadius: '50px',
        padding: '6px 15px', textDecoration: 'none', fontSize: '13px', fontWeight: '800',
        marginTop: '10px', border: '1.5px solid #F97350', cursor: 'pointer',
        gap: '6px', boxShadow: '0 2px 5px rgba(249, 115, 80, 0.1)'
    }
};

function ShipperOrderDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [hasNewMsg, setHasNewMsg] = useState(false);
    const [lastNotifiedMsgId, setLastNotifiedMsgId] = useState(null);

    const [btnPos, setBtnPos] = useState({ x: 20, y: 150 });
    const movedRef = useRef(false); // Ref để kiểm tra xem có đang kéo hay không

    const handleMouseDown = (e) => {
        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = btnPos.x;
        const initialY = btnPos.y;
        movedRef.current = false; // Reset trạng thái mỗi khi nhấn xuống

        const onMouseMove = (moveEvent) => {
            // Tính toán khoảng cách di chuyển
            const deltaX = startX - moveEvent.clientX;
            const deltaY = startY - moveEvent.clientY;

            // Nếu di chuyển hơn 5px thì coi như là đang kéo
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                movedRef.current = true;
            }

            setBtnPos({
                x: initialX + deltaX,
                y: initialY + deltaY
            });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // DÙNG useCallback ĐỂ FIX WARNING
    const fetchOrder = useCallback(async () => {
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data);
        } catch (err) { console.error("Lỗi load đơn:", err); }
    }, [id]); // Phụ thuộc vào id

    // DÙNG useCallback ĐỂ FIX WARNING
    const checkMessages = useCallback(async () => {
        try {
            const res = await api.get(`/messages/${id}`);
            const messages = res.data;
            if (messages.length > 0) {
                const lastMsg = messages[messages.length - 1];
                const lastRead = localStorage.getItem(`lastRead_${id}`);
                const currentUserId = localStorage.getItem('userId');

                // A. Âm thanh báo tin nhắn (chỉ khi tin mới khác ID cũ)
                if (lastMsg.senderId !== currentUserId && lastMsg._id !== lastNotifiedMsgId) {
                    const audio = new Audio('/sounds/message.mp3');
                    audio.play().catch(() => { });
                    setLastNotifiedMsgId(lastMsg._id);
                }

                // B. Logic Chấm đỏ: Nếu tin cuối từ đối phương VÀ chưa được đọc (mốc thời gian)
                if (lastMsg.senderId !== currentUserId) {
                    if (!lastRead || new Date(lastMsg.createdAt) > new Date(lastRead)) {
                        setHasNewMsg(true);
                    } else {
                        setHasNewMsg(false);
                    }
                } else {
                    setHasNewMsg(false); // Mình là người nhắn cuối thì không hiện chấm đỏ
                }
            }
        } catch (err) { console.error(err); }
    }, [id, lastNotifiedMsgId]);

    useEffect(() => {
        fetchOrder();
        const t1 = setInterval(fetchOrder, 5000);
        const t2 = setInterval(checkMessages, 4000);
        return () => { clearInterval(t1); clearInterval(t2); };
    }, [fetchOrder, checkMessages]);

    const handleOpenChat = () => {
        setIsChatOpen(true);
        setHasNewMsg(false);
        localStorage.setItem(`lastRead_${id}`, new Date().toISOString());
    };

    const updateStatus = async (status, reason = '') => {
        try {
            const res = await api.put(`/orders/${id}`, { status, reason });
            setOrder(res.data);
            if (status === 'done') {
                await alertSuccess(
                    "Tuyệt vời!",
                    "Đơn hàng đã hoàn thành. Cảm ơn bạn đã nỗ lực giao hàng!"
                );
                navigate('/shipper');
            }
        } catch (err) { alertError("Lỗi", err.message); }
    };

    if (!order) return <div style={{ padding: 20, textAlign: 'center', color: '#888' }}>Đang tải dữ liệu...</div>;

    const restaurant = order.restaurantId || {};
    const customerParts = order.customer ? order.customer.split(' | ') : [];
    const custName = customerParts[0] || "Khách hàng";
    const custPhone = customerParts[1] ? customerParts[1].replace('SĐT: ', '') : "";
    const custAddr = customerParts[2] ? customerParts[2].replace('Địa chỉ: ', '') : "";

    const isReady = order.status === 'ready';
    const isPickup = order.status === 'pickup';

    const handleOpenMap = (lat, lng) => {
        if (!lat || !lng) return alertError("Lỗi", "Không tìm thấy tọa độ!");
        // Cấu trúc URL chuẩn để mở app bản đồ
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
        window.open(url, '_blank');
    };

    const handlePickupClick = async () => {
        // Xác định nội dung thông báo dựa trên trạng thái món ăn
        const title = isReady ? "Xác nhận đã lấy món?" : "Lấy món sớm?";
        const message = isReady
            ? "Bạn đã nhận gói hàng từ cửa hàng chưa?"
            : "Cửa hàng chưa báo món xong, bạn chắc chắn muốn lấy món sớm không?";

        // Gọi confirmDialog (đã import từ hafoAlert.js)
        const isConfirmed = await confirmDialog(title, message);

        if (isConfirmed) {
            try {
                // Cập nhật trạng thái
                await updateStatus('pickup');

                // Thông báo thành công cho Shipper yên tâm
                await alertSuccess("Đã lấy món!", "Hãy bắt đầu hành trình giao hàng nhé.");
            } catch (err) {
                alertError("Lỗi", "Không thể cập nhật trạng thái lúc này.");
            }
        }
    };

    const handleCompleteOrder = async () => {
        // 1. Hiện hộp thoại xác nhận chuyên nghiệp
        const isConfirmed = await confirmDialog(
            "Hoàn tất đơn hàng?",
            "Xác nhận bạn đã giao món ăn thành công đến tay khách hàng và nhận đầy đủ thanh toán (nếu có)?"
        );

        if (isConfirmed) {
            try {
                // 2. Gọi hàm cập nhật trạng thái lên Server
                await updateStatus('done');
                // Nếu bạn có logic điều hướng hoặc đóng trang chi tiết thì thêm ở đây
            } catch (err) {
                // 4. Xử lý lỗi nếu mất mạng hoặc lỗi Server
                const errorMsg = err.response?.data?.message || "Không thể cập nhật trạng thái đơn hàng.";
                alertError("Lỗi hệ thống", errorMsg);
            }
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <button style={styles.backBtn} onClick={() => navigate('/shipper')}>
                    <i className="fa-solid fa-chevron-left"></i>
                </button>
                <div style={{ fontWeight: 'bold', fontSize: '17px', flex: 1, textAlign: 'center', marginRight: '30px' }}>
                    Đơn #{order._id.slice(-6).toUpperCase()}
                </div>
            </div>

            <div style={styles.statusBanner(order.status)}>
                {isPickup ? <><i className="fa-solid fa-motorcycle"></i> ĐANG GIAO HÀNG</> :
                    isReady ? <><i className="fa-solid fa-check-circle"></i> QUÁN ĐÃ XONG MÓN</> :
                        <><i className="fa-solid fa-fire-burner"></i> QUÁN ĐANG CHUẨN BỊ</>}
            </div>

            <div style={styles.section}>
                <div style={styles.sectionHeader}><i className="fa-solid fa-store" style={{ color: '#F97350' }}></i> ĐIỂM LẤY HÀNG</div>
                <div style={styles.bigText}>{restaurant.name || "Đang tải tên quán..."}</div>
                <div style={styles.subText}>{restaurant.address || "..."}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {restaurant.phone && (
                        <a href={`tel:${restaurant.phone}`} style={styles.callBtn}>
                            <i className="fa-solid fa-phone"></i> Gọi quán
                        </a>
                    )}
                    {/* ✅ NÚT CHỈ ĐƯỜNG TỚI QUÁN */}
                    <button
                        style={styles.mapBtn}
                        onClick={() => handleOpenMap(restaurant.location.coordinates[1], restaurant.location.coordinates[0])}
                    >
                        <i className="fa-solid fa-map-location-dot"></i> Chỉ đường tới quán
                    </button>
                </div>
            </div>

            <div style={styles.section}>
                <div style={styles.sectionHeader}><i className="fa-solid fa-location-dot" style={{ color: '#8B5CF6' }}></i> ĐIỂM GIAO HÀNG</div>
                <div style={styles.bigText}>{custName}</div>
                <div style={styles.subText}>{custAddr}</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <a href={`tel:${custPhone}`} style={styles.callBtn}>
                        <i className="fa-solid fa-phone"></i> Gọi khách
                    </a>
                    {/* ✅ NÚT CHỈ ĐƯỜNG TỚI NHÀ KHÁCH */}
                    <button
                        style={styles.mapBtn}
                        onClick={() => handleOpenMap(order.lat, order.lng)}
                    >
                        <i className="fa-solid fa-map-location-dot"></i> Chỉ đường tới khách
                    </button>
                </div>
                {order.note && (
                    <div style={{ marginTop: 8, background: '#FFF7ED', padding: 8, borderRadius: 6, color: '#C2410C', fontSize: 13 }}>
                        <b><i className="fa-regular fa-note-sticky"></i> Ghi chú:</b> {order.note}
                    </div>
                )}
            </div>

            <div style={styles.section}>
                <div style={styles.sectionHeader}><i className="fa-solid fa-receipt"></i> CHI TIẾT ({Array.isArray(order.items) ? order.items.length : 0} MÓN)</div>
                <div>
                    {Array.isArray(order.items) && order.items.map((item, idx) => (
                        <div key={idx} style={styles.itemRow}>
                            <img src={item.image || "https://via.placeholder.com/60"} style={styles.itemImg} alt={item.name} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>{item.name}</div>
                                <div style={{ fontSize: '12px', color: '#666' }}>x{item.quantity} {item.options ? `(${item.options})` : ''}</div>
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{(item.price * item.quantity).toLocaleString()}đ</div>
                        </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 15 }}>
                        <a href={`tel:${custPhone}`} style={styles.callBtn}>
                            <i className="fa-solid fa-phone"></i> Gọi khách
                        </a>
                        <div
                            style={{
                                position: 'fixed',
                                right: `${btnPos.x}px`,
                                bottom: `${btnPos.y}px`,
                                zIndex: 1000,
                                touchAction: 'none' // Ngăn trình duyệt cuộn trang khi đang kéo trên mobile
                            }}
                        >
                            <button
                                onMouseDown={handleMouseDown} // Bắt đầu kéo
                                onClick={() => {
                                    // ✅ CHỈ MỞ CHAT NẾU KHÔNG PHẢI LÀ ĐANG KÉO
                                    if (!movedRef.current) {
                                        handleOpenChat();
                                    }
                                }}
                                style={{
                                    position: 'relative',
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    background: '#F97350',
                                    border: '3px solid #fff',
                                    color: '#fff',
                                    fontSize: '24px',
                                    boxShadow: '0 8px 20px rgba(249, 115, 80, 0.4)',
                                    cursor: 'grab',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: movedRef.current ? 'none' : 'transform 0.2s' // Mượt khi không kéo
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <i className="fa-solid fa-comments"></i>
                                {hasNewMsg && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-2px',
                                        right: '-2px',
                                        width: '18px',
                                        height: '18px',
                                        background: '#EF4444',
                                        borderRadius: '50%',
                                        border: '3px solid #fff',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}></span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: 15, paddingTop: 15, borderTop: '2px dashed #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '15px', color: '#666', fontWeight: '600' }}>TỔNG THU KHÁCH:</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#F97350' }}>{order.total ? order.total.toLocaleString() : 0}đ</div>
                </div>
            </div>

            {isChatOpen && (
                <div style={styles.chatOverlay}>
                    <Chat
                        orderId={id}
                        onClose={() => setIsChatOpen(false)}
                        partnerAvatar="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" // Icon người dùng cơ bản
                    />
                </div>
            )}

            <div style={styles.fixedBottom}>
                {(order.status === 'prep' || order.status === 'ready') && (
                    <button style={styles.btn('primary')} onClick={handlePickupClick}>
                        <i className="fa-solid fa-box"></i> {isReady ? 'ĐÃ LẤY MÓN' : 'LẤY MÓN SỚM'}
                    </button>
                )}

                {isPickup && (
                    <>
                        <button style={{ ...styles.btn('danger'), flex: 0.4 }} onClick={() => { const r = prompt("Lý do sự cố:"); if (r) updateStatus('cancel', r); }}>
                            <i className="fa-solid fa-triangle-exclamation"></i> SỰ CỐ
                        </button>
                        <button style={styles.btn('success')} onClick={handleCompleteOrder}>
                            <i className="fa-solid fa-check-double"></i> HOÀN TẤT ĐƠN
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default ShipperOrderDetail;