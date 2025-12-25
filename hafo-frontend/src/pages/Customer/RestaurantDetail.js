import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import FoodModal from '../../components/FoodModal';
import { useCart } from '../../context/CartContext';

function RestaurantDetail() {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [foods, setFoods] = useState([]);
    const [promos, setPromos] = useState([]); // State lưu mã giảm giá

    // State Modal & Cart
    const [selectedFood, setSelectedFood] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Lấy thông tin quán
                const resRest = await api.get(`/restaurants/${id}`);
                setRestaurant(resRest.data.restaurant || resRest.data);

                // 2. Lấy Menu
                const resMenu = await api.get(`/restaurants/${id}/menu`);
                setFoods(resMenu.data);

                // 3. Lấy Mã khuyến mãi
                const resPromo = await api.get(`/promos/${id}`);
                setPromos(resPromo.data);

            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
            }
        };
        fetchData();
    }, [id]);

    const handleOpenModal = (food) => {
        setSelectedFood(food);
        setShowModal(true);
    };

    // Helper xử lý ảnh
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/400x300?text=No+Image';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000/${path.replace(/\\/g, "/")}`;
    };

    if (!restaurant) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F7F2E5' }}>
            <div style={{ textAlign: 'center', color: '#F97350' }}>
                <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '40px' }}></i>
                <p style={{ marginTop: '10px' }}>Đang tải quán ngon...</p>
            </div>
        </div>
    );

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: '50px' }}>
            <Navbar />

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                {/* Breadcrumb */}
                <div style={{ fontSize: '13px', color: '#7a6f65', margin: '20px 0' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: '#7a6f65' }}>Trang chủ</Link>
                    <span style={{ margin: '0 8px' }}>›</span>
                    <span style={{ color: '#F97350', fontWeight: '600' }}>{restaurant.name}</span>
                </div>

                {/* --- PHẦN 1: THÔNG TIN QUÁN (INFO BOX) --- */}
                <div style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: '30px', background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>

                    {/* Cột Trái: Ảnh Bìa */}
                    <div style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        <img
                            src={getImageUrl(restaurant.image)}
                            alt="Cover"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => e.target.src = 'https://via.placeholder.com/400x300'}
                        />
                        {/* Badge Trạng thái trên ảnh */}
                        <div style={{
                            position: 'absolute', top: 10, left: 10,
                            background: restaurant.isOpen ? '#22C55E' : '#999',
                            color: '#fff', padding: '5px 10px', borderRadius: '20px',
                            fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}>
                            {restaurant.isOpen ? '● Đang mở cửa' : '● Đóng cửa'}
                        </div>
                    </div>

                    {/* Cột Phải: Thông tin chi tiết */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h1 style={{ margin: '0 0 10px', fontSize: '28px', color: '#3A2E2E', lineHeight: '1.2' }}>{restaurant.name}</h1>
                            <div style={{ background: '#FFF8E1', color: '#F5A524', padding: '5px 12px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <i className="fa-solid fa-star"></i> {restaurant.rating || 5.0} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>/ 5</span>
                            </div>
                        </div>

                        {/* Các dòng thông tin (Icon + Text) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px', color: '#555' }}>

                            {/* Địa chỉ */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <i className="fa-solid fa-location-dot" style={{ color: '#F97350', marginTop: '3px' }}></i>
                                <span>{restaurant.address}, {restaurant.district}, {restaurant.city}</span>
                            </div>

                            {/* Giờ mở cửa & Giá */}
                            <div style={{ display: 'flex', gap: '30px' }}>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <i className="fa-regular fa-clock" style={{ color: '#F97350' }}></i>
                                    <span>{restaurant.openTime} - {restaurant.closeTime}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <i className="fa-solid fa-wallet" style={{ color: '#F97350' }}></i>
                                    <span>{restaurant.priceRange || '20.000đ - 100.000đ'}</span>
                                </div>
                            </div>

                            {/* Món đặc trưng (Tags) */}
                            {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <i className="fa-solid fa-utensils" style={{ color: '#F97350' }}></i>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {restaurant.cuisine.map((tag, idx) => (
                                            <span key={idx} style={{ background: '#f3f4f6', color: '#555', padding: '3px 10px', borderRadius: '12px', fontSize: '12px', border: '1px solid #eee' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* --- DANH SÁCH MÃ GIẢM GIÁ (PROMOS) --- */}
                        {promos.length > 0 && (
                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed #ddd' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F97350', marginBottom: '10px' }}>
                                    <i className="fa-solid fa-ticket"></i> Mã khuyến mãi
                                </div>
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                                    {promos.map(promo => (
                                        promo.isActive && (
                                            <div key={promo._id} style={{
                                                border: '1px dashed #F97350', background: '#FFF5F2',
                                                padding: '8px 12px', borderRadius: '8px', minWidth: '140px',
                                                display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', position: 'relative'
                                            }} onClick={() => navigator.clipboard.writeText(promo.code) && alert(`Đã sao chép mã: ${promo.code}`)}>
                                                <div style={{ fontWeight: 'bold', color: '#F97350', fontSize: '13px' }}>{promo.code}</div>
                                                <div style={{ fontSize: '11px', color: '#666' }}>
                                                    Giảm {promo.type === 'amount' ? promo.value.toLocaleString() + 'đ' : promo.value + '%'}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#999' }}>Đơn tối thiểu {promo.minOrder.toLocaleString()}đ</div>
                                                {/* Vòng tròn trang trí giống vé */}
                                                <div style={{ position: 'absolute', left: -6, top: '50%', marginTop: -6, width: 12, height: 12, background: '#fff', borderRadius: '50%', borderRight: '1px solid #F97350' }}></div>
                                                <div style={{ position: 'absolute', right: -6, top: '50%', marginTop: -6, width: 12, height: 12, background: '#fff', borderRadius: '50%', borderLeft: '1px solid #F97350' }}></div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- PHẦN 2: THỰC ĐƠN (MENU) --- */}
                <div style={{ marginTop: '30px' }}>
                    <h3 style={{ fontSize: '20px', borderLeft: '4px solid #F97350', paddingLeft: '10px', color: '#333' }}>
                        Thực đơn món ngon ({foods.length})
                    </h3>

                    {foods.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888', background: '#fff', borderRadius: '12px' }}>
                            <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="No food" style={{ width: 60, opacity: 0.5, marginBottom: 10 }} />
                            <p>Quán chưa cập nhật thực đơn.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
                            {foods.map((food) => (
                                <div key={food._id} style={{
                                    display: 'flex', gap: '15px', padding: '15px', borderRadius: '12px', background: '#fff',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #eee', transition: 'transform 0.2s'
                                }} className="food-card">

                                    {/* Ảnh món */}
                                    <div style={{ width: '100px', height: '100px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                                        <img
                                            src={getImageUrl(food.image)}
                                            alt={food.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/100?text=Food'}
                                        />
                                        {!food.isAvailable && (
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>Hết món</div>
                                        )}
                                    </div>

                                    {/* Thông tin món */}
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div>
                                            <h4 style={{ margin: '0 0 5px', fontSize: '16px', color: '#333' }}>{food.name}</h4>
                                            <p style={{ fontSize: '13px', color: '#777', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {food.description || 'Chưa có mô tả'}
                                            </p>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#F97350', fontSize: '16px' }}>
                                                {food.price.toLocaleString()}đ
                                            </span>

                                            <button
                                                disabled={!food.isAvailable || !restaurant.isOpen}
                                                onClick={() => handleOpenModal(food)}
                                                style={{
                                                    background: food.isAvailable && restaurant.isOpen ? '#F97350' : '#ddd',
                                                    color: 'white', border: 'none',
                                                    padding: '6px 14px', borderRadius: '20px',
                                                    cursor: food.isAvailable && restaurant.isOpen ? 'pointer' : 'not-allowed',
                                                    fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px'
                                                }}
                                            >
                                                <i className="fa-solid fa-plus"></i> Thêm
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Chọn Món */}
            {selectedFood && (
                <FoodModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    food={selectedFood}
                    onAddToCart={addToCart}
                />
            )}
        </div>
    );
}

export default RestaurantDetail;