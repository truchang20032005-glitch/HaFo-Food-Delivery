import { useState, useEffect } from 'react';

// Helper format tiền
const toVND = (n) => Number(n || 0).toLocaleString('vi-VN');

function FoodModal({ isOpen, onClose, food, onAddToCart }) {
    const [quantity, setQuantity] = useState(1);
    const [size, setSize] = useState('Vừa');
    const [sizePrice, setSizePrice] = useState(0);
    const [toppings, setToppings] = useState([]);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (isOpen && food) {
            setQuantity(1);
            setSize('Vừa');
            setSizePrice(0);
            setToppings([]);
            setNote('');
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

    // Xử lý chọn size (Click vào div)
    const handleSelectSize = (opt) => {
        setSize(opt.name);
        setSizePrice(Number(opt.price));
    };

    // Xử lý chọn topping (Click vào div)
    const handleToggleTopping = (top) => {
        const exists = toppings.find(t => t.name === top.name);
        if (exists) {
            setToppings(toppings.filter(t => t.name !== top.name));
        } else {
            setToppings([...toppings, { name: top.name, price: Number(top.price) }]);
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

    // Styles
    const S = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(4px)'
        },
        modal: {
            background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '20px',
            overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', maxHeight: '90vh'
        },
        body: { padding: '20px', overflowY: 'auto' },
        sectionTitle: { fontSize: '16px', fontWeight: '700', marginBottom: '10px', color: '#333' },

        // CHIP STYLE (Thẻ chọn)
        chipGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
        chip: {
            padding: '8px 16px', borderRadius: '20px', border: '1px solid #eee',
            background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#555',
            transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px'
        },
        chipSelected: {
            background: '#FFF5F2', borderColor: '#F97350', color: '#F97350', fontWeight: '700'
        },

        qtyBtn: { width: 32, height: 32, borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    };

    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={S.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFCF5' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#F97350' }}>{food.name}</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}>&times;</button>
                </div>

                <div style={S.body}>
                    {/* Size Selection */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={S.sectionTitle}>Chọn kích cỡ</div>
                        <div style={S.chipGrid}>
                            {food.options?.length > 0 ? food.options.map((opt, idx) => (
                                <div
                                    key={idx}
                                    style={{ ...S.chip, ...(size === opt.name ? S.chipSelected : {}) }}
                                    onClick={() => handleSelectSize(opt)}
                                >
                                    <span>{opt.name}</span>
                                    <span style={{ fontSize: '12px' }}>+{toVND(opt.price)}đ</span>
                                </div>
                            )) : (
                                <div style={{ ...S.chip, ...S.chipSelected }}>Tiêu chuẩn</div>
                            )}
                        </div>
                    </div>

                    {/* Topping Selection */}
                    {food.toppings?.length > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={S.sectionTitle}>Thêm topping</div>
                            <div style={S.chipGrid}>
                                {food.toppings.map((top, idx) => {
                                    const isSelected = toppings.some(t => t.name === top.name);
                                    return (
                                        <div
                                            key={idx}
                                            style={{ ...S.chip, ...(isSelected ? S.chipSelected : {}) }}
                                            onClick={() => handleToggleTopping(top)}
                                        >
                                            <span>{top.name}</span>
                                            <span style={{ fontSize: '12px' }}>+{toVND(top.price)}đ</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={S.sectionTitle}>Ghi chú cho quán</div>
                        <textarea
                            placeholder="Ví dụ: Không hành, ít đá..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '14px', outline: 'none', height: '60px' }}
                        />
                    </div>

                    {/* Quantity */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={S.sectionTitle}><span style={{ margin: 0 }}>Số lượng</span></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={S.qtyBtn}>-</button>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{quantity}</span>
                            <button onClick={() => setQuantity(q => q + 1)} style={S.qtyBtn}>+</button>
                        </div>
                    </div>
                </div>

                {/* Footer Button */}
                <div style={{ padding: '15px 20px', borderTop: '1px solid #eee' }}>
                    <button
                        onClick={handleConfirm}
                        style={{ width: '100%', padding: '14px', background: '#F97350', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    >
                        <span>Thêm vào giỏ</span>
                        <span>{toVND(totalPrice)}đ</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FoodModal;