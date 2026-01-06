import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ChatBot.css';
import ReactMarkdown from 'react-markdown';
import { alertError } from '../utils/hafoAlert';

function ChatBot() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Chào bạn! 👋 HaFo có thể giúp gì cho bạn hôm nay? Bạn đang thèm món gì nè?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { addToCart } = useCart();

    const quickReplies = [
        "Món nào ngon nhất? 😋",
        "Đơn hàng của tôi đâu? 🛵",
        "Có mã giảm giá không? 🎫",
        "Tìm nước uống giải khát 🥤"
    ];

    // Tự động cuộn xuống cuối khi có tin nhắn mới
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        const loadChatHistory = async () => {
            if (user?.id || user?._id) {
                try {
                    const res = await api.get(`/chat/history/${user.id || user._id}`);
                    if (res.data.length > 0) {
                        setMessages(res.data); // Đổ dữ liệu cũ vào state messages
                    }
                } catch (err) { console.error("Không thể tải lịch sử chat"); }
            }
        };
        loadChatHistory();
    }, [user]);

    const formatPrice = (price) => {
        if (!price) return '0đ';
        // Chuyển về số (xóa bỏ chữ đ hoặc ký tự lạ nếu AI lỡ tay trả về chuỗi)
        const numericPrice = typeof price === 'string'
            ? parseInt(price.replace(/\D/g, ''))
            : price;
        return numericPrice.toLocaleString('vi-VN') + 'đ';
    };

    const handleSend = async (msgText) => {
        const textToSend = msgText || input;
        if (!textToSend.trim()) return;

        const userMsg = { sender: 'user', text: textToSend };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            // 2. Gửi thêm thông tin User để AI cá nhân hóa
            const res = await api.post('/chat', {
                message: textToSend,
                history: messages,
                userId: user?.id || user?._id,
                userName: user?.fullName,
                address: localStorage.getItem('last_address') // Giả sử bạn lưu địa chỉ ở đây
            });

            // Backend giờ trả về { reply, foods }
            setMessages(prev => [...prev, {
                sender: 'bot',
                text: res.data.reply,
                foods: res.data.foods || []
            }]);
        } catch (error) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Kết nối không ổn định, vui lòng thử lại sau!' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Hàm thêm món từ Chat vào Giỏ (Tạo nhanh item với options mặc định)
    const handleAddToCartFromChat = (food) => {
        // 1. Ép kiểu giá tiền để không bị lỗi 1720000đ
        const basePrice = typeof food.price === 'string'
            ? parseInt(food.price.replace(/\D/g, ''))
            : (Number(food.price) || 0);

        // 2. LẤY ID NHÀ HÀNG AN TOÀN (Đây là chỗ má bị lỗi)
        const resId = food.restaurantId?._id || food.restaurantId || food.restaurant?._id || food.restaurant;

        if (!resId) {
            // Nếu vẫn không có, ta thử lấy từ các trường dự phòng
            console.error("Dữ liệu món ăn bị thiếu quán:", food);
            return alertError("Món này chưa có thông tin quán, má chọn món khác nha!");
        }

        // 3. ĐÓNG GÓI ITEM
        const cartItem = {
            ...food,
            uniqueId: Date.now() + Math.random(),
            quantity: 1,
            price: basePrice,
            _id: food._id,

            // Thông tin nhà hàng chuẩn để Cart.js và Checkout.js làm việc
            restaurantId: resId,
            restaurantName: food.restaurantName || "Cửa hàng đối tác",
            resLat: food.resLat || 10.762622,
            resLng: food.resLng || 106.660172,

            selectedSize: food.selectedSize || food.options?.[0]?.name || 'Vừa',
            sizePrice: Number(food.sizePrice || food.options?.[0]?.price || 0),
            selectedToppings: [],
            note: '',
            finalPrice: basePrice + Number(food.options?.[0]?.price || 0)
        };

        addToCart(cartItem);
        // Thêm hiệu ứng rung nhẹ hoặc thông báo nhỏ nếu muốn
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
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
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
                                                    <div className="cf-price">{formatPrice(food.price)}</div>
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

                        {/* 4. RENDER GỢI Ý NHANH (Khi không đang load) */}
                        {!isLoading && messages.length < 3 && (
                            <div className="quick-replies">
                                {quickReplies.map((txt, i) => (
                                    <button key={i} onClick={() => handleSend(txt)} className="qr-btn">{txt}</button>
                                ))}
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
                        <button className="chat-send" onClick={() => handleSend()} disabled={isLoading}>
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