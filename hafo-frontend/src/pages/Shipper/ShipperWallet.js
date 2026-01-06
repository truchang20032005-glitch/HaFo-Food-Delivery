import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { alertError, alertSuccess, alertWarning } from '../../utils/hafoAlert';

const toVND = (n) => n?.toLocaleString('vi-VN');

function ShipperWallet() {
    const [profile, setProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const realBalance = useMemo(() => {
        return transactions.reduce((sum, t) => {
            if (t.type === 'in') return sum + t.amount;
            if (t.type === 'out' && t.status !== 'rejected') return sum - t.amount;
            return sum;
        }, 0);
    }, [transactions]);

    const isOverBalance = Number(withdrawAmount) > realBalance;
    const isBelowMin = withdrawAmount !== '' && Number(withdrawAmount) < 50000;
    const isInvalid = isOverBalance || isBelowMin || !withdrawAmount;

    // ✅ Thêm State quản lý lọc ngày (Mặc định lọc 7 ngày gần nhất)
    const [filterDate, setFilterDate] = useState({
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    // ✅ State quản lý việc chỉnh sửa ngân hàng
    const [isEditingBank, setIsEditingBank] = useState(false);
    const [bankFormData, setBankFormData] = useState({
        bankName: '',
        bankAccount: '',
        bankOwner: '',
        bankBranch: ''
    });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            fetchWalletData(user.id);
        }
    }, []);

    const fetchWalletData = async (userId) => {
        try {
            setLoading(true);
            // 1. Lấy thông tin Shipper
            const profileRes = await api.get(`/shippers/profile/${userId}`);
            const data = profileRes.data;
            setProfile(data);

            setBankFormData({
                bankName: data.bankName || '',
                bankAccount: data.bankAccount || '',
                bankOwner: data.bankOwner || data.user?.fullName || '',
                bankBranch: data.bankBranch || ''
            });

            // 2. Lấy đơn hàng (Thu nhập) VÀ Lệnh rút tiền (Chi tiêu)
            const [ordersRes, transRes] = await Promise.all([
                api.get('/orders'),
                api.get(`/transactions/user/${userId}`)
            ]);

            // A. Xử lý thu nhập từ đơn hàng
            const myDoneOrders = ordersRes.data.filter(o =>
                (o.shipperId?._id === userId || o.shipperId === userId) && o.status === 'done'
            );
            const incomeHistory = myDoneOrders.map(o => ({
                id: o._id,
                date: o.createdAt,
                desc: `Thu nhập đơn #${o._id.slice(-6).toUpperCase()}${o.tipAmount > 0 ? ' (Gồm Tip)' : ''}`,
                amount: 15000 + (o.tipAmount || 0) * 0.8,
                type: 'in'
            }));

            // B. Xử lý lệnh rút tiền (Chỉ lấy những lệnh đã được duyệt để trừ tiền, hoặc hiện cả pending)
            const withdrawHistory = transRes.data.map(t => ({
                id: t._id,
                date: t.createdAt,
                desc: `Rút tiền về ví`,
                amount: t.amount,
                type: 'out',
                status: t.status // pending, approved, rejected
            }));

            // Gộp lại và sắp xếp
            const fullHistory = [...incomeHistory, ...withdrawHistory];
            setTransactions(fullHistory);

        } catch (err) {
            console.error("Lỗi tải ví:", err);
        } finally {
            setLoading(false);
        }
    };



    const filteredTransactions = useMemo(() => {
        return transactions
            .filter(t => {
                const tDate = new Date(t.createdAt || t.date).toISOString().split('T')[0];
                return tDate >= filterDate.start && tDate <= filterDate.end;
            })
            .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    }, [transactions, filterDate]);

    const handleWithdraw = async () => {
        if (withdrawAmount < 50000) return alertWarning("Tối thiểu 50.000đ");
        if (withdrawAmount > profile.income) return alertWarning("Số dư không đủ");

        try {
            await api.post('/transactions', {
                userId: profile.user._id,
                role: 'shipper',
                amount: Number(withdrawAmount),
                bankInfo: {
                    bankName: profile.bankName,
                    bankAccount: profile.bankAccount,
                    bankOwner: profile.bankOwner
                }
            });
            alertSuccess("Thành công", "Yêu cầu rút tiền đã được gửi!");
            setShowWithdrawModal(false);
            fetchWalletData(profile.user._id);
        } catch (err) { alertError("Lỗi", err.message); }
    };

    // ✅ Hàm lưu thông tin ngân hàng
    const handleSaveBank = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        try {
            setIsSaving(true);
            await api.put(`/shippers/profile/${user.id}`, bankFormData);

            // Hiện alert thành công trước khi đóng form
            await alertSuccess("Đã lưu!", "Thông tin ngân hàng của bạn đã được cập nhật.");

            setIsEditingBank(false);
            fetchWalletData(user.id);
        } catch (err) {
            alertError("Lỗi cập nhật", err.response?.data?.message || err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải ví...</div>;
    if (!profile) return <div style={{ padding: 20, textAlign: 'center' }}>Chưa có thông tin ví.</div>;

    return (
        <div className="profile-panel">
            <div className="profile-head">
                <i className="fa-solid fa-wallet"></i> Ví của tôi
            </div>
            <div className="profile-body">
                {/* Số dư */}
                <div className="kpi-box" style={{ background: '#FFF8EF', borderColor: '#ffe0ad', marginBottom: '15px' }}>
                    <div className="kpi-label">Số dư khả dụng</div>
                    <div className="kpi-val" style={{ color: '#F97350', fontSize: '28px' }}>{toVND(realBalance)}đ</div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Doanh thu từ các đơn đã giao</div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center', // Căn giữa theo chiều ngang
                        marginTop: '25px',
                        paddingBottom: '10px'
                    }}>
                        <button
                            className="btn primary"
                            onClick={() => setShowWithdrawModal(true)}
                            disabled={realBalance < 50000}
                            style={{
                                padding: '12px 40px', // Tăng độ dài nút cho cân đối
                                fontSize: '15px',
                                fontWeight: '800',
                                borderRadius: '12px',
                                boxShadow: '0 4px 15px rgba(249, 115, 80, 0.2)', // Đổ bóng cam cho nổi bật
                                cursor: 'pointer',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <i className="fa-solid fa-money-bill-transfer"></i>
                            Rút tiền về ngân hàng
                        </button>
                    </div>
                </div>

                {/* ✅ Tài khoản ngân hàng có chức năng sửa */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold' }}>Thông tin thụ hưởng</div>
                    {!isEditingBank ? (
                        <button onClick={() => setIsEditingBank(true)} style={{ background: 'none', border: 'none', color: '#F97350', cursor: 'pointer', fontSize: '13px' }}>
                            <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleSaveBank} disabled={isSaving} style={{ background: 'none', border: 'none', color: '#22C55E', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                                {isSaving ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button onClick={() => setIsEditingBank(false)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '13px' }}>Hủy</button>
                        </div>
                    )}
                </div>

                <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '12px' }}>
                    {isEditingBank ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '12px', color: '#666' }}>Tên ngân hàng</label>
                                <input
                                    style={inputStyle}
                                    value={bankFormData.bankName}
                                    onChange={(e) => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                                    placeholder="Ví dụ: Vietcombank"
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '12px', color: '#666' }}>Số tài khoản</label>
                                <input
                                    style={inputStyle}
                                    value={bankFormData.bankAccount}
                                    onChange={(e) => setBankFormData({ ...bankFormData, bankAccount: e.target.value })}
                                    placeholder="Nhập số tài khoản"
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '12px', color: '#666' }}>Tên chủ tài khoản</label>
                                <input
                                    style={inputStyle}
                                    value={bankFormData.bankOwner}
                                    onChange={(e) => setBankFormData({ ...bankFormData, bankOwner: e.target.value })}
                                    placeholder="Tên in trên thẻ (không dấu)"
                                />
                            </div>
                            <div className="input-group">
                                <label style={{ fontSize: '12px', color: '#666' }}>Chi nhánh</label>
                                <input
                                    style={inputStyle}
                                    value={bankFormData.bankBranch}
                                    onChange={(e) => setBankFormData({ ...bankFormData, bankBranch: e.target.value })}
                                    placeholder="Ví dụ: Chi nhánh TP.HCM"
                                />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div className="info-row-wallet">
                                <span style={labelStyle}>Ngân hàng:</span>
                                <span style={valueStyle}>{profile.bankName || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="info-row-wallet">
                                <span style={labelStyle}>Số tài khoản:</span>
                                <span style={valueStyle}>{profile.bankAccount || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="info-row-wallet">
                                <span style={labelStyle}>Chủ tài khoản:</span>
                                <span style={valueStyle}>{profile.bankOwner || 'Chưa cập nhật'}</span>
                            </div>
                            <div className="info-row-wallet">
                                <span style={labelStyle}>Chi nhánh:</span>
                                <span style={valueStyle}>{profile.bankBranch || 'Chưa cập nhật'}</span>
                            </div>
                        </div>
                    )}
                </div>
                <div style={{ height: '1px', background: '#eee', margin: '10px 0' }}></div>
            </div>
            {/* Lịch sử giao dịch */}
            <div className="profile-panel" style={{ marginTop: '5px 0' }}>
                <div className="profile-head" style={{ justifyContent: 'space-between' }}>
                    <span><i className="fa-solid fa-clock-rotate-left"></i> Lịch sử biến động</span>
                </div>

                <div className="profile-body">
                    {/* UI BỘ LỌC NGÀY */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        marginBottom: '15px', padding: '10px', background: '#F8FAFC',
                        borderRadius: '10px', border: '1px solid #E2E8F0'
                    }}>
                        <input type="date" value={filterDate.start} onChange={e => setFilterDate({ ...filterDate, start: e.target.value })} style={dateInputStyle} />
                        <span style={{ color: '#CBD5E1' }}>➔</span>
                        <input type="date" value={filterDate.end} onChange={e => setFilterDate({ ...filterDate, end: e.target.value })} style={dateInputStyle} />
                    </div>

                    {filteredTransactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '13px' }}>
                            Không có biến động nào trong khoảng thời gian này.
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <tbody>
                                {filteredTransactions.map(t => (
                                    <tr key={t._id || t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '12px 0', width: '30%' }}>
                                            <div style={{ fontWeight: '700', fontSize: '13px' }}>{new Date(t.createdAt || t.date).toLocaleDateString('vi-VN')}</div>
                                            <div style={{ fontSize: '10px', color: '#94A3B8' }}>{new Date(t.createdAt || t.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td style={{ padding: '12px 0' }}>
                                            <div style={{ fontSize: '12px', color: '#475569' }}>{t.desc || 'Giao dịch hệ thống'}</div>
                                            {t.status && (
                                                <span style={{ fontSize: '9px', fontWeight: '800', color: t.status === 'approved' ? '#16A34A' : (t.status === 'pending' ? '#D97706' : '#DC2626') }}>
                                                    • {t.status === 'approved' ? 'Thành công' : (t.status === 'pending' ? 'Đang xử lý' : 'Bị từ chối')}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '12px 0', color: t.type === 'in' ? '#16A34A' : '#DC2626', fontWeight: '800', fontSize: '14px' }}>
                                            {t.type === 'in' ? '+' : '-'}{toVND(t.amount)}đ
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showWithdrawModal && (
                <div style={S.overlay}>
                    <div className="animate-pop-in" style={S.sheet}>
                        <h2 style={{ margin: '0 0 25px', color: '#F97350', fontSize: '22px', fontWeight: '800' }}>
                            <i className="fa-solid fa-money-bill-transfer"></i> Yêu cầu rút tiền
                        </h2>

                        {/* Thông tin tài khoản nhận tiền */}
                        <div style={S.bankCard}>
                            <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase' }}>Chuyển về tài khoản:</div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>
                                {profile?.bankName} - {profile?.bankAccount}
                            </div>
                            <div style={{ fontSize: '14px', color: '#475569', fontWeight: '600', textTransform: 'uppercase' }}>
                                {profile?.bankOwner}
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={S.label}>Số tiền muốn rút (VNĐ)</label>
                            <input
                                style={{
                                    ...S.input,
                                    borderColor: isOverBalance ? '#EF4444' : (isBelowMin ? '#F59E0B' : '#E2E8F0'),
                                    background: isOverBalance ? '#FFF1F0' : '#fff',
                                    fontWeight: '800',
                                    color: '#F97350'
                                }}
                                type="text"
                                // Hiển thị định dạng 50.000 khi gõ
                                value={withdrawAmount ? Number(withdrawAmount).toLocaleString('vi-VN') : ''}
                                onChange={e => {
                                    const rawValue = e.target.value.replace(/\D/g, '');
                                    setWithdrawAmount(rawValue);
                                }}
                                placeholder="0"
                                autoFocus
                            />

                            {/* Cảnh báo lỗi */}
                            <div style={{ marginTop: '8px', minHeight: '18px' }}>
                                {isOverBalance && (
                                    <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: '700' }}>
                                        <i className="fa-solid fa-circle-exclamation"></i> Số dư hiện tại không đủ!
                                    </span>
                                )}
                                {isBelowMin && (
                                    <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '700' }}>
                                        <i className="fa-solid fa-triangle-exclamation"></i> Tối thiểu 50.000đ
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', color: '#F97350', fontWeight: '700' }}>Khả dụng: {toVND(realBalance)}đ</span>

                                {/* Nút rút hết */}
                                <button
                                    onClick={() => setWithdrawAmount(realBalance.toString())}
                                    style={{
                                        background: '#FFF5F2', border: '1px solid #F97350', color: '#F97350',
                                        fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer'
                                    }}
                                >
                                    TẤT CẢ
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="btn soft" style={{ flex: 1, padding: '12px', borderRadius: '12px' }} onClick={() => setShowWithdrawModal(false)}>Hủy bỏ</button>
                            <button
                                className="btn primary"
                                style={{
                                    flex: 1, padding: '12px', borderRadius: '12px',
                                    opacity: isInvalid ? 0.5 : 1,
                                    cursor: isInvalid ? 'not-allowed' : 'pointer'
                                }}
                                onClick={handleWithdraw}
                                disabled={loading || isInvalid}
                            >
                                {loading ? 'Đang gửi...' : 'Xác nhận rút'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inputStyle = {
    width: '100%',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    marginTop: '2px'
};

const S = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(5px)', padding: '20px' },
    sheet: { background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '24px', padding: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' },
    bankCard: { background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '25px' },
    label: { display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: '700', color: '#475569' },
    input: { width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #E2E8F0', fontSize: '20px', outline: 'none', transition: '0.2s', boxSizing: 'border-box' }
};

const labelStyle = { color: '#666', fontSize: '13px', width: '120px', display: 'inline-block' };
const valueStyle = { fontWeight: 'bold', fontSize: '13px' };
const dateInputStyle = { flex: 1, border: 'none', background: 'transparent', fontSize: '12px', fontWeight: '700', color: '#475569', outline: 'none' };

export default ShipperWallet;