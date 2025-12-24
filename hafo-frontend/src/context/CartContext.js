import { createContext, useState, useContext, useEffect } from 'react';

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

    // Lưu giỏ hàng vào localStorage mỗi khi có thay đổi
    useEffect(() => {
        localStorage.setItem('hafo_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Hàm thêm món vào giỏ hàng
    const addToCart = (product) => {
        setCartItems((prevItems) => {
            // Logic đơn giản: luôn thêm mới để tránh lỗi merge option phức tạp
            // Trong thực tế bạn có thể check trùng ID + Option để tăng số lượng
            return [...prevItems, product];
        });
        // Thông báo đơn giản (có thể thay bằng Toast)
        alert(`Đã thêm "${product.name}" vào giỏ!`);
    };

    // Hàm xóa món khỏi giỏ hàng
    const removeFromCart = (uniqueId) => {
        setCartItems((prevItems) => prevItems.filter((item) => item.uniqueId !== uniqueId));
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
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalCount,
                totalAmount
            }}
        >
            {children}
        </CartContext.Provider>
    );
};