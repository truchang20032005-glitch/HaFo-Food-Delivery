import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import FoodModal from '../../components/FoodModal';
import { useCart } from '../../context/CartContext';

function RestaurantDetail() {
    const { id } = useParams(); // Lấy ID quán từ URL
    const [restaurant, setRestaurant] = useState(null);
    const [foods, setFoods] = useState([]);

    // State Modal
    const [selectedFood, setSelectedFood] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        // 1. Lấy thông tin quán
        api.get(`/restaurants/${id}`)
            .then(res => setRestaurant(res.data.restaurant || res.data)) // Fix phòng trường hợp API trả về cấu trúc khác
            .catch(err => console.error("Lỗi lấy quán:", err));

        // 2. Lấy Menu của quán
        api.get(`/restaurants/${id}/menu`)
            .then(res => setFoods(res.data))
            .catch(err => console.error("Lỗi lấy menu:", err));
    }, [id]);

    const handleOpenModal = (food) => {
        setSelectedFood(food);
        setShowModal(true);
    };

    // --- HÀM XỬ LÝ ĐƯỜNG DẪN ẢNH ---
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/300x200?text=No+Image';
        // Nếu là link ảnh online (http...) thì giữ nguyên
        if (path.startsWith('http')) return path;
        // Nếu là ảnh upload (uploads/...) thì thêm domain server vào trước
        return `http://localhost:5000/${path.replace(/\\/g, "/")}`; // .replace để sửa lỗi đường dẫn Windows
    };

    if (!restaurant) return <div style={{ padding: 50, textAlign: 'center' }}>Đang tải dữ liệu quán...</div>;

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar />

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <div className="crumb" style={{ fontSize: '13px', color: '#7a6f65', margin: '14px 0' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: '#7a6f65' }}>Trang chủ</Link> <span className="sep">›</span> {restaurant.name}
                </div>

                {/* THÔNG TIN QUÁN */}
                <div className="top" style={{ display: 'grid', gridTemplateColumns: '520px 1fr', gap: '24px', alignItems: 'start' }}>
                    <div className="thumb" style={{ height: '300px', background: '#ddd', borderRadius: '12px', overflow: 'hidden' }}>
                        <img
                            // ✅ SỬA Ở ĐÂY: Dùng hàm getImageUrl
                            src={getImageUrl(restaurant.coverImage || restaurant.image)}
                            alt="Cover"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => e.target.src = 'https://via.placeholder.com/800x400?text=Error'}
                        />
                    </div>
                    <div className="info">
                        <h1 style={{ margin: '0 0 6px', fontSize: '26px', color: '#3A2E2E' }}>{restaurant.name}</h1>
                        <div className="addr" style={{ fontSize: '14px', color: '#6e655d', marginBottom: '8px' }}>
                            {restaurant.address}
                        </div>
                        <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700 }}>
                            <div className="rating" style={{ color: '#F5C048' }}>★ {restaurant.rating || 5.0}</div>
                            <div className="price" style={{ color: '#6e655d' }}>
                                {restaurant.openTime || '07:00'} - {restaurant.closeTime || '22:00'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* THỰC ĐƠN */}
                <div className="board" style={{ background: '#fff', border: '1px solid #e7e0d3', borderRadius: '12px', padding: '16px', marginTop: '22px' }}>
                    <h3 style={{ marginTop: 0, borderBottom: '2px solid #F97350', display: 'inline-block', paddingBottom: '5px' }}>Thực đơn</h3>

                    {foods.length === 0 ? (
                        <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>Quán này chưa đăng món nào.</p>
                    ) : (
                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {foods.map((food) => (
                                <div key={food._id} style={{ display: 'flex', gap: '15px', border: '1px solid #eee', padding: '10px', borderRadius: '8px', background: '#fff' }}>
                                    <img
                                        // ✅ SỬA Ở ĐÂY: Dùng hàm getImageUrl cho món ăn luôn
                                        src={getImageUrl(food.image)}
                                        alt={food.name}
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #eee' }}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=Food'}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: '0 0 5px' }}>{food.name}</h4>
                                        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 5px' }}>{food.description}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 'bold', color: '#F97350' }}>{food.price.toLocaleString()}đ</span>
                                            <button
                                                onClick={() => handleOpenModal(food)}
                                                style={{ background: '#F97350', color: 'white', border: 'none', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >+</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
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