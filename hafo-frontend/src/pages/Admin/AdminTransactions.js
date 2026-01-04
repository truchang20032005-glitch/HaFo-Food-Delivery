import { useState, useEffect } from 'react';
import api from '../../services/api';
import { alertSuccess, alertError } from '../../utils/hafoAlert';

const toVND = (n) => n?.toLocaleString('vi-VN') + 'đ';

function AdminTransactions() {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        api.get('/transactions/admin/all').then(res => setTransactions(res.data));
    }, []);

    const handleAction = async (id, status) => {
        const note = prompt("Nhập ghi chú cho yêu cầu này:");
        try {
            await api.put(`/transactions/${id}/status`, { status, note });
            setTransactions(prev => prev.map(t => t._id === id ? { ...t, status, note } : t));
            await alertSuccess("Xử lý thành công!");
        } catch (err) { alertError(err.message); }
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
                                    <div style={{ fontSize: '13px' }}>{t.bankInfo.bankName}</div>
                                    <small>{t.bankInfo.bankAccount} - {t.bankInfo.bankOwner}</small>
                                </td>
                                <td>
                                    <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', background: t.status === 'pending' ? '#FFFBEB' : (t.status === 'approved' ? '#DCFCE7' : '#FEE2E2'), color: t.status === 'pending' ? '#B45309' : (t.status === 'approved' ? '#166534' : '#991B1B') }}>
                                        {t.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    {t.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            <button onClick={() => handleAction(t._id, 'approved')} style={{ background: '#22C55E', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Duyệt</button>
                                            <button onClick={() => handleAction(t._id, 'rejected')} style={{ background: '#EF4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>Từ chối</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AdminTransactions;