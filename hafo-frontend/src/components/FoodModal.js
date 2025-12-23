import React, { useState, useEffect } from 'react';

// Helper format tiền
const toVND = (n) => n?.toLocaleString('vi-VN');

function FoodModal({ isOpen, onClose, food, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);
    const [size, setSize] = useState('Vừa');
    const [sizePrice, setSizePrice] = useState(0);
    const [toppings, setToppings] = useState([]);
    const [note, setNote] = useState('');

    // Reset khi mở món mới
    useEffect(() => {
        if (isOpen && food) {
            setQuantity(1);
            setSize('Vừa');
            setSizePrice(0);
            setToppings([]);
            setNote('');
            // Logic mặc định chọn size đầu tiên nếu có
            if (food.options && food.options.length > 0) {
                setSize(food.options[0].name);
                setSizePrice(food.options[0].price);
            }
        }
    }, [isOpen, food]);

    // Tính toán giá
    const basePrice = food?.price || 0;
    const toppingsTotal = toppings.reduce((sum, t) => sum + t.price, 0);
    const unitPrice = basePrice + sizePrice + toppingsTotal;
    const totalPrice = unitPrice * quantity;

    const handleSizeChange = (e) => {
        const price = parseInt(e.target.dataset.price);
        setSize(e.target.value);
        setSizePrice(price);
    };

    const handleToppingChange = (e) => {
        const name = e.target.value;
        const price = parseInt(e.target.dataset.price);
        if (e.target.checked) {
            setToppings([...toppings, { name, price }]);
        } else {
            setToppings(toppings.filter(t => t.name !== name));
        }
    };

    const handleConfirm = () => {
        const cartItem = {
            ...food,
            uniqueId: Date.now(),
            selectedSize: size,
            sizePrice: sizePrice,
            selectedToppings: toppings,
            note: note,
            quantity: quantity,
            finalPrice: unitPrice
        };
        onAddToCart(cartItem);
        onClose();
    };

    if (!isOpen || !food) return null;

    return (
        // LỚP PHỦ MỜ (OVERLAY) - Style cứng để chắc chắn hiện
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', // Màu đen mờ
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999, // Cao nhất để đè lên mọi thứ
            opacity: 1,
            visibility: 'visible'
        }} onClick={onClose}>

            {/* HỘP MODAL */}
            <div style={{
                background: '#fff',
                width: '90%',
                maxWidth: '500px',
                borderRadius: '16px',
                overflow: 'hidden',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }} onClick={(e) => e.stopPropagation()}>

                {/* HEAD */}
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#FFFCF5'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>{food.name}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: '#666' }}>×</button>
                </div>

                {/* BODY (Có cuộn) */}
                <div style={{ padding: '20px', overflowY: 'auto' }}>

                    {/* Size */}
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Kích cỡ</h4>

                        {/* Nếu món có options từ DB */}
                        {food.options && food.options.length > 0 ? (
                            food.options.map((opt, idx) => (
                                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="size"
                                        value={opt.name}
                                        data-price={opt.price}
                                        checked={size === opt.name}
                                        onChange={handleSizeChange}
                                    />
                                    {opt.name} (+{toVND(opt.price)})
                                </label>
                            ))
                        ) : (
                            // Fallback nếu không có options
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <input type="radio" name="size" value="Tiêu chuẩn" data-price="0" checked={true} readOnly />
                                Tiêu chuẩn (+0đ)
                            </label>
                        )}
                    </div>

                    {/* Topping */}
                    {food.toppings && food.toppings.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Topping</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {food.toppings.map((top, idx) => (
                                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            value={top.name}
                                            data-price={top.price}
                                            onChange={handleToppingChange}
                                        />
                                        {top.name} (+{toVND(top.price)})
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    <div style={{ marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Ghi chú</h4>
                        <textarea
                            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
                            placeholder="Ít cay, không hành..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        ></textarea>
                    </div>

                    {/* Số lượng */}
                    <div>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', textTransform: 'uppercase' }}>Số lượng</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 30, height: 30, borderRadius: 5, border: '1px solid #ddd', background: '#fff', fontWeight: 'bold' }}>-</button>
                            <span style={{ fontWeight: 'bold', fontSize: 16 }}>{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)} style={{ width: 30, height: 30, borderRadius: 5, border: '1px solid #ddd', background: '#fff', fontWeight: 'bold' }}>+</button>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div style={{ padding: '15px 20px', borderTop: '1px solid #eee', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#F97350' }}>{toVND(totalPrice)}đ</div>
                    <button
                        onClick={handleConfirm}
                        style={{
                            background: '#F97350', color: 'white', border: 'none',
                            padding: '12px 24px', borderRadius: '20px',
                            fontWeight: 'bold', cursor: 'pointer', fontSize: '15px'
                        }}
                    >
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FoodModal;