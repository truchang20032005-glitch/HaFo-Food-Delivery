import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';

const toVND = (n) => n?.toLocaleString('vi-VN');

function Cart() {
    const { cartItems, updateQuantity, removeFromCart, totalAmount } = useCart();

    // Hàm xử lý ảnh (Fix lỗi không hiện ảnh)
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/100?text=Food';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
    };

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: 50 }}>
            <Navbar />

            {/* Header phụ */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e9e4d8', padding: '15px 0' }}>
                <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
                    <h2 style={{ margin: 0, fontSize: '22px', color: '#3A2E2E' }}>Giỏ hàng của bạn 🛒</h2>
                </div>
            </div>

            <main style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '25px', alignItems: 'start' }}>

                {/* --- CỘT TRÁI: DANH SÁCH MÓN --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {cartItems.length === 0 ? (
                        <div style={{ background: '#fff', padding: '50px 20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty" style={{ width: '120px', opacity: 0.5, marginBottom: '20px' }} />
                            <h3 style={{ color: '#555', margin: '0 0 10px' }}>Chưa có món nào!</h3>
                            <p style={{ color: '#888', marginBottom: '20px' }}>Bụng đói rồi, hãy chọn món ngon ngay thôi.</p>
                            <Link to="/home" style={{ display: 'inline-block', padding: '10px 25px', background: '#F97350', color: '#fff', textDecoration: 'none', borderRadius: '25px', fontWeight: 'bold' }}>
                                Đi chợ ngay
                            </Link>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.uniqueId} style={{ display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '16px', border: '1px solid #eee', alignItems: 'center' }}>
                                {/* Ảnh món */}
                                <img
                                    src={getImageUrl(item.image)}
                                    alt={item.name}
                                    style={{ width: '90px', height: '90px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #f0f0f0' }}
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/90'}
                                />

                                {/* Thông tin */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                                        <h4 style={{ margin: 0, fontSize: '16px', color: '#333' }}>{item.name}</h4>
                                        <button onClick={() => removeFromCart(item.uniqueId)} style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '16px', padding: 0 }}>
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>

                                    {/* Size & Topping */}
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                                        <span style={{ background: '#FFF5F2', color: '#F97350', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', marginRight: 5 }}>
                                            {item.selectedSize}
                                        </span>
                                        {item.selectedToppings?.map(t => t.name).join(', ')}
                                        {item.note && <div style={{ color: '#888', fontStyle: 'italic', marginTop: 2 }}>📝 "{item.note}"</div>}
                                    </div>

                                    {/* Giá & Số lượng */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                        <div style={{ fontWeight: 'bold', color: '#F97350', fontSize: '16px' }}>
                                            {toVND(item.finalPrice)}đ
                                        </div>

                                        {/* Bộ điều khiển số lượng */}
                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                                            <button onClick={() => updateQuantity(item.uniqueId, -1)} style={{ width: '30px', height: '30px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>−</button>
                                            <span style={{ width: '30px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.uniqueId, 1)} style={{ width: '30px', height: '30px', border: 'none', background: '#fff', cursor: 'pointer', fontWeight: 'bold', color: '#F97350' }}>+</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* --- CỘT PHẢI: THANH TOÁN --- */}
                <div style={{ position: 'sticky', top: '90px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #eadfcd', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <h4 style={{ margin: '0 0 15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Tóm tắt đơn hàng</h4>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#555' }}>
                            <span>Tổng số món</span>
                            <b>{cartItems.reduce((acc, item) => acc + item.quantity, 0)} món</b>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', color: '#555' }}>
                            <span>Phí giao hàng</span>
                            <span style={{ color: '#22C55E' }}>Miễn phí</span>
                        </div>

                        {/* Input Voucher (Giả lập) */}
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
                            <input placeholder="Nhập mã giảm giá" style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }} />
                            <button style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 12px', fontSize: '13px', cursor: 'pointer' }}>Áp dụng</button>
                        </div>

                        <div style={{ borderTop: '2px dashed #eee', margin: '15px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px' }}>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>Tổng cộng</span>
                            <span style={{ fontWeight: 'bold', color: '#F97350' }}>{toVND(totalAmount)}đ</span>
                        </div>

                        <Link to="/checkout" style={{ textDecoration: 'none' }}>
                            <button
                                disabled={cartItems.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: cartItems.length === 0 ? '#ddd' : '#F97350',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                                    boxShadow: cartItems.length === 0 ? 'none' : '0 4px 15px rgba(249, 115, 80, 0.4)',
                                    transition: '0.3s'
                                }}
                            >
                                Thanh toán ngay
                            </button>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Cart;