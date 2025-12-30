import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';

// Import Leaflet cho bản đồ
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix lỗi icon marker của Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const toVND = (n) => n?.toLocaleString('vi-VN');

function Checkout() {
    const { cartItems, totalAmount, clearCart } = useCart();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ name: '', phone: '', address: '', note: '', lat: null, lng: null });
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [vouchers, setVouchers] = useState([]); // Trong code của má là 'promos', ở đây con giữ 'vouchers' cho đồng bộ state cũ
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [showMapModal, setShowMapModal] = useState(false);

    const SHIP_FEE = 22000;
    const APP_FEE = 2000;
    const FINAL_TOTAL = Math.max(0, totalAmount + SHIP_FEE + APP_FEE - discountAmount);

    function LocationMarker() {
        useMapEvents({
            click(e) {
                setFormData(prev => ({ ...prev, lat: e.latlng.lat, lng: e.latlng.lng }));
            },
        });
        return (formData.lat && formData.lng) ? <Marker position={[formData.lat, formData.lng]} /> : null;
    }

    useEffect(() => {
        const fetchUserInfo = async () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                try {
                    const res = await api.get(`/auth/me/${userObj.id}`);
                    const userData = res.data;
                    setFormData(prev => ({
                        ...prev,
                        name: userData.fullName || prev.name,
                        phone: userData.phone || prev.phone,
                        address: userData.addresses?.[0]?.value || prev.address,
                        lat: userData.addresses?.[0]?.lat || 10.762622,
                        lng: userData.addresses?.[0]?.lng || 106.660172
                    }));
                } catch (err) { console.error("Lỗi user info:", err); }
            }
        };
        fetchUserInfo();
    }, []);

    useEffect(() => {
        if (cartItems.length > 0) {
            const restaurantId = cartItems[0].restaurant || cartItems[0].restaurantId;
            api.get(`/promos/${restaurantId}`)
                .then(res => setVouchers(res.data.filter(v => v.isActive)))
                .catch(err => console.error("Lỗi voucher:", err));
        }
    }, [cartItems]);

    const handleSelectVoucher = (voucher) => {
        if (selectedVoucher?._id === voucher._id) {
            setSelectedVoucher(null); setDiscountAmount(0); return;
        }
        if (totalAmount < voucher.minOrder) {
            return alert(`Đơn hàng phải từ ${toVND(voucher.minOrder)}đ mới dùng được mã này!`);
        }
        setSelectedVoucher(voucher);
        setDiscountAmount(voucher.type === 'percent' ? (totalAmount * voucher.value) / 100 : voucher.value);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleOrder = async () => {
        if (!formData.name || !formData.phone || !formData.address) return alert("Vui lòng điền đủ thông tin giao hàng!");
        const user = JSON.parse(localStorage.getItem('user'));
        const orderData = {
            userId: user.id,
            restaurantId: cartItems[0]?.restaurant || cartItems[0]?.restaurantId,
            customer: `${formData.name} | ${formData.phone} | ${formData.address} | ${paymentMethod}`,
            items: cartItems.map(item => ({
                foodId: item._id, name: item.name, price: item.finalPrice,
                quantity: item.quantity, image: item.image,
                options: `${item.selectedSize}${item.selectedToppings.length > 0 ? ', ' + item.selectedToppings.map(t => t.name).join('+') : ''}`
            })),
            total: FINAL_TOTAL,
            note: formData.note + (selectedVoucher ? ` [Voucher: ${selectedVoucher.code}]` : ""),
            lat: formData.lat, lng: formData.lng
        };
        try {
            // 1. Tạo đơn hàng lấy ID trước
            const resOrder = await api.post('/orders', orderData);
            const newOrderId = resOrder.data._id;

            if (paymentMethod === 'MOMO') {
                // 2. Gọi Backend lấy link MoMo
                const resMomo = await api.post('/momo/payment', {
                    amount: FINAL_TOTAL,
                    orderId: newOrderId
                });

                if (resMomo.data.payUrl) {
                    // 3. Chuyển hướng khách sang trang MoMo (cái hình bạn gửi lúc nãy)
                    window.location.href = resMomo.data.payUrl;
                }
            } else {
                alert("🎉 Đặt hàng thành công!");
                clearCart();
                navigate(`/order-tracking/${newOrderId}`);
            }
        } catch (error) {
            alert("Lỗi: " + error.message);
        }
    };

    if (cartItems.length === 0) return <div style={{ padding: 50, textAlign: 'center' }}>Giỏ hàng trống! <Link to="/">Về trang chủ</Link></div>;

    const S = {
        container: { background: '#F7F2E5', minHeight: '100vh', paddingBottom: '50px' },
        wrapper: { maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 450px', gap: '30px', alignItems: 'start' },
        card: { background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
        h3: { margin: '0 0 20px', fontSize: '18px', fontWeight: '700', color: '#333', display: 'flex', alignItems: 'center', gap: '10px' },
        inputGroup: { marginBottom: '15px' },
        label: { display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px', color: '#555' },
        input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' },
        paymentBtn: (active) => ({
            flex: 1, padding: '15px', borderRadius: '12px', border: active ? '2px solid #F97350' : '1px solid #eee',
            background: active ? '#FFF5F2' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'
        }),
        summaryRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: '#555', fontSize: '14px' },
        totalRow: { display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '15px', borderTop: '1px dashed #ddd', fontWeight: '700', fontSize: '20px', color: '#F97350' },
        checkoutBtn: { width: '100%', padding: '16px', background: 'linear-gradient(to right, #F97350, #FF5F6D)', color: '#fff', border: 'none', borderRadius: '30px', fontSize: '16px', fontWeight: '700', cursor: 'pointer', marginTop: '25px', boxShadow: '0 4px 15px rgba(249, 115, 80, 0.4)' },
        mapModalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' },
        mapModalContent: { background: '#fff', padding: '25px', borderRadius: '24px', width: '90%', maxWidth: '700px', position: 'relative' }
    };

    return (
        <div style={S.container}>
            <Navbar />
            <div className="container" style={{ maxWidth: '1200px', margin: '20px auto 0', padding: '0 20px' }}>
                <Link to="/cart" style={{ textDecoration: 'none', color: '#F97350', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-arrow-left"></i> Quay lại giỏ hàng
                </Link>
            </div>

            <div style={S.wrapper}>
                {/* CỘT TRÁI: THÔNG TIN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div style={S.card}>
                        <h3 style={S.h3}><i className="fa-solid fa-location-dot" style={{ color: '#F97350' }}></i> Thông tin giao hàng</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={S.inputGroup}>
                                <label style={S.label}>Người nhận</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Tên người nhận" style={S.input} />
                            </div>
                            <div style={S.inputGroup}>
                                <label style={S.label}>Số điện thoại</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="SĐT liên hệ" style={S.input} />
                            </div>
                        </div>
                        <div style={S.inputGroup}>
                            <label style={S.label}>Địa chỉ nhận hàng</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Địa chỉ chi tiết..." style={{ ...S.input, flex: 1 }} />
                                <button onClick={() => setShowMapModal(true)} style={{ padding: '0 15px', background: '#fff', border: '1px solid #F97350', color: '#F97350', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}>
                                    📍 Chọn trên map
                                </button>
                            </div>
                        </div>
                        <div style={S.inputGroup}>
                            <label style={S.label}>Ghi chú</label>
                            <textarea name="note" value={formData.note} onChange={handleChange} placeholder="Lời nhắn cho quán..." style={{ ...S.input, height: '80px', resize: 'none' }} />
                        </div>
                    </div>

                    <div style={S.card}>
                        <h3 style={S.h3}><i className="fa-solid fa-wallet" style={{ color: '#F97350' }}></i> Phương thức thanh toán</h3>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={S.paymentBtn(paymentMethod === 'CASH')} onClick={() => setPaymentMethod('CASH')}>
                                <i className="fa-solid fa-money-bill-wave" style={{ color: paymentMethod === 'CASH' ? '#F97350' : '#999', fontSize: '20px' }}></i>
                                <div><div style={{ fontWeight: '600' }}>Tiền mặt</div><div style={{ fontSize: '12px', color: '#777' }}>Trả khi nhận hàng</div></div>
                            </div>
                            <div style={S.paymentBtn(paymentMethod === 'MOMO')} onClick={() => setPaymentMethod('MOMO')}>
                                <img src="https://avatars.githubusercontent.com/u/36770798?s=200&v=4" alt="Momo" style={{ width: '28px', borderRadius: '5px' }} />
                                <div><div style={{ fontWeight: '600' }}>Ví MoMo</div><div style={{ fontSize: '12px', color: '#777' }}>Cổng thanh toán MoMo</div></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
                <div style={S.card}>
                    <h3 style={S.h3}>Món đã chọn ({cartItems.length})</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px', scrollbarWidth: 'thin' }}>
                        {cartItems.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '15px', paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px dashed #eee' }}>
                                <img src={item.image || 'https://via.placeholder.com/80'} alt={item.name} style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '700', fontSize: '15px' }}>{item.quantity}x {item.name}</span>
                                        <span style={{ fontWeight: '600' }}>{toVND(item.finalPrice * item.quantity)}đ</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#777', marginTop: '5px' }}>
                                        {/* Sử dụng selectedSize và mapping toppings giống bên Cart.js */}
                                        <span style={{ marginRight: '5px', fontWeight: 'bold' }}>{item.selectedSize}</span>
                                        {item.selectedToppings?.length > 0 && (
                                            <span>+ {item.selectedToppings.map(t => t.name).join(', ')}</span>
                                        )}
                                        {item.note && <div style={{ fontStyle: 'italic' }}>📝 {item.note}</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ✅ GIAO DIỆN VOUCHER HÌNH CHIẾC VÉ CỦA MÁ */}
                    <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed #ddd' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F97350' }}>
                                <i className="fa-solid fa-ticket"></i> Mã khuyến mãi
                            </div>
                            {discountAmount > 0 && (
                                <span
                                    style={{ fontSize: '12px', color: '#F97350', cursor: 'pointer', fontWeight: 'bold' }}
                                    onClick={() => { setSelectedVoucher(null); setDiscountAmount(0) }}
                                >
                                    Gỡ bỏ
                                </span>
                            )}
                        </div>

                        {vouchers.length === 0 ? (
                            <div style={{ fontSize: '13px', color: '#999', fontStyle: 'italic', background: '#f9f9f9', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                                Không có mã giảm giá.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                                {vouchers.map(promo => (
                                    promo.isActive && (
                                        <div
                                            key={promo._id}
                                            onClick={() => handleSelectVoucher(promo)}
                                            style={{
                                                border: selectedVoucher?._id === promo._id ? '1px solid #F97350' : '1px dashed #F97350',
                                                background: selectedVoucher?._id === promo._id ? '#FFF1ED' : '#FFF5F2',
                                                padding: '8px 12px', borderRadius: '8px', minWidth: '140px',
                                                display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', position: 'relative'
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold', color: '#F97350', fontSize: '13px' }}>{promo.code}</div>
                                            <div style={{ fontSize: '11px', color: '#666' }}>
                                                Giảm {promo.type === 'amount' ? promo.value.toLocaleString() + 'đ' : promo.value + '%'}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#999' }}>Đơn tối thiểu {promo.minOrder.toLocaleString()}đ</div>

                                            {/* Vòng tròn trang trí giống vé */}
                                            <div style={{ position: 'absolute', left: -6, top: '50%', marginTop: -6, width: 12, height: 12, background: '#fff', borderRadius: '50%', borderRight: '1px solid #F97350' }}></div>
                                            <div style={{ position: 'absolute', right: -6, top: '50%', marginTop: -6, width: 12, height: 12, background: '#fff', borderRadius: '50%', borderLeft: '1px solid #F97350' }}></div>

                                            {/* Icon check khi được chọn */}
                                            {selectedVoucher?._id === promo._id && (
                                                <div style={{ position: 'absolute', top: -5, right: -5, background: '#F97350', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>✓</div>
                                            )}
                                        </div>
                                    )
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <div style={S.summaryRow}><span>Tạm tính</span> <span>{toVND(totalAmount)}đ</span></div>
                        <div style={S.summaryRow}><span>Phí vận chuyển</span> <span>{toVND(SHIP_FEE)}đ</span></div>
                        <div style={S.summaryRow}><span>Phí dịch vụ</span> <span>{toVND(APP_FEE)}đ</span></div>
                        {discountAmount > 0 && <div style={{ ...S.summaryRow, color: '#22C55E', fontWeight: 'bold' }}><span>Voucher giảm giá</span> <span>-{toVND(discountAmount)}đ</span></div>}
                        <div style={S.totalRow}><span>Tổng thanh toán</span> <span>{toVND(FINAL_TOTAL)}đ</span></div>
                        <button onClick={handleOrder} style={S.checkoutBtn}>ĐẶT HÀNG NGAY</button>
                    </div>
                </div>
            </div>

            {/* MODAL BẢN ĐỒ */}
            {showMapModal && (
                <div style={S.mapModalOverlay}>
                    <div style={S.mapModalContent}>
                        <button onClick={() => setShowMapModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: '#f5f5f5', width: '35px', height: '35px', borderRadius: '50%', cursor: 'pointer', zIndex: 10, fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        <h3 style={{ marginTop: 0, fontSize: '20px' }}>Ghim địa chỉ giao hàng</h3>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>Click vào vị trí nhà bạn trên bản đồ để shipper tìm đường dễ hơn.</p>
                        <div style={{ height: '400px', borderRadius: '16px', overflow: 'hidden', border: '1px solid #eee' }}>
                            <MapContainer center={[formData.lat || 10.762622, formData.lng || 106.660172]} zoom={15} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                <LocationMarker />
                            </MapContainer>
                        </div>
                        <button onClick={() => setShowMapModal(false)} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#F97350', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Xác nhận vị trí này</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Checkout;