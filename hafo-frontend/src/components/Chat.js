import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { alertError } from '../utils/hafoAlert';

const Chat = ({ orderId: propOrderId, onClose, partnerAvatar }) => {
    const { user } = useAuth(); // Lấy user từ Context
    const currentUserId = user?._id || user?.id; // Lấy ID an toàn hơn
    const { orderId: paramOrderId } = useParams();
    // Ưu tiên lấy ID từ props, nếu không có thì lấy từ URL
    const orderId = propOrderId || paramOrderId;

    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef();

    const fetchMessages = useCallback(async () => {
        if (!orderId) return;
        try {
            const res = await api.get(`/messages/${orderId}`);
            setMessages(res.data);
        } catch (err) {
            console.error("Lỗi tải tin nhắn:", err);
        }
    }, [orderId]);

    useEffect(() => {
        fetchMessages();
        const interval = setInterval(fetchMessages, 3000);

        //  Mỗi khi mở chat hoặc tin nhắn mới về, lưu lại mốc thời gian đã đọc
        if (orderId) {
            localStorage.setItem(`lastRead_${orderId}`, new Date().toISOString());
        }

        return () => {
            clearInterval(interval);
        };
    }, [fetchMessages, orderId, messages.length]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim()) return;

        if (!currentUserId) {
            alertError("Lỗi", "Không tìm thấy ID người dùng. Vui lòng đăng nhập lại!");
            return;
        }

        try {
            const res = await api.post('/messages', {
                orderId,
                senderId: currentUserId,
                text: newMessage
            });
            setMessages([...messages, res.data]);
            setNewMessage('');
        } catch (err) {
            // Hiển thị lỗi cụ thể từ Backend trả về thay vì alert chung chung
            const errorMsg = err.response?.data?.message || "Lỗi gửi tin!";
            alertError(errorMsg);
        }
    };

    if (!orderId) return null;
    const defaultAvatar = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
    const finalPartnerAvatar = partnerAvatar || defaultAvatar;

    return (
        <div style={S.widgetContainer}>
            {/* Header chuẩn HaFo */}
            <div style={S.header}>
                <div style={S.avatarCircle}><i className="fa-solid fa-user-ninja"></i></div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '800', fontSize: '15px' }}>Trò chuyện đơn hàng</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>
                        Mã đơn: #{orderId ? orderId.slice(-6).toUpperCase() : '...'}
                    </div>
                </div>
                <button onClick={onClose || (() => navigate(-1))} style={S.closeBtn}>
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div style={S.chatBox}>
                {messages.map((msg, i) => {
                    const isMine = msg.senderId === currentUserId;
                    return (
                        <div key={i} style={{
                            display: 'flex',
                            flexDirection: isMine ? 'row-reverse' : 'row', // Đảo chiều nếu là tin của mình
                            alignItems: 'flex-end', // Căn avatar xuống đáy dòng
                            marginBottom: '10px',
                            gap: '8px'
                        }}>
                            {/* CHỈ HIỆN AVATAR NẾU KHÔNG PHẢI TIN NHẮN CỦA MÌNH */}
                            {!isMine && (
                                <img
                                    src={finalPartnerAvatar}
                                    alt="Partner"
                                    style={S.chatAvatar}
                                />
                            )}

                            <div style={{
                                ...S.bubble,
                                background: isMine ? '#F97350' : '#fff',
                                color: isMine ? '#fff' : '#333',
                                border: isMine ? 'none' : '1px solid #eee',
                                // Bo góc khác nhau tùy người gửi
                                borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            }}>
                                {msg.text}
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSendMessage} style={S.inputArea}>
                <div style={S.inputPill}>
                    <input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập nội dung..."
                        style={S.inputField}
                    />
                    <button type="submit" style={S.sendBtn}><i className="fa-solid fa-paper-plane"></i></button>
                </div>
            </form>
        </div>
    );
};

const S = {
    widgetContainer: { height: '100%', display: 'flex', flexDirection: 'column', background: '#F9F9F9' },
    header: { background: '#EB7252', padding: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' },
    avatarCircle: { width: '35px', height: '35px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer' },
    chatBox: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
    bubble: { maxWidth: '80%', padding: '10px 14px', borderRadius: '15px', fontSize: '13px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    chatAvatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '1px solid #eee',
        flexShrink: 0
    },
    inputArea: { padding: '15px', background: '#fff', borderTop: '1px solid #eee' },
    inputPill: { display: 'flex', background: '#F4F4F4', borderRadius: '25px', padding: '5px 5px 5px 15px', border: '1px solid #eee' },
    inputField: { flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: '13px' },
    sendBtn: { background: 'none', border: 'none', color: '#2563EB', fontSize: '18px', cursor: 'pointer' }
};

export default Chat;