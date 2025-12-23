import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './ChatBot.css'; // File CSS riêng cho đẹp

function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { sender: 'bot', text: 'Chào bạn! 👋 HaFo có thể giúp gì cho bạn hôm nay? Bạn đang thèm món gì nè?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

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
            const res = await axios.post('http://localhost:5000/api/chat', {
                message: input,
                history: messages // Gửi kèm lịch sử để AI hiểu ngữ cảnh
            });

            const botMsg = { sender: 'bot', text: res.data.reply };
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

    return (
        <div className="chatbot-container">
            {/* Nút bật/tắt Chat */}
            <button
                className={`chat-toggle ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-comment-dots"></i>}
            </button>

            {/* Cửa sổ Chat */}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <div style={{ fontSize: '20px' }}>🤖</div>
                        <div>
                            <div>Trợ lý HaFo AI</div>
                            <div style={{ fontSize: '10px', opacity: 0.8, fontWeight: 'normal' }}>Luôn sẵn sàng hỗ trợ</div>
                        </div>
                    </div>

                    <div className="chat-body">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`msg ${msg.sender}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="msg bot">
                                <i className="fa-solid fa-ellipsis fa-fade"></i>
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
                            placeholder="Hỏi HaFo món ngon..."
                        />
                        <button className="chat-send" onClick={handleSend} disabled={isLoading}>
                            <i className="fa-solid fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatBot;