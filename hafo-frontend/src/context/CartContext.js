import { createContext, useState, useContext, useEffect, useRef } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    // Lấy giỏ hàng từ localStorage khi khởi động
    const [cartItems, setCartItems] = useState(() => {
        try {
            const savedCart = localStorage.getItem('hafo_cart');
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error("Lỗi khi đọc giỏ hàng từ localStorage:", error);
            return [];
        }
    });

    // Toast state
    const [toast, setToast] = useState({ show: false, text: '' });
    const toastTimerRef = useRef(null);

    // Lưu giỏ hàng vào localStorage mỗi khi có thay đổi
    useEffect(() => {
        localStorage.setItem('hafo_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    const showToast = (text) => {
        setToast({ show: true, text });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => {
            setToast({ show: false, text: '' });
        }, 2200);
    };

    // Hàm thêm món vào giỏ hàng
    const addToCart = (newItem) => {
        setCartItems((prev) => {
            // mỗi lần thêm từ Modal sẽ là một item riêng biệt (không gộp dòng)
            return [...prev, newItem];
        });

        // Toast thay vì alert
        showToast(`Đã thêm ${newItem.quantity} phần "${newItem.name}" vào giỏ`);

        // Bật hiệu ứng "bump" ở icon giỏ hàng (Navbar sẽ lắng nghe event này)
        window.dispatchEvent(new Event('hafo_cart_added'));
    };

    // Hàm xóa món khỏi giỏ hàng
    const removeFromCart = (uniqueId) => {
        if (window.confirm("Bạn muốn xóa món này?")) {
            setCartItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
        }
    };

    // Hàm cập nhật số lượng món
    const updateQuantity = (uniqueId, change) => {
        setCartItems((prevItems) =>
            prevItems.map((item) => {
                if (item.uniqueId === uniqueId) {
                    const newQuantity = item.quantity + change;
                    return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
                }
                return item;
            })
        );
    };

    // Hàm xóa toàn bộ giỏ hàng
    const clearCart = () => {
        setCartItems([]);
    };

    // Tính tổng số lượng món (để hiện trên badge navbar)
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Tính tổng thành tiền
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, totalAmount, totalCount, showToast }}>
            {children}

            {/* Toast UI */}
            <div className={`hafo-toast ${toast.show ? 'show' : ''}`}>
                {toast.text}
            </div>
        </CartContext.Provider>
    );
};