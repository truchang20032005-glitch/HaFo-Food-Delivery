import { useState, useEffect } from 'react';
import api from '../../services/api';
import { alertError, alertSuccess, confirmDialog, alertWarning } from '../../utils/hafoAlert';

const toVND = (n) => n?.toLocaleString('vi-VN');

function ShipperWallet() {
    const [profile, setProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

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
            // 1. Lấy thông tin Shipper
            const profileRes = await api.get(`/shippers/profile/${userId}`);
            const data = profileRes.data;
            setProfile(data);

            // Khởi tạo form data từ dữ liệu DB
            setBankFormData({
                bankName: data.bankName || '',
                bankAccount: data.bankAccount || '',
                bankOwner: data.bankOwner || data.user.fullName,
                bankBranch: data.bankBranch || ''
            });

            // 2. Lấy lịch sử giao dịch (đơn hàng đã hoàn thành)
            const ordersRes = await api.get('/orders');
            if (ordersRes.data) {
                const myDoneOrders = ordersRes.data.filter(o =>
                    o.shipperId === userId && o.status === 'done'
                );
                const history = myDoneOrders.map(o => ({
                    id: o._id,
                    date: o.createdAt,
                    desc: `Thu nhập đơn #${o._id.slice(-6).toUpperCase()}`,
                    amount: 15000,
                    type: 'in'
                }));
                setTransactions(history.reverse());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        const amountText = toVND(realBalance);

        // 1. Kiểm tra số dư
        if (realBalance <= 0) {
            return alertWarning("Không thể rút tiền", "Số dư khả dụng của bạn đang bằng 0đ.");
        }

        // 2. Kiểm tra thông tin ngân hàng
        if (!profile.bankAccount || !profile.bankName) {
            return alertWarning(
                "Thiếu thông tin",
                "Vui lòng cập nhật thông tin ngân hàng bên dưới trước khi yêu cầu rút tiền!"
            );
        }

        // 3. Xác nhận rút tiền (Bắt buộc có await)
        const isConfirmed = await confirmDialog(
            "Xác nhận rút tiền?",
            `Hệ thống sẽ gửi yêu cầu rút ${amountText}đ về ngân hàng ${profile.bankName} của bạn.`
        );

        if (!isConfirmed) return;

        try {
            const user = JSON.parse(localStorage.getItem('user'));

            // 4. Gửi yêu cầu lên Backend
            const payload = {
                userId: user.id,
                role: 'shipper',
                amount: realBalance,
                bankInfo: {
                    bankName: profile.bankName,
                    bankAccount: profile.bankAccount,
                    bankOwner: profile.bankOwner
                },
                note: 'Shipper yêu cầu rút toàn bộ số dư'
            };

            await api.post('/transactions', payload);

            // 5. Thông báo thành công và ĐỢI người dùng đọc xong
            await alertSuccess(
                "Thành công!",
                "Yêu cầu rút tiền đã được gửi. Vui lòng đợi Admin phê duyệt trong vòng 24h."
            );

            // 6. Tải lại dữ liệu ví để cập nhật trạng thái mới nhất
            fetchWalletData(user.id);

        } catch (err) {
            const errMsg = err.response?.data?.message || "Không thể kết nối đến máy chủ để thực hiện rút tiền.";
            alertError("Lỗi rút tiền", errMsg);
        }
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

    const realBalance = transactions.reduce((sum, t) => sum + t.amount, 0);

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
                            onClick={handleWithdraw}
                            disabled={realBalance <= 0}
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

                <div style={{ height: '1px', background: '#eee', margin: '15px 0' }}></div>

                {/* Lịch sử giao dịch */}
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>Lịch sử biến động</div>
                {transactions.length === 0 ? (
                    <div style={{ fontSize: '13px', color: '#999', textAlign: 'center' }}>Chưa có giao dịch nào.</div>
                ) : (
                    <table style={{ width: '100%', fontSize: '13px' }}>
                        <tbody>
                            {transactions.map(t => (
                                <tr key={t.id}>
                                    <td style={{ padding: '8px 0', color: '#666', width: '30%' }}>
                                        {new Date(t.date).toLocaleDateString('vi-VN')}
                                        <div style={{ fontSize: '11px' }}>{new Date(t.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                                    </td>
                                    <td style={{ padding: '8px 0' }}>
                                        <div>{t.desc}</div>
                                    </td>
                                    <td style={{ textAlign: 'right', color: t.type === 'in' ? '#22C55E' : '#ef4444', fontWeight: 'bold' }}>
                                        {t.type === 'in' ? '+' : '-'}{toVND(t.amount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
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

const labelStyle = { color: '#666', fontSize: '13px', width: '120px', display: 'inline-block' };
const valueStyle = { fontWeight: 'bold', fontSize: '13px' };

export default ShipperWallet;