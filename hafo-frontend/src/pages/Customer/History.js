import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';
import { alertSuccess, alertError, alertWarning, alertInfo } from '../../utils/hafoAlert';
import { removeVietnameseTones } from '../../utils/stringUtils';

const toVND = (n) => n?.toLocaleString('vi-VN');

function History() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, danggiao, damua, dahuy
    const [selectedReview, setSelectedReview] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // ✅ Lấy thông tin điều hướng từ Navbar gửi qua
    const { addToCart } = useCart();

    const [searchTerm, setSearchTerm] = useState(""); // State cho ô tìm kiếm
    const [selectedOrder, setSelectedOrder] = useState(null); // Lưu đơn đang xem chi tiết
    const [showDetailModal, setShowDetailModal] = useState(false);

    // LOGIC ĐIỀU HƯỚNG THÔNG MINH (Mở modal khi bấm từ chuông thông báo)
    const handleViewReview = useCallback(async (orderId) => {
        try {
            const res = await api.get(`/customer-reviews/order/${orderId}`);
            setSelectedReview(res.data);
            setShowReviewModal(true);
        } catch (err) {
            alertWarning("Đơn hàng này hiện chưa có đánh giá hoặc phản hồi.");
        }
    }, []);

    // Hàm lấy dữ liệu (Dùng useCallback để fix warning)
    const fetchHistory = useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;
        try {
            const res = await api.get(`/orders?userId=${user.id || user._id}`);
            const myOrders = res.data.filter(o => o.userId === (user.id || user._id));
            myOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(myOrders);
        } catch (err) {
            console.error("Lỗi tải lịch sử:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Lấy dữ liệu lịch sử từ Backend
    useEffect(() => {
        // Chỉ chạy khi orders đã tải xong và có openOrderId trong state
        if (!loading && orders.length > 0 && location.state?.openOrderId) {
            const targetId = location.state.openOrderId;
            const targetOrder = orders.find(o => o._id === targetId);

            if (targetOrder) {
                handleViewReview(targetOrder._id.toString());
                window.history.replaceState({}, document.title);
            }
        }
    }, [location.state, orders, loading, handleViewReview]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    // Hàm xử lý ảnh
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/80?text=HaFo';
        return path;
    };

    // Kiểm tra xem đơn hàng có trong vòng 24h không
    const canEdit = (orderDate) => {
        const now = new Date();
        const receivedDate = new Date(orderDate);
        const diffInHours = (now - receivedDate) / (1000 * 60 * 60);
        return diffInHours <= 24;
    };

    const filteredOrders = useMemo(() => {
        let result = [...orders];

        // Bước A: Lọc theo Tab (giữ nguyên logic cũ)
        if (filter !== 'all') {
            if (filter === 'danggiao') {
                result = result.filter(o => ['new', 'prep', 'ready', 'pickup'].includes(o.status));
            } else if (filter === 'damua') {
                result = result.filter(o => o.status === 'done');
            } else if (filter === 'dahuy') {
                result = result.filter(o => o.status === 'cancel');
            }
        }

        // ✅ 2. XỬ LÝ TÌM KIẾM KHÔNG DẤU
        const keyword = removeVietnameseTones((searchTerm || "").toLowerCase().trim());
        if (keyword) {
            result = result.filter(order =>
                order.items.some(item =>
                    removeVietnameseTones(item.name.toLowerCase()).includes(keyword)
                )
            );
        }

        return result;
    }, [orders, filter, searchTerm]);

    // Xử lí đặt lại/mua lại
    const handleReorder = async (oldOrder) => {
        try {
            // 1. Hiện thông báo đang kiểm tra món
            alertInfo("Đang kiểm tra...", "HaFo đang kiểm tra trạng thái món ăn hiện tại.");

            const unavailableItems = []; // Danh sách món đã ngừng bán
            const itemsToAddToCart = [];

            // 2. Kiểm tra trạng thái thực tế của từng món từ Server
            const checkPromises = oldOrder.items.map(async (item) => {
                try {
                    // Gọi API lấy thông tin mới nhất của món ăn
                    const res = await api.get(`/foods/${item.foodId}`);
                    const currentFood = res.data;

                    // Kiểm tra xem món còn tồn tại và còn bán không
                    if (!currentFood || !currentFood.isAvailable) {
                        unavailableItems.push(item.name);
                        return;
                    }

                    // Nếu còn bán, tính toán lại giá dựa trên Size và Topping cũ
                    const sizePrice = item.selectedSize?.price || 0;
                    const toppingsPrice = item.selectedToppings?.reduce((sum, t) => sum + (t.price || 0), 0) || 0;
                    const basePrice = item.price - sizePrice - toppingsPrice;

                    itemsToAddToCart.push({
                        _id: item.foodId,
                        name: item.name,
                        image: item.image,
                        price: basePrice,

                        selectedSize: item.selectedSize?.name || 'Vừa',
                        sizePrice: sizePrice,
                        selectedToppings: item.selectedToppings || [],

                        quantity: item.quantity,
                        note: item.note,

                        // Thông tin nhà hàng từ đơn cũ
                        restaurantId: oldOrder.restaurantId?._id || oldOrder.restaurantId,
                        restaurantName: oldOrder.restaurantId?.name || "Cửa hàng đối tác",
                        resLat: oldOrder.lat,
                        resLng: oldOrder.lng,

                        uniqueId: Date.now() + Math.random(),
                        finalPrice: item.price
                    });
                } catch (err) {
                    // Nếu lỗi 404 hoặc lỗi server -> Món đã bị xóa khỏi hệ thống
                    unavailableItems.push(item.name);
                }
            });

            // Đợi kiểm tra xong tất cả các món
            await Promise.all(checkPromises);

            // 3. Xử lý kết quả sau khi check
            if (itemsToAddToCart.length > 0) {
                itemsToAddToCart.forEach(item => addToCart(item));

                if (unavailableItems.length > 0) {
                    // Nếu có món còn món mất
                    alertWarning(
                        "Đã thêm một phần!",
                        `Đã thêm các món còn bán. Riêng các món: [${unavailableItems.join(', ')}] hiện không còn khả dụng.`
                    );
                } else {
                    // Nếu tất cả đều còn bán
                    alertSuccess("Thành công!", "Toàn bộ món từ đơn cũ đã được thêm vào giỏ.");
                }
                navigate('/cart');
            } else {
                // Nếu không có món nào còn khả dụng
                alertError("Rất tiếc!", "Tất cả các món trong đơn hàng này hiện đã ngừng kinh doanh.");
            }

        } catch (error) {
            console.error("Lỗi Reorder:", error);
            alertError("Lỗi hệ thống", "Không thể thực hiện mua lại lúc này.");
        }
    };

    const getStatusBadge = (status) => {
        const styles = { padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' };
        switch (status) {
            case 'new': return <span style={{ ...styles, background: '#FFF7E6', color: '#FA8C16' }}>⏳ Chờ xác nhận</span>;
            case 'prep': return <span style={{ ...styles, background: '#E6F7FF', color: '#1890FF' }}>👨‍🍳 Đang chuẩn bị</span>;
            case 'pickup': return <span style={{ ...styles, background: '#F9F0FF', color: '#722ED1' }}>🛵 Đang giao</span>;
            case 'done': return <span style={{ ...styles, background: '#F6FFED', color: '#52C41A' }}>✅ Hoàn thành</span>;
            case 'cancel': return <span style={{ ...styles, background: '#FFF1F0', color: '#F5222D' }}>❌ Đã hủy</span>;
            case 'ready': return <span style={{ ...styles, background: '#f0fff8ff', color: '#1f802aff' }}>✅ Nhà hàng đã xong</span>;
            default: return <span style={{ ...styles, background: '#eee', color: '#666' }}>Không rõ</span>;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: '60px' }}>
            <Navbar onSearch={setSearchTerm} searchValue={searchTerm} />

            <div className="container" style={{ maxWidth: '800px', margin: '20px auto', padding: '0 15px' }}>
                <h2 style={{ color: '#3A2E2E', marginBottom: '20px', fontSize: '24px' }}>📜 Lịch sử đơn hàng</h2>

                {/* TABS BỘ LỌC */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none' }}>
                    {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'danggiao', label: 'Đang xử lý' },
                        { id: 'damua', label: 'Hoàn thành' },
                        { id: 'dahuy', label: 'Đã hủy' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setFilter(tab.id)} style={{ padding: '8px 18px', borderRadius: '25px', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: filter === tab.id ? '#F97350' : '#fff', color: filter === tab.id ? '#fff' : '#666', boxShadow: filter === tab.id ? '0 4px 10px rgba(249, 115, 80, 0.3)' : '0 2px 5px rgba(0,0,0,0.05)' }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* DANH SÁCH ĐƠN */}
                <div className="order-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: '16px' }}>
                            <img src="https://cdn-icons-png.flaticon.com/512/6134/6134065.png" alt="Empty" style={{ width: '100px', opacity: 0.5, marginBottom: '15px' }} />
                            {searchTerm ? (
                                <p style={{ color: '#666' }}>Không tìm thấy món ăn nào khớp với <b>"{searchTerm}"</b></p>
                            ) : (
                                <p style={{ color: '#666' }}>Chưa có đơn hàng nào ở mục này.</p>
                            )}
                        </div>
                    ) : (
                        filteredOrders.map(order => {
                            const firstItemImage = order.items && order.items.length > 0 ? order.items[0].image : null;
                            return (
                                <div key={order._id} style={{ background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #eee', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '12px' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', color: '#888', fontWeight: '500' }}><i className="fa-regular fa-clock"></i> {formatDate(order.createdAt)}</div>
                                            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '2px' }}>#{order._id.slice(-8).toUpperCase()}</div>
                                        </div>
                                        <div>{getStatusBadge(order.status)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ width: '80px', height: '80px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '1px solid #f0f0f0', background: '#f9f9f9' }}>
                                            <img src={getImageUrl(firstItemImage)} alt="Food" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=HaFo'} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '5px' }}>
                                                {order.items[0]?.name}
                                                {order.items.length > 1 && <span style={{ fontWeight: 'normal', color: '#666', fontSize: '13px' }}> (+{order.items.length - 1} món khác)</span>}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#666' }}>
                                                {order.items.slice(0, 2).map((item, idx) => (
                                                    <div key={idx}>{item.quantity}x {item.name}</div>
                                                ))}
                                                {order.items.length > 2 && <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#999' }}>...và các món khác</div>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f5f5f5' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#666' }}>Tổng tiền</div>
                                            <div style={{ fontSize: '18px', fontWeight: '800', color: '#F97350' }}>{toVND(order.total)}đ</div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {['new', 'prep', 'ready', 'pickup'].includes(order.status) && (
                                                <Link to={`/order-tracking/${order._id}`} style={{ textDecoration: 'none', padding: '8px 16px', borderRadius: '20px', background: '#e0f2fe', color: '#0070f3', fontSize: '13px', fontWeight: 'bold' }}>Theo dõi</Link>
                                            )}
                                            <button
                                                className="btn-detail"
                                                onClick={() => { setSelectedOrder(order); setShowDetailModal(true); }}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    background: '#FFF7ED', // Màu cam cực nhạt
                                                    color: '#F97350',      // Màu cam thương hiệu
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                // Hiệu ứng hover nhẹ khi rê chuột vào
                                                onMouseOver={(e) => e.currentTarget.style.background = '#FFEDD5'}
                                                onMouseOut={(e) => e.currentTarget.style.background = '#FFF7ED'}
                                            >
                                                <i className="fa-solid fa-circle-info"></i> Chi tiết
                                            </button>
                                            {order.status === 'done' && (
                                                <>
                                                    <button
                                                        onClick={() => handleReorder(order)}
                                                        style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Mua lại</button>
                                                    {order.isReviewed ? (
                                                        <button onClick={() => handleViewReview(order._id)} style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #F97350', background: '#fff', color: '#F97350', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Xem lại đánh giá</button>
                                                    ) : (
                                                        <Link to={`/review/${order._id}`} style={{ textDecoration: 'none', padding: '8px 20px', borderRadius: '20px', background: '#F97350', color: '#fff', fontSize: '13px', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(249, 115, 80, 0.2)' }}>Đánh giá</Link>
                                                    )}
                                                </>
                                            )}
                                            {order.status === 'cancel' && <button
                                                onClick={() => handleReorder(order)}
                                                style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: '#fff', color: '#555', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>Đặt lại</button>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>



            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            {showDetailModal && selectedOrder && (
                <div className="modal-bg" onClick={() => setShowDetailModal(false)} style={S.modalOverlay}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={S.modalContainer}>

                        {/* Header: Luôn cố định ở trên */}
                        <div style={S.modalHeader}>
                            <h3 style={{ color: '#F97350', margin: 0 }}>
                                Chi tiết đơn #{selectedOrder._id.slice(-6).toUpperCase()}
                            </h3>
                            <button onClick={() => setShowDetailModal(false)} style={S.closeBtn}>✕</button>
                        </div>

                        {/* ✅ THÊM THẺ BỌC Ở GIỮA: Thẻ này sẽ tự cuộn nếu nội dung quá dài */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {/* Thông tin chung */}
                            <div style={S.infoSection}>
                                <p><b>Quán:</b> {selectedOrder.restaurantId?.name || "N/A"}</p>
                                <p><b>Thời gian:</b> {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</p>
                                <p><b>Địa chỉ:</b> {selectedOrder.customer.split('|')[2]}</p>
                            </div>

                            {/* Danh sách món ăn */}
                            <div style={S.itemListContainer}>
                                <h4 style={{ marginBottom: '15px', fontSize: '15px' }}>Món đã đặt:</h4>
                                {/* Bỏ maxHeight cố định của scrollArea để Flexbox tự xử lý */}
                                <div style={{ paddingRight: '10px' }}>
                                    {selectedOrder.items.map((item, index) => (
                                        <div key={index} style={S.foodItem}>
                                            <img src={item.image || "/images/food.png"} alt="" style={S.foodImg} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold' }}>{item.quantity}x {item.name}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{item.note}</div>
                                            </div>
                                            <div style={{ fontWeight: 'bold', color: '#F97350' }}>
                                                {(item.price * item.quantity).toLocaleString()}đ
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer: Luôn cố định ở dưới cùng */}
                        <div style={S.modalFooter}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
                                <b>TỔNG CỘNG:</b>
                                <b style={{ color: '#F97350' }}>{selectedOrder.total.toLocaleString()}đ</b>
                            </div>
                            <button className="btn primary" onClick={() => setShowDetailModal(false)} style={S.btnPrimary}>
                                Đóng cửa sổ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHI TIẾT ĐÁNH GIÁ */}
            {showReviewModal && selectedReview && (
                <div style={S.modalOverlay}>
                    <div style={S.modalContainer} onClick={e => e.stopPropagation()}>
                        <div style={S.modalHeader}>
                            <div>
                                <h3 style={S.modalTitle}>Chi tiết đánh giá</h3>
                                <p style={S.modalSubtitle}>Đơn hàng #{selectedReview.orderId?.slice ? selectedReview.orderId.slice(-6).toUpperCase() : '...'}</p>
                            </div>
                            <button onClick={() => setShowReviewModal(false)} style={S.closeBtnCircle}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div style={S.modalBody}>
                            <div style={S.shipperHighlightCard}>
                                <div style={S.shipperAvatarLarge}><i className="fa-solid fa-motorcycle"></i></div>
                                <div style={{ flex: 1 }}>
                                    <div style={S.labelText}>Tài xế vận chuyển</div>
                                    <div style={S.shipperNameLarge}>{selectedReview.shipperId?.fullName || "Tài xế"}</div>
                                    <div style={S.starRowLarge}>{'★'.repeat(selectedReview.shipperRating || 0)}<span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - (selectedReview.shipperRating || 0))}</span></div>
                                </div>
                            </div>
                            {selectedReview.shipperComment && <div style={S.commentBubble}><i className="fa-solid fa-quote-left" style={{ color: '#F97350', marginRight: '8px', opacity: 0.5 }}></i>{selectedReview.shipperComment}</div>}
                            <div style={S.divider}></div>
                            <div>
                                <h4 style={S.sectionTitle}>🍴 Đánh giá món ăn ({selectedReview.itemReviews?.length || 0})</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedReview.itemReviews?.map((item, idx) => (
                                        <div key={idx} style={S.foodReviewCard}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '5px' }}>
                                                <div style={S.foodName}>{item.name}</div>
                                                <div style={S.starRowSmall}>{'★'.repeat(item.rating || 0)}<span style={{ color: '#E5E7EB' }}>{'★'.repeat(5 - (item.rating || 0))}</span></div>
                                            </div>
                                            {item.comment && <div style={S.foodComment}>{item.comment}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedReview.replies && selectedReview.replies.length > 0 && (
                                <div style={S.replySectionContainer}>
                                    <h4 style={S.sectionTitle}>💬 Phản hồi từ đối tác</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {selectedReview.replies.map((reply, i) => {
                                            const isMerchant = reply.userRole === 'merchant';
                                            return (
                                                <div key={i} style={S.replyChatBubble}>
                                                    <div style={S.replyAvatar(isMerchant)}><i className={`fa-solid ${isMerchant ? 'fa-store' : 'fa-motorcycle'}`}></i></div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={S.replyAuthorName}>{reply.userId?.fullName}<span style={S.replyRoleBadge(isMerchant)}>{isMerchant ? 'Quán' : 'Shipper'}</span></div>
                                                        <div style={S.replyContent}>{reply.content}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={S.modalFooter}>
                            {canEdit(selectedReview.createdAt) ? (
                                <button onClick={() => navigate(`/review/${selectedReview.orderId}?edit=true`)} style={S.editBtnPrimary}><i className="fa-solid fa-pen-to-square" style={{ marginRight: '8px' }}></i> Sửa đánh giá (Còn hiệu lực)</button>
                            ) : (
                                <div style={S.expiredNotice}><i className="fa-solid fa-clock-rotate-left"></i> Đã hết thời hạn chỉnh sửa (24h)</div>
                            )}
                            <button onClick={() => setShowReviewModal(false)} style={S.closeBtnText}>Đóng lại</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const S = {
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)', // Nền tối sang trọng
        display: 'grid',
        placeItems: 'center',       // Căn giữa cả ngang và dọc 100%
        zIndex: 99999,
        backdropFilter: 'blur(8px)', // Làm mờ nền cực đẹp
        padding: '20px'
    },

    // 2. Container: Xóa bỏ margin và transform cũ để hết méo
    modalContainer: {
        backgroundColor: '#fff',
        width: '100%',
        maxWidth: '550px',
        borderRadius: '32px',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',           // Không quá 90% màn hình
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        position: 'relative',
        margin: 'auto'               // Hỗ trợ thêm căn giữa
    },

    // 3. Body: Thanh cuộn mượt mà
    modalBody: {
        padding: '0 30px 30px',
        overflowY: 'auto',           // ✅ TỰ HIỆN THANH CUỘN KHI DÀI
        flex: 1,
        textAlign: 'left',
        // Tùy chỉnh thanh cuộn cho đẹp
        scrollbarWidth: 'thin',
    },

    // Thẻ hiển thị thời gian
    timeHighlightBox: {
        background: '#F8FAFC',
        padding: '15px',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },

    // Ô hiển thị thời gian
    timeBox: {
        background: '#F8FAFC',
        padding: '15px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },

    // Các phần khác giữ nguyên hoặc chỉnh nhẹ
    modalHeader: {
        padding: '24px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fff'
    },
    modalFooter: {
        padding: '20px 30px',
        borderTop: '1px solid #F1F5F9',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    modalTitle: { margin: 0, fontSize: '20px', fontWeight: '800', color: '#111827' },
    modalSubtitle: { margin: '4px 0 0', fontSize: '13px', color: '#6B7280' },
    closeBtnCircle: { width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: '#F3F4F6', color: '#4B5563', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' },
    shipperHighlightCard: { display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', background: '#FFF7ED', borderRadius: '16px', border: '1px solid #FFEDD5' },
    shipperAvatarLarge: { width: '56px', height: '56px', borderRadius: '50%', background: '#F97350', color: 'white', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(249, 115, 80, 0.2)' },
    labelText: { fontSize: '12px', color: '#9A3412', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
    shipperNameLarge: { fontSize: '18px', fontWeight: '800', color: '#9A3412', margin: '2px 0' },
    starRowLarge: { fontSize: '20px', color: '#FBBF24', letterSpacing: '2px' },
    commentBubble: { marginTop: '15px', padding: '15px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#374151', fontStyle: 'italic', lineHeight: '1.5' },
    divider: { height: '1px', background: '#E5E7EB', margin: '25px 0' },
    sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: '0 0 15px' },
    foodReviewCard: { padding: '15px', background: '#fff', borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' },
    foodName: { fontWeight: '700', fontSize: '15px', color: '#374151' },
    starRowSmall: { fontSize: '14px', color: '#FBBF24' },
    foodComment: { fontSize: '13px', color: '#6B7280', marginTop: '8px', lineHeight: '1.4' },
    replySectionContainer: { marginTop: '30px', paddingTop: '25px', borderTop: '2px dashed #E5E7EB' },
    replyChatBubble: { display: 'flex', gap: '12px' },
    replyAvatar: (isMerchant) => ({ width: '32px', height: '32px', borderRadius: '50%', background: isMerchant ? '#EFF6FF' : '#F0FDF4', color: isMerchant ? '#2563EB' : '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }),
    replyAuthorName: { fontWeight: '700', fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' },
    replyRoleBadge: (isMerchant) => ({ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: isMerchant ? '#DBEAFE' : '#DCFCE7', color: isMerchant ? '#1E40AF' : '#166534', fontWeight: '800', textTransform: 'uppercase' }),
    replyContent: { marginTop: '4px', padding: '10px 14px', background: '#fff', borderRadius: '4px 16px 16px 16px', border: '1px solid #E5E7EB', fontSize: '13px', color: '#374151', lineHeight: '1.5' },
    editBtnPrimary: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#F97350', color: '#fff', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249, 115, 80, 0.25)', transition: 'all 0.2s' },
    expiredNotice: { textAlign: 'center', fontSize: '13px', color: '#6B7280', padding: '10px', background: '#F3F4F6', borderRadius: '12px', fontWeight: '600' },
    closeBtnText: { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: '#fff', color: '#6B7280', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' },
    closeBtn: { border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' },
    infoSection: { padding: '20px 25px', background: '#fcfcfc', borderBottom: '1px solid #f5f5f5', fontSize: '14px', lineHeight: '1.6' },
    itemListContainer: { padding: '20px 25px' },
    // ✅ Khu vực cuộn
    scrollArea: { maxHeight: '250px', overflowY: 'auto', paddingRight: '10px' },
    foodItem: { display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', paddingBottom: '15px', borderBottom: '1px solid #f9f9f9' },
    foodImg: { width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' },
    btnPrimary: { width: '100%', marginTop: '15px', padding: '12px', borderRadius: '12px', border: 'none', background: '#F97350', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }
};

export default History;