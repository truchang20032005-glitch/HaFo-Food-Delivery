import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [reportModal, setReportModal] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [replyText, setReplyText] = useState('');
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        try {
            const shopRes = await api.get(`/restaurants/my-shop/${user.id || user._id}`);
            const res = await api.get(`/customer-reviews/restaurant/${shopRes.data._id}`);
            setReviews(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { loadData(); }, []);

    const handleReply = async () => {
        if (!replyText.trim()) return;
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await api.post(`/customer-reviews/${selectedReview._id}/reply`, {
                userId: user.id || user._id,
                content: replyText
            });
            alert("✅ Đã gửi phản hồi thành công!");
            setReplyText('');
            setSelectedReview(null);
            loadData();
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) return alert("Nhập lý do má ơi!");
        setLoading(true);
        try {
            await api.put(`/customer-reviews/${reportModal._id}/report`, { reason: reportReason });
            alert("🚩 Đã báo cáo lên Admin!");
            setReportModal(null);
            setReportReason('');
            loadData();
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    const renderStars = (n) => [...Array(5)].map((_, i) => (
        <i key={i} className="fa-solid fa-star" style={{ color: i < n ? '#F5A524' : '#ddd', fontSize: '13px' }} />
    ));

    const S = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
        sheet: { background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
        itemCard: { padding: '12px', background: '#F8FAFC', borderRadius: '12px', marginBottom: '10px', border: '1px solid #E2E8F0' }
    };

    return (
        <div className="panel">
            <div className="head">Đánh giá khách hàng</div>
            <div className="body" style={{ padding: 0 }}>
                <table style={{ width: '100%' }}>
                    <thead style={{ background: '#F8FAFC' }}>
                        <tr>
                            <th style={{ padding: '15px 20px' }}>Khách hàng</th>
                            <th>Xếp hạng</th>
                            <th>Nội dung</th>
                            <th style={{ textAlign: 'center' }}>Phản hồi</th>
                            <th style={{ textAlign: 'right', paddingRight: '20px' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.map(r => (
                            <tr key={r._id} style={{ borderBottom: '1px solid #F1F5F9', opacity: r.isReported ? 0.6 : 1 }}>
                                <td style={{ padding: '15px 20px' }}>
                                    <div style={{ fontWeight: '700' }}>{r.customerId?.fullName}</div>
                                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(r.createdAt).toLocaleDateString('vi-VN')}</div>
                                </td>
                                <td>{renderStars(r.rating)}</td>
                                <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.comment}</td>
                                <td style={{ textAlign: 'center' }}>
                                    {r.replies?.length > 0 ? <span className="tag green">Đã rep</span> : <span className="tag yellow">Chờ rep</span>}
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    <button className="btn small soft" onClick={() => setSelectedReview(r)} style={{ marginRight: '8px' }}>Chi tiết</button>
                                    <button className="btn small danger" onClick={() => setReportModal(r)} disabled={r.isReported}>Báo cáo</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT & PHẢN HỒI */}
            {selectedReview && (
                <div style={S.overlay} onClick={() => setSelectedReview(null)}>
                    <div style={S.sheet} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
                            <b style={{ fontSize: '18px' }}>Chi tiết đánh giá đơn #{selectedReview.orderId?.slice(-6).toUpperCase()}</b>
                            <button onClick={() => setSelectedReview(null)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
                            {/* Nhận xét chung */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <b>{selectedReview.customerId?.fullName}</b>
                                    <div>{renderStars(selectedReview.rating)}</div>
                                </div>
                                <p style={{ fontStyle: 'italic', color: '#64748B' }}>"{selectedReview.comment}"</p>
                            </div>

                            {/* Chi tiết từng món */}
                            <div style={{ marginBottom: '25px' }}>
                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#F97350', marginBottom: '10px' }}>ĐÁNH GIÁ MÓN ĂN</div>
                                {selectedReview.itemReviews?.map((it, idx) => (
                                    <div key={idx} style={S.itemCard}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <b style={{ fontSize: '14px' }}>{it.name}</b>
                                            <span>{renderStars(it.rating)}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748B' }}>{it.comment}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Đánh giá Shipper */}
                            <div style={{ background: '#FFF8F1', padding: '15px', borderRadius: '16px', marginBottom: '25px' }}>
                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#EA580C' }}>VỀ GIAO HÀNG (SHIPPER)</div>
                                <div style={{ marginTop: '5px' }}>{renderStars(selectedReview.shipperRating)}</div>
                                <div style={{ fontSize: '14px' }}>{selectedReview.shipperComment || 'Không có bình luận về giao hàng.'}</div>
                            </div>

                            {/* Phản hồi của các bên */}
                            <div style={{ borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <label style={{ fontWeight: '800', fontSize: '14px' }}>Lịch sử phản hồi:</label>

                                {selectedReview.replies?.map((rep, i) => (
                                    <div key={i} style={{
                                        marginTop: '10px',
                                        background: rep.userRole === 'merchant' ? '#FFF1ED' : '#F0FDF4', // Màu khác nhau cho dễ nhìn
                                        padding: '12px',
                                        borderRadius: '12px',
                                        borderLeft: `4px solid ${rep.userRole === 'merchant' ? '#F97350' : '#22C55E'}`
                                    }}>
                                        <b style={{ color: rep.userRole === 'merchant' ? '#F97350' : '#16A34A' }}>
                                            {rep.userRole === 'merchant' ? '🏠 NHÀ HÀNG:' : '🛵 SHIPPER:'}
                                        </b>
                                        <span style={{ fontSize: '14px', marginLeft: '5px' }}>{rep.content}</span>
                                        <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '5px' }}>
                                            {new Date(rep.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL BÁO CÁO GIỮ NGUYÊN STYLE MÁ THÍCH */}
            {reportModal && (
                <div style={S.overlay}>
                    <div style={{ ...S.sheet, maxWidth: '400px', padding: '24px' }}>
                        <h3 style={{ color: '#EF4444', marginTop: 0 }}>🚩 Báo cáo đánh giá</h3>
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Lý do má báo cáo:</label>
                        <textarea className="f-input" style={{ height: '100px', marginTop: '10px' }} placeholder="VD: Khách đánh giá sai sự thật, xúc phạm quán..." value={reportReason} onChange={e => setReportReason(e.target.value)} />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button className="btn soft" style={{ flex: 1 }} onClick={() => setReportModal(null)}>Hủy</button>
                            <button className="btn primary" style={{ flex: 1, background: '#EF4444' }} onClick={handleReport} disabled={loading}>Gửi báo cáo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reviews;