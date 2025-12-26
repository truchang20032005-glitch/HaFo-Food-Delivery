import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';

const toVND = (n) => n?.toLocaleString('vi-VN');

function ReviewOrder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);

    // State đánh giá Tài xế
    const [driverRating, setDriverRating] = useState(5);
    const [driverTags, setDriverTags] = useState([]);
    const [driverComment, setDriverComment] = useState('');
    const [driverTip, setDriverTip] = useState(0);

    // State đánh giá Món ăn (Lưu object: { "Tên món": 5 sao })
    const [foodRatings, setFoodRatings] = useState({});

    // State kiểm soát trạng thái: false = đang nhập, true = đã gửi xong
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        //axios.get(`http://localhost:5000/api/orders/${id}`)
        api.get(`/orders/${id}`)
            .then(res => setOrder(res.data))
            .catch(err => console.error(err));
    }, [id]);

    const handleSubmit = () => {
        // Tổng hợp dữ liệu
        const reviewData = {
            orderId: id,
            driver: { rating: driverRating, tags: driverTags, comment: driverComment, tip: driverTip },
            food: foodRatings
        };

        console.log("Gửi đánh giá:", reviewData);
        // Chuyển sang trạng thái "Đã gửi" thay vì chuyển trang
        setIsSubmitted(true);
        window.scrollTo(0, 0);
    };

    // Hàm xử lý chọn Tag (Thân thiện, Đúng giờ...)
    const toggleTag = (tag) => {
        if (driverTags.includes(tag)) {
            setDriverTags(driverTags.filter(t => t !== tag));
        } else {
            setDriverTags([...driverTags, tag]);
        }
    };

    // Hàm xử lý đánh giá món ăn
    const handleFoodRate = (itemName, rating) => {
        setFoodRatings({ ...foodRatings, [itemName]: rating });
    };

    if (!order) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải...</div>;

    // Tách chuỗi món ăn ra thành mảng để hiển thị
    const foodItems = order.items.split(', ');

    // Tính điểm trung bình món ăn (để hiển thị ở màn hình Read-only)
    const avgFoodRating = Object.values(foodRatings).length > 0
        ? Math.round(Object.values(foodRatings).reduce((a, b) => a + b, 0) / Object.values(foodRatings).length)
        : 5;

    // Component hiển thị sao (hỗ trợ chế độ chỉ xem)
    const StarRow = ({ value, onChange, readOnly }) => (
        <div className="stars" style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    className={star <= value ? 'active' : ''}
                    onClick={() => !readOnly && onChange && onChange(star)}
                    style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: readOnly ? '18px' : '24px', // Nhỏ hơn xíu khi xem lại
                        cursor: readOnly ? 'default' : 'pointer',
                        color: star <= value ? '#F5A524' : '#d1c7ba',
                        padding: 0
                    }}
                >
                    ★
                </button>
            ))}
        </div>
    );

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar />

            <header className="header" style={{ background: '#fff', borderBottom: '1px solid #e9e4d8', padding: '10px 0' }}>
                <div className="container hop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{isSubmitted ? 'Đánh giá đã gửi' : 'Đánh giá đơn hàng'}</h3>
                    <Link to="/" style={{ textDecoration: 'none', color: '#6b625d', fontWeight: 'bold' }}>Về trang chủ</Link>
                </div>
            </header>

            <main className="hop" style={{ margin: '20px auto', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>

                {/* --- CỘT TRÁI --- */}
                <section>

                    {/* --------------------------------------------------------- */}
                    {/* TRƯỜNG HỢP 1: ĐÃ GỬI XONG (READ-ONLY) - GIỐNG FILE HTML BẠN GỬI */}
                    {/* --------------------------------------------------------- */}
                    {isSubmitted ? (
                        <div className="card" style={{ background: '#fff', padding: '16px', borderRadius: '14px', border: '1px solid #eadfcd' }}>
                            {/* Banner Cảm ơn */}
                            <div className="done-banner" style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #dff6ea', background: '#EAFBF1', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                                <i className="fa-solid fa-circle-check" style={{ color: '#22C55E', fontSize: '24px' }}></i>
                                <div>
                                    <b style={{ display: 'block', fontSize: '16px', color: '#333', marginBottom: '4px' }}>Cảm ơn bạn! Đánh giá của bạn đã được ghi nhận.</b>
                                    <div className="muted" style={{ color: '#666', fontSize: '13px' }}>Mã đơn <b style={{ color: '#333' }}>#{order._id.slice(-6).toUpperCase()}</b>. Chúng tôi trân trọng phản hồi của bạn.</div>
                                </div>
                            </div>

                            {/* Lưới tóm tắt đánh giá (4 ô) */}
                            <div className="ratings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {/* Món ăn */}
                                <div className="rate-box" style={{ border: '1px solid #f0e8d9', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFCF5' }}>
                                    <div className="rate-ico" style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #f0e8d9', color: '#F97350', fontSize: '18px' }}>
                                        <i className="fa-solid fa-bowl-food"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '14px' }}>Món ăn</div>
                                        <StarRow value={avgFoodRating} readOnly />
                                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Hương vị, phần ăn</div>
                                    </div>
                                </div>

                                {/* Tài xế */}
                                <div className="rate-box" style={{ border: '1px solid #f0e8d9', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFCF5' }}>
                                    <div className="rate-ico" style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #f0e8d9', color: '#F97350', fontSize: '18px' }}>
                                        <i className="fa-solid fa-motorcycle"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '14px' }}>Tài xế</div>
                                        <StarRow value={driverRating} readOnly />
                                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Thân thiện, đúng giờ</div>
                                    </div>
                                </div>
                                {/* Các ô giả lập khác để giống layout */}
                                <div className="rate-box" style={{ border: '1px solid #f0e8d9', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFCF5' }}>
                                    <div className="rate-ico" style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #f0e8d9', color: '#F97350', fontSize: '18px' }}>
                                        <i className="fa-solid fa-box"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '14px' }}>Đóng gói</div>
                                        <StarRow value={5} readOnly />
                                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Gọn gàng, sạch sẽ</div>
                                    </div>
                                </div>
                                <div className="rate-box" style={{ border: '1px solid #f0e8d9', borderRadius: '12px', padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: '#FFFCF5' }}>
                                    <div className="rate-ico" style={{ width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #f0e8d9', color: '#F97350', fontSize: '18px' }}>
                                        <i className="fa-solid fa-bolt"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '14px' }}>Tốc độ</div>
                                        <StarRow value={5} readOnly />
                                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Thời gian giao</div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ height: '1px', background: '#f0e8d9', margin: '20px 0' }}></div>

                            {/* Nhận xét đã ghi */}
                            <div style={{ fontWeight: '800', marginBottom: '6px' }}>Nhận xét của bạn</div>
                            <div style={{
                                background: '#fff', border: '1px dashed #eadfcd', borderRadius: '10px',
                                padding: '12px', color: '#4a4039', lineHeight: '1.5', fontStyle: driverComment ? 'normal' : 'italic'
                            }}>
                                {driverComment || "Không có nhận xét chi tiết."}
                            </div>

                            {/* Nút điều hướng sau khi xong */}
                            <div className="actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <Link to="/" className="btn primary" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#F97350', color: 'white', fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>
                                    <i className="fa-solid fa-cart-plus"></i> Tiếp tục mua sắm
                                </Link>
                                <Link to="/history" className="btn soft" style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd', background: '#fff', color: '#333', fontWeight: 'bold', textAlign: 'center', textDecoration: 'none' }}>
                                    <i className="fa-solid fa-receipt"></i> Xem lịch sử đơn
                                </Link>
                            </div>
                            <div style={{ textAlign: 'center', color: '#999', fontSize: '12px', marginTop: '15px' }}>Bạn có thể chỉnh sửa đánh giá trong vòng 24 giờ.</div>
                        </div>

                    ) : (

                        /* --------------------------------------------------------- */
                        /* TRƯỜNG HỢP 2: CHƯA GỬI (FORM NHẬP LIỆU) - GIỮ NGUYÊN CŨ */
                        /* --------------------------------------------------------- */
                        <div className="card" style={{ background: '#fff', padding: '16px', borderRadius: '14px', border: '1px solid #eadfcd' }}>
                            {/* Banner Cảm ơn (Trạng thái vừa hoàn tất đơn) */}
                            <div className="done-banner" style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #dff6ea', background: '#EAFBF1', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                                <i className="fa-solid fa-circle-check" style={{ color: '#22C55E', fontSize: '24px' }}></i>
                                <div>
                                    <b style={{ display: 'block', fontSize: '16px', color: '#333', marginBottom: '4px' }}>Đơn hàng đã hoàn tất — cảm ơn bạn!</b>
                                    <span className="muted" style={{ color: '#666', fontSize: '13px' }}>Hãy chia sẻ trải nghiệm của bạn để HaFo phục vụ tốt hơn 💛</span>
                                </div>
                            </div>

                            {/* 1. Đánh giá Tài xế */}
                            <div className="review-card" style={{ background: '#fff', border: '1px solid #eadfcd', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '18px' }}>
                                <div className="head" style={{ padding: '14px 16px', background: '#FFFCF5', borderBottom: '1px solid #f0e8d9', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fa-solid fa-motorcycle"></i> Đánh giá tài xế</div>
                                <div className="body" style={{ padding: '16px' }}>
                                    <div className="driver-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                                        <img src={order.shipperAvatar || "/images/shipper.jpg"} alt="Shipper" onError={(e) => e.target.src = 'https://via.placeholder.com/50'} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FAD06C' }} />
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '16px' }}>Nguyễn Minh Tài</div>
                                            <div className="muted" style={{ color: '#666', fontSize: '12px' }}>Biển số: <b>59X3-123.45</b> · Xe máy</div>
                                        </div>
                                    </div>

                                    <div className="star-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <span className="label" style={{ fontWeight: '600', color: '#555' }}>Mức độ hài lòng</span>
                                        <div className="stars">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button key={star} className={star <= driverRating ? 'active' : ''} onClick={() => setDriverRating(star)} style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer', color: star <= driverRating ? '#F5A524' : '#e5dfd2', padding: 0 }}>★</button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
                                        {['Thân thiện', 'Đúng giờ', 'Cẩn thận', 'Nhiệt tình'].map(tag => (
                                            <div key={tag} className={`chip ${driverTags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)} style={{ border: '1px solid #e5dfd2', background: driverTags.includes(tag) ? '#F97350' : '#fff', color: driverTags.includes(tag) ? '#fff' : '#333', borderRadius: '99px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}>
                                                {tag}
                                            </div>
                                        ))}
                                    </div>

                                    <textarea
                                        className="cmt"
                                        placeholder="Nhận xét cho tài xế (Ví dụ: Anh tài xế rất lịch sự...)"
                                        value={driverComment}
                                        onChange={(e) => setDriverComment(e.target.value)}
                                        style={{ width: '100%', minHeight: '80px', border: '1px solid #e5dfd2', borderRadius: '10px', padding: '10px 12px', resize: 'vertical', fontFamily: 'inherit', marginBottom: '15px' }}
                                    ></textarea>

                                    <div className="label" style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Gửi tip cho tài xế (tuỳ chọn)</div>
                                    <div className="chips" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {[5000, 10000, 20000, 50000].map(tip => (
                                            <div key={tip} className={`chip tip ${driverTip === tip ? 'active' : ''}`} onClick={() => setDriverTip(tip === driverTip ? 0 : tip)} style={{ border: '1px solid #ffe0ad', background: driverTip === tip ? '#F97350' : '#fff7e5', color: driverTip === tip ? '#fff' : '#333', borderRadius: '99px', padding: '8px 14px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}>
                                                {toVND(tip)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Đánh giá Món ăn */}
                            <div className="review-card" style={{ background: '#fff', border: '1px solid #eadfcd', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', marginBottom: '18px' }}>
                                <div className="head" style={{ padding: '14px 16px', background: '#FFFCF5', borderBottom: '1px solid #f0e8d9', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fa-solid fa-bowl-food"></i> Đánh giá món ăn</div>
                                <div className="body" style={{ padding: '16px' }}>
                                    {foodItems.map((item, index) => (
                                        <div key={index} style={{ marginBottom: '20px', borderBottom: '1px dashed #eee', paddingBottom: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <div style={{ fontWeight: '700' }}>{item}</div>
                                            </div>

                                            <div className="star-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '15px', marginBottom: '12px' }}>
                                                <span className="label" style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>Chất lượng:</span>
                                                <div className="stars" style={{ display: 'flex', gap: '6px' }}>
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            className={star <= (foodRatings[item] || 5) ? 'active' : ''}
                                                            onClick={() => handleFoodRate(item, star)}
                                                            style={{ fontSize: '20px', border: 'none', background: 'transparent', cursor: 'pointer', color: star <= (foodRatings[item] || 5) ? '#F5A524' : '#e5dfd2', padding: 0 }}
                                                        >★</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Món này thế nào? (Ngon, vừa miệng...)"
                                                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e5dfd2' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Nút Gửi */}
                            <div className="actions" style={{ marginTop: '10px' }}>
                                <button onClick={handleSubmit} className="btn primary" style={{ width: '100%', padding: '14px', fontSize: '16px', borderRadius: '12px', fontWeight: 'bold', color: 'white', border: 'none', background: '#F97350', cursor: 'pointer', boxShadow: '0 4px 0 #e05d3a' }}>
                                    <i className="fa-solid fa-paper-plane"></i> Gửi đánh giá
                                </button>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: '15px', color: '#888', fontSize: '13px' }}>
                                Bạn có thể chỉnh sửa đánh giá trong vòng 24 giờ.
                            </div>
                        </div>
                    )}

                </section>

                {/* --- CỘT PHẢI: TÓM TẮT --- */}
                <aside>
                    <div className="review-card" style={{ background: '#fff', border: '1px solid #eadfcd', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div className="head" style={{ padding: '14px 16px', background: '#FFFCF5', borderBottom: '1px solid #f0e8d9', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fa-solid fa-receipt"></i> Tóm tắt đơn hàng</div>
                        <div className="body" style={{ padding: '16px' }}>
                            <div style={{ marginBottom: '10px', fontSize: '14px' }}>Mã đơn: <b>#{order._id.slice(-6).toUpperCase()}</b></div>

                            {/* Danh sách món thu gọn */}
                            <div>
                                {foodItems.map((item, idx) => (
                                    <div key={idx} style={{ fontSize: '13px', color: '#555', padding: '6px 0', borderTop: '1px dashed #eee' }}>
                                        • {item}
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: '1px solid #eee', margin: '15px 0' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                                <span className="muted" style={{ color: '#666' }}>Tạm tính</span>
                                <b>{toVND(order.total)}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                                <span className="muted" style={{ color: '#666' }}>Phí ship</span>
                                <span>15.000đ</span>
                            </div>

                            <div style={{ borderTop: '1px solid #eee', margin: '10px 0' }}></div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: '900', color: '#333' }}>
                                <span>Tổng cộng</span>
                                <span>{toVND(order.total + 15000)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="review-card" style={{ marginTop: '15px', background: '#fff', border: '1px solid #eadfcd', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div className="head" style={{ padding: '14px 16px', background: '#FFFCF5', borderBottom: '1px solid #f0e8d9', fontWeight: '800', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fa-solid fa-location-dot"></i> Giao đến</div>
                        <div className="body" style={{ padding: '16px', fontSize: '14px', lineHeight: '1.5' }}>
                            {/* Cắt chuỗi customer để lấy địa chỉ (Do backend lưu gộp) */}
                            {order.customer.split('|')[2] || order.customer}
                        </div>
                    </div>
                </aside>

            </main>
        </div>
    );
}

export default ReviewOrder;