import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../services/api';
import { useLocation } from 'react-router-dom';

const toVND = (n) => n?.toLocaleString('vi-VN') + 'đ';

function ShipperHistory() {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [reviewDetail, setReviewDetail] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [reportReason, setReportReason] = useState('');
    const [isReporting, setIsReporting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const location = useLocation();

    const handleSelectOrder = useCallback(async (order) => {
        setSelectedOrder(order);
        if (order.isReviewed) {
            try {
                const res = await api.get(`/customer-reviews/order/${order._id}`);
                setReviewDetail(res.data);
            } catch (err) { console.error("Lỗi tải đánh giá:", err); }
        }
    }, []);

    // ✅ Dùng useCallback cho hàm loadHistory để fix cảnh báo ESLint
    const loadHistory = useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        try {
            const res = await api.get('/orders');
            const myHistory = res.data.filter(o =>
                (o.shipperId?._id === (user.id || user._id) || o.shipperId === (user.id || user._id)) && o.status === 'done'
            );
            myHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllOrders(myHistory);

            // ✅ LOGIC ĐIỀU HƯỚNG THÔNG MINH: Tự động mở Modal nếu có ID từ chuông thông báo
            if (location.state?.openId) {
                const target = myHistory.find(o => o._id === location.state.openId);
                if (target) {
                    handleSelectOrder(target);
                    // Xóa trạng thái state để tránh việc tự mở lại khi Admin F5 trang
                    window.history.replaceState({}, document.title);
                }
            }
        } catch (err) {
            console.error("Lỗi lấy lịch sử:", err);
        } finally {
            setLoading(false);
        }
    }, [location.state, handleSelectOrder]); // Chỉ tạo lại khi 2 biến này đổi

    // ✅ Thêm loadHistory vào dependency array để đúng chuẩn React
    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const filteredOrders = useMemo(() => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        return allOrders.filter(order => {
            const orderDate = new Date(order.createdAt);
            if (filter === 'today') return orderDate >= startOfToday;
            if (filter === 'week') return orderDate >= startOfWeek;
            return true;
        });
    }, [allOrders, filter]);

    const totalEarnings = filteredOrders.length * 15000;

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
            alert("✅ Đã gửi phản hồi!");
            setReplyText('');
            handleSelectOrder(selectedOrder);
        } catch (err) { alert("Lỗi: " + err.message); }
        finally { setIsSubmitting(false); }
    };

    // ✅ ĐÃ SỬA: Đồng bộ với API report.js mới nhất
    const handleReportReview = async () => {
        if (!reportReason.trim()) return alert("Vui lòng nhập lý do!");
        setIsSubmitting(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));

            const reportData = {
                orderId: selectedOrder._id,
                reporterId: user.id || user._id, // Đổi shipperId thành reporterId cho đúng Model
                reporterRole: 'shipper',          // Thêm reporterRole
                reason: reportReason,
                reviewContent: reviewDetail.shipperComment
            };

            await api.post('/reports/review', reportData);

            alert("🚩 Đã gửi khiếu nại lên Admin!");
            setIsReporting(false);
            setReportReason('');
            loadHistory(); // Tải lại danh sách để cập nhật trạng thái
            setSelectedOrder(null);
        } catch (err) {
            alert("Lỗi báo cáo: " + err.message);
        } finally {
            setIsSubmitting(false);
        }
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
                <i className="fa-solid fa-clock-rotate-left" style={{ color: '#F97350', marginRight: '8px' }}></i> Lịch sử đơn hàng
            </h2>

            <div style={S.summaryCard}>
                <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>Đơn hoàn tất</div>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{filteredOrders.length}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', opacity: 0.9 }}>Thu nhập ước tính</div>
                        <div style={{ fontSize: '24px', fontWeight: '900' }}>{toVND(totalEarnings)}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {['all', 'today', 'week'].map(t => (
                    <button key={t} onClick={() => setFilter(t)} style={{
                        padding: '6px 16px', borderRadius: '20px', border: 'none', fontWeight: '700', fontSize: '12px',
                        background: filter === t ? '#F97350' : '#fff', color: filter === t ? '#fff' : '#64748B',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'pointer'
                    }}>
                        {t === 'all' ? 'Tất cả' : t === 'today' ? 'Hôm nay' : 'Tuần này'}
                    </button>
                ))}
            </div>

            {allOrders.map(order => (
                <div key={order._id} style={S.orderCard} onClick={() => handleSelectOrder(order)}>
                    <div>
                        <div style={S.boldText}>#{order._id.slice(-6).toUpperCase()}</div>
                        <div style={S.smallText}>{new Date(order.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', color: '#F97350', fontSize: '14px' }}>+15k</div>
                        {/* ✅ ĐÃ SỬA: Sử dụng order.shipperRating cho đúng Model mới */}
                        {order.isReviewed && (
                            <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'flex-end', gap: '2px' }}>
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
                    </div>
                </div>
            ))}

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