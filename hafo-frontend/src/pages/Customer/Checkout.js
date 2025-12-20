import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';

const toVND = (n) => n?.toLocaleString('vi-VN');

function Checkout() {
    const { cartItems, totalAmount, clearCart } = useCart();
    const navigate = useNavigate();

    // State cho Form
    const [formData, setFormData] = useState({
        name: 'Nguyễn Văn B', // Điền sẵn để test cho nhanh
        phone: '0909123456',
        address: '19/13 Khu phố Thắng Lợi 1, Dĩ An',
        note: ''
    });

    // State cho Thanh toán & Voucher
    const [paymentMethod, setPaymentMethod] = useState('CASH'); // Mặc định tiền mặt
    const [voucher, setVoucher] = useState(0); // Số tiền giảm giá

    // Phí cố định
    const SHIP_FEE = 22000;
    const APP_FEE = 2000;
    const FINAL_TOTAL = totalAmount + SHIP_FEE + APP_FEE - voucher;

    // Xử lý nhập liệu
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Xử lý Đặt hàng
    const handleOrder = async () => {
        // Validate
        if (!formData.name || !formData.phone || !formData.address) {
            alert("Vui lòng điền đầy đủ thông tin giao hàng!");
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
            alert("Bạn cần đăng nhập để đặt hàng!");
            navigate('/');
            return;
        }

        // --- SỬA ĐỔI QUAN TRỌNG: TẠO MẢNG ITEMS ---
        const itemsPayload = cartItems.map(item => ({
            foodId: item._id || item.id, // Đảm bảo lấy đúng ID món
            name: item.name,
            price: item.finalPrice,      // Giá cuối (đã cộng topping)
            quantity: item.quantity,
            image: item.image,
            // Gom Size và Topping thành 1 chuỗi để hiển thị cho gọn ở Backend cũ nếu cần
            options: `${item.selectedSize || ''} ${item.selectedToppings?.length > 0 ? '- ' + item.selectedToppings.map(t => t.name).join(', ') : ''}`
        }));
        // ------------------------------------------

        // Gộp địa chỉ đầy đủ
        const customerString = `${formData.name}|${formData.phone}|${formData.address}, ${formData.note}`;

        const orderData = {
            userId: user.id,
            restaurantId: cartItems[0].restaurantId || cartItems[0].restaurant, // Lấy ID quán từ món đầu tiên
            customer: customerString,
            items: itemsPayload, // Gửi mảng vừa tạo (không stringify thủ công, axios tự làm)
            total: FINAL_TOTAL
        };

        try {
            await axios.post('http://localhost:5000/api/orders', orderData);
            alert("🎉 Đặt hàng thành công! Đang chờ quán xác nhận.");
            clearCart();
            navigate('/history');
        } catch (error) {
            console.error(error);
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
                    <Link to="/cart" style={{ textDecoration: 'none', color: '#6b625d', fontWeight: 'bold' }}>← Quay lại giỏ hàng</Link>
                    <h3 style={{ margin: '0 auto' }}>Thanh toán</h3>
                    <div style={{ width: '100px' }}></div>
                </div>
            </header>

            <main className="hop" style={{ margin: '20px auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px' }}>

                {/* --- CỘT TRÁI: THÔNG TIN --- */}
                <section>
                    {/* 1. Giao đến */}
                    <div className="card ship-info">
                        <div className="head"><i className="fa-solid fa-location-dot"></i> Giao đến</div>
                        <div className="body">
                            <div className="row" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <span className="badge-time"><i className="fa-regular fa-clock"></i> 20 phút</span>
                                <span style={{ color: '#666' }}>· Cách bạn <b>2,1 km</b></span>
                            </div>

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
                                <label>Ghi chú cho tài xế</label>
                                <input name="note" value={formData.note} onChange={handleChange} placeholder="Ví dụ: Gọi trước khi tới..." />
                            </div>
                        </div>
                    </div>

                    {/* 2. Danh sách món (Tóm tắt) */}
                    <div className="card">
                        <div className="head">Tóm tắt đơn hàng ({cartItems.length} món)</div>
                        <div className="body" style={{ padding: 0 }}>
                            {cartItems.map((item) => (
                                <div key={item.uniqueId} style={{ display: 'flex', gap: '15px', padding: '12px 16px', borderBottom: '1px solid #eee' }}>
                                    <img src={item.image || '/images/default-food.jpg'} alt="" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                        <div style={{ fontSize: '13px', color: '#666' }}>{item.selectedSize}, {item.selectedToppings.map(t => t.name).join(', ')}</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold' }}>x{item.quantity}</div>
                                    <div style={{ fontWeight: 'bold', minWidth: '70px', textAlign: 'right' }}>
                                        {toVND(item.finalPrice * item.quantity)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* --- CỘT PHẢI: THANH TOÁN --- */}
                <aside>
                    <div className="card">
                        <div className="head">Chi tiết thanh toán</div>
                        <div className="body">
                            {/* Voucher */}
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Khuyến mãi</label>
                                <div className="vouchers">
                                    <div
                                        className={`voucher ${voucher === 10000 ? 'active' : ''}`}
                                        onClick={() => setVoucher(10000)}
                                    >
                                        <div>
                                            <div className="v-title">Giảm 10K</div>
                                            <div className="v-code">HAFO10</div>
                                        </div>
                                    </div>
                                    <div
                                        className={`voucher ${voucher === 20000 ? 'active' : ''}`}
                                        onClick={() => setVoucher(20000)}
                                    >
                                        <div>
                                            <div className="v-title">Giảm 20K</div>
                                            <div className="v-code">HAFO20</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Phương thức thanh toán */}
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
                                    <div className={`method ${paymentMethod === 'ZALOPAY' ? 'selected' : ''}`} onClick={() => setPaymentMethod('ZALOPAY')}>
                                        <i className="fa-solid fa-bolt"></i>
                                        <div><b>ZaloPay</b></div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid #eee', margin: '20px 0' }}></div>

                            {/* Tổng kết tiền */}
                            <div className="line-row"><span>Tạm tính</span> <b>{toVND(totalAmount)}</b></div>
                            <div className="line-row"><span>Phí ship</span> <b>{toVND(SHIP_FEE)}</b></div>
                            <div className="line-row"><span>Phí áp dụng</span> <b>{toVND(APP_FEE)}</b></div>
                            <div className="line-row" style={{ color: 'green' }}><span>Khuyến mãi</span> <b>- {toVND(voucher)}</b></div>

                            <div className="total-row">
                                <span>Tổng cộng</span>
                                <span>{toVND(FINAL_TOTAL)}</span>
                            </div>

                            <button
                                onClick={handleOrder}
                                type="submit"
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '20px', background: '#F97350', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
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