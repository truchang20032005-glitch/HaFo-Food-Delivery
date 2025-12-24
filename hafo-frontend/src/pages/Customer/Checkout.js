import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';

const toVND = (n) => n?.toLocaleString('vi-VN');

function Checkout() {
    const { cartItems, totalAmount, clearCart } = useCart();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: 'Nguyễn Văn B',
        phone: '0909123456',
        address: '19/13 Khu phố Thắng Lợi 1, Dĩ An',
        note: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('CASH');

    // --- STATE VOUCHER ---
    const [vouchers, setVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    const SHIP_FEE = 22000;
    const APP_FEE = 2000;
    // Tính tổng tiền cuối cùng (không âm)
    const FINAL_TOTAL = Math.max(0, totalAmount + SHIP_FEE + APP_FEE - discountAmount);

    // 1. Lấy danh sách Voucher của quán
    useEffect(() => {
        if (cartItems.length > 0) {
            // Lấy restaurantId từ món đầu tiên (Giả sử 1 đơn 1 quán)
            const restaurantId = cartItems[0].restaurant || cartItems[0].restaurantId;
            if (restaurantId) {
                //axios.get(`http://localhost:5000/api/promos/${restaurantId}`)
                api.get(`/promos/${restaurantId}`)
                    .then(res => {
                        // Chỉ lấy mã đang hoạt động
                        const activeVouchers = res.data.filter(v => v.isActive);
                        setVouchers(activeVouchers);
                    })
                    .catch(err => console.error("Lỗi lấy voucher:", err));
            }
        }
    }, [cartItems]);

    // 2. Xử lý khi chọn Voucher
    const handleSelectVoucher = (voucher) => {
        // Nếu đang chọn cái cũ thì bỏ chọn
        if (selectedVoucher && selectedVoucher._id === voucher._id) {
            setSelectedVoucher(null);
            setDiscountAmount(0);
            return;
        }

        // Kiểm tra đơn tối thiểu
        if (totalAmount < voucher.minOrder) {
            alert(`Đơn hàng phải từ ${toVND(voucher.minOrder)} mới dùng được mã này!`);
            return;
        }

        setSelectedVoucher(voucher);

        // Tính tiền giảm
        if (voucher.type === 'percent') {
            const amount = (totalAmount * voucher.value) / 100;
            // Có thể thêm logic giới hạn mức giảm tối đa ở đây nếu muốn
            setDiscountAmount(amount);
        } else {
            setDiscountAmount(voucher.value);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleOrder = async () => {
        if (!formData.name || !formData.phone || !formData.address) {
            alert("Vui lòng điền đầy đủ thông tin giao hàng!");
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            alert("Vui lòng đăng nhập để đặt hàng!");
            return;
        }

        const restaurantId = cartItems[0]?.restaurant || cartItems[0]?.restaurantId;

        // Map items sang cấu trúc chi tiết
        const itemsData = cartItems.map(item => ({
            foodId: item._id,
            name: item.name,
            price: item.finalPrice,
            quantity: item.quantity,
            image: item.image,
            options: `${item.selectedSize}${item.selectedToppings.length > 0 ? ', ' + item.selectedToppings.map(t => t.name).join('+') : ''}`
        }));

        const customerString = `${formData.name} | ${formData.phone} | ${formData.address} | ${paymentMethod}`;

        const orderData = {
            userId: user.id,
            restaurantId: restaurantId,
            customer: customerString,
            items: itemsData,
            total: FINAL_TOTAL,
            // Lưu mã voucher vào note hoặc trường riêng (nếu backend hỗ trợ)
            note: formData.note + (selectedVoucher ? ` [Voucher: ${selectedVoucher.code}]` : "")
        };

        try {
            //const res = await axios.post('http://localhost:5000/api/orders', orderData);
            const res = await api.post('/orders', orderData);
            alert("Đặt hàng thành công! Mã đơn: " + res.data._id);
            clearCart();
            navigate(`/order-tracking/${res.data._id}`);
        } catch (error) {
            alert("Lỗi đặt hàng: " + (error.response?.data?.message || error.message));
        }
    };

    if (cartItems.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <h2>Giỏ hàng trống!</h2>
                <Link to="/" className="btn primary">Quay lại chọn món</Link>
            </div>
        );
    }

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar />

            <header className="header" style={{ background: '#fff', borderBottom: '1px solid #e9e4d8', padding: '10px 0' }}>
                <div className="container hop" style={{ display: 'flex', alignItems: 'center' }}>
                    <Link to="/cart" style={{
                        border: 0,
                        background: 'transparent',
                        color: '#6b625d',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        fontWeight: 'bold'
                    }}>← Quay lại giỏ hàng</Link>
                    <h3 style={{ margin: '0 auto' }}>Thanh toán</h3>
                    <div style={{ width: '100px' }}></div>
                </div>
            </header>

            <main className="hop" style={{ margin: '20px auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>

                {/* CỘT TRÁI */}
                <section>
                    <div className="card ship-info">
                        <div className="head"><i className="fa-solid fa-location-dot"></i> Giao đến</div>
                        <div className="body">
                            <div className="field-group">
                                <label>Địa chỉ nhận hàng</label>
                                <input name="address" value={formData.address} onChange={handleChange} />
                            </div>
                            <div className="field-group">
                                <label>Tên người nhận</label>
                                <input name="name" value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="field-group">
                                <label>Số điện thoại</label>
                                <input name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                            <div className="field-group">
                                <label>Ghi chú</label>
                                <input name="note" value={formData.note} onChange={handleChange} placeholder="Ví dụ: Gọi trước khi tới..." />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CỘT PHẢI */}
                <aside>
                    <div className="card">
                        <div className="head">Chi tiết thanh toán</div>
                        <div className="body">

                            {/* KHUYẾN MÃI TỪ API */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Khuyến mãi từ quán</label>
                                {vouchers.length === 0 ? (
                                    <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic' }}>Quán này chưa có mã giảm giá.</div>
                                ) : (
                                    <div className="vouchers" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 5 }}>
                                        {vouchers.map(v => (
                                            <div
                                                key={v._id}
                                                // Style đổi màu nếu được chọn
                                                style={{
                                                    minWidth: 140, padding: 10, border: selectedVoucher?._id === v._id ? '2px solid #F97350' : '1px solid #ddd',
                                                    borderRadius: 8, cursor: 'pointer', background: selectedVoucher?._id === v._id ? '#fff5f2' : '#fff'
                                                }}
                                                onClick={() => handleSelectVoucher(v)}
                                            >
                                                <div style={{ fontWeight: 'bold', color: '#F97350' }}>{v.code}</div>
                                                <div style={{ fontSize: 12 }}>Giảm {v.type === 'percent' ? `${v.value}%` : toVND(v.value)}</div>
                                                <div style={{ fontSize: 11, color: '#888' }}>Đơn từ {toVND(v.minOrder)}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="paybox">
                                <label style={{ fontWeight: 'bold' }}>Phương thức thanh toán</label>
                                <div className="methods">
                                    <div className={`method ${paymentMethod === 'CASH' ? 'selected' : ''}`} onClick={() => setPaymentMethod('CASH')}>
                                        <i className="fa-solid fa-money-bill"></i>
                                        <div><b>Tiền mặt</b> <span style={{ fontSize: '12px', color: '#666' }}>(COD)</span></div>
                                    </div>
                                    <div className={`method ${paymentMethod === 'MOMO' ? 'selected' : ''}`} onClick={() => setPaymentMethod('MOMO')}>
                                        <i className="fa-solid fa-wallet"></i>
                                        <div><b>MoMo</b></div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #eee', margin: '20px 0' }}></div>

                            <div className="line-row"><span>Tạm tính</span> <b>{toVND(totalAmount)}</b></div>
                            <div className="line-row"><span>Phí ship</span> <b>{toVND(SHIP_FEE)}</b></div>
                            <div className="line-row"><span>Phí dịch vụ</span> <b>{toVND(APP_FEE)}</b></div>
                            <div className="line-row" style={{ color: 'green' }}><span>Giảm giá</span> <b>- {toVND(discountAmount)}</b></div>

                            <div className="total-row">
                                <span>Tổng cộng</span>
                                <span>{toVND(FINAL_TOTAL)}</span>
                            </div>

                            <button
                                onClick={handleOrder}
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '20px', padding: '14px', fontSize: '16px', borderRadius: '8px', border: 'none', background: '#F97350', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                ĐẶT HÀNG ({toVND(FINAL_TOTAL)})
                            </button>
                        </div>
                    </div>
                </aside>

            </main>
        </div>
    );
}

export default Checkout;