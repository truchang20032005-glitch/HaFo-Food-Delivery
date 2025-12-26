import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import './ChatBot.css';

function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Chào bạn! 👋 HaFo có thể giúp gì cho bạn hôm nay? Bạn đang thèm món gì nè?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { addToCart } = useCart();

    // Tự động cuộn xuống cuối khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // Gửi tin nhắn lên Backend
            // const res = await axios.post('http://localhost:5000/api/chat'
            const res = await api.post('/chat', { message: input, history: messages });

            // Backend trả về: reply (text) và foods (mảng món ăn gợi ý)
            const botMsg = {
                sender: 'bot',
                text: res.data.reply,
                foods: res.data.foods || []
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Hic, mình đang bị mất kết nối một chút. Bạn thử lại sau nhé!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Hàm thêm món từ Chat vào Giỏ (Tạo nhanh item với options mặc định)
    const handleAddToCartFromChat = (food) => {
        const cartItem = {
            ...food,
            uniqueId: Date.now(),
            quantity: 1,
            // Nếu món có options, chọn cái đầu tiên làm mặc định
            selectedSize: food.options?.[0]?.name || 'Tiêu chuẩn',
            sizePrice: food.options?.[0]?.price || 0,
            selectedToppings: [],
            note: 'Thêm từ Chatbot',
            finalPrice: (food.price || 0) + (food.options?.[0]?.price || 0)
        };
        addToCart(cartItem);
    };

    return (
        <div className="chatbot-container">
            {/* Nút bật/tắt Chat */}
            <button
                className={`chat-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? (
                    <img
                        src="/images/robot.png"  // Đường dẫn ảnh khi đóng chat
                        alt="Close Chat"
                        style={{ width: '30px', height: '30px' }}  // Điều chỉnh kích thước ảnh nếu cần
                    />
                ) : (
                    <img
                        src="/images/robot.png"  // Đường dẫn ảnh khi mở chat
                        alt="Open Chat"
                        style={{ width: '30px', height: '30px' }}  // Điều chỉnh kích thước ảnh nếu cần
                    />
                )}
            </button>

            {/* Cửa sổ Chat */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <div>
                            <img
                                src="/images/robot.png"
                                alt="Chatbot Icon"
                                style={{ width: '30px', height: '30px' }}
                            />
                        </div>
                        <div>
                            <div>Trợ lý HaFo AI</div>
                            <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'normal' }}>Luôn sẵn sàng hỗ trợ</div>
                        </div>
                    </div>

                    <div className="chat-body">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-msg ${msg.sender}`} style={{ alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                                {/* Nội dung tin nhắn text */}
                                <div className="msg-content">
                                    {msg.text}
                                </div>

                                {/* RENDER DANH SÁCH MÓN ĂN GỢI Ý (Nếu có) */}
                                {msg.sender === 'bot' && msg.foods && msg.foods.length > 0 && (
                                    <div className="food-suggestions">
                                        {msg.foods.map((food) => (
                                            <div key={food._id} className="chat-food-card">
                                                <img
                                                    src={food.image || 'https://via.placeholder.com/150?text=HaFo'}
                                                    alt={food.name}
                                                    className="cf-img"
                                                    onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=HaFo'}
                                                />
                                                <div className="cf-info">
                                                    <div className="cf-name" title={food.name}>{food.name}</div>
                                                    <div className="cf-price">{food.price?.toLocaleString()}đ</div>
                                                    <button
                                                        className="cf-btn"
                                                        onClick={() => handleAddToCartFromChat(food)}
                                                    >
                                                        + Thêm ngay
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="chat-msg bot">
                                <div className="msg-content">
                                    <i className="fa-solid fa-ellipsis fa-fade"></i>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>


                    <div className="chat-footer">
                        <input
                            className="chat-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Bạn muốn ăn gì?..."
                            disabled={isLoading}
                        />
                        <button className="chat-send" onClick={handleSend} disabled={isLoading}>
                            <img
                                src="/images/send.png"  // Đường dẫn đến ảnh bạn muốn sử dụng
                                alt="Send"
                                style={{ width: '24px', height: '24px' }}  // Điều chỉnh kích thước ảnh nếu cần
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatBot;