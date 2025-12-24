import { useState, useEffect } from 'react';
import api from '../../services/api';

const toVND = (n) => n?.toLocaleString('vi-VN');

function ShipperWallet() {
    const [profile, setProfile] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // 1. Lấy thông tin Shipper (Số dư, Ngân hàng)
            //axios.get(`http://localhost:5000/api/shippers/profile/${user.id}`)
            api.get(`/shippers/profile/${user.id}`)
                .then(res => {
                    setProfile(res.data);

                    // 2. Lấy lịch sử đơn hàng để giả lập lịch sử giao dịch
                    //return axios.get('http://localhost:5000/api/orders');
                    return api.get('/orders');
                })
                .then(res => {
                    if (res && res.data) {
                        const myDoneOrders = res.data.filter(o =>
                            o.shipperId === user.id && o.status === 'done'
                        );
                        // Giả lập mỗi đơn ship được 15.000đ cộng vào ví
                        const history = myDoneOrders.map(o => ({
                            id: o._id,
                            date: o.createdAt,
                            desc: `Thu nhập đơn #${o._id.slice(-6).toUpperCase()}`,
                            amount: 15000,
                            type: 'in' // Tiền vào
                        }));
                        setTransactions(history.reverse());
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, []);

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải ví...</div>;
    if (!profile) return <div style={{ padding: 20, textAlign: 'center' }}>Chưa có thông tin ví.</div>;

    // Tính số dư thực tế (Giả sử số dư = Tổng tiền ship các đơn đã chạy)
    // Nếu bạn đã lưu trường `income` trong DB thì dùng profile.income
    // Ở đây mình tính nóng luôn cho chắc ăn khớp với lịch sử
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
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="ship-btn primary" style={{ padding: '10px', width: 'auto' }} onClick={() => alert("Yêu cầu rút tiền đã gửi!")}>Rút tiền</button>
                    </div>
                </div>

                {/* Tài khoản ngân hàng (Lấy từ DB thật) */}
                <div className="info-row" style={{ border: 0 }}>
                    <span className="info-label">Tài khoản nhận</span>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold' }}>{profile.bankName || 'Chưa cập nhật'}</div>
                        <div style={{ fontSize: '13px' }}>
                            {profile.bankAccount} - {profile.bankOwner || profile.user.fullName}
                        </div>
                    </div>
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

export default ShipperWallet;