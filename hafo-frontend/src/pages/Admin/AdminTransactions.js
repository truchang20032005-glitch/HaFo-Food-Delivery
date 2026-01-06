import { useState, useEffect } from 'react';
import api from '../../services/api';
import { alertSuccess, alertError } from '../../utils/hafoAlert';

const toVND = (n) => n?.toLocaleString('vi-VN') + 'đ';

function AdminTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [selectedTrans, setSelectedTrans] = useState(null);
    const [actionType, setActionType] = useState(''); // 'approved' hoặc 'rejected'
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        api.get('/transactions/admin/all').then(res => setTransactions(res.data));
    }, []);

    // ✅ Hàm này chỉ dùng để mở Modal và set trạng thái ban đầu
    const openActionModal = (trans, type) => {
        setSelectedTrans(trans);
        setActionType(type);
        setAdminNote(''); // Reset ghi chú mỗi lần mở
    };

    // ✅ Hàm này mới là hàm gửi dữ liệu thật lên Server
    const submitAction = async () => {
        try {
            await api.put(`/transactions/${selectedTrans._id}/status`, {
                status: actionType,
                note: adminNote
            });

            // Cập nhật lại danh sách tại chỗ để không phải reload trang
            setTransactions(prev => prev.map(t =>
                t._id === selectedTrans._id ? { ...t, status: actionType, note: adminNote } : t
            ));

            alertSuccess("Xử lý thành công!");
            setSelectedTrans(null); // Đóng modal
        } catch (err) {
            alertError(err.message);
        }
    };

    return (
        <div className="panel">
            <div className="head"><i className="fa-solid fa-money-bill-transfer"></i> Quản lý Đối soát & Rút tiền</div>
            <div className="body" style={{ padding: 0 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: '#f8fafc', textAlign: 'left' }}>
                        <tr>
                            <th style={{ padding: '15px' }}>Người yêu cầu</th>
                            <th>Số tiền</th>
                            <th>Ngân hàng</th>
                            <th>Trạng thái</th>
                            <th style={{ textAlign: 'right', paddingRight: '20px' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(t => (
                            <tr key={t._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ fontWeight: '700' }}>{t.userId?.fullName}</div>
                                    <small style={{ color: '#64748b' }}>{t.role === 'shipper' ? 'Tài xế' : 'Chủ quán'}</small>
                                </td>
                                <td><b style={{ color: '#F97350' }}>{toVND(t.amount)}</b></td>
                                <td>
                                    <div style={{ fontSize: '13px' }}>{t.bankInfo?.bankName}</div>
                                    <small>{t.bankInfo?.bankAccount} - {t.bankInfo?.bankOwner}</small>
                                </td>
                                <td>
                                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: t.status === 'pending' ? '#FFFBEB' : (t.status === 'approved' ? '#DCFCE7' : '#FEE2E2'), color: t.status === 'pending' ? '#B45309' : (t.status === 'approved' ? '#166534' : '#991B1B') }}>
                                        {t.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    {t.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {/* ✅ SỬA TẠI ĐÂY: Gọi hàm mở modal thay vì handleAction cũ */}
                                            <button onClick={() => openActionModal(t, 'approved')} style={{ background: '#22C55E', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Duyệt</button>
                                            <button onClick={() => openActionModal(t, 'rejected')} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Từ chối</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ✅ MODAL XỬ LÝ (Phần này lúc nãy bạn bị thiếu) */}
            {selectedTrans && (
                <div style={S.modalOverlay}>
                    <div className="animate-pop-in" style={S.modalContainer}>

                        {/* Header với Icon */}
                        <div style={S.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '45px', height: '45px', borderRadius: '12px',
                                    background: actionType === 'approved' ? '#DCFCE7' : '#FEE2E2',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '20px', color: actionType === 'approved' ? '#22C55E' : '#EF4444'
                                }}>
                                    <i className={`fa-solid ${actionType === 'approved' ? 'fa-check-double' : 'fa-ban'}`}></i>
                                </div>
                                <div>
                                    <h3 style={S.modalTitle}>
                                        {actionType === 'approved' ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Mã giao dịch: #{selectedTrans._id.slice(-8).toUpperCase()}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedTrans(null)} style={S.closeBtnIcon}>✕</button>
                        </div>

                        <div style={{ padding: '25px' }}>
                            {/* Thẻ tóm tắt thông tin (Summary Card) */}
                            <div style={S.summaryCard}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>ĐỐI TÁC</div>
                                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>{selectedTrans.userId?.fullName}</div>
                                    <div style={{ fontSize: '11px', color: '#F97350', fontWeight: '700' }}>{selectedTrans.role === 'shipper' ? 'TÀI XẾ' : 'CHỦ QUÁN'}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>SỐ TIỀN RÚT</div>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#F97350' }}>{toVND(selectedTrans.amount)}</div>
                                </div>
                            </div>

                            {/* Phần nhập ghi chú */}
                            <div style={{ marginTop: '20px' }}>
                                <label style={S.inputLabel}>
                                    <i className="fa-solid fa-pen-nib"></i> Ghi chú phản hồi cho đối tác
                                </label>
                                <textarea
                                    placeholder={actionType === 'approved' ? "Ví dụ: Đã chuyển khoản qua Vietcombank..." : "Lý do từ chối (Ví dụ: Sai số tài khoản)..."}
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    style={S.textArea}
                                />
                            </div>
                        </div>

                        {/* Footer với nút bấm cách điệu */}
                        <div style={S.modalFooter}>
                            <button onClick={() => setSelectedTrans(null)} style={S.btnCancel}>Hủy bỏ</button>
                            <button
                                onClick={submitAction}
                                style={{
                                    ...S.btnSubmit,
                                    background: actionType === 'approved' ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' : 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
                                    boxShadow: actionType === 'approved' ? '0 10px 20px -5px rgba(34, 197, 94, 0.4)' : '0 10px 20px -5px rgba(239, 68, 68, 0.4)'
                                }}
                            >
                                {actionType === 'approved' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const S = {
    // ... các style cũ giữ nguyên ...
    modalOverlay: {
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.7)', // Màu Slate đậm cho chuyên nghiệp
        backdropFilter: 'blur(8px)', // Làm mờ nền cực đẹp
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '20px'
    },
    modalContainer: {
        background: '#fff', width: '100%', maxWidth: '500px',
        borderRadius: '32px', overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    },
    modalHeader: {
        padding: '25px 30px', borderBottom: '1px solid #F1F5F9',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    },
    modalTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#1E293B' },
    closeBtnIcon: { border: 'none', background: '#F8FAFC', width: '32px', height: '32px', borderRadius: '10px', cursor: 'pointer', color: '#94A3B8' },
    summaryCard: {
        background: '#F8FAFC', padding: '20px', borderRadius: '20px',
        border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center'
    },
    inputLabel: { marginBottom: '10px', fontWeight: '700', fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' },
    textArea: {
        width: '100%', height: '120px', padding: '15px', borderRadius: '16px',
        border: '2px solid #F1F5F9', outline: 'none', fontSize: '14px',
        color: '#1E293B', transition: '0.2s', resize: 'none', boxSizing: 'border-box'
    },
    modalFooter: { padding: '20px 30px 30px', display: 'flex', gap: '15px' },
    btnCancel: { flex: 1, padding: '14px', border: '1px solid #E2E8F0', borderRadius: '14px', background: '#fff', color: '#64748B', fontWeight: '700', cursor: 'pointer' },
    btnSubmit: { flex: 2, padding: '14px', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '800', cursor: 'pointer', transition: '0.3s' }
};

export default AdminTransactions;