// CartContext.js

import { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem('hafo_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            return [];
        }
    });

    // State cho Voucher
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherError, setVoucherError] = useState('');

    const [toast, setToast] = useState({ show: false, text: '' });
    const toastTimerRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('hafo_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // --- LOGIC TÍNH TOÁN (Dùng useMemo để tối ưu) ---

    const calculateRealShipping = (distance = 3) => {
        const BASE_FEE = 16000; // 2km đầu tiên
        const PER_KM_FEE = 5000; // Mỗi km tiếp theo
        if (distance <= 2) return BASE_FEE;
        return BASE_FEE + Math.ceil(distance - 2) * PER_KM_FEE;
    };

    // 2. Nhóm món ăn theo nhà hàng và tính phí ship
    const shippingDetails = useMemo(() => {
        const groups = cartItems.reduce((acc, item) => {
            const rId = item.restaurantId || 'unknown';
            if (!acc[rId]) {
                // Giả định khoảng cách là 3km nếu không có dữ liệu thực tế từ quán
                const dist = item.distance || 3;
                acc[rId] = calculateRealShipping(dist);
            }
            return acc;
        }, {});

        const totalFee = Object.values(groups).reduce((sum, fee) => sum + fee, 0);
        return {
            restaurantCount: Object.keys(groups).length,
            totalShippingFee: totalFee,
            feesPerRestaurant: groups // Lưu lại để Cart.js lấy ra hiển thị
        };
    }, [cartItems]);

    // 3. Tổng tiền hàng (chưa ship, chưa giảm)
    const subtotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    }, [cartItems]);

    const totalAmount = subtotal - (appliedVoucher?.discountAmount || 0);

    // 4. Logic Voucher Real
    const applyVoucher = (code) => {
        setVoucherError('');
        const vlc = code.toUpperCase();

        // Giả lập database voucher (Sau này bạn có thể gọi API ở đây)
        const vouchers = {
            'HAFO50': { type: 'percent', value: 0.5, max: 50000, minOrder: 100000 },
            'FREESHIP': { type: 'fixed', value: 15000, minOrder: 0 },
            'STUDENT': { type: 'fixed', value: 20000, minOrder: 50000 }
        };

        const found = vouchers[vlc];
        if (!found) {
            setVoucherError('Mã không tồn tại!');
            setAppliedVoucher(null);
            return;
        }

        if (subtotal < found.minOrder) {
            setVoucherError(`Đơn hàng tối thiểu ${found.minOrder.toLocaleString()}đ`);
            setAppliedVoucher(null);
            return;
        }

        let discount = 0;
        if (found.type === 'percent') {
            discount = Math.min(subtotal * found.value, found.max);
        } else {
            discount = found.value;
        }

        setAppliedVoucher({ code: vlc, discountAmount: discount });
        showToast(`Đã áp dụng mã ${vlc}`);
    };

    // Các hàm helper khác giữ nguyên...
    const showToast = (text) => {
        setToast({ show: true, text });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast({ show: false, text: '' }), 2200);
    };

    const addToCart = (newItem) => {
        setCartItems(prev => [...prev, newItem]);
        showToast(`Đã thêm món vào giỏ`);
        window.dispatchEvent(new Event('hafo_cart_added'));
    };

    const removeFromCart = (uniqueId) => {
        if (window.confirm("Xóa món này khỏi giỏ?")) {
            setCartItems(prev => prev.filter(item => item.uniqueId !== uniqueId));
        }
    };

    const updateQuantity = (uniqueId, change) => {
        setCartItems(prev => prev.map(item =>
            item.uniqueId === uniqueId ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
        ));
    };

    const clearCart = () => {
        setCartItems([]); // Xóa sạch mảng món ăn
        setAppliedVoucher(null); // Reset voucher
        setVoucherError(''); // Xóa lỗi voucher

        // Xóa trong localStorage để đảm bảo đồng bộ
        localStorage.removeItem('hafo_cart');

        // (Tùy chọn) Xóa luôn địa chỉ tạm đã ghim trên Map nếu muốn lần sau khách chọn lại
        localStorage.removeItem('temp_checkout_location');
    };

    return (
        <CartContext.Provider value={{
            cartItems, addToCart, updateQuantity, removeFromCart,
            totalAmount, subtotal,
            shippingDetails, clearCart,
            applyVoucher, appliedVoucher, voucherError,
            totalCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
        }}>
            {children}
            <div className={`hafo-toast ${toast.show ? 'show' : ''}`}>{toast.text}</div>
        </CartContext.Provider>
    );
};