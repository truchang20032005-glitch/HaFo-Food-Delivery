import React, { useState, useEffect } from 'react';

// Helper format tiền
const toVND = (n) => Number(n || 0).toLocaleString('vi-VN');

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
                setSizePrice(Number(food.options[0].price || 0));
            }
        }
    }, [isOpen, food]);

    // Tính toán giá
    const basePrice = food?.price || 0;
    const toppingsTotal = toppings.reduce((sum, t) => sum + Number(t.price || 0), 0);
    const unitPrice = Number(basePrice) + Number(sizePrice) + Number(toppingsTotal);
    const totalPrice = unitPrice * quantity;

    const handleSizeChange = (e) => {
        const price = Number(e.target.dataset.price || 0);
        setSize(e.target.value);
        setSizePrice(price);
    };

    const handleToppingChange = (e) => {
        const name = e.target.value;
        const price = Number(e.target.dataset.price || 0);
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

    // ====== Styles (chỉ UI, không đụng logic) ======
    const S = {
        overlay: {
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999
        },
        modal: {
            background: '#fff',
            width: '92%',
            maxWidth: '520px',
            borderRadius: '18px',
            overflow: 'hidden',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 18px 60px rgba(0,0,0,0.35)'
        },
        head: {
            padding: '16px 18px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#FFFCF5'
        },
        title: { margin: 0, fontSize: 18, color: '#222', fontWeight: 800 },
        close: { border: 'none', background: 'transparent', fontSize: 26, cursor: 'pointer', color: '#666', lineHeight: 1 },
        body: { padding: 18, overflowY: 'auto' },

        section: { marginBottom: 18 },
        sectionTitle: {
            margin: '0 0 10px 0',
            fontSize: 13,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: 0.4,
            fontWeight: 800
        },

        // card list (size/topping)
        cardGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr', // 1 cột cho chắc đẹp, dễ nhìn
            gap: 10
        },
        card: {
            display: 'grid',
            gridTemplateColumns: '22px 1fr auto',
            alignItems: 'center',
            columnGap: 12,
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid #eee',
            background: '#fff',
            cursor: 'pointer',
            userSelect: 'none',
            minWidth: 0
        },
        cardSelected: {
            border: '1px solid #F97350',
            background: '#FFF3EE',
            boxShadow: '0 0 0 3px rgba(249,115,80,0.12)'
        },
        leftWrap: { display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 },
        inputCol: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        nameText: {
            fontWeight: 800,
            color: '#222',
            whiteSpace: 'normal',
            wordBreak: 'normal',
            overflowWrap: 'anywhere',
            lineHeight: 1.2
        },
        priceText: {
            fontWeight: 900,
            color: '#444',
            whiteSpace: 'nowrap',
            textAlign: 'right'
        },

        // input note
        textarea: {
            width: '100%',
            padding: 12,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            outline: 'none',
            minHeight: 84,
            resize: 'vertical'
        },

        // quantity
        qtyRow: { display: 'flex', alignItems: 'center', gap: 12 },
        qtyBtn: {
            width: 38, height: 38,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#fff',
            fontWeight: 900,
            cursor: 'pointer',
            fontSize: 18,
            lineHeight: 1
        },
        qtyNum: { fontWeight: 900, fontSize: 16, minWidth: 22, textAlign: 'center' },

        // footer
        footer: {
            padding: '14px 18px',
            borderTop: '1px solid #eee',
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12
        },
        total: { fontSize: 20, fontWeight: 900, color: '#F97350' },
        cta: {
            background: '#F97350',
            color: 'white',
            border: 'none',
            padding: '12px 18px',
            borderRadius: 18,
            fontWeight: 900,
            cursor: 'pointer',
            fontSize: 15,
            whiteSpace: 'nowrap'
        }
    };

    const isToppingChecked = (name) => toppings.some((t) => t.name === name);

    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={S.modal} onClick={(e) => e.stopPropagation()}>
                {/* HEAD */}
                <div style={S.head}>
                    <h3 style={S.title}>{food.name}</h3>
                    <button onClick={onClose} style={S.close}>×</button>
                </div>

                {/* BODY */}
                <div style={S.body}>
                    {/* Size */}
                    <div style={S.section}>
                        <h4 style={S.sectionTitle}>Kích cỡ</h4>

                        <div style={S.cardGrid}>
                            {food.options && food.options.length > 0 ? (
                                food.options.map((opt, idx) => {
                                    const selected = size === opt.name;
                                    return (
                                        <label
                                            key={idx}
                                            style={{ ...S.card, ...(selected ? S.cardSelected : {}) }}
                                        >
                                            <span style={S.inputCol}>
                                                <input
                                                    type="radio"
                                                    name="size"
                                                    value={opt.name}
                                                    data-price={opt.price}
                                                    checked={selected}
                                                    onChange={handleSizeChange}
                                                />
                                            </span>

                                            <span style={S.nameText}>{opt.name}</span>

                                            <span style={S.priceText}>+{toVND(opt.price)}đ</span>
                                        </label>
                                    );
                                })
                            ) : (
                                <label style={{ ...S.card, ...S.cardSelected }}>
                                    {/* Cột 1: Input (22px) */}
                                    <span style={S.inputCol}>
                                        <input
                                            type="radio"
                                            name="size"
                                            value="Tiêu chuẩn"
                                            data-price="0"
                                            checked
                                            readOnly
                                        />
                                    </span>

                                    {/* Cột 2: Tên (1fr - tự giãn) */}
                                    <span style={S.nameText}>Tiêu chuẩn</span>

                                    {/* Cột 3: Giá (auto) */}
                                    <span style={S.priceText}>+0đ</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Topping */}
                    {food.toppings && food.toppings.length > 0 && (
                        <div style={S.section}>
                            <h4 style={S.sectionTitle}>Topping</h4>

                            <div style={S.cardGrid}>
                                {food.toppings.map((top, idx) => {
                                    const checked = isToppingChecked(top.name);
                                    return (
                                        <label
                                            key={idx}
                                            style={{ ...S.card, ...(checked ? S.cardSelected : {}) }}
                                        >
                                            <span style={S.inputCol}>
                                                <input
                                                    type="checkbox"
                                                    value={top.name}
                                                    data-price={top.price}
                                                    checked={checked}
                                                    onChange={handleToppingChange}
                                                />
                                            </span>

                                            <span style={S.nameText}>{top.name}</span>

                                            <span style={S.priceText}>+{toVND(top.price)}đ</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    <div style={S.section}>
                        <h4 style={S.sectionTitle}>Ghi chú</h4>
                        <textarea
                            style={S.textarea}
                            placeholder="Ít cay, không hành..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    {/* Quantity */}
                    <div style={{ ...S.section, marginBottom: 6 }}>
                        <h4 style={S.sectionTitle}>Số lượng</h4>
                        <div style={S.qtyRow}>
                            <button
                                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                style={S.qtyBtn}
                            >
                                −
                            </button>
                            <span style={S.qtyNum}>{quantity}</span>
                            <button
                                onClick={() => setQuantity(q => q + 1)}
                                style={S.qtyBtn}
                            >
                                +
                            </button>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div style={S.footer}>
                    <div style={S.total}>{toVND(totalPrice)}đ</div>
                    <button onClick={handleConfirm} style={S.cta}>
                        Thêm vào giỏ
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FoodModal;
