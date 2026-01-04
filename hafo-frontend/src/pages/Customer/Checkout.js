import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';
import { alertSuccess, alertError, alertWarning, alertInfo } from '../../utils/hafoAlert';

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

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 2; // Mặc định 2km nếu thiếu
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const calculateShippingFee = (dist) => {
    const BASE_FEE = 16000; // 2km đầu
    const PER_KM_FEE = 5000; // Mỗi km tiếp theo
    if (dist <= 2) return BASE_FEE;
    return BASE_FEE + Math.ceil(dist - 2) * PER_KM_FEE;
};

function Checkout() {
    const { cartItems, totalAmount, clearCart } = useCart();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ name: '', phone: '', address: '', note: '', lat: null, lng: null });
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [vouchers, setVouchers] = useState([]);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [showMapModal, setShowMapModal] = useState(false);

    const [tipAmount, setTipAmount] = useState(0);
    const [customTip, setCustomTip] = useState('');

    const formatTipInput = (val) => {
        const number = val.replace(/\D/g, ''); // Chỉ lấy số
        return number ? parseInt(number).toLocaleString('vi-VN') : '';
    };

    const APP_FEE = 2000;

    const groups = useMemo(() => {
        return cartItems.reduce((acc, item) => {
            const resId = item.restaurantId || item.restaurant;
            if (!acc[resId]) {
                acc[resId] = {
                    name: item.restaurantName,
                    items: [],
                    lat: item.resLat, // Lấy từ món ăn mình đã sửa ở bước 2
                    lng: item.resLng
                };
            }
            acc[resId].items.push(item);
            return acc;
        }, {});
    }, [cartItems]);

    const shippingInfo = useMemo(() => {
        const details = {};
        let total = 0;

        Object.keys(groups).forEach(resId => {
            const res = groups[resId];
            const dist = calculateDistance(res.lat, res.lng, formData.lat, formData.lng);
            const fee = calculateShippingFee(dist);
            details[resId] = fee;
            total += fee;
        });

        return { total, details };
    }, [groups, formData.lat, formData.lng]);

    const FINAL_TOTAL = Math.max(0, totalAmount + shippingInfo.total + APP_FEE - discountAmount + tipAmount);

    const handleSelectVoucher = (voucher) => {
        if (selectedVoucher?._id === voucher._id) {
            setSelectedVoucher(null); setDiscountAmount(0); return;
        }

        // Tìm tổng tiền của riêng quán có voucher này
        const resId = voucher.restaurantId || voucher.restaurant;
        const resSubtotal = groups[resId]?.items.reduce((sum, it) => sum + (it.finalPrice * it.quantity), 0) || 0;

        if (resSubtotal < voucher.minOrder) {
            return alertInfo(`Đơn hàng của quán "${groups[resId]?.name}" phải từ ${toVND(voucher.minOrder)}đ mới dùng được mã này!`);
        }

        setSelectedVoucher(voucher);
        setDiscountAmount(voucher.type === 'percent' ? (resSubtotal * voucher.value) / 100 : voucher.value);
    };

    function LocationMarker() {
        useMapEvents({
            async click(e) {
                const { lat, lng } = e.latlng;

                // 1. Hiện trạng thái đang xử lý
                setFormData(prev => ({ ...prev, lat, lng, address: '📍 Đang xác định địa chỉ...' }));

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi`
                    );
                    const data = await response.json();

                    if (data && data.display_name) {
                        const newAddress = data.display_name;

                        // 2. Cập nhật State
                        setFormData(prev => ({ ...prev, address: newAddress }));

                        // 3. LƯU VÀO LOCALSTORAGE để không bị mất khi reload
                        const tempLoc = { lat, lng, address: newAddress };
                        localStorage.setItem('temp_checkout_location', JSON.stringify(tempLoc));
                    }
                } catch (error) {
                    setFormData(prev => ({ ...prev, address: 'Không tìm thấy địa chỉ, vui lòng nhập tay.' }));
                }
            }
        });
        return (formData.lat && formData.lng) ? <Marker position={[formData.lat, formData.lng]} /> : null;
    }

    useEffect(() => {
        const fetchUserInfo = async () => {
            // Kiểm tra xem có địa chỉ vừa ghim trong máy không
            const savedLoc = localStorage.getItem('temp_checkout_location');
            const parsedLoc = savedLoc ? JSON.parse(savedLoc) : null;

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
                        // Ưu tiên lấy từ parsedLoc (vừa ghim), nếu không có mới lấy từ userData
                        address: parsedLoc?.address || userData.addresses?.[0]?.value || prev.address,
                        lat: parsedLoc?.lat || userData.addresses?.[0]?.lat || 10.762622,
                        lng: parsedLoc?.lng || userData.addresses?.[0]?.lng || 106.660172
                    }));
                } catch (err) { console.error("Lỗi user info:", err); }
            }
        };
        fetchUserInfo();
    }, []);

    useEffect(() => {
        if (cartItems.length > 0) {
            const fetchAllPromos = async () => {
                // Lấy danh sách ID nhà hàng duy nhất
                const uniqueResIds = [...new Set(cartItems.map(item => item.restaurantId || item.restaurant))];
                try {
                    // Gọi API lấy promo của tất cả các quán cùng lúc
                    const promises = uniqueResIds.map(id => api.get(`/promos/${id}`));
                    const results = await Promise.all(promises);

                    // Gộp tất cả promo vào 1 mảng duy nhất
                    const allPromos = results.flatMap(res => res.data).filter(v => v.isActive);
                    setVouchers(allPromos);
                } catch (err) {
                    console.error("Lỗi tải danh sách voucher:", err);
                }
            };
            fetchAllPromos();
        }
    }, [cartItems]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleOrder = async () => {
        if (!formData.name || !formData.phone || !formData.address) return alertWarning("Thiếu thông tin", "Vui lòng điền đủ thông tin giao hàng!");
        const user = JSON.parse(localStorage.getItem('user'));

        try {
            const orderIds = [];
            // ✅ BƯỚC 2: Duyệt qua từng nhóm để tạo đơn riêng biệt
            for (const resId in groups) {
                const resGroup = groups[resId];
                const subTotal = resGroup.items.reduce((sum, it) => sum + (it.finalPrice * it.quantity), 0);

                // Dùng phí ship đã tính ở trên
                const currentResShipping = shippingInfo.details[resId];

                // Voucher chỉ áp dụng cho đúng quán
                let currentDiscount = 0;
                if (selectedVoucher && (selectedVoucher.restaurantId === resId || selectedVoucher.restaurant === resId)) {
                    currentDiscount = discountAmount;
                }

                const groupFinalTotal = subTotal + currentResShipping + APP_FEE - currentDiscount;

                const orderData = {
                    userId: user.id,
                    restaurantId: resId,
                    customer: `${formData.name} | ${formData.phone} | ${formData.address} | ${paymentMethod}`,
                    items: resGroup.items.map(item => ({
                        foodId: item._id, name: item.name, price: item.finalPrice,
                        quantity: item.quantity, image: item.image,
                        options: `${item.selectedSize}${item.selectedToppings.length > 0 ? ', ' + item.selectedToppings.map(t => t.name).join('+') : ''}`
                    })),
                    total: groupFinalTotal + (tipAmount / Object.keys(groups).length), // Chia đều tip nếu đặt nhiều quán
                    tipAmount: tipAmount, // ✅ Gửi tiền tip thực tế
                    note: formData.note + (currentDiscount > 0 ? ` [Voucher: ${selectedVoucher.code}]` : ""),
                    lat: formData.lat, lng: formData.lng
                };

                const resOrder = await api.post('/orders', orderData);
                orderIds.push(resOrder.data._id);
            }

            // ✅ BƯỚC 3: Xử lý sau khi đặt hàng thành công
            if (paymentMethod === 'MOMO') {
                // Nếu có nhiều đơn, có thể cộng tổng tiền để thanh toán 1 lần hoặc thanh toán đơn đầu tiên
                // Ở đây tạm thời xử lý đơn đầu tiên để khớp logic cũ của bạn
                const resMomo = await api.post('/momo/payment', { amount: FINAL_TOTAL, orderId: orderIds[0] });
                if (resMomo.data.payUrl) window.location.href = resMomo.data.payUrl;
            } else {
                await alertSuccess(
                    "Đặt hàng thành công!",
                    `Hệ thống đã ghi nhận ${orderIds.length} đơn hàng của bạn.`
                );
                clearCart();
                // Điều hướng về lịch sử để xem tất cả các đơn
                navigate('/history');
            }
        } catch (error) {
            alertError("Lỗi đặt hàng", error.message);
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
            <style>{`
                .checkout-scroll-container::-webkit-scrollbar {
                    width: 6px;
                }
                .checkout-scroll-container::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .checkout-scroll-container::-webkit-scrollbar-thumb {
                    background: #F97350;
                    border-radius: 10px;
                }
                .checkout-scroll-container::-webkit-scrollbar-thumb:hover {
                    background: #e85d3a;
                }
            `}</style>
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
                    <h3 style={S.h3}>Chi tiết đơn hàng</h3>
                    <div
                        className="checkout-scroll-container"
                        style={{
                            maxHeight: '300px', // Giới hạn chiều cao
                            overflowY: 'auto',   // Hiện thanh cuộn khi vượt quá chiều cao
                            paddingRight: '10px',
                            marginBottom: '20px'
                        }}
                    >
                        {/* DUYỆT THEO NHÓM NHÀ HÀNG (groups) */}
                        {Object.entries(groups).map(([resId, group]) => (
                            <div key={resId} style={{ marginBottom: '25px', border: '1px solid #f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>

                                {/* Header quán và Phí ship của quán đó */}
                                <div style={{ background: '#F8FAFC', padding: '10px 15px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#333' }}>
                                        <i className="fa-solid fa-shop" style={{ color: '#F97350', marginRight: '5px' }}></i>
                                        {group.name}
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#F97350', fontWeight: 'bold' }}>
                                        Ship: {toVND(shippingInfo.details[resId])}đ
                                    </span>
                                </div>

                                {/* Danh sách món của quán này */}
                                <div style={{ padding: '15px' }}>
                                    {group.items.map((item, index) => (
                                        <div key={index} style={{ display: 'flex', gap: '12px', marginBottom: index === group.items.length - 1 ? 0 : '15px' }}>
                                            <img src={item.image || 'https://via.placeholder.com/60'} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                                    <span style={{ fontWeight: '600' }}>{item.quantity}x {item.name}</span>
                                                    <span>{toVND(item.finalPrice * item.quantity)}đ</span>
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#888' }}>{item.selectedSize} {item.selectedToppings?.length > 0 && `+ ${item.selectedToppings.map(t => t.name).join(', ')}`}</div>
                                            </div>
                                        </div>
                                    ))}
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

                    {/* Giao diện chọn Tips */}
                    <div style={{ ...S.card, marginTop: '20px', border: '1px solid #FFE0D1', background: 'linear-gradient(to bottom, #fff, #FFF9F6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h3 style={{ ...S.h3, margin: 0 }}>
                                <i className="fa-solid fa-heart" style={{ color: '#F97350', fontSize: '18px' }}></i> Tip cho Shipper
                            </h3>
                            {tipAmount > 0 && (
                                <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: 'bold', background: '#F0FDF4', padding: '4px 10px', borderRadius: '20px' }}>
                                    <i className="fa-solid fa-face-smile"></i> Cảm ơn bạn nhiều!
                                </span>
                            )}
                        </div>

                        <p style={{ fontSize: '13px', color: '#7a6f65', marginBottom: '18px', lineHeight: '1.4' }}>
                            Gửi một chút "lòng thành" để Shipper có thêm động lực giao hàng nhanh và an toàn nhé!
                        </p>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                            {[0, 5000, 10000, 20000].map(amt => {
                                const isSelected = tipAmount === amt && !customTip;
                                return (
                                    <button
                                        key={amt}
                                        onClick={() => { setTipAmount(amt); setCustomTip(''); }}
                                        style={{
                                            position: 'relative',
                                            minWidth: '100px',
                                            padding: '12px 15px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: '800',
                                            fontSize: '14px',
                                            transition: '0.3s',
                                            // ✅ STYLE HÌNH CHIẾC VÉ
                                            border: isSelected ? '1px solid #F97350' : '1px dashed #F97350',
                                            background: isSelected ? '#F97350' : '#FFF5F2',
                                            color: isSelected ? '#fff' : '#F97350',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        {/* Vòng tròn đục lỗ giả lập vé */}
                                        <div style={{ position: 'absolute', left: -6, top: '50%', marginTop: -5, width: 10, height: 10, background: '#fff', borderRadius: '50%', borderRight: isSelected ? 'none' : '1px solid #F97350' }}></div>
                                        <div style={{ position: 'absolute', right: -6, top: '50%', marginTop: -5, width: 10, height: 10, background: '#fff', borderRadius: '50%', borderLeft: isSelected ? 'none' : '1px solid #F97350' }}></div>

                                        <span>{amt === 0 ? 'Không tip' : `+${toVND(amt)}đ`}</span>
                                        {isSelected && <i className="fa-solid fa-check-circle" style={{ fontSize: '10px' }}></i>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Ô nhập tiền tùy chỉnh tinh tế hơn */}
                        <div style={{ marginTop: '5px', position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: customTip ? '#F97350' : '#999' }}>
                                <i className="fa-solid fa-pen-nib"></i>
                            </div>
                            <input
                                type="text"
                                placeholder="Hoặc nhập số tiền khác..."
                                value={customTip}
                                onChange={(e) => {
                                    const formatted = formatTipInput(e.target.value);
                                    setCustomTip(formatted);
                                    setTipAmount(parseInt(e.target.value.replace(/\D/g, '')) || 0);
                                }}
                                style={{
                                    ...S.input,
                                    paddingLeft: '40px',
                                    paddingRight: '40px',
                                    borderColor: customTip ? '#F97350' : '#ddd',
                                    background: customTip ? '#FFF9F6' : '#fff',
                                    fontSize: '14px',
                                    fontWeight: customTip ? '700' : 'normal'
                                }}
                            />
                            {customTip && (
                                <span style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: '#F97350', fontWeight: 'bold' }}>đ</span>
                            )}
                        </div>
                    </div>

                    <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '2px dashed #eee' }}>
                        <div style={S.summaryRow}>
                            <span>Tạm tính</span>
                            <span>{toVND(totalAmount)}đ</span>
                        </div>

                        <div style={S.summaryRow}>
                            <span>Phí vận chuyển ({Object.keys(groups).length} quán)</span>
                            <span>{toVND(shippingInfo.total)}đ</span>
                        </div>

                        {/* Hiển thị dòng Tip nếu có chọn Tip */}
                        {tipAmount > 0 && (
                            <div style={{ ...S.summaryRow, color: '#F97350', fontWeight: '600' }}>
                                <span>Tiền Tip cho Shipper</span>
                                <span>+{toVND(tipAmount)}đ</span>
                            </div>
                        )}

                        {discountAmount > 0 && (
                            <div style={{ ...S.summaryRow, color: '#22C55E', fontWeight: 'bold' }}>
                                <span>Voucher giảm giá</span>
                                <span>-{toVND(discountAmount)}đ</span>
                            </div>
                        )}

                        <div style={S.totalRow}>
                            <span>Tổng thanh toán</span>
                            <span>{toVND(FINAL_TOTAL)}đ</span>
                        </div>

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