import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';

const toVND = (n) => n?.toLocaleString('vi-VN');

function Checkout() {
    const { cartItems, totalAmount, clearCart } = useCart();
    const navigate = useNavigate();

    // State Form
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
        note: ''
    });

    const [paymentMethod, setPaymentMethod] = useState('CASH');

    // State Voucher
    const [vouchers, setVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    const SHIP_FEE = 22000;
    const APP_FEE = 2000; // Phí nền tảng

    // Tính toán cuối cùng
    const FINAL_TOTAL = Math.max(0, totalAmount + SHIP_FEE + APP_FEE - discountAmount);

    // 1. Load thông tin User
    useEffect(() => {
        const fetchUserInfo = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                try {
                    const res = await api.get(`/auth/me/${userObj.id}`);
                    const userData = res.data;
                    let defaultAddress = '';
                    if (userData.addresses && userData.addresses.length > 0) {
                        defaultAddress = userData.addresses[0].value;
                    }
                    setFormData(prev => ({
                        ...prev,
                        name: userData.fullName || prev.name,
                        phone: userData.phone || '',
                        address: defaultAddress,
                    }));
                } catch (err) {
                    console.error("Lỗi user info:", err);
                }
            }
        };
        fetchUserInfo();
    }, []);

    // 2. Load Voucher
    useEffect(() => {
        if (cartItems.length > 0) {
            const restaurantId = cartItems[0].restaurant || cartItems[0].restaurantId;
            if (restaurantId) {
                api.get(`/promos/${restaurantId}`)
                    .then(res => {
                        const activeVouchers = res.data.filter(v => v.isActive);
                        setVouchers(activeVouchers);
                    })
                    .catch(err => console.error("Lỗi voucher:", err));
            }
        }
    }, [cartItems]);

    // Xử lý chọn Voucher
    const handleSelectVoucher = (voucher) => {
        if (selectedVoucher && selectedVoucher._id === voucher._id) {
            setSelectedVoucher(null);
            setDiscountAmount(0);
            return;
        }
        if (totalAmount < voucher.minOrder) {
            alert(`Đơn hàng phải từ ${toVND(voucher.minOrder)} mới dùng được mã này!`);
            return;
        }
        setSelectedVoucher(voucher);
        if (voucher.type === 'percent') {
            setDiscountAmount((totalAmount * voucher.value) / 100);
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
            alert("Vui lòng đăng nhập!");
            return;
        }

        const restaurantId = cartItems[0]?.restaurant || cartItems[0]?.restaurantId;
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
            note: formData.note + (selectedVoucher ? ` [Voucher: ${selectedVoucher.code}]` : "")
        };

        try {
            const res = await api.post('/orders', orderData);
            alert("🎉 Đặt hàng thành công!");
            clearCart();
            navigate(`/order-tracking/${res.data._id}`);
        } catch (error) {
            alert("Lỗi đặt hàng: " + (error.response?.data?.message || error.message));
        }
    };

    // --- HELPER UI ---
    const InputField = ({ icon, name, placeholder, value, onChange }) => (
        <div style={{ position: 'relative', marginBottom: '15px' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}>
                {icon}
            </div>
            <input
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{
                    width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px',
                    border: '1px solid #ddd', fontSize: '14px', outline: 'none', transition: 'border 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#F97350'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
        </div>
    );

    if (cartItems.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 20px', background: '#F7F2E5', minHeight: '100vh' }}>
                <img src="https://cdn-icons-png.flaticon.com/512/2038/2038854.png" alt="Empty" style={{ width: 100, marginBottom: 20, opacity: 0.5 }} />
                <h3 style={{ color: '#555' }}>Giỏ hàng trống trơn!</h3>
                <Link to="/home" className="btn primary" style={{ marginTop: 20, display: 'inline-block', padding: '10px 30px', background: '#F97350', color: '#fff', borderRadius: '25px', textDecoration: 'none', fontWeight: 'bold' }}>
                    Đi chọn món ngay
                </Link>
            </div>
        );
    }

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: 50 }}>
            <Navbar />

            {/* Header */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e9e4d8', padding: '15px 0', boxShadow: '0 2px 5px rgba(0,0,0,0.03)' }}>
                <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 15 }}>
                    <Link to="/cart" style={{ textDecoration: 'none', color: '#666', fontSize: '18px' }}><i className="fa-solid fa-arrow-left"></i></Link>
                    <h2 style={{ margin: 0, fontSize: '20px', color: '#3A2E2E', flex: 1, textAlign: 'center' }}>Thanh toán & Đặt hàng</h2>
                    <div style={{ width: 20 }}></div>
                </div>
            </div>

            <main style={{ maxWidth: '1100px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px', alignItems: 'start' }}>

                {/* --- CỘT TRÁI: THÔNG TIN --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* 1. THÔNG TIN GIAO HÀNG */}
                    <section style={cardStyle}>
                        <h4 style={headerStyle}><i className="fa-solid fa-location-dot" style={{ color: '#F97350', marginRight: 8 }}></i> Thông tin giao hàng</h4>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <InputField icon={<i className="fa-regular fa-user"></i>} name="name" placeholder="Tên người nhận" value={formData.name} onChange={handleChange} />
                                <InputField icon={<i className="fa-solid fa-phone"></i>} name="phone" placeholder="Số điện thoại" value={formData.phone} onChange={handleChange} />
                            </div>
                            <InputField icon={<i className="fa-solid fa-map-location-dot"></i>} name="address" placeholder="Địa chỉ chi tiết (Số nhà, đường, phường...)" value={formData.address} onChange={handleChange} />
                            <InputField icon={<i className="fa-regular fa-note-sticky"></i>} name="note" placeholder="Ghi chú cho tài xế/quán (VD: Không cay...)" value={formData.note} onChange={handleChange} />
                        </div>
                    </section>

                    {/* 2. PHƯƠNG THỨC THANH TOÁN */}
                    <section style={cardStyle}>
                        <h4 style={headerStyle}><i className="fa-regular fa-credit-card" style={{ color: '#F97350', marginRight: 8 }}></i> Phương thức thanh toán</h4>
                        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div
                                onClick={() => setPaymentMethod('CASH')}
                                style={{
                                    border: paymentMethod === 'CASH' ? '2px solid #F97350' : '1px solid #ddd',
                                    background: paymentMethod === 'CASH' ? '#FFF5F2' : '#fff',
                                    borderRadius: '12px', padding: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s'
                                }}
                            >
                                <img src="https://cdn-icons-png.flaticon.com/512/2331/2331941.png" alt="Cash" style={{ width: 32 }} />
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Tiền mặt</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>Thanh toán khi nhận</div>
                                </div>
                                {paymentMethod === 'CASH' && <i className="fa-solid fa-circle-check" style={{ marginLeft: 'auto', color: '#F97350' }}></i>}
                            </div>

                            <div
                                onClick={() => setPaymentMethod('MOMO')}
                                style={{
                                    border: paymentMethod === 'MOMO' ? '2px solid #D82D8B' : '1px solid #ddd',
                                    background: paymentMethod === 'MOMO' ? '#FDEDF6' : '#fff',
                                    borderRadius: '12px', padding: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s'
                                }}
                            >
                                <img
                                    src="https://avatars.githubusercontent.com/u/36770798?s=200&v=4"
                                    alt="MoMo"
                                    style={{ width: 32, borderRadius: '4px' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>Ví MoMo</div>
                                    <div style={{ fontSize: '11px', color: '#666' }}>Liên kết siêu tốc</div>
                                </div>
                                {paymentMethod === 'MOMO' && <i className="fa-solid fa-circle-check" style={{ marginLeft: 'auto', color: '#D82D8B' }}></i>}
                            </div>
                        </div>
                    </section>
                </div>

                {/* --- CỘT PHẢI: TÓM TẮT & VOUCHER --- */}
                <aside style={{ position: 'sticky', top: '90px' }}>
                    <div style={{ ...cardStyle, overflow: 'hidden' }}>

                        {/* List món rút gọn */}
                        <div style={{ background: '#FFFCF5', padding: '15px', borderBottom: '1px dashed #e5e5e5' }}>
                            <h4 style={{ margin: '0 0 10px', fontSize: '15px', color: '#555' }}>Món đã chọn ({cartItems.length})</h4>
                            <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '13px' }}>
                                {cartItems.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#333' }}><b>{item.quantity}x</b> {item.name}</span>
                                        <span style={{ color: '#666' }}>{toVND(item.finalPrice * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Voucher */}
                        <div style={{ padding: '15px 20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <label style={{ fontWeight: 'bold', fontSize: '14px' }}><i className="fa-solid fa-ticket"></i> Mã khuyến mãi</label>
                                {discountAmount > 0 && <span style={{ fontSize: '12px', color: '#F97350', cursor: 'pointer' }} onClick={() => { setSelectedVoucher(null); setDiscountAmount(0) }}>Gỡ bỏ</span>}
                            </div>

                            {vouchers.length === 0 ? (
                                <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic', background: '#f9f9f9', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>Không có mã giảm giá.</div>
                            ) : (
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none' }}>
                                    {vouchers.map(v => (
                                        <div
                                            key={v._id}
                                            onClick={() => handleSelectVoucher(v)}
                                            style={{
                                                minWidth: '130px', padding: '8px', border: selectedVoucher?._id === v._id ? '1px solid #F97350' : '1px dashed #ccc',
                                                borderRadius: '8px', cursor: 'pointer', background: selectedVoucher?._id === v._id ? '#fff5f2' : '#fff',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold', color: '#F97350', fontSize: '13px' }}>{v.code}</div>
                                            <div style={{ fontSize: '11px', color: '#555' }}>Giảm {v.type === 'percent' ? `${v.value}%` : toVND(v.value)}</div>
                                            {selectedVoucher?._id === v._id && <div style={{ position: 'absolute', top: -5, right: -5, background: '#F97350', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tổng kết tiền */}
                        <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #eee' }}>
                            <div style={rowStyle}><span>Tạm tính</span> <b>{toVND(totalAmount)}đ</b></div>
                            <div style={rowStyle}><span>Phí ship</span> <b>{toVND(SHIP_FEE)}đ</b></div>
                            <div style={rowStyle}><span>Phí dịch vụ</span> <b>{toVND(APP_FEE)}đ</b></div>
                            {discountAmount > 0 && (
                                <div style={{ ...rowStyle, color: '#22C55E' }}><span>Khuyến mãi</span> <b>- {toVND(discountAmount)}đ</b></div>
                            )}

                            <div style={{ borderTop: '1px dashed #ddd', margin: '15px 0' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>Tổng thanh toán</span>
                                <span style={{ fontSize: '22px', fontWeight: '900', color: '#F97350' }}>{toVND(FINAL_TOTAL)}đ</span>
                            </div>

                            <button
                                onClick={handleOrder}
                                style={{
                                    width: '100%', padding: '14px', borderRadius: '30px', border: 'none',
                                    background: 'linear-gradient(to right, #F97350, #FF5F6D)', color: '#fff',
                                    fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(249, 115, 80, 0.4)', transition: 'transform 0.2s'
                                }}
                                onMouseDown={e => e.target.style.transform = 'scale(0.98)'}
                                onMouseUp={e => e.target.style.transform = 'scale(1)'}
                            >
                                ĐẶT HÀNG NGAY
                            </button>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}

// --- Styles ---
const cardStyle = {
    background: '#fff', borderRadius: '16px', border: '1px solid #eadfcd', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
};
const headerStyle = {
    margin: 0, padding: '15px 20px', borderBottom: '1px solid #eee', fontSize: '16px', color: '#333', background: '#fff'
};
const rowStyle = {
    display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#555'
};

export default Checkout;