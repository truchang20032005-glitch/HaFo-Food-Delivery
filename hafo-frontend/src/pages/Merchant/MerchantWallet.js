import { useState, useEffect } from 'react';
import api from '../../services/api';
import { alertError, alertSuccess, alertWarning } from '../../utils/hafoAlert';

function MerchantWallet() {
    const [balance, setBalance] = useState(0);
    const [shop, setShop] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false); // Modal chỉnh sửa ngân hàng
    const [bankFormData, setBankFormData] = useState({
        bankName: '',
        bankAccount: '',
        bankOwner: '',
        bankBranch: ''
    });
    const isOverBalance = Number(withdrawAmount) > balance;
    const isBelowMin = withdrawAmount !== '' && Number(withdrawAmount) < 50000;
    const isInvalid = isOverBalance || isBelowMin || !withdrawAmount;

    // Hàm để đổ dữ liệu cũ vào form khi nhấn "Chỉnh sửa"
    const openEditBank = () => {
        setBankFormData({
            bankName: shop?.bankName || '',
            bankAccount: shop?.bankAccount || '',
            bankOwner: shop?.bankOwner || '',
            bankBranch: shop?.bankBranch || ''
        });
        setShowBankModal(true);
    };

    // Hàm gọi API cập nhật
    const handleUpdateBank = async () => {
        if (!bankFormData.bankName || !bankFormData.bankAccount) {
            return alertWarning("Thiếu thông tin", "Vui lòng điền tên và số tài khoản ngân hàng!");
        }
        setLoading(true);
        try {
            await api.put(`/restaurants/${shop._id}`, bankFormData); // Gọi API put của quán
            await alertSuccess("Cập nhật thông tin ngân hàng thành công!");
            setShowBankModal(false);
            fetchData(); // Tải lại dữ liệu mới nhất
        } catch (err) {
            alertError("Lỗi", err.message);
        } finally {
            setLoading(false);
        }
    };

    const toVND = (n) => n.toLocaleString('vi-VN') + 'đ';

    const fetchData = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            try {
                // 1. Lấy thông tin quán (đã có trường revenue mới cập nhật ở Backend)
                const shopRes = await api.get(`/restaurants/my-shop/${user.id}`);
                const currentShop = shopRes.data;
                setShop(currentShop);

                // ✅ LẤY SỐ DƯ TRỰC TIẾP TỪ DB (Thay vì tính toán thủ công)
                setBalance(currentShop.revenue || 0);

                // 2. Lấy lịch sử giao dịch (Sửa lại đường dẫn cho đúng API)
                const transRes = await api.get(`/transactions/user/${user.id}`); // Dùng /user/:userId
                setTransactions(transRes.data);

                setLoading(false);
            } catch (err) {
                console.error("Lỗi lấy dữ liệu ví:", err);
                setLoading(false);
            }
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleWithdraw = async () => {
        if (isInvalid) return; // Đã có logic check số dư và min 50k của má

        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await api.post('/transactions', {
                userId: user.id || user._id,
                role: 'merchant',
                amount: Number(withdrawAmount),
                bankInfo: {
                    bankName: shop.bankName,
                    bankAccount: shop.bankAccount,
                    bankOwner: shop.bankOwner
                }
            });

            await alertSuccess("Đã gửi yêu cầu", "Vui lòng đợi Admin phê duyệt trong 24h.");
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            // Reload lại dữ liệu
            window.location.reload();
        } catch (err) {
            alertError("Lỗi rút tiền", err.response?.data?.message || "Không thể thực hiện.");
        } finally {
            setLoading(false);
        }
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
            <section className="panel" style={{ marginBottom: '24px', overflow: 'hidden' }}>
                <div className="head" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-wallet" style={{ color: '#F97350' }}></i>
                        <span style={{ fontWeight: '800' }}>Quản lý dòng tiền</span>
                    </div>
                </div>
                <div className="body" style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '25px' }}>

                        {/* CỘT 1: THẺ SỐ DƯ (Gradient rực rỡ) */}
                        <div style={{
                            background: 'linear-gradient(135deg, #F97350 0%, #FF5F6D 100%)',
                            padding: '24px',
                            borderRadius: '24px',
                            color: '#fff',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            boxShadow: '0 10px 20px rgba(249, 115, 80, 0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Hoa văn trang trí cho sang chảnh */}
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>

                            <div>
                                <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: '700', marginBottom: '8px', letterSpacing: '1px' }}>SỐ DƯ KHẢ DỤNG</div>
                                <div style={{ fontSize: '36px', fontWeight: '900', letterSpacing: '0.5px' }}>{toVND(balance)}</div>
                            </div>

                            <button
                                className="btn"
                                onClick={() => setShowWithdrawModal(true)}
                                style={{
                                    marginTop: '25px',
                                    background: '#fff',
                                    color: '#F97350',
                                    border: 'none',
                                    padding: '14px',
                                    borderRadius: '16px',
                                    fontWeight: '900',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <i className="fa-solid fa-paper-plane"></i> RÚT TIỀN NGAY
                            </button>
                        </div>

                        {/* CỘT 2: THÔNG TIN NGÂN HÀNG (Style thẻ ATM tinh tế) */}
                        <div style={{
                            background: '#fff',
                            border: '2px solid #215f9eff',
                            padding: '20px',
                            borderRadius: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#3f5a7fff', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Tài khoản nhận tiền</div>
                                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#1E293B' }}>{shop?.bankName || 'Chưa cập nhật'}</div>
                                </div>
                                <button
                                    onClick={openEditBank}
                                    style={{
                                        background: '#FFF5F2', border: 'none', color: '#F97350',
                                        width: '36px', height: '36px', borderRadius: '50%',
                                        cursor: 'pointer', fontSize: '14px', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center'
                                    }}
                                    title="Chỉnh sửa thông tin"
                                >
                                    <i className="fa-solid fa-pen-to-square"></i>
                                </button>
                            </div>

                            <div style={{ marginTop: '15px' }}>
                                {/* Số tài khoản cách 4 số một lần nhìn cho chuyên nghiệp */}
                                <div style={{ fontSize: '18px', fontWeight: '800', color: '#F97350', letterSpacing: '2px', fontFamily: 'monospace' }}>
                                    {shop?.bankAccount ? shop.bankAccount.replace(/(\d{4})/g, '$1 ').trim() : '**** **** ****'}
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: '700', color: '#3f5a7fff', textTransform: 'uppercase', marginTop: '6px' }}>
                                    {shop?.bankOwner || 'CHỦ TÀI KHOẢN --'}
                                </div>
                            </div>

                            <div style={{
                                marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #F1F5F9',
                                fontSize: '12px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                                <i className="fa-solid fa-location-dot"></i> {shop?.bankBranch || 'Chi nhánh mặc định'}
                            </div>
                        </div>
                    </div>
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
                                style={{
                                    ...S.input,
                                    borderColor: isOverBalance ? '#EF4444' : (isBelowMin ? '#F59E0B' : '#E2E8F0'),
                                    background: isOverBalance ? '#FFF1F0' : '#fff',
                                    fontWeight: '800', // Cho chữ đậm lên nhìn cho rõ tiền
                                    color: '#F97350'
                                }}
                                // ✅ Chuyển sang type="text" để cho phép hiển thị dấu chấm
                                type="text"

                                // ✅ Hiển thị số đã được định dạng dấu chấm khi gõ
                                value={withdrawAmount ? Number(withdrawAmount).toLocaleString('vi-VN') : ''}

                                onChange={e => {
                                    // ✅ CHỈ LẤY SỐ: Loại bỏ tất cả ký tự không phải số (bao gồm cả dấu chấm cũ)
                                    const rawValue = e.target.value.replace(/\D/g, '');
                                    setWithdrawAmount(rawValue);
                                }}
                                placeholder="Nhập số tiền muốn rút"
                                autoFocus
                            />

                            {/* ✅ DÒNG CẢNH BÁO NHỎ ĐỎ */}
                            <div style={{ marginTop: '8px', minHeight: '18px' }}>
                                {isOverBalance && (
                                    <span style={{ fontSize: '12px', color: '#EF4444', fontWeight: '700' }}>
                                        <i className="fa-solid fa-circle-exclamation"></i> Số dư hiện tại không đủ để rút!
                                    </span>
                                )}
                                {isBelowMin && (
                                    <span style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '700' }}>
                                        <i className="fa-solid fa-triangle-exclamation"></i> Số tiền tối thiểu là 50.000đ
                                    </span>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>* Tối thiểu 50.000đ</span>
                                <span style={{ fontSize: '12px', color: '#F97350', fontWeight: '700' }}>Khả dụng: {toVND(balance)}</span>
                                {/* ✅ NÚT RÚT HẾT TIỆN LỢI */}
                                <button
                                    onClick={() => setWithdrawAmount(balance.toString())}
                                    style={{
                                        background: '#FFF5F2',
                                        border: '1px solid #F97350',
                                        color: '#F97350',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        padding: '2px 8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.background = '#F97350'; e.target.style.color = '#fff'; }}
                                    onMouseOut={(e) => { e.target.style.background = '#FFF5F2'; e.target.style.color = '#F97350'; }}
                                >
                                    TẤT CẢ
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="btn soft" style={{ flex: 1 }} onClick={() => setShowWithdrawModal(false)}>Hủy bỏ</button>
                            <button
                                className="btn primary"
                                style={{
                                    flex: 1,
                                    opacity: isInvalid ? 0.5 : 1,
                                    cursor: isInvalid ? 'not-allowed' : 'pointer'
                                }}
                                onClick={handleWithdraw}
                                // ✅ KHÓA NÚT KHI SỐ TIỀN SAI
                                disabled={loading || isInvalid}
                            >
                                {loading ? 'Đang gửi...' : 'Xác nhận rút'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHỈNH SỬA NGÂN HÀNG */}
            {showBankModal && (
                <div style={S.overlay}>
                    <div style={S.sheet}>
                        <h2 style={{ margin: '0 0 20px', color: '#F97350', fontSize: '20px', fontWeight: '800' }}>
                            Cập nhật ngân hàng
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                            <div>
                                <label style={S.label}>Tên ngân hàng (VD: Vietcombank)</label>
                                <input
                                    style={S.input}
                                    value={bankFormData.bankName}
                                    onChange={e => setBankFormData({ ...bankFormData, bankName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={S.label}>Số tài khoản</label>
                                <input
                                    style={S.input}
                                    value={bankFormData.bankAccount}
                                    onChange={e => setBankFormData({ ...bankFormData, bankAccount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={S.label}>Tên chủ tài khoản (Viết hoa không dấu)</label>
                                <input
                                    style={S.input}
                                    value={bankFormData.bankOwner}
                                    onChange={e => setBankFormData({ ...bankFormData, bankOwner: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label style={S.label}>Chi nhánh (Không bắt buộc)</label>
                                <input
                                    style={S.input}
                                    value={bankFormData.bankBranch}
                                    onChange={e => setBankFormData({ ...bankFormData, bankBranch: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="btn soft" style={{ flex: 1 }} onClick={() => setShowBankModal(false)}>Hủy</button>
                            <button className="btn primary" style={{ flex: 1 }} onClick={handleUpdateBank} disabled={loading}>
                                {loading ? 'Đang lưu...' : 'Lưu thông tin'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MerchantWallet;