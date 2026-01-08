import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { alertError, alertSuccess, alertWarning } from '../../utils/hafoAlert';

const toVND = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

function ShipperHistory() {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('delivering'); // ✅ Đặt mặc định là Đang giao để shipper thấy ngay đơn dở dang
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewDetail, setReviewDetail] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const location = useLocation();
    const navigate = useNavigate(); // ✅ Dùng để chuyển hướng về trang xử lý đơn

    // ✅ Định nghĩa hàm mở Modal ổn định với useCallback để tránh Warning ESLint
    const handleSelectOrder = useCallback(async (order) => {
        setSelectedOrder(order);
        if (order.isReviewed) {
            try {
                const res = await api.get(`/customer-reviews/order/${order._id}`);
                setReviewDetail(res.data);
            } catch (err) {
                console.error("Lỗi tải đánh giá:", err);
            }
        }
    }, []);

    // ✅ Logic xử lý click: Đang giao thì chuyển trang, Hoàn tất thì mở Modal
    const handleItemClick = useCallback((order) => {
        const isActive = ['prep', 'ready', 'pickup'].includes(order.status);
        if (isActive) {
            navigate(`/shipper/order/${order._id}`);
        } else {
            handleSelectOrder(order);
        }
    }, [navigate, handleSelectOrder]);

    // ✅ Hàm lấy dữ liệu ổn định (Sửa điều kiện lọc để lấy thêm đơn đang xử lý)
    const loadHistory = useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        const currentUserId = String(user.id || user._id);

        try {
            const res = await api.get('/orders');
            // SỬA: Lấy tất cả các trạng thái đơn hàng mà shipper này tham gia
            const myHistory = res.data.filter(o =>
                (String(o.shipperId?._id || o.shipperId) === currentUserId) &&
                ['prep', 'ready', 'pickup', 'done', 'cancel'].includes(o.status)
            );
            myHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllOrders(myHistory);

            // ✅ LOGIC ĐIỀU HƯỚNG THÔNG MINH TỪ CHUÔNG (Bell Notification)
            if (location.state?.openId) {
                const target = myHistory.find(o => o._id === location.state.openId);
                if (target) {
                    handleItemClick(target);
                    // Xóa trạng thái state để tránh việc tự mở lại khi Admin F5 trang
                    window.history.replaceState({}, document.title);
                }
            }
        } catch (err) {
            console.error("Lỗi lấy lịch sử:", err);
        } finally {
            setLoading(false);
        }
    }, [location.state, handleItemClick]);

    // ✅ Gọi loadHistory chuẩn React (Fix warning dependency)
    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    // ✅ Logic lọc đơn hàng cho các Tab (Fix lỗi thiếu startOfWeek)
    const filteredOrders = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 ngày trước

        return allOrders.filter(order => {
            // MỤC MỚI: Đang giao
            if (filter === 'delivering') {
                return ['prep', 'ready', 'pickup'].includes(order.status);
            }

            const orderDate = new Date(order.createdAt);
            const isFinished = ['done', 'cancel'].includes(order.status);

            if (filter === 'today') return isFinished && orderDate >= startOfToday;
            if (filter === 'week') return isFinished && orderDate >= startOfWeek;

            // Tab 'all' chỉ hiện lịch sử các đơn đã kết thúc (Xong hoặc Hủy)
            return isFinished;
        });
    }, [allOrders, filter]);

    // Thu nhập chỉ tính trên đơn đã giao thành công (done)
    const parseMoney = (val) => {
        if (typeof val === 'string') return parseInt(val.replace(/\D/g, '')) || 0;
        return Number(val || 0);
    };

    const totalEarnings = useMemo(() => {
        return allOrders
            .filter(o => o.status === 'done')
            .reduce((sum, order) => {
                const tipAmount = parseMoney(order.tipAmount);
                return sum + 15000 + (tipAmount * 0.8);
            }, 0);
    }, [allOrders]);

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setIsSubmitting(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await api.post(`/customer-reviews/${reviewDetail._id}/reply`, {
                userId: user.id || user._id,
                content: replyText,
                userRole: 'shipper'
            });
            alertSuccess("Thành công", "Đã gửi phản hồi!");
            setReplyText('');
            handleSelectOrder(selectedOrder);
        } catch (err) { alertError("Lỗi", err.message); }
        finally { setIsSubmitting(false); }
    };

    const handleReportReview = async () => {
        if (!reportReason.trim()) return alertWarning("Thiếu thông tin", "Vui lòng nhập lý do!");
        setIsSubmitting(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const reportData = {
                orderId: selectedOrder._id,
                reporterId: user.id || user._id,
                reporterRole: 'shipper',
                reason: reportReason,
                reviewContent: reviewDetail.shipperComment
            };
            await api.post('/reports/review', reportData);
            alertSuccess("Thành công", "Đã gửi khiếu nại lên Admin!");
            setIsReporting(false);
            setReportReason('');
            loadHistory();
            setSelectedOrder(null);
        } catch (err) { alertError("Lỗi báo cáo", err.message); }
        finally { setIsSubmitting(false); }
    };

    const renderStars = (n) => [...Array(5)].map((_, i) => (
        <i key={i} className="fa-solid fa-star" style={{ color: i < n ? '#F5A524' : '#E2E8F0', fontSize: '12px' }} />
    ));

    const S = {
        summaryCard: { background: 'linear-gradient(135deg, #F97350 0%, #FF5F6D 100%)', borderRadius: '16px', padding: '15px', color: '#fff', boxShadow: '0 8px 15px rgba(249, 115, 80, 0.15)', marginBottom: '20px' },
        orderCard: { background: '#fff', borderRadius: '12px', padding: '12px 15px', marginBottom: '10px', border: '1px solid #F1F5F9', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' },
        modal: { background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh' },
        reviewBox: { background: '#FFF9F7', borderRadius: '12px', padding: '15px', border: '1px solid #FFEDD5', marginTop: '15px' },
        replyBubble: (isMe) => ({
            background: isMe ? '#F97350' : '#F1F5F9',
            color: isMe ? '#fff' : '#334155',
            padding: '8px 12px', borderRadius: '10px', fontSize: '12px', marginBottom: '6px'
        }),
        smallText: { fontSize: '12px', color: '#64748B' },
        boldText: { fontWeight: '800', fontSize: '14px', color: '#1E293B' }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '80px', color: '#64748B' }}>Đang tải...</div>;

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px 15px 80px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#1E293B', marginBottom: '20px' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#F97350', marginRight: '8px' }}></i> Lịch sử hoạt động
            </h2>

            <div style={S.summaryCard}>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>Đơn hoàn tất</div>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{allOrders.filter(o => o.status === 'done').length}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>Tổng thu nhập</div>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{toVND(totalEarnings)}</div>
                    </div>
                </div>
            </div>

            {/* THANH TAB BỘ LỌC CẢI TIẾN */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
                <button onClick={() => setFilter('delivering')} style={{
                    padding: '8px 16px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '12px',
                    background: filter === 'delivering' ? '#F97350' : '#fff', color: filter === 'delivering' ? '#fff' : '#64748B',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', whiteSpace: 'nowrap'
                }}>Đang giao</button>

                {['all', 'today', 'week'].map(t => (
                    <button key={t} onClick={() => setFilter(t)} style={{
                        padding: '6px 16px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '12px',
                        background: filter === t ? '#F97350' : '#fff', color: filter === t ? '#fff' : '#64748B',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}>
                        {t === 'all' ? 'Tất cả' : t === 'today' ? 'Hôm nay' : 'Tuần này'}
                    </button>
                ))}
            </div>

            {filteredOrders.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Không có đơn hàng nào ở mục này.
                </div>
            ) : (
                // ✅ Đã xóa bỏ cặp ngoặc nhọn dư thừa ở đây
                filteredOrders.map(order => {
                    const isActive = ['prep', 'ready', 'pickup'].includes(order.status);
                    const tipEarn = Number(order.tipAmount || 0) * 0.8;
                    const totalOrderEarn = 15000 + tipEarn;

                    return (
                        <div key={order._id} style={S.orderCard} onClick={() => handleItemClick(order)}>
                            <div>
                                <div style={S.boldText}>#{order._id.slice(-6).toUpperCase()}</div>
                                <div style={S.smallText}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                                {order.status === 'cancel' ? (
                                    <div style={{ fontWeight: '800', color: '#94A3B8', fontSize: '14px' }}>Đã hủy</div>
                                ) : (
                                    <>
                                        {/* Hiển thị tiền: toVND đã có sẵn chữ 'đ' */}
                                        <div style={{ fontWeight: '800', color: '#F97350', fontSize: '14px' }}>
                                            {order.status === 'done' ? '+' : ''}{toVND(totalOrderEarn)}
                                        </div>

                                        {/* Chú thích thông minh */}
                                        <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '700' }}>
                                            {isActive ? (
                                                <span style={{ color: '#F97350' }}>DỰ KIẾN GIAO ➔</span>
                                            ) : (
                                                order.tipAmount > 0 ? `(Gồm ${toVND(tipEarn)} Tip)` : 'Phí giao hàng'
                                            )}
                                        </div>

                                        {/* Đánh giá sao */}
                                        {!isActive && order.isReviewed && (
                                            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
                                                {order.shipperRating > 0 ? (
                                                    [...Array(5)].map((_, i) => (
                                                        <i key={i} className="fa-solid fa-star"
                                                            style={{ color: i < order.shipperRating ? '#F5A524' : '#E2E8F0', fontSize: '10px' }} />
                                                    ))
                                                ) : (
                                                    <span style={{ fontSize: '10px', color: '#94A3B8' }}>Đã đánh giá</span>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })
            )}

            {selectedOrder && (
                <div style={S.overlay} onClick={() => { setSelectedOrder(null); setReviewDetail(null); }}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <b style={{ fontSize: '15px' }}>Chi tiết đơn #{selectedOrder._id.slice(-6).toUpperCase()}</b>
                            <button onClick={() => { setSelectedOrder(null); setReviewDetail(null); }} style={{ border: 'none', background: 'none', fontSize: '20px', color: '#94A3B8' }}>×</button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' }}>Khách hàng</div>
                                <div style={{ fontWeight: '700', fontSize: '14px', marginTop: '2px' }}>{selectedOrder.customer.split('|')[0]}</div>
                                <div style={{ fontSize: '12px', color: '#64748B' }}>{selectedOrder.customer.split('|')[2]}</div>
                            </div>

                            <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Món ăn</div>
                            {selectedOrder.items.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '10px', padding: '6px 0', borderBottom: '1px solid #F8FAFC' }}>
                                    <div style={{ fontWeight: '700', fontSize: '13px', width: '25px' }}>{it.quantity}x</div>
                                    <div style={{ flex: 1, fontSize: '13px' }}>{it.name}</div>
                                </div>
                            ))}

                            {reviewDetail && (
                                <div style={S.reviewBox}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: '800', color: '#9A3412', fontSize: '12px' }}>⭐ KHÁCH ĐÁNH GIÁ BẠN</span>
                                        <span>{renderStars(reviewDetail.shipperRating)}</span>
                                    </div>
                                    <p style={{ fontStyle: 'italic', color: '#475569', fontSize: '13px', margin: '0 0 12px' }}>"{reviewDetail.shipperComment || "Khách không viết nhận xét"}"</p>

                                    {reviewDetail.replies?.filter(r => r.userRole === 'shipper').map((rep, i) => (
                                        <div key={i} style={S.replyBubble(true)}>
                                            <b style={{ fontSize: '10px', display: 'block' }}>BẠN ĐÃ PHẢN HỒI:</b>
                                            {rep.content}
                                        </div>
                                    ))}

                                    {!isReporting && (
                                        <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                                            <input style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid #FFEDD5', outline: 'none', fontSize: '12px' }}
                                                placeholder="Phản hồi khách..." value={replyText} onChange={e => setReplyText(e.target.value)} />
                                            <button onClick={handleSendReply} disabled={isSubmitting} style={{ background: '#F97350', color: '#fff', border: 'none', borderRadius: '10px', padding: '0 15px', fontWeight: 'bold', fontSize: '12px' }}>Gửi</button>
                                        </div>
                                    )}

                                    <button onClick={() => setIsReporting(true)} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#EF4444', textDecoration: 'underline', fontSize: '11px', cursor: 'pointer' }}>
                                        Khiếu nại đánh giá này
                                    </button>
                                </div>
                            )}
                        </div>
                        <div style={{ padding: '15px', textAlign: 'center' }}>
                            <button onClick={() => { setSelectedOrder(null); setReviewDetail(null); }} style={{ width: '100%', padding: '10px', background: '#334155', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px' }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {isReporting && (
                <div style={{ ...S.overlay, zIndex: 11000 }}>
                    <div style={{ ...S.modal, maxWidth: '350px', padding: '20px' }}>
                        <h4 style={{ color: '#EF4444', margin: 0, fontSize: '16px' }}>🚩 Báo cáo đánh giá</h4>
                        <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
                            placeholder="Lý do khiếu nại..."
                            style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '10px', border: '1px solid #E2E8F0', marginTop: '12px', outline: 'none', fontSize: '12px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '15px' }}>
                            <button style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', fontSize: '12px' }} onClick={() => setIsReporting(false)}>Hủy</button>
                            <button style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} onClick={handleReportReview} disabled={isSubmitting}>Gửi báo cáo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ShipperHistory;