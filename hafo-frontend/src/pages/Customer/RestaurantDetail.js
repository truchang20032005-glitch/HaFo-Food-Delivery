import { useState, useEffect, useMemo } from 'react';
import { removeVietnameseTones } from '../../utils/stringUtils';
import api from '../../services/api';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import FoodModal from '../../components/FoodModal';
import { useCart } from '../../context/CartContext';
import { alertInfo } from '../../utils/hafoAlert';

function RestaurantDetail() {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [foods, setFoods] = useState([]);
    const [promos, setPromos] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState(''); // State cho thanh tìm kiếm

    const [selectedFood, setSelectedFood] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const { addToCart } = useCart();

    const [detailFood, setDetailFood] = useState(null); // Lưu món đang xem chi tiết
    const [showDetailModal, setShowDetailModal] = useState(false);

    const [hoveredPromo, setHoveredPromo] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resRest = await api.get(`/restaurants/${id}`);
                setRestaurant(resRest.data.restaurant || resRest.data);

                const resMenu = await api.get(`/restaurants/${id}/menu`);
                setFoods(resMenu.data);

                const resPromo = await api.get(`/promos/${id}`);
                setPromos(resPromo.data);
            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
            }
        };
        fetchData();
    }, [id]);

    // HÀM LỌC MÓN THEO TỪ KHÓA TÌM KIẾM
    const filteredFoods = useMemo(() => {
        const keyword = removeVietnameseTones(searchKeyword.toLowerCase().trim());

        return foods.filter(food => {
            const nameClean = removeVietnameseTones(food.name.toLowerCase());
            const descClean = removeVietnameseTones((food.description || '').toLowerCase());

            return nameClean.includes(keyword) || descClean.includes(keyword);
        });
    }, [foods, searchKeyword]);

    const handleOpenModal = (food) => {
        const [resLng, resLat] = restaurant.location?.coordinates || [106.660172, 10.762622];
        // Tạo một object mới kết hợp thông tin món và thông tin quán
        const foodWithRestaurant = {
            ...food,
            restaurantId: restaurant._id || restaurant.id, // Lấy ID từ state restaurant đã load
            restaurantName: restaurant.name,
            resLat: resLat,
            resLng: resLng               // Lấy tên quán
        };
        setSelectedFood(foodWithRestaurant);
        setShowModal(true);
    };

    // ✅ Logic tính khoảng giá tự động từ menu
    const dynamicPriceRange = useMemo(() => {
        if (!foods || foods.length === 0) return 'Đang cập nhật...';
        const prices = foods.map(f => f.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        // Nếu giá min và max bằng nhau (chỉ có 1 mức giá)
        if (minPrice === maxPrice) return `${minPrice.toLocaleString()}đ`;

        return `${minPrice.toLocaleString()}đ - ${maxPrice.toLocaleString()}đ`;
    }, [foods]);

    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/400x300?text=No+Image';
        return path;
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
            {/* CSS CHO THANH CUỘN ĐẸP HƠN */}
            <style>{`
                .menu-scroll-container::-webkit-scrollbar { width: 6px; }
                .menu-scroll-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .menu-scroll-container::-webkit-scrollbar-thumb { background: #F97350; border-radius: 10px; }
                .menu-scroll-container::-webkit-scrollbar-thumb:hover { background: #e85d3a; }
                @keyframes popIn {
                    0% { opacity: 0; transform: translateX(-50%) translateY(10px) scale(0.9); }
                    100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
                }
                .animate-pop-in {
                    animation: popIn 0.2s ease-out forwards;
                }

                /* --- ✅ THÊM ĐOẠN NÀY VÀO ĐÂY --- */

                /* 1. Thiết lập chuyển động mượt mà cho ảnh */
                .food-card img {
                    /* Dùng cubic-bezier để tạo cảm giác "nhún" nhẹ khi bắt đầu và kết thúc */
                    transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
                    will-change: transform; /* Tối ưu hiệu suất trình duyệt */
                }

                /* 2. Khi rê chuột vào thẻ món ăn (.food-item), thì phóng to cái ảnh bên trong */
                .food-card:hover img {
                    transform: scale(1.12); /* Phóng to lên 12% */
                }

                /* (Tùy chọn) Thêm hiệu ứng nổi nhẹ cho cả cái thẻ để tăng cảm giác 3D */
                .food-card {
                     transition: all 0.3s ease;
                }
                .food-card:hover {
                     transform: translateY(-3px);
                     box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important; /* Ghi đè box-shadow cũ */
                     background: #fff !important;
                }
                
            `}</style>

            <Navbar hideSearch={true} />

            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <div style={{ fontSize: '13px', color: '#7a6f65', margin: '20px 0' }}>
                    <Link to="/" style={{ textDecoration: 'none', color: '#7a6f65' }}>Trang chủ</Link>
                    <span style={{ margin: '0 8px' }}>›</span>
                    <span style={{ color: '#F97350', fontWeight: '600' }}>{restaurant.name}</span>
                </div>

                {/* THÔNG TIN QUÁN */}
                <div style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: '30px', background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        <img src={getImageUrl(restaurant.image)} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 10, left: 10, background: restaurant.isOpen ? '#22C55E' : '#999', color: '#fff', padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                            {restaurant.isOpen ? '● Đang mở cửa' : '● Đóng cửa'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h1 style={{ margin: '0 0 10px', fontSize: '28px', color: '#3A2E2E' }}>{restaurant.name}</h1>
                            <div style={{ background: '#FFF8E1', color: '#F5A524', padding: '5px 12px', borderRadius: '8px', fontWeight: 'bold' }}>
                                <i className="fa-solid fa-star"></i> {restaurant.rating || 5.0}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#555' }}>
                            <div style={{ display: 'flex', gap: '10px' }}><i className="fa-solid fa-location-dot" style={{ color: '#F97350' }}></i><span>{restaurant.address}</span></div>
                            <div style={{ display: 'flex', gap: '30px' }}>
                                <span><i className="fa-regular fa-clock" style={{ color: '#F97350' }}></i> {restaurant.openTime} - {restaurant.closeTime}</span>
                                <span>
                                    <i className="fa-solid fa-wallet" style={{ color: '#F97350' }}></i> {dynamicPriceRange}
                                </span>
                            </div>
                        </div>

                        {/* --- DANH SÁCH MÃ GIẢM GIÁ (PROMOS) --- */}
                        {promos.length > 0 && (
                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px dashed #ddd', position: 'relative' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#F97350', marginBottom: '10px' }}>
                                    <i className="fa-solid fa-ticket"></i> Mã khuyến mãi
                                </div>

                                {/* ✅ BẢNG CHI TIẾT CỐ ĐỊNH TRONG KHU VỰC NÀY (Không bị cắt bởi scroll) */}
                                {hoveredPromo && (
                                    <div className="animate-pop-in" style={{
                                        position: 'absolute',
                                        top: '-10px', // Nhảy lên trên tiêu đề một chút
                                        right: '0',
                                        background: '#333',
                                        color: '#fff',
                                        padding: '15px',
                                        borderRadius: '12px',
                                        width: '240px',
                                        zIndex: 9999,
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                        fontSize: '12px'
                                    }}>
                                        <div style={{ color: '#F97350', fontWeight: '900', marginBottom: '8px', borderBottom: '1px solid #555', paddingBottom: '5px' }}>
                                            THÔNG TIN ƯU ĐÃI: {hoveredPromo.code}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <span>• <b>Giảm giá:</b> {hoveredPromo.type === 'amount' ? hoveredPromo.value.toLocaleString() + 'đ' : hoveredPromo.value + '%'}</span>
                                            <span>• <b>Đơn tối thiểu:</b> {hoveredPromo.minOrder.toLocaleString()}đ</span>
                                            <span>• <b>Số lượng còn:</b> {hoveredPromo.limit} lượt</span>
                                            <span style={{ fontSize: '11px', color: '#aaa', marginTop: '5px' }}>
                                                Hạn dùng: {new Date(hoveredPromo.startDate).toLocaleDateString('vi-VN')} - {new Date(hoveredPromo.endDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* KHUNG CUỘN VÉ (GIỮ NGUYÊN GIAO DIỆN CŨ) */}
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
                                    {promos.map(promo => (
                                        promo.isActive && (
                                            <div
                                                key={promo._id}
                                                onMouseEnter={() => setHoveredPromo(promo)} // Rê chuột vào: hiện modal
                                                onMouseLeave={() => setHoveredPromo(null)}  // Rê chuột ra: ẩn modal
                                                onClick={() => navigator.clipboard.writeText(promo.code) && alertInfo(`Đã sao chép mã: ${promo.code}`)}
                                                style={{
                                                    border: '1px dashed #F97350', background: '#FFF5F2',
                                                    padding: '8px 12px', borderRadius: '8px', minWidth: '140px',
                                                    display: 'flex', flexDirection: 'column', gap: '4px', cursor: 'pointer', position: 'relative',
                                                    flexShrink: 0 // Đảm bảo không bị bóp méo khi cuộn
                                                }}
                                            >
                                                <div style={{ fontWeight: 'bold', color: '#F97350', fontSize: '13px' }}>{promo.code}</div>
                                                <div style={{ fontSize: '11px', color: '#666' }}>
                                                    Giảm {promo.type === 'amount' ? promo.value.toLocaleString() + 'đ' : promo.value + '%'}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#999' }}>Đơn tối thiểu {promo.minOrder.toLocaleString()}đ</div>

                                                {/* Hai cái lỗ tròn trang trí của má */}
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

                {/* --- PHẦN 2: THỰC ĐƠN (CÓ TÌM KIẾM VÀ THANH CUỘN) --- */}
                <div style={{ marginTop: '30px', background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                        <h3 style={{ fontSize: '20px', borderLeft: '4px solid #F97350', paddingLeft: '10px', color: '#333', margin: 0 }}>
                            Thực đơn món ngon
                        </h3>

                        {/* THANH TÌM KIẾM MÓN ĂN */}
                        <div style={{ position: 'relative', width: '300px' }}>
                            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' }}></i>
                            <input
                                type="text"
                                placeholder="Tìm món ngon tại quán..."
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                style={{ width: '100%', padding: '10px 15px 10px 40px', borderRadius: '25px', border: '1px solid #ddd', outline: 'none', fontSize: '14px' }}
                            />
                        </div>
                    </div>

                    {/* KHUNG CUỘN MENU */}
                    <div
                        className="menu-scroll-container"
                        style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '10px' }}
                    >
                        {filteredFoods.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                                <p>{searchKeyword ? 'Không tìm thấy món phù hợp.' : 'Quán chưa có món ăn.'}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                                {filteredFoods.map((food) => (
                                    <div key={food._id} style={{ display: 'flex', gap: '15px', padding: '15px', borderRadius: '12px', border: '1px solid #eee' }} className="food-card">
                                        <div style={{ width: '100px', height: '100px', flexShrink: 0, borderRadius: '10px', overflow: 'hidden' }}>
                                            <img src={food.image || "/images/default-food.png"} alt={food.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 5px', fontSize: '16px' }}>{food.name}</h4>
                                                {/* ✅ Giới hạn mô tả chỉ hiện 1 dòng, nếu dài quá sẽ hiện dấu ... */}
                                                <p style={{
                                                    fontSize: '12px', color: '#777', margin: 0,
                                                    display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                }}>
                                                    {food.description || 'Chưa có mô tả món.'}
                                                </p>
                                                {/* ✅ Nút xem chi tiết nhỏ xinh */}
                                                <span
                                                    onClick={() => { setDetailFood(food); setShowDetailModal(true); }}
                                                    style={{ fontSize: '11px', color: '#F97350', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                                                >
                                                    Xem chi tiết
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 'bold', color: '#F97350' }}>{food.price.toLocaleString()}đ</span>
                                                <button
                                                    disabled={!food.isAvailable || !restaurant.isOpen}
                                                    onClick={() => handleOpenModal(food)}
                                                    className="btn primary small"
                                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                                >
                                                    + Thêm
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedFood && <FoodModal isOpen={showModal} onClose={() => setShowModal(false)} food={selectedFood} onAddToCart={addToCart} />}
            {/* MODAL XEM CHI TIẾT MÔ TẢ MÓN */}
            {showDetailModal && detailFood && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowDetailModal(false)}>
                    <div style={{ background: '#fff', width: '400px', borderRadius: '24px', overflow: 'hidden', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        {/* Ảnh món vừa vặn, không tràn */}
                        <div style={{ width: '100%', height: '220px', background: '#f5f5f5' }}>
                            <img src={detailFood.image || "/images/default-food.png"} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '10px' }} alt="Detail" />
                        </div>

                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>{detailFood.name}</h3>
                                <b style={{ color: '#F97350', fontSize: '18px' }}>{detailFood.price.toLocaleString()}đ</b>
                            </div>

                            <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '12px', border: '1px solid #E2E8F0', minHeight: '80px' }}>
                                <small style={{ color: '#94A3B8', fontWeight: '800', textTransform: 'uppercase', fontSize: '10px', display: 'block', marginBottom: '5px' }}>Mô tả món ăn</small>
                                <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                    {detailFood.description || 'Quán chưa cập nhật mô tả cho món này.'}
                                </p>
                            </div>

                            <button
                                onClick={() => setShowDetailModal(false)}
                                style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#F97350', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Đóng lại
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RestaurantDetail;