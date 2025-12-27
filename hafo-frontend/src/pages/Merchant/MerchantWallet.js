import { useState, useEffect } from 'react';
import api from '../../services/api';

function MerchantWallet() {
    const [balance, setBalance] = useState(0);
    const [shop, setShop] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const toVND = (n) => n.toLocaleString('vi-VN') + 'đ';

    const fetchData = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            try {
                const shopRes = await api.get(`/restaurants/my-shop/${user.id}`);
                const currentShop = shopRes.data;
                setShop(currentShop);

                const ordersRes = await api.get(`/orders?restaurantId=${currentShop._id}`);
                const totalRevenue = ordersRes.data
                    .filter(o => o.status === 'done')
                    .reduce((sum, o) => sum + o.total, 0);

                // Giả định có endpoint này để lấy lịch sử giao dịch
                const transRes = await api.get(`/transactions/${currentShop._id}`);
                const history = transRes.data;
                setTransactions(history);

                const totalWithdrawn = history
                    .filter(t => t.status !== 'rejected')
                    .reduce((sum, t) => sum + t.amount, 0);

                setBalance(totalRevenue - totalWithdrawn);
            } catch (err) { console.error(err); }
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleWithdraw = async () => {
        const amount = Number(withdrawAmount);
        if (amount < 50000) return alert("Má ơi, rút tối thiểu 50.000đ nha!");
        if (amount > balance) return alert("Số dư không đủ để rút số tiền này!");

        setLoading(true);
        try {
            await api.post('/transactions', {
                restaurantId: shop._id,
                amount: amount,
                bankInfo: {
                    bankName: shop.bankName,
                    bankAccount: shop.bankAccount,
                    bankOwner: shop.bankOwner
                }
            });
            alert("✅ Gửi yêu cầu rút tiền thành công!");
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            fetchData();
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    // ====== HỆ THỐNG STYLES ĐÃ CẢI THIỆN THEO Ý MÁ ======
    const S = {
        overlay: {
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 10000, display: 'flex', alignItems: 'center',
            justifyContent: 'center', backdropFilter: 'blur(6px)'
        },
        sheet: {
            background: '#fff',
            width: '95%',
            maxWidth: '480px', // Nới rộng hộp thoại ra 1 chút
            borderRadius: '28px',
            padding: '30px',   // Tăng padding tổng thể
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        },
        bankCard: {
            background: '#F8FAFC',
            padding: '20px',   // Nới rộng khoảng cách bên trong khung ngân hàng
            borderRadius: '16px',
            marginBottom: '24px',
            border: '1px solid #E2E8F0'
        },
        label: { display: 'block', fontWeight: '700', fontSize: '14px', color: '#475569', marginBottom: '10px' },
        input: {
            width: '100%', padding: '14px 18px', borderRadius: '14px',
            border: '1.5px solid #E2E8F0', fontSize: '16px', outline: 'none',
            background: '#fff', transition: 'all 0.2s'
        },
        statusBadge: (s) => ({
            padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
            background: s === 'approved' ? '#DCFCE7' : s === 'rejected' ? '#FEE2E2' : '#FEF9C3',
            color: s === 'approved' ? '#166534' : s === 'rejected' ? '#991B1B' : '#854D0E'
        })
    };

    return (
        <div className="wallet-container">
            {/* PHẦN HIỂN THỊ SỐ DƯ (Gọn gàng như trước) */}
            <section className="panel" style={{ marginBottom: '24px' }}>
                <div className="head">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-wallet" style={{ color: '#F97350' }}></i>
                        <span>Ví & Đối soát</span>
                    </div>
                </div>
                <div className="body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: '#64748B', fontSize: '14px', fontWeight: '600' }}>Số dư khả dụng</div>
                        <div style={{ fontSize: '30px', fontWeight: '800', color: '#F97350' }}>{toVND(balance)}</div>
                    </div>
                    <button className="btn primary" onClick={() => setShowWithdrawModal(true)} style={{ padding: '12px 24px', borderRadius: '12px' }}>
                        Rút tiền ngay
                    </button>
                </div>
            </section>

            {/* LỊCH SỬ GIAO DỊCH */}
            <section className="panel">
                <div className="head">Lịch sử rút tiền</div>
                <div className="body">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC' }}>
                                <th style={{ padding: '12px' }}>Ngày yêu cầu</th>
                                <th>Số tiền</th>
                                <th>Ngân hàng</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Chưa có yêu cầu rút tiền.</td></tr>
                            ) : (
                                transactions.map(t => (
                                    <tr key={t._id}>
                                        <td style={{ padding: '12px' }}>{new Date(t.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td><b style={{ color: '#F97350' }}>-{toVND(t.amount)}</b></td>
                                        <td style={{ fontSize: '12px' }}>{t.bankInfo.bankName} - {t.bankInfo.bankAccount}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span style={S.statusBadge(t.status)}>{t.status.toUpperCase()}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* MODAL RÚT TIỀN (ĐÃ ĐƯỢC CẢI THIỆN ĐỘ RỘNG & THÔNG THOÁNG) */}
            {showWithdrawModal && (
                <div style={S.overlay}>
                    <div style={S.sheet}>
                        <h2 style={{ margin: '0 0 25px', color: '#F97350', fontSize: '22px', fontWeight: '800' }}>Yêu cầu rút tiền</h2>

                        {/* Khu vực ngân hàng - Đã nới rộng khoảng cách */}
                        <div style={S.bankCard}>
                            <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px', fontWeight: '600' }}>Chuyển về tài khoản:</div>
                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#1E293B', marginBottom: '4px' }}>
                                {shop?.bankName} - {shop?.bankAccount}
                            </div>
                            <div style={{ fontSize: '15px', color: '#475569', fontWeight: '600', textTransform: 'uppercase' }}>
                                {shop?.bankOwner}
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={S.label}>Số tiền muốn rút (VNĐ)</label>
                            <input
                                style={S.input}
                                type="number"
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                                placeholder="Nhập số tiền..."
                                autoFocus
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>* Tối thiểu 50.000đ</span>
                                <span style={{ fontSize: '12px', color: '#F97350', fontWeight: '700' }}>Khả dụng: {toVND(balance)}</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button
                                className="btn soft"
                                style={{ flex: 1, padding: '14px', borderRadius: '14px', borderStyle: 'dashed' }}
                                onClick={() => setShowWithdrawModal(false)}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                className="btn primary"
                                style={{ flex: 1, padding: '14px', borderRadius: '14px', fontSize: '16px' }}
                                onClick={handleWithdraw}
                                disabled={loading}
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

export default MerchantWallet;