import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import { alertError, alertWarning } from '../../utils/hafoAlert';

const toVND = (n) => n?.toLocaleString('vi-VN');

function ReviewOrder() {
    const { user } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [shipper, setShipper] = useState(null);

    // State đánh giá
    const [driverRating, setDriverRating] = useState(5);
    const [driverTags, setDriverTags] = useState([]);
    const [driverComment, setDriverComment] = useState('');
    const [foodRatings, setFoodRatings] = useState({});
    const [foodComments, setFoodComments] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const res = await api.get(`/orders/${id}`);
            const orderData = res.data;
            setOrder(orderData);

            // ✅ BƯỚC QUAN TRỌNG: Khởi tạo dữ liệu nháp
            const initialRatings = {};
            const initialComments = {};

            orderData.items.forEach((item, index) => {
                // Dùng Key duy nhất: ID món + Vị trí trong đơn
                const uniqueKey = `${item.foodId}_${index}`;
                initialRatings[uniqueKey] = 5;
                initialComments[uniqueKey] = '';
            });

            // ✅ ĐẨY VÀO STATE (Nếu thiếu dòng này sẽ không bấm được sao)
            setFoodRatings(initialRatings);
            setFoodComments(initialComments);

            if (orderData.shipperId) {
                const shipperUserId = typeof orderData.shipperId === 'object'
                    ? orderData.shipperId._id
                    : orderData.shipperId;
                const shipRes = await api.get(`/shippers/profile/${shipperUserId}`);
                setShipper(shipRes.data);
            }
        } catch (err) {
            console.error("Lỗi tải thông tin đơn hàng:", err);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Hàm xử lý khi khách bấm sao cho món ăn
    const handleFoodRate = (foodId, index, rating) => {
        const key = `${foodId}_${index}`;
        setFoodRatings(prev => ({ ...prev, [key]: rating }));
    };

    // Hàm xử lý khi khách nhập comment cho món ăn
    const handleFoodComment = (foodId, index, comment) => {
        const key = `${foodId}_${index}`;
        setFoodComments(prev => ({ ...prev, [key]: comment }));
    };

    const handleSubmit = async () => {
        const currentUserId = user?._id || user?.id;
        if (!currentUserId) {
            alertWarning("Vui lòng đăng nhập để thực hiện đánh giá!");
            return;
        }
        try {
            const reviewData = {
                orderId: id,
                customerId: currentUserId, // ✅ Sửa lại lấy ID từ user context
                restaurantId: order.restaurantId._id || order.restaurantId,
                shipperId: order.shipperId?._id || order.shipperId,
                rating: driverRating,
                comment: driverComment,
                shipperRating: driverRating,
                shipperComment: driverComment,
                itemReviews: order.items.map((item, index) => {
                    const key = `${item.foodId}_${index}`;
                    return {
                        foodId: item.foodId,
                        name: item.name,
                        options: item.options,
                        rating: foodRatings[key],
                        comment: foodComments[key]
                    };
                }),
            };

            // GỌI API THỰC TẾ
            await api.post('/customer-reviews', reviewData);
            setIsSubmitted(true);
            window.scrollTo(0, 0);
        } catch (error) {
            // Log lỗi ra console để debug chính xác lỗi từ Backend
            console.error("Chi tiết lỗi:", error.response?.data || error.message);
            alertError("Không thể gửi đánh giá. Lỗi: " + (error.response?.data?.error || "Vui lòng thử lại sau"));
        }
    };

    if (!order) return <div style={{ padding: '80px', textAlign: 'center', background: '#F7F2E5', minHeight: '100vh' }}>Đang tải thông tin đơn hàng...</div>;

    const StarRow = ({ value, onChange, readOnly, size = "24px" }) => (
        <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <span
                    key={star}
                    onClick={() => !readOnly && onChange(star)}
                    style={{
                        fontSize: size,
                        cursor: readOnly ? 'default' : 'pointer',
                        color: star <= value ? '#F5A524' : '#E2E8F0',
                        transition: '0.2s'
                    }}
                >
                    {star <= value ? '★' : '☆'}
                </span>
            ))}
        </div>
    );

    // HỆ THỐNG STYLE ĐỒNG BỘ TUYỆT ĐỐI VỚI ORDERTRACKING VÀ CHECKOUT
    const S = {
        pageBackground: { background: '#F7F2E5', minHeight: '100vh', width: '100%', paddingBottom: '60px' },
        centeringWrapper: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
        content: { width: '100%', maxWidth: '1200px', padding: '0 20px', boxSizing: 'border-box' },
        gridWrapper: { display: 'grid', gridTemplateColumns: '1fr 450px', gap: '30px', marginTop: '30px', alignItems: 'start' }, // ✅ Cột phải 450px
        card: { background: '#fff', borderRadius: '16px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' },
        header: { padding: '18px 25px', borderBottom: '1px solid #f5f5f5', margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' },
        chip: (active) => ({
            border: '1px solid #eee', background: active ? '#F97350' : '#fff', color: active ? '#fff' : '#64748b',
            borderRadius: '12px', padding: '10px 18px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: '0.2s'
        })
    };

    return (
        <div style={S.pageBackground}>
            <Navbar />
            <div style={S.centeringWrapper}>
                <div style={S.content}>
                    <div style={{ paddingTop: '25px' }}>
                        <h2 style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#1e293b' }}>
                            {isSubmitted ? 'Phản hồi đã được ghi nhận' : 'Đánh giá chất lượng dịch vụ'}
                        </h2>
                    </div>

                    <main style={S.gridWrapper}>
                        {/* CỘT TRÁI: FORM ĐÁNH GIÁ CHI TIẾT */}
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            {isSubmitted ? (
                                <div style={{
                                    ...S.card,
                                    padding: '80px 40px',
                                    textAlign: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    background: 'linear-gradient(to bottom, #ffffff, #fffaf9)',
                                    border: '1px solid #ffe5dd',
                                    boxShadow: '0 20px 40px rgba(249, 115, 80, 0.05)'
                                }}>
                                    {/* Biểu tượng thành công với hiệu ứng vòng tròn */}
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        background: '#85eaa3',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: '30px',
                                        boxShadow: '0 10px 20px rgba(34, 197, 94, 0.1)',
                                        border: '4px solid #888b88'
                                    }}>
                                        <i className="fa-solid fa-check" style={{ fontSize: '40px', color: '#0b8437' }}></i>
                                    </div>

                                    <h3 style={{
                                        fontSize: '28px',
                                        fontWeight: '900',
                                        color: '#1e293b',
                                        letterSpacing: '-0.5px',
                                        margin: 0
                                    }}>
                                        Tuyệt vời!
                                    </h3>

                                    <p style={{
                                        color: '#64748b',
                                        marginTop: '15px',
                                        fontSize: '16px',
                                        maxWidth: '400px',
                                        lineHeight: '1.6'
                                    }}>
                                        Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn đã giúp cộng đồng <b>HaFo</b> tìm được những món ngon nhất!
                                    </p>

                                    {/* Cụm nút bấm chuyên nghiệp */}
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                                        <button
                                            onClick={() => navigate('/history')}
                                            style={{
                                                padding: '16px 35px',
                                                background: '#F97350',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50px',
                                                fontWeight: '800',
                                                fontSize: '15px',
                                                cursor: 'pointer',
                                                boxShadow: '0 10px 20px rgba(249, 115, 80, 0.3)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '10px' }}></i>
                                            Xem lịch sử
                                        </button>

                                        <button
                                            onClick={() => navigate('/home')}
                                            style={{
                                                padding: '16px 35px',
                                                background: '#fff',
                                                color: '#64748b',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '50px',
                                                fontWeight: '700',
                                                fontSize: '15px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = '#f8fafc';
                                                e.currentTarget.style.color = '#1e293b';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = '#fff';
                                                e.currentTarget.style.color = '#64748b';
                                            }}
                                        >
                                            Về trang chủ
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Đánh giá tài xế với thông tin thực */}
                                    <div style={S.card}>
                                        <h4 style={S.header}><i className="fa-solid fa-motorcycle" style={{ color: '#F97350' }}></i> Nhân viên giao hàng</h4>
                                        <div style={{ padding: '25px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                                                <img src={shipper?.user?.avatar || "https://via.placeholder.com/70"} alt="Avatar" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #FFF1ED' }} />
                                                <div>
                                                    <div style={{ fontWeight: '900', fontSize: '18px', color: '#1e293b' }}>{shipper?.user?.fullName || order?.shipperId?.fullName || "Tài xế đang cập nhật"}</div>
                                                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>Biển số xe: {shipper?.licensePlate || "..."}</div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                                <span style={{ fontWeight: '700' }}>Chất lượng giao hàng:</span>
                                                <StarRow value={driverRating} onChange={setDriverRating} />
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
                                                {['Giao nhanh', 'Đúng giờ', 'Thân thiện', 'Nhiệt tình'].map(tag => (
                                                    <div key={tag} onClick={() => setDriverTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])} style={S.chip(driverTags.includes(tag))}>{tag}</div>
                                                ))}
                                            </div>
                                            <textarea
                                                placeholder="Nhập nhận xét về nhân viên giao hàng (nếu có)..."
                                                value={driverComment}
                                                onChange={(e) => setDriverComment(e.target.value)}
                                                style={{ width: '100%', minHeight: '100px', border: '1px solid #eee', borderRadius: '15px', padding: '15px', fontSize: '14px', outline: 'none', resize: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Đánh giá món ăn với ô nhận xét riêng */}
                                    <div style={S.card}>
                                        <h4 style={S.header}><i className="fa-solid fa-bowl-food" style={{ color: '#F97350' }}></i> Chất lượng món ăn</h4>
                                        <div style={{ padding: '25px' }}>
                                            {order.items.map((item, index) => {
                                                const key = `${item.foodId}_${index}`;
                                                return (
                                                    <div key={key} style={{ paddingBottom: '25px', marginBottom: '25px', borderBottom: index !== order.items.length - 1 ? '1px dashed #f1f1f1' : 'none' }}>

                                                        {/* HÀNG TRÊN: Ảnh, Tên + Topping bên trái | Sao bên phải */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                                <img
                                                                    src={item.image || "https://via.placeholder.com/60"}
                                                                    alt={item.name}
                                                                    style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #eee' }}
                                                                />
                                                                <div>
                                                                    <div style={{ fontWeight: '800', fontSize: '16px', color: '#1e293b' }}>{item.name}</div>
                                                                    <div style={{ fontSize: '12px', color: '#F97350', fontWeight: '600', marginTop: '2px' }}>
                                                                        <i className="fa-solid fa-layer-group"></i> {item.options || "Món nguyên bản"}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* ✅ DÙNG CHUNG STARROW VÀ ĐẨY SANG PHẢI */}
                                                            <StarRow
                                                                value={foodRatings[key]}
                                                                onChange={(val) => handleFoodRate(item.foodId, index, val)}
                                                                size="28px"
                                                            />
                                                        </div>

                                                        {/* Ô NHẬP NHẬN XÉT */}
                                                        <input
                                                            type="text"
                                                            placeholder="Nhận xét về món này..."
                                                            // ✅ SỬA LỖI: Dùng đúng KEY unique để không bị nhảy chữ món này sang món kia
                                                            value={foodComments[key] || ''}
                                                            onChange={(e) => handleFoodComment(item.foodId, index, e.target.value)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '12px 15px',
                                                                borderRadius: '12px',
                                                                border: '1px solid #eee',
                                                                outline: 'none',
                                                                fontSize: '14px',
                                                                background: '#fcfcfc'
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <button onClick={handleSubmit} style={{ width: '100%', padding: '20px', borderRadius: '40px', border: 'none', background: 'linear-gradient(to right, #F97350, #FF5F6D)', color: '#fff', fontSize: '18px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 8px 25px rgba(249, 115, 80, 0.3)' }}>
                                        HOÀN TẤT VÀ GỬI ĐÁNH GIÁ
                                    </button>
                                </>
                            )}
                        </section>

                        {/* CỘT PHẢI ĐỒNG BỘ 450PX: TỔNG HỢP THÔNG TIN */}
                        <aside style={{ position: 'sticky', top: '100px', display: 'flex', flexDirection: 'column', gap: '25px', width: '450px' }}>
                            {/* Tóm tắt đơn hàng có hình ảnh */}
                            <div style={S.card}>
                                <h4 style={S.header}><i className="fa-solid fa-receipt" style={{ color: '#F97350' }}></i> Tóm tắt đơn hàng</h4>
                                <div style={{ padding: '25px' }}>
                                    <div style={{ fontSize: '14px', marginBottom: '15px', color: '#64748b' }}>Mã đơn hàng: <b style={{ color: '#1e293b' }}>#{order._id.slice(-6).toUpperCase()}</b></div>

                                    <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '8px', scrollbarWidth: 'thin' }}>
                                        {order.items.map((it, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '15px', padding: '15px 0', borderTop: '1px solid #f9f9f9' }}>
                                                <img src={it.image || "https://via.placeholder.com/55"} alt="food" style={{ width: '55px', height: '55px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #eee' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b' }}>{it.quantity}x {it.name}</span>
                                                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#333' }}>{toVND(it.price * it.quantity)}</span>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{it.options}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ borderTop: '2px solid #F7F2E5', marginTop: '20px', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: '800', fontSize: '18px', color: '#1e293b' }}>TỔNG THANH TOÁN</span>
                                        <span style={{ fontWeight: '900', fontSize: '28px', color: '#F97350' }}>{toVND(order.total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Địa chỉ nhận hàng */}
                            <div style={S.card}>
                                <h4 style={S.header}><i className="fa-solid fa-location-dot" style={{ color: '#F97350' }}></i> Địa chỉ nhận hàng</h4>
                                <div style={{ padding: '20px 25px', fontSize: '14px', color: '#64748b', lineHeight: '1.6' }}>
                                    {order.customer.split('|')[2] || "Địa chỉ đã lưu trong hệ thống"}
                                </div>
                            </div>
                        </aside>
                    </main>
                </div>
            </div>
        </div>
    );
}

export default ReviewOrder;