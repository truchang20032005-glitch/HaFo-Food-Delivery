import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { useLocation, useSearchParams } from 'react-router-dom';
import { alertError, alertSuccess, alertWarning } from '../../utils/hafoAlert';

function Reviews() {
    const [reviews, setReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [reportModal, setReportModal] = useState(null);
    const [reportReason, setReportReason] = useState('');

    // State quản lý nội dung phản hồi cho từng món và phản hồi chung
    const [itemReplyTexts, setItemReplyTexts] = useState({});
    const [generalReplyText, setGeneralReplyText] = useState('');
    const [loading, setLoading] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Đánh giá thường dài nên để 5 cái/trang
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';

    // LOGIC LỌC TÌM KIẾM (Tìm theo tên khách hoặc nội dung đánh giá)
    const filteredReviews = reviews.filter(r =>
        r.customerId?.fullName?.toLowerCase().includes(searchQuery) ||
        r.comment?.toLowerCase().includes(searchQuery)
    );

    // LOGIC PHÂN TRANG
    const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
    const currentItems = filteredReviews.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    const location = useLocation();

    const loadData = useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        try {
            const shopRes = await api.get(`/restaurants/my-shop/${user.id || user._id}`);
            const res = await api.get(`/customer-reviews/restaurant/${shopRes.data._id}`);
            const data = res.data;
            setReviews(data);

            // ✅ LOGIC THÔNG MINH: Tự mở modal chi tiết đánh giá
            if (location.state?.openId) {
                const target = data.find(r => r._id === location.state.openId);
                if (target) {
                    setSelectedReview(target);
                    window.history.replaceState({}, document.title);
                }
            }
        } catch (err) { console.error("Lỗi lấy đánh giá:", err); }
    }, [location.state]); // ✅ Chỉ khởi tạo lại khi location.state thay đổi

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Hàm gửi phản hồi (Dùng chung cho cả món ăn và phản hồi tổng quát)
    const handleSendReply = async (content, type = 'general') => {
        if (!content.trim()) return alertWarning("Vui lòng nhập nội dung phản hồi!");

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await api.post(`/customer-reviews/${selectedReview._id}/reply`, {
                userId: user.id || user._id,
                content: content,
                userRole: 'merchant' // Gắn role nhà hàng
            });

            alertSuccess("Đã gửi phản hồi thành công!");
            if (type === 'general') setGeneralReplyText('');
            loadData(); // Tải lại để cập nhật lịch sử phản hồi trong modal
        } catch (err) {
            alertError("Lỗi", err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) return alertWarning("Nhập lý do!");
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const reportData = {
                orderId: reportModal.orderId,
                reporterId: user.id || user._id,
                reporterRole: 'merchant',
                reason: reportReason,
                reviewContent: reportModal.comment
            };

            // GỌI API MỚI (Tập trung)
            await api.post('/reports/review', reportData);

            alertSuccess("Thành công", "Đã gửi khiếu nại lên Admin!");
            setReportModal(null);
            loadData();
        } catch (err) { alertError("Lỗi", err.message); }
        finally { setLoading(false); }
    };

    const renderStars = (n) => [...Array(5)].map((_, i) => (
        <i key={i} className="fa-solid fa-star" style={{ color: i < n ? '#F5A524' : '#ddd', fontSize: '13px' }} />
    ));

    const S = {
        overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
        sheet: { background: '#fff', width: '100%', maxWidth: '700px', borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' },
        modalHeader: { padding: '20px 30px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' },
        modalBody: { padding: '30px', overflowY: 'auto', background: '#F8FAFC' },
        sectionTitle: { fontSize: '14px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' },

        // Thẻ món ăn
        foodCard: { background: '#fff', borderRadius: '20px', padding: '20px', marginBottom: '15px', border: '1px solid #E2E8F0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
        replyInputGroup: { display: 'flex', gap: '10px', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #E2E8F0' },
        smallInput: { flex: 1, padding: '10px 15px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none', fontSize: '13px', background: '#F8FAFC' },
        sendBtnSmall: { padding: '8px 15px', borderRadius: '12px', border: 'none', background: '#F97350', color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },

        // Bong bóng chat lịch sử
        historyBubble: (isMe) => ({
            marginTop: '10px', padding: '12px 18px', borderRadius: '16px', fontSize: '13px', lineHeight: '1.5',
            background: isMe ? '#FFF1ED' : '#F1F5F9',
            borderLeft: `4px solid ${isMe ? '#F97350' : '#94A3B8'}`,
            alignSelf: 'flex-start'
        })
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
                        {currentItems.map(r => {
                            // 1. Tính số sao trung bình của các món ăn trong đơn
                            const validItemRatings = r.itemReviews?.filter(it => it.rating > 0) || [];
                            const avgItemRating = validItemRatings.length > 0
                                ? Math.round(validItemRatings.reduce((sum, it) => sum + it.rating, 0) / validItemRatings.length)
                                : r.rating; // Fallback về rating tổng nếu không có item nào có sao

                            // 2. Lấy ngẫu nhiên nội dung đánh giá của một món ăn (có chữ)
                            const itemsWithComments = r.itemReviews?.filter(it => it.comment && it.comment.trim() !== "") || [];
                            let randomItemComment = "Khách hàng không để lại nhận xét món.";

                            if (itemsWithComments.length > 0) {
                                const randomIndex = Math.floor(Math.random() * itemsWithComments.length);
                                randomItemComment = itemsWithComments[randomIndex].comment;
                            } else if (r.comment && r.comment.trim() !== "") {
                                // Nếu các món không có chữ nhưng nhận xét chung của đơn có chữ thì lấy nhận xét chung
                                randomItemComment = r.comment;
                            }

                            const displayRating = avgItemRating;
                            const displayComment = randomItemComment;

                            // --- KẾT THÚC LOGIC MỚI ---

                            return (
                                // BỎ opacity: r.isReported ? 0.6 : 1 ĐỂ DÒNG LUÔN RÕ NÉT
                                <tr key={r._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div style={{ fontWeight: '700' }}>{r.customerId?.fullName}</div>
                                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                                            {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                                        </div>
                                    </td>

                                    {/* Hiển thị số sao đã qua xử lý logic */}
                                    <td>{renderStars(displayRating)}</td>

                                    {/* Hiển thị nội dung đã qua xử lý logic */}
                                    <td style={{
                                        maxWidth: '250px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        fontSize: '13px',
                                        color: '#475569'
                                    }}>
                                        {displayComment}
                                    </td>

                                    <td style={{ textAlign: 'center' }}>
                                        {r.replies?.length > 0
                                            ? <span className="tag green" style={{ opacity: 1 }}>Đã rep</span>
                                            : <span className="tag yellow">Chờ rep</span>}
                                    </td>

                                    <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                        <button
                                            className="btn small soft"
                                            onClick={() => setSelectedReview(r)}
                                            style={{ marginRight: '8px' }}
                                        >
                                            Chi tiết
                                        </button>

                                        {/* SỬA LẠI: Nút báo cáo luôn hiện rõ, chỉ khóa khi đang loading gửi dữ liệu */}
                                        <button
                                            className="btn small danger"
                                            onClick={() => setReportModal(r)}
                                            style={{
                                                opacity: 1,
                                                background: r.isReported ? '#FEE2E2' : '', // Đổi màu nhẹ nếu đã báo cáo để dễ phân biệt
                                                color: r.isReported ? '#EF4444' : ''
                                            }}
                                            disabled={loading}
                                        >
                                            {r.isReported ? 'Đã báo cáo' : 'Báo cáo'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '20px', borderTop: '1px solid #F1F5F9' }}>
                        <button
                            className="btn small soft"
                            disabled={currentPage === 1}
                            onClick={() => {
                                setCurrentPage(p => p - 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <i className="fa-solid fa-angle-left"></i>
                        </button>

                        <span style={{ fontWeight: '800', fontSize: '14px', color: '#64748B' }}>
                            Trang {currentPage} / {totalPages}
                        </span>

                        <button
                            className="btn small soft"
                            disabled={currentPage === totalPages}
                            onClick={() => {
                                setCurrentPage(p => p + 1);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            <i className="fa-solid fa-angle-right"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT & PHẢN HỒI MỚI */}
            {selectedReview && (
                <div style={S.overlay}>
                    <div style={S.sheet}>
                        <div style={S.modalHeader}>
                            <div>
                                <b style={{ fontSize: '20px', color: '#1E293B' }}>Chi tiết đánh giá</b>
                                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>Đơn hàng #{selectedReview.orderId?.slice(-6).toUpperCase()}</div>
                            </div>
                            <button onClick={() => setSelectedReview(null)} style={{ border: 'none', background: '#F1F5F9', width: '36px', height: '36px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#64748B' }}>×</button>
                        </div>

                        <div style={S.modalBody}>
                            {/* 1. Nhận xét tổng quát của khách */}
                            <div style={{ background: '#fff', borderRadius: '20px', padding: '25px', marginBottom: '25px', border: '1px solid #E2E8F0' }}>
                                <div style={S.sectionTitle}><i className="fa-solid fa-comment-dots"></i> Nhận xét chung</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <b style={{ fontSize: '16px' }}>{selectedReview.customerId?.fullName}</b>
                                    <div>{renderStars(selectedReview.rating)}</div>
                                </div>
                                <p style={{ fontStyle: 'italic', color: '#475569', fontSize: '15px', lineHeight: '1.6' }}>"{selectedReview.comment || "Không có nhận xét nội dung."}"</p>
                            </div>

                            {/* 2. Đánh giá chi tiết từng món & Phản hồi riêng */}
                            <div style={S.sectionTitle}><i className="fa-solid fa-utensils"></i> Đánh giá chi tiết món ăn</div>
                            {selectedReview.itemReviews?.map((it, idx) => (
                                <div key={idx} style={S.foodCard}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <b style={{ fontSize: '15px', color: '#1E293B' }}>{it.name}</b>
                                            <div style={{ marginTop: '4px' }}>{renderStars(it.rating)}</div>
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748B', background: '#F1F5F9', padding: '4px 10px', borderRadius: '8px' }}>
                                            Món #{idx + 1}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '10px', color: '#475569', fontSize: '14px' }}>
                                        {it.comment || <span style={{ color: '#CBD5E1' }}>Khách không để lại bình luận món này.</span>}
                                    </div>

                                    {/* Ô nhập phản hồi cho từng món */}
                                    <div style={S.replyInputGroup}>
                                        <input
                                            style={S.smallInput}
                                            placeholder={`Phản hồi riêng cho món ${it.name}...`}
                                            value={itemReplyTexts[it._id] || ''}
                                            onChange={(e) => setItemReplyTexts({ ...itemReplyTexts, [it._id]: e.target.value })}
                                        />
                                        <button
                                            style={S.sendBtnSmall}
                                            disabled={loading}
                                            onClick={() => {
                                                const content = `[Món: ${it.name}] ${itemReplyTexts[it._id]}`;
                                                handleSendReply(content, 'item');
                                                setItemReplyTexts({ ...itemReplyTexts, [it._id]: '' });
                                            }}
                                        >
                                            Gửi ngay
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* 3. Lịch sử phản hồi đã gửi */}
                            {selectedReview.replies?.length > 0 && (
                                <div style={{ marginTop: '30px' }}>
                                    <div style={S.sectionTitle}><i className="fa-solid fa-clock-rotate-left"></i> Lịch sử phản hồi</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {selectedReview.replies.map((rep, i) => {
                                            const isMerchant = rep.userRole === 'merchant';
                                            return (
                                                <div key={i} style={S.historyBubble(isMerchant)}>
                                                    <b style={{ color: isMerchant ? '#F97350' : '#16A34A', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                                                        {isMerchant ? '🏠 PHẢN HỒI CỦA QUÁN:' : '🛵 SHIPPER PHẢN HỒI:'}
                                                    </b>
                                                    {rep.content}
                                                    <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '6px' }}>
                                                        {new Date(rep.createdAt).toLocaleString('vi-VN')}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 4. Phản hồi chung (Dưới cùng) */}
                            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
                                <div style={S.sectionTitle}>Phản hồi chung cho cả đơn</div>
                                <textarea
                                    className="f-input"
                                    style={{ height: '80px', borderRadius: '16px' }}
                                    placeholder="Cảm ơn khách hoặc giải thích chung về đơn hàng..."
                                    value={generalReplyText}
                                    onChange={e => setGeneralReplyText(e.target.value)}
                                />
                                <button
                                    className="btn primary"
                                    style={{
                                        width: '100%',
                                        marginTop: '15px',
                                        borderRadius: '16px',
                                        background: '#334155',
                                        // --- SỬA TẠI ĐÂY: THÊM CĂN GIỮA TUYỆT ĐỐI ---
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '48px', // Chiều cao cố định để đẹp hơn
                                        border: 'none',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => handleSendReply(generalReplyText, 'general')}
                                    disabled={loading}
                                >
                                    Gửi phản hồi chung
                                </button>
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
                        <label style={{ fontSize: '13px', fontWeight: '600' }}>Lý do báo cáo:</label>
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