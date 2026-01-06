// CartContext.js

import { createContext, useState, useContext, useEffect, useRef, useMemo } from 'react';
import { confirmDialog, alertSuccess } from '../utils/hafoAlert';
import { useAuth } from './AuthContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const { user, loading: authLoading } = useAuth();
    const getImmediateUserId = () => {
        const stored = localStorage.getItem('user');
        if (stored) {
            const u = JSON.parse(stored);
            return u?._id || u?.id || 'guest';
        }
        return 'guest';
    };

    // Khởi tạo state rỗng, việc tải dữ liệu sẽ làm trong useEffect
    const [cartItems, setCartItems] = useState(() => {
        const uid = getImmediateUserId();
        const saved = localStorage.getItem(`hafo_cart_${uid}`);
        return saved ? JSON.parse(saved) : [];
    });
    const isInitiated = useRef(false);
    const userId = user?._id || user?.id || 'guest';

    // State cho Voucher
    const [appliedVoucher, setAppliedVoucher] = useState(null);
    const [voucherError, setVoucherError] = useState('');

    const [toast, setToast] = useState({ show: false, text: '' });
    const toastTimerRef = useRef(null);

    // Khi userId thay đổi (đăng nhập/đăng xuất), tải lại giỏ hàng tương ứng
    useEffect(() => {
        if (authLoading) return; // ✅ Đợi AuthContext xong xuôi đã

        const savedCart = localStorage.getItem(`hafo_cart_${userId}`);
        if (savedCart) {
            setCartItems(JSON.parse(savedCart));
        } else {
            setCartItems([]);
        }

        // Chỉ khi load xong dữ liệu của đúng User này thì mới cho phép Save
        isInitiated.current = true;
    }, [userId, authLoading]);

    // --- 2. LOGIC LƯU DỮ LIỆU (SỬA LẠI CHỖ NÀY) ---
    useEffect(() => {
        if (!isInitiated.current || authLoading) return;

        localStorage.setItem(`hafo_cart_${userId}`, JSON.stringify(cartItems));
    }, [cartItems, userId, authLoading]);

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

    const removeFromCart = async (uniqueId) => {
        const isConfirmed = await confirmDialog(
            "Xác nhận xóa?",
            "Món ăn này sẽ biến mất khỏi giỏ hàng của bạn đó!"
        );
        if (isConfirmed) {
            setCartItems(prev => prev.filter(item => item.uniqueId !== uniqueId));
            await alertSuccess("Đã xóa!", "Giỏ hàng đã được cập nhật.");
        }
    };

    const updateQuantity = (uniqueId, change) => {
        setCartItems(prev => prev.map(item =>
            item.uniqueId === uniqueId ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
        ));
    };

    const clearCart = () => {
        setCartItems([]);
        setAppliedVoucher(null);
        setVoucherError('');
        localStorage.removeItem(`hafo_cart_${userId}`); // Xóa đúng giỏ hàng của user
        localStorage.removeItem('temp_checkout_location');
    };

    const updateItemOptions = (uniqueId, newOptions) => {
        setCartItems(prev => prev.map(item =>
            item.uniqueId === uniqueId
                ? { ...item, ...newOptions } // Ghi đè options mới vào item cũ
                : item
        ));
        showToast("Đã cập nhật tùy chọn! ✨");
    };

    return (
        <CartContext.Provider value={{
            cartItems, addToCart, updateQuantity, removeFromCart,
            totalAmount, subtotal,
            shippingDetails, clearCart, updateItemOptions,
            applyVoucher, appliedVoucher, voucherError,
            totalCount: cartItems.reduce((sum, item) => sum + item.quantity, 0)
        }}>
            {children}
            <div className={`hafo-toast ${toast.show ? 'show' : ''}`}>{toast.text}</div>
        </CartContext.Provider>
    );
};