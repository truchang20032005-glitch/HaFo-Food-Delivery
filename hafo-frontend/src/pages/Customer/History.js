import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // ✅ ĐÃ THÊM useLocation VÀO ĐÂY
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';

const toVND = (n) => n?.toLocaleString('vi-VN');

function History() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, danggiao, damua, dahuy
    const [selectedReview, setSelectedReview] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // ✅ Lấy thông tin điều hướng từ Navbar gửi qua
    const { addToCart } = useCart();


    // LOGIC ĐIỀU HƯỚNG THÔNG MINH (Mở modal khi bấm từ chuông thông báo)
    const handleViewReview = useCallback(async (orderId) => {
        try {
            const res = await api.get(`/customer-reviews/order/${orderId}`);
            setSelectedReview(res.data);
            setShowReviewModal(true);
        } catch (err) {
            alert("Đơn hàng này hiện chưa có đánh giá hoặc phản hồi.");
        }
    }, []);

    // Hàm lấy dữ liệu (Dùng useCallback để fix warning)
    const fetchHistory = useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        try {
            const res = await api.get(`/orders?userId=${user.id || user._id}`);
            const myOrders = res.data.filter(o => o.userId === (user.id || user._id));
            myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(myOrders);
        } catch (err) {
            console.error("Lỗi tải lịch sử:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Lấy dữ liệu lịch sử từ Backend
    useEffect(() => {
        // Chỉ chạy khi orders đã tải xong và có openOrderId trong state
        if (!loading && orders.length > 0 && location.state?.openOrderId) {
            const targetId = location.state.openOrderId;
            const targetOrder = orders.find(o => o._id === targetId);

            if (targetOrder) {
                handleViewReview(targetOrder._id.toString());
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, orders, loading, handleViewReview]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    // Hàm xử lý ảnh
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/80?text=HaFo';
        return path;
    };

    // Kiểm tra xem đơn hàng có trong vòng 24h không
    const canEdit = (orderDate) => {
        const now = new Date();
        const receivedDate = new Date(orderDate);
        const diffInHours = (now - receivedDate) / (1000 * 60 * 60);
        return diffInHours <= 24;
    };

    // Logic lọc tab
    const filteredOrders = orders.filter(o => {
        if (filter === 'all') return true;
        // ✅ THÊM 'ready' vào mảng này
        if (filter === 'danggiao') return ['new', 'prep', 'ready', 'pickup'].includes(o.status);
        if (filter === 'damua') return o.status === 'done';
        if (filter === 'dahuy') return o.status === 'cancel';
        return true;
    });

    // Xử lí đặt lại/mua lại
    const handleReorder = async (order) => {
        try {
            // Lấy ID nhà hàng (xử lý cả trường hợp là object hoặc string)
            const resId = order.restaurantId?._id || order.restaurantId;

            // Bước A: Kiểm tra trạng thái quán (Mở/Đóng)
            const resRest = await api.get(`/restaurants/${resId}`);
            const restaurant = resRest.data.restaurant || resRest.data;

            if (!restaurant.isOpen) {
                return alert(`Quán "${restaurant.name}" hiện đã đóng cửa. Má vui lòng quay lại sau nha! 🕒`);
            }

            // Bước B: Lấy Menu mới nhất để check món còn bán không
            const resMenu = await api.get(`/restaurants/${resId}/menu`);
            const currentMenu = resMenu.data;

            let addedCount = 0;
            let unavailableCount = 0;

            // Bước C: Đối chiếu và thêm vào giỏ
            for (const orderItem of order.items) {
                const liveFood = currentMenu.find(f => f._id === orderItem.foodId);

                if (liveFood && liveFood.isAvailable) {
                    // Tạo object cartItem chuẩn (bao gồm cả tọa độ quán để tính ship ở Checkout)
                    const [resLng, resLat] = restaurant.location?.coordinates || [106.660172, 10.762622];

                    const cartItem = {
                        ...liveFood,
                        uniqueId: Date.now() + Math.random(),
                        restaurantId: resId,
                        restaurantName: restaurant.name,
                        resLat: resLat,
                        resLng: resLng,
                        quantity: orderItem.quantity,
                        selectedSize: 'Vừa', // Mua lại mặc định size vừa (hoặc parse từ orderItem.options nếu muốn xịn hơn)
                        sizePrice: 0,
                        selectedToppings: [],
                        finalPrice: liveFood.price,
                        note: "[Mua lại từ đơn cũ]"
                    };

                    addToCart(cartItem);
                    addedCount++;
                } else {
                    unavailableCount++;
                }
            }

            // Bước D: Thông báo kết quả
            if (addedCount > 0) {
                alert(`Đã thêm ${addedCount} món vào giỏ hàng! ${unavailableCount > 0 ? `(Có ${unavailableCount} món đã ngừng bán)` : ''}`);
                navigate('/cart'); // Chuyển sang giỏ hàng luôn
            } else {
                alert("Rất tiếc, tất cả các món trong đơn này hiện đã ngừng kinh doanh hoặc hết hàng.");
            }

        } catch (err) {
            console.error("Lỗi khi mua lại:", err);
            alert("Không thể kết nối với máy chủ để kiểm tra món ăn.");
        }
    };

    const getStatusBadge = (status) => {
        const styles = { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' };
        switch (status) {
            case 'new': return <span style={{ ...styles, background: '#FFF7E6', color: '#FA8C16' }}>⏳ Chờ xác nhận</span>;
            case 'prep': return <span style={{ ...styles, background: '#E6F7FF', color: '#1890FF' }}>👨‍🍳 Đang chuẩn bị</span>;
            case 'pickup': return <span style={{ ...styles, background: '#F9F0FF', color: '#722ED1' }}>🛵 Đang giao</span>;
            case 'done': return <span style={{ ...styles, background: '#F6FFED', color: '#52C41A' }}>✅ Hoàn thành</span>;
            case 'cancel': return <span style={{ ...styles, background: '#FFF1F0', color: '#F5222D' }}>❌ Đã hủy</span>;
            case 'ready': return <span style={{ ...styles, background: '#f0fff8ff', color: '#1f802aff' }}>✅ Nhà hàng đã xong</span>;
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
                        <button key={tab.id} onClick={() => setFilter(tab.id)} style={{ padding: '8px 18px', borderRadius: '25px', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: filter === tab.id ? '#F97350' : '#fff', color: filter === tab.id ? '#fff' : '#666', boxShadow: filter === tab.id ? '0 4px 10px rgba(249, 115, 80, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)' }}>
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
                            <Link to="/home" style={{ display: 'inline-block', marginTop: '15px', textDecoration: 'none', background: '#F97350', color: '#fff', padding: '10px 25px', borderRadius: '25px', fontWeight: 'bold' }}>Đặt món ngay</Link>
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            const firstItemImage = order.items && order.items.length > 0 ? order.items[0].image : null;
                            return (
                                <div key={order._id} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}><i className="fa-regular fa-clock"></i> {formatDate(order.createdAt)}</div>
                                            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '2px' }}>#{order._id.slice(-8).toUpperCase()}</div>
                                        </div>
                                        <div>{getStatusBadge(order.status)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0', background: '#f9f9f9' }}>
                                            <img src={getImageUrl(firstItemImage)} alt="Food" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=HaFo'} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '5px' }}>
                                                {order.items[0]?.name}
                                                {order.items.length > 1 && <span style={{ fontWeight: 'normal', color: '#666', fontSize: '13px' }}> (+{order.items.length - 1} món khác)</span>}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#666' }}>
                                                {order.items.slice(0, 2).map((item, idx) => (
                                                    <div key={idx}>{item.quantity}x {item.name}</div>
                                                ))}
                                                {order.items.length > 2 && <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#999' }}>...và các món khác</div>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f5f5f5' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Tổng tiền</div>
                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#F97350' }}>{toVND(order.total)}đ</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {['new', 'prep', 'ready', 'pickup'].includes(order.status) && (
                                                <Link to={`/order-tracking/${order._id}`} style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', background: '#e0f2fe', color: '#0070f3', fontSize: '13px', fontWeight: 'bold' }}>Theo dõi</Link>
                                            )}
                                            {order.status === 'done' && (
                                                <>
                                                    <button
                                                        onClick={() => handleReorder(order)}
                                                        style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Mua lại</button>
                                                    {order.isReviewed ? (
                                                        <button onClick={() => handleViewReview(order._id)} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #F97350', background: '#fff', color: '#F97350', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Xem lại đánh giá</button>
                                                    ) : (
                                                        <Link to={`/review/${order._id}`} style={{ textDecoration: 'none', padding: '8px 20px', borderRadius: '20px', background: '#F97350', color: '#fff', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(249, 115, 80, 0.2)' }}>Đánh giá</Link>
                                                    )}
                                                </>
                                            )}
                                            {order.status === 'cancel' && <button
                                                onClick={() => handleReorder(order)}
                                                style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Đặt lại</button>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* MODAL CHI TIẾT ĐÁNH GIÁ */}
            {showReviewModal && selectedReview && (
                <div style={S.modalOverlay}>
                    <div className="animate-pop-in" style={S.modalContainer}>
                        <div style={S.modalHeader}>
                            <div>
                                <h3 style={S.modalTitle}>Chi tiết đánh giá</h3>
                                <p style={S.modalSubtitle}>Đơn hàng #{selectedReview.orderId?.slice ? selectedReview.orderId.slice(-6).toUpperCase() : '...'}</p>
                            </div>
                            <button onClick={() => setShowReviewModal(false)} style={S.closeBtnCircle}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div style={S.modalBody}>
                            <div style={S.shipperHighlightCard}>
                                <div style={S.shipperAvatarLarge}><i className="fa-solid fa-motorcycle"></i></div>
                                <div style={{ flex: 1 }}>
                                    <div style={S.labelText}>Tài xế vận chuyển</div>
                                    <div style={S.shipperNameLarge}>{selectedReview.shipperId?.fullName || "Tài xế"}</div>
                                    <div style={S.starRowLarge}>{'★'.repeat(selectedReview.shipperRating || 0)}<span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - (selectedReview.shipperRating || 0))}</span></div>
                                </div>
                            </div>
                            {selectedReview.shipperComment && <div style={S.commentBubble}><i className="fa-solid fa-quote-left" style={{ color: '#F97350', marginRight: '8px', opacity: 0.5 }}></i>{selectedReview.shipperComment}</div>}
                            <div style={S.divider}></div>
                            <div>
                                <h4 style={S.sectionTitle}>🍴 Đánh giá món ăn ({selectedReview.itemReviews?.length || 0})</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedReview.itemReviews?.map((item, idx) => (
                                        <div key={idx} style={S.foodReviewCard}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                                                <div style={S.foodName}>{item.name}</div>
                                                <div style={S.starRowSmall}>{'★'.repeat(item.rating || 0)}<span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - (item.rating || 0))}</span></div>
                                            </div>
                                            {item.comment && <div style={S.foodComment}>{item.comment}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedReview.replies && selectedReview.replies.length > 0 && (
                                <div style={S.replySectionContainer}>
                                    <h4 style={S.sectionTitle}>💬 Phản hồi từ đối tác</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {selectedReview.replies.map((reply, i) => {
                                            const isMerchant = reply.userRole === 'merchant';
                                            return (
                                                <div key={i} style={S.replyChatBubble}>
                                                    <div style={S.replyAvatar(isMerchant)}><i className={`fa-solid ${isMerchant ? 'fa-store' : 'fa-motorcycle'}`}></i></div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={S.replyAuthorName}>{reply.userId?.fullName}<span style={S.replyRoleBadge(isMerchant)}>{isMerchant ? 'Quán' : 'Shipper'}</span></div>
                                                        <div style={S.replyContent}>{reply.content}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={S.modalFooter}>
                            {canEdit(selectedReview.createdAt) ? (
                                <button onClick={() => navigate(`/review/${selectedReview.orderId}?edit=true`)} style={S.editBtnPrimary}><i className="fa-solid fa-pen-to-square" style={{ marginRight: '8px' }}></i> Sửa đánh giá (Còn hiệu lực)</button>
                            ) : (
                                <div style={S.expiredNotice}><i className="fa-solid fa-clock-rotate-left"></i> Đã hết thời hạn chỉnh sửa (24h)</div>
                            )}
                            <button onClick={() => setShowReviewModal(false)} style={S.closeBtnText}>Đóng lại</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const S = {
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', padding: '20px' },
    modalContainer: { background: '#fff', width: '100%', maxWidth: '550px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' },
    modalHeader: { padding: '20px 25px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' },
    modalTitle: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' },
    modalSubtitle: { margin: '4px 0 0', fontSize: '13px', color: '#6B7280' },
    closeBtnCircle: { width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#F3F4F6', color: '#4B5563', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
    modalBody: { padding: '25px', overflowY: 'auto', flex: 1, background: '#F9FAFB' },
    shipperHighlightCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: '#FFF7ED', borderRadius: '16px', border: '1px solid #FFEDD5' },
    shipperAvatarLarge: { width: '56px', height: '56px', borderRadius: '50%', background: '#F97350', color: 'white', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(249, 115, 80, 0.2)' },
    labelText: { fontSize: '12px', color: '#9A3412', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
    shipperNameLarge: { fontSize: '18px', fontWeight: '800', color: '#9A3412', margin: '2px 0' },
    starRowLarge: { fontSize: '20px', color: '#FBBF24', letterSpacing: '2px' },
    commentBubble: { marginTop: '15px', padding: '15px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#374151', fontStyle: 'italic', lineHeight: '1.5' },
    divider: { height: '1px', background: '#E5E7EB', margin: '25px 0' },
    sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 15px' },
    foodReviewCard: { padding: '15px', background: '#fff', borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' },
    foodName: { fontWeight: '700', fontSize: '15px', color: '#374151' },
    starRowSmall: { fontSize: '14px', color: '#FBBF24' },
    foodComment: { fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: '1.4' },
    replySectionContainer: { marginTop: '30px', paddingTop: '25px', borderTop: '2px dashed #E5E7EB' },
    replyChatBubble: { display: 'flex', gap: '12px' },
    replyAvatar: (isMerchant) => ({ width: '32px', height: '32px', borderRadius: '50%', background: isMerchant ? '#EFF6FF' : '#F0FDF4', color: isMerchant ? '#2563EB' : '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }),
    replyAuthorName: { fontWeight: '700', fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' },
    replyRoleBadge: (isMerchant) => ({ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: isMerchant ? '#DBEAFE' : '#DCFCE7', color: isMerchant ? '#1E40AF' : '#166534', fontWeight: '800', textTransform: 'uppercase' }),
    replyContent: { marginTop: '4px', padding: '10px 14px', background: '#fff', borderRadius: '4px 16px 16px 16px', border: '1px solid #E5E7EB', fontSize: '13px', color: '#374151', lineHeight: '1.5' },
    modalFooter: { padding: '20px 25px', borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: '12px', background: '#fff' },
    editBtnPrimary: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#F97350', color: '#fff', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249, 115, 80, 0.25)', transition: 'all 0.2s' },
    expiredNotice: { textAlign: 'center', fontSize: '13px', color: '#6B7280', padding: '10px', background: '#F3F4F6', borderRadius: '12px', fontWeight: '600' },
    closeBtnText: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#fff', color: '#6B7280', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' },
};

export default History;