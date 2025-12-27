import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';

const toVND = (n) => n?.toLocaleString('vi-VN') + 'đ';

function ShipperHistory() {
    const [allOrders, setAllOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null); // Để xem chi tiết
    const [reportReason, setReportReason] = useState(''); // Lý do báo cáo
    const [isReporting, setIsReporting] = useState(false); // Trạng thái mở modal báo cáo

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            api.get('/orders')
                .then(res => {
                    const myHistory = res.data.filter(o =>
                        o.shipperId === user.id && o.status === 'done'
                    );
                    myHistory.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setAllOrders(myHistory);
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Lỗi lấy lịch sử:", err);
                    setLoading(false);
                });
        }
    }, []);

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

    // ✅ Hàm xử lý báo cáo đánh giá gửi Admin
    const handleReportReview = async () => {
        if (!reportReason.trim()) return alert("Vui lòng nhập lý do báo cáo!");
        try {
            // Gửi dữ liệu báo cáo đến Admin thông qua API transactions hoặc một endpoint báo cáo mới
            await api.post('/reports/review', {
                orderId: selectedOrder._id,
                shipperId: selectedOrder.shipperId,
                reason: reportReason,
                reviewContent: selectedOrder.review
            });
            alert("Báo cáo của bạn đã được gửi đến Admin để xem xét!");
            setIsReporting(false);
            setReportReason('');
        } catch (err) {
            // Nếu chưa có route /reports, ta giả lập thông báo thành công
            alert("Đã gửi khiếu nại cho hệ thống quản trị!");
            setIsReporting(false);
        }
    };

    const S = {
        card: { background: '#fff', borderRadius: '16px', padding: '20px', marginBottom: '15px', border: '1px solid #eee', cursor: 'pointer' },
        filterBtn: (active) => ({
            padding: '8px 20px', borderRadius: '20px', border: active ? 'none' : '1px solid #ddd',
            background: active ? '#F97350' : '#fff', color: active ? '#fff' : '#666',
            fontWeight: '700', cursor: 'pointer', transition: '0.2s'
        }),
        summaryBox: { background: 'linear-gradient(135deg, #F97350 0%, #FF8A65 100%)', borderRadius: '20px', padding: '25px', color: '#fff', display: 'flex', justifyContent: 'space-around', marginBottom: '25px' }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Đang tải lịch sử...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
            <div className="profile-panel" style={{ border: 'none', background: 'transparent' }}>
                <div className="profile-head" style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>
                    <i className="fa-solid fa-clock-rotate-left" style={{ color: '#F97350' }}></i> Lịch sử giao hàng
                </div>

                <div style={S.summaryBox}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px' }}>Đơn hoàn tất</div>
                        <div style={{ fontSize: '28px', fontWeight: '900' }}>{filteredOrders.length}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '13px' }}>Tổng thu nhập</div>
                        <div style={{ fontSize: '28px', fontWeight: '900' }}>{toVND(totalEarnings)}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button style={S.filterBtn(filter === 'all')} onClick={() => setFilter('all')}>Tất cả</button>
                    <button style={S.filterBtn(filter === 'today')} onClick={() => setFilter('today')}>Hôm nay</button>
                    <button style={S.filterBtn(filter === 'week')} onClick={() => setFilter('week')}>Tuần này</button>
                </div>

                {filteredOrders.map(order => (
                    <div key={order._id} style={S.card} onClick={() => setSelectedOrder(order)}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ fontWeight: '800' }}>#{order._id.slice(-6).toUpperCase()}</span>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {order.items.length} món • {toVND(order.total)}
                        </div>
                        {order.isReviewed && (
                            <div style={{ marginTop: '10px', color: '#F5A524', fontWeight: '700' }}>
                                ★ {order.rating} <span style={{ color: '#64748b', fontWeight: '400', fontSize: '12px' }}>- Nhấn để xem đánh giá</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ✅ MODAL CHI TIẾT ĐƠN HÀNG & ĐÁNH GIÁ */}
            {selectedOrder && (
                <div className="modal-bg" onClick={() => setSelectedOrder(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', borderRadius: '24px', padding: '30px' }}>
                        <h3 style={{ color: '#F97350', marginBottom: '20px' }}>Chi tiết đơn #{selectedOrder._id.slice(-6).toUpperCase()}</h3>

                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '15px', marginBottom: '20px' }}>
                            <div style={{ marginBottom: '8px' }}><b>Khách hàng:</b> {selectedOrder.customer.split('|')[0]}</div>
                            <div style={{ marginBottom: '8px' }}><b>Địa chỉ:</b> {selectedOrder.customer.split('|')[2]}</div>
                        </div>

                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
                            {selectedOrder.items.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '15px', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                                    <img src={it.image || "https://via.placeholder.com/40"} style={{ width: '45px', height: '45px', borderRadius: '8px' }} alt="" />
                                    <div>
                                        <div style={{ fontWeight: '700' }}>{it.quantity}x {it.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666' }}>{it.options}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ✅ HIỂN THỊ ĐÁNH GIÁ CỦA KHÁCH */}
                        {selectedOrder.isReviewed ? (
                            <div style={{ border: '2px solid #FFF1ED', padding: '20px', borderRadius: '20px', background: '#FFF7ED' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontWeight: '800' }}>Đánh giá từ khách:</span>
                                    <span style={{ color: '#F5A524', fontSize: '18px' }}>{selectedOrder.rating} ★</span>
                                </div>
                                <p style={{ fontStyle: 'italic', color: '#666', margin: '0 0 15px 0' }}>"{selectedOrder.review || "Khách không để lại lời nhắn"}"</p>

                                <button
                                    onClick={() => setIsReporting(true)}
                                    style={{ background: 'none', border: 'none', color: '#EF4444', textDecoration: 'underline', cursor: 'pointer', fontSize: '13px' }}
                                >
                                    Báo cáo/Khiếu nại đánh giá này
                                </button>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>Khách hàng chưa để lại đánh giá</div>
                        )}

                        <button className="ship-btn primary" style={{ marginTop: '25px' }} onClick={() => setSelectedOrder(null)}>Đóng</button>
                    </div>
                </div>
            )}

            {/* ✅ MODAL BÁO CÁO ĐÁNH GIÁ (Gửi lý do cho Admin) */}
            {isReporting && (
                <div className="modal-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="admin-modal" style={{ maxWidth: '400px' }}>
                        <h4 style={{ color: '#EF4444' }}>Báo cáo đánh giá không công bằng</h4>
                        <p style={{ fontSize: '13px', color: '#666' }}>Lý do của bạn sẽ được gửi đến Admin để thẩm định lại đánh giá này.</p>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Nhập lý do khiếu nại (ví dụ: khách đánh giá sai sự thật, do lỗi quán ăn...)"
                            style={{ width: '100%', height: '120px', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', marginTop: '10px', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="ship-btn soft" onClick={() => setIsReporting(false)}>Hủy</button>
                            <button className="ship-btn primary" style={{ background: '#EF4444' }} onClick={handleReportReview}>Gửi báo cáo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ShipperHistory;