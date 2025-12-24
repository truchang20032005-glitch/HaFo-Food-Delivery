import { useState, useEffect } from 'react';
import api from '../../services/api';

function MerchantWallet() {
    const [balance, setBalance] = useState(0);
    const [shop, setShop] = useState(null);

    const toVND = (n) => n.toLocaleString('vi-VN') + 'đ';

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // 1. Lấy quán để hiển thị tên ngân hàng
            //axios.get(`http://localhost:5000/api/restaurants/my-shop/${user.id}`)
            api.get(`/restaurants/my-shop/${user.id}`)
                .then(res => {
                    if (res.data) {
                        setShop(res.data);
                        // 2. Lấy đơn hàng CỦA QUÁN ĐÓ để tính tiền
                        //return axios.get(`http://localhost:5000/api/orders?restaurantId=${res.data._id}`);
                        return api.get(`/orders?restaurantId=${res.data._id}`);
                    }
                })
                .then(res => {
                    if (res && res.data) {
                        // Chỉ cộng tiền các đơn đã HOÀN TẤT
                        const total = res.data
                            .filter(o => o.status === 'done')
                            .reduce((sum, o) => sum + o.total, 0);
                        setBalance(total);
                    }
                })
                .catch(err => console.error(err));
        }
    }, []);

    return (
        <div className="panel">
            <div className="head">Đối soát & Thanh toán</div>
            <div className="body">
                <div className="balance" style={{ marginBottom: '20px' }}>
                    <div className="box" style={{ border: '1px solid #eadfcd', borderRadius: '12px', padding: '15px', background: '#fff' }}>
                        <div className="legend">Số dư khả dụng (Từ đơn hàng thực tế)</div>
                        <div className="big" style={{ fontSize: '24px', fontWeight: '800', color: '#F97350', margin: '5px 0' }}>{toVND(balance)}</div>
                    </div>
                </div>

                <div className="hr" style={{ height: '1px', background: '#eee', margin: '20px 0' }}></div>

                {/* Hiển thị ngân hàng lấy từ DB */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9f9f9', padding: '12px', borderRadius: '10px' }}>
                    <div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Ngân hàng nhận tiền</div>
                        <div style={{ fontWeight: 'bold' }}>
                            {shop ? `${shop.bankName} - ${shop.bankAccount}` : 'Chưa cập nhật'}
                        </div>
                        <div style={{ fontSize: '13px' }}>{shop?.bankOwner}</div>
                    </div>
                    <button className="btn small soft">Thay đổi</button>
                </div>
            </div>
        </div>
    );
}
export default MerchantWallet;