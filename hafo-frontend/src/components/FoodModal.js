import React, { useState, useEffect } from 'react';

// Helper format tiền
const toVND = (n) => n?.toLocaleString('vi-VN');

function FoodModal({ isOpen, onClose, food, onAddToCart }) {
    // State lưu các lựa chọn của khách
    const [quantity, setQuantity] = useState(1);
    const [size, setSize] = useState('Vừa'); // Mặc định size Vừa
    const [sizePrice, setSizePrice] = useState(0);
    const [toppings, setToppings] = useState([]); // Danh sách topping đã chọn
    const [note, setNote] = useState('');
    const [includeUtensils, setIncludeUtensils] = useState(false); // kèm muỗng/đũa

    // Reset lại form mỗi khi mở món mới
    useEffect(() => {
        if (isOpen && food) {
            setQuantity(1);
            setSize('Vừa');
            setSizePrice(0);
            setToppings([]);
            setNote('');
            setIncludeUtensils(false);
        }
    }, [isOpen, food]);

    if (!isOpen || !food) return null;

    // Tính tổng tiền: (Giá gốc + Giá size + Giá topping) * Số lượng
    const toppingPrice = toppings.reduce((total, item) => total + item.price, 0);
    const unitPrice = (food?.price || 0) + sizePrice + toppingPrice;
    const totalPrice = unitPrice * quantity;

    // Xử lý chọn Size
    const handleSizeChange = (e) => {
        const price = parseInt(e.target.dataset.price, 10) || 0;
        setSize(e.target.value);
        setSizePrice(price);
    };

    // Xử lý chọn Topping
    const handleToppingChange = (e) => {
        const name = e.target.value;
        const price = parseInt(e.target.dataset.price, 10) || 0;

        if (e.target.checked) {
            setToppings((prev) => [...prev, { name, price }]);
        } else {
            setToppings((prev) => prev.filter((t) => t.name !== name));
        }
    };

    // Xử lý Thêm vào giỏ
    const handleConfirm = () => {
        const cartItem = {
            ...food, // Lấy thông tin gốc (tên, ảnh...)
            uniqueId: Date.now(), // Tạo ID riêng để không bị trùng nếu đặt nhiều lần
            selectedSize: size,
            sizePrice,
            selectedToppings: toppings,
            note,
            includeUtensils,
            quantity,
            finalPrice: unitPrice, // Giá của 1 phần (đã cộng topping)
        };
        onAddToCart(cartItem);
        onClose();
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
            }}
        >
            {/* Hộp modal chính */}
            <div
                style={{
                    backgroundColor: '#fff',
                    borderRadius: 16,
                    width: 'min(680px, 92vw)',
                    maxWidth: 680,
                    maxHeight: '80vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 20px 80px rgba(0,0,0,0.25)',
                    border: '1px solid #f0e8d9',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderBottom: '1px solid #f0e8d9',
                        background: '#FFFCF5',
                    }}
                >
                    <div
                        style={{ fontWeight: 800, fontSize: 20 }}
                    >
                        {food.name}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            marginLeft: 'auto',
                            border: 'none',
                            background: 'transparent',
                            fontSize: 22,
                            cursor: 'pointer',
                            color: '#6f665d',
                        }}
                        aria-label="Đóng"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div
                    style={{
                        padding: '16px 20px',
                        overflowY: 'auto',
                        flex: 1,
                    }}
                >
                    {/* 1. Chọn Size */}
                    <div style={{ marginBottom: 18 }}>
                        <h4
                            style={{
                                margin: '0 0 10px',
                                fontSize: 14,
                                letterSpacing: 0.2,
                                color: '#6f665d',
                            }}
                        >
                            Kích cỡ
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 14,
                                }}
                            >
                                <input
                                    type="radio"
                                    name="size"
                                    value="Vừa"
                                    data-price="0"
                                    checked={size === 'Vừa'}
                                    onChange={handleSizeChange}
                                />
                                <span>
                                    Vừa{' '}
                                    <span style={{ color: '#8a7f76', fontWeight: 700 }}>
                                        (+0đ)
                                    </span>
                                </span>
                            </label>
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: 14,
                                }}
                            >
                                <input
                                    type="radio"
                                    name="size"
                                    value="Lớn"
                                    data-price="6000"
                                    checked={size === 'Lớn'}
                                    onChange={handleSizeChange}
                                />
                                <span>
                                    Lớn{' '}
                                    <span style={{ color: '#8a7f76', fontWeight: 700 }}>
                                        (+6.000đ)
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* 2. Chọn Topping */}
                    <div style={{ marginBottom: 18 }}>
                        <h4
                            style={{
                                margin: '0 0 10px',
                                fontSize: 14,
                                letterSpacing: 0.2,
                                color: '#6f665d',
                            }}
                        >
                            Thêm topping
                        </h4>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                                columnGap: 24,
                                rowGap: 6,
                            }}
                        >
                            {[
                                { label: 'Chả bò', price: 5000 },
                                { label: 'Gân', price: 6000 },
                                { label: 'Nạm', price: 6000 },
                                { label: 'Huyết', price: 3000 },
                            ].map((t) => (
                                <label
                                    key={t.label}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: 14,
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        value={t.label}
                                        data-price={t.price}
                                        onChange={handleToppingChange}
                                    />
                                    <span>
                                        {t.label}{' '}
                                        <span
                                            style={{
                                                color: '#8a7f76',
                                                fontWeight: 700,
                                            }}
                                        >
                                            (+{toVND(t.price)}đ)
                                        </span>
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 3. Dụng cụ ăn kèm */}
                    <div style={{ marginBottom: 18 }}>
                        <h4
                            style={{
                                margin: '0 0 10px',
                                fontSize: 14,
                                letterSpacing: 0.2,
                                color: '#6f665d',
                            }}
                        >
                            Dụng cụ ăn kèm
                        </h4>
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 14,
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={includeUtensils}
                                onChange={(e) => setIncludeUtensils(e.target.checked)}
                            />
                            <span>Kèm muỗng/đũa (miễn phí)</span>
                        </label>
                    </div>

                    {/* 4. Ghi chú */}
                    <div style={{ marginBottom: 18 }}>
                        <h4
                            style={{
                                margin: '0 0 10px',
                                fontSize: 14,
                                letterSpacing: 0.2,
                                color: '#6f665d',
                            }}
                        >
                            Ghi chú cho quán
                        </h4>
                        <textarea
                            placeholder="Ví dụ: Ít bún, không hành, nước dùng đậm hơn..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: 90,
                                border: '1px solid #e3dac8',
                                background: '#FFFEFB',
                                borderRadius: 12,
                                padding: '10px 12px',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                fontSize: 14,
                            }}
                        ></textarea>
                    </div>

                    {/* 5. Số lượng */}
                    <div style={{ marginBottom: 4 }}>
                        <h4
                            style={{
                                margin: '0 0 10px',
                                fontSize: 14,
                                letterSpacing: 0.2,
                                color: '#6f665d',
                            }}
                        >
                            Số lượng
                        </h4>
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setQuantity((q) => Math.max(1, q - 1))
                                }
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: '1px solid #e3dac8',
                                    background: '#fff',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                }}
                            >
                                −
                            </button>
                            <strong>{quantity}</strong>
                            <button
                                type="button"
                                onClick={() => setQuantity((q) => q + 1)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: '1px solid #e3dac8',
                                    background: '#fff',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                }}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer: Tổng tiền & Nút thêm */}
                <div
                    style={{
                        padding: '12px 20px',
                        borderTop: '1px solid #f0e8d9',
                        background: '#FFFCF5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                    }}
                >
                    <div
                        style={{ fontWeight: 900, fontSize: 18, marginRight: 'auto' }}
                    >
                        {toVND(totalPrice)}đ
                    </div>
                    <button
                        onClick={handleConfirm}
                        style={{
                            border: '1px solid #F97350',
                            backgroundColor: '#F97350',
                            color: '#fff',
                            padding: '10px 16px',
                            borderRadius: 12,
                            cursor: 'pointer',
                            fontWeight: 800,
                            fontSize: 14,
                            boxShadow: '0 2px 0 rgba(0,0,0,0.06)',
                        }}
                    >
                        Thêm vào giỏ - {toVND(totalPrice)}đ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FoodModal;
