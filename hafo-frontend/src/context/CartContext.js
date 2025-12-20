import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        const saved = localStorage.getItem('hafo_cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('hafo_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // --- HÀM THÊM VÀO GIỎ (LOGIC MỚI) ---
    const addToCart = (newItem) => {
        setCartItems((prev) => {
            // Để đơn giản và chính xác nhất với logic chọn topping/size, 
            // mỗi lần thêm từ Modal sẽ là một item riêng biệt (không gộp dòng)
            // để tránh lỗi khi so sánh topping phức tạp.
            return [...prev, newItem];
        });
        // Có thể thêm Toast thông báo ở đây
        alert(`Đã thêm ${newItem.quantity} phần "${newItem.name}" vào giỏ!`);
    };

    const removeFromCart = (uniqueId) => {
        if (window.confirm("Bạn muốn xóa món này?")) {
            setCartItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
        }
    };

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

    const clearCart = () => setCartItems([]);

    // Tính tổng tiền: Dựa trên finalPrice (giá đã cộng topping)
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeFromCart, clearCart, totalAmount, totalCount }}>
            {children}
        </CartContext.Provider>
    );
};