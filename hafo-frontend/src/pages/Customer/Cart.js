import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';

const toVND = (n) => n?.toLocaleString('vi-VN');

function Cart() {
    const { cartItems, updateQuantity, removeFromCart, totalAmount } = useCart();

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar />

            {/* Header phụ */}
            <header className="header" style={{ background: '#fff', borderBottom: '1px solid #e9e4d8', padding: '10px 0' }}>
                <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
                    <Link to="/home" className="btn-link" style={{ border: 0, background: 'transparent', color: '#6b625d', cursor: 'pointer', textDecoration: 'none', fontWeight: 'bold' }}>
                        ← Tiếp tục mua sắm
                    </Link>
                    <div style={{ marginLeft: 'auto', fontSize: '14px', color: '#7a716a' }}>
                        <i className="fa-regular fa-clock"></i> Thời gian giao: <b>20 phút</b> (Cách bạn 1,2 km)
                    </div>
                </div>
            </header>

            <main className="cart" style={{ maxWidth: '1000px', margin: '18px auto 28px', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '18px' }}>

                {/* CỘT TRÁI: DANH SÁCH MÓN */}
                <section className="panel" style={{ background: '#fff', border: '1px solid #eadfcd', borderRadius: '14px', overflow: 'hidden' }}>
                    <div className="panel__head" style={{ padding: '14px 16px', borderBottom: '1px solid #f0e8d9', background: '#FFFCF5', fontWeight: '800' }}>
                        Giỏ hàng của bạn
                    </div>

                    <div className="items">
                        {cartItems.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                                <p>Giỏ hàng đang trống trơn 😢</p>
                                <Link to="/home" style={{ color: '#F97350', fontWeight: 'bold' }}>Đi chọn món ngay</Link>
                            </div>
                        ) : (
                            cartItems.map((item) => (
                                <div key={item.uniqueId} className="item" style={{ display: 'grid', gridTemplateColumns: 'auto 64px 1fr auto', gap: '12px', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #f6efe1' }}>
                                    {/* Checkbox (Demo) */}
                                    <label className="i-check"><input type="checkbox" defaultChecked style={{ accentColor: '#F97350' }} /></label>

                                    <img
                                        src={item.image || '/images/default-food.jpg'}
                                        alt={item.name}
                                        style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #eee3d6' }}
                                    />

                                    <div>
                                        <div className="i-title" style={{ fontWeight: '800' }}>
                                            {item.name}
                                            {/* Badge Size */}
                                            {item.selectedSize !== 'Vừa' && (
                                                <span className="badge" style={{ background: '#FAD06C', border: '1px solid #eadfcd', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', marginLeft: '6px' }}>
                                                    Size {item.selectedSize}
                                                </span>
                                            )}
                                        </div>

                                        {/* Topping & Note */}
                                        <div className="i-opts" style={{ fontSize: '12px', color: '#6e655d' }}>
                                            {item.selectedToppings && item.selectedToppings.length > 0 && (
                                                <div>+ {item.selectedToppings.map(t => t.name).join(', ')}</div>
                                            )}
                                            {item.note && <div style={{ fontStyle: 'italic', marginTop: '2px' }}>"{item.note}"</div>}
                                        </div>

                                        {/* Nút Tăng/Giảm */}
                                        <div className="qty" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                                            <button onClick={() => updateQuantity(item.uniqueId, -1)} style={{ width: '28px', height: '28px', border: '1px solid #e3dac8', background: '#fff', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>−</button>
                                            <strong className="q" style={{ minWidth: '18px', textAlign: 'center' }}>{item.quantity}</strong>
                                            <button onClick={() => updateQuantity(item.uniqueId, 1)} style={{ width: '28px', height: '28px', border: '1px solid #e3dac8', background: '#fff', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>+</button>

                                            <button onClick={() => removeFromCart(item.uniqueId)} style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px', marginLeft: '10px' }}>
                                                <i className="fa-solid fa-trash"></i> Xóa
                                            </button>
                                        </div>
                                    </div>

                                    {/* Giá Tổng Món */}
                                    <div className="i-price" style={{ fontWeight: '800', minWidth: '84px', textAlign: 'right' }}>
                                        <span className="p">{toVND(item.finalPrice * item.quantity)}đ</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* CỘT PHẢI: TỔNG KẾT */}
                <aside className="summary" style={{ background: '#fff', border: '1px solid #eadfcd', borderRadius: '14px', padding: '14px', height: 'fit-content' }}>
                    <div className="sum-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                        <div className="muted" style={{ color: '#6e655d', fontSize: '14px' }}>Số món đã chọn</div>
                        <div>{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</div>
                    </div>
                    <div className="sum-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                        <div className="muted" style={{ color: '#6e655d', fontSize: '14px' }}>Tạm tính</div>
                        <div className="big" style={{ fontWeight: '900', fontSize: '18px' }}>{toVND(totalAmount)}đ</div>
                    </div>
                    <div className="divider" style={{ height: '1px', background: '#f0e8d9', margin: '10px 0' }}></div>

                    <Link to="/checkout" style={{ textDecoration: 'none' }}>
                        <button className="btn-primary" disabled={cartItems.length === 0} style={{ width: '100%', marginTop: '10px', background: cartItems.length === 0 ? '#ccc' : '#F97350', border: 'none', color: '#fff', padding: '12px 14px', borderRadius: '12px', fontWeight: '800', cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer', boxShadow: '0 2px 0 rgba(0,0,0,0.05)' }}>
                            Thanh toán ngay
                        </button>
                    </Link>
                </aside>
            </main>
        </div>
    );
}

export default Cart;