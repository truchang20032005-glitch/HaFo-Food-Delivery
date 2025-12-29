import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import AddDishModal from './AddDishModal';

function Menu() {
    const [foods, setFoods] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [myShop, setMyShop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingFood, setEditingFood] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);

    const fetchShopInfo = useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            try {
                const res = await api.get(`/restaurants/my-shop/${user.id}`);
                if (res.data) {
                    setMyShop(res.data);
                    fetchMenu(res.data._id);
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin quán:", err);
            } finally {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchShopInfo();
    }, [fetchShopInfo]);

    const fetchMenu = async (restaurantId) => {
        try {
            const res = await api.get(`/restaurants/${restaurantId}/menu`);
            setFoods(res.data);
        } catch (err) { console.error(err); }
    };

    // --- HÀM BẬT/TẮT MÓN MỚI ---
    const handleToggleStatus = async (food) => {
        try {
            const newStatus = !food.isAvailable;
            // Gọi API sửa món để cập nhật trường isAvailable
            await api.put(`/foods/${food._id}`, { isAvailable: newStatus });

            // Cập nhật lại state local để giao diện đổi ngay lập tức
            setFoods(foods.map(f => f._id === food._id ? { ...f, isAvailable: newStatus } : f));
        } catch (err) {
            alert("Lỗi cập nhật trạng thái: " + err.message);
        }
    };

    const handleAdd = () => {
        setEditingFood(null);
        setShowModal(true);
    };

    const handleEdit = (food) => {
        setEditingFood(food);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn chắc chắn muốn xóa món này?")) {
            try {
                await api.delete(`/foods/${id}`);
                fetchMenu(myShop._id);
            } catch (err) { alert("Lỗi xóa: " + err.message); }
        }
    };

    if (loading) return <div style={{ padding: 20 }}>Đang tải...</div>;
    if (!myShop) return <div style={{ textAlign: 'center', padding: 40 }}>Lỗi dữ liệu quán.</div>;

    return (
        <section className="panel">
            <div className="head">
                {/* Con thứ nhất: Nhóm Tiêu đề (Nằm bên trái) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-utensils" style={{ color: '#F97350' }}></i>
                    <span>Quản lý thực đơn</span>
                </div>

                {/* Con thứ hai: Nút bấm (Sẽ được đẩy sang bên phải) */}
                <button className="btn primary small" onClick={handleAdd}>
                    <i className="fa-solid fa-plus"></i> Thêm món mới
                </button>
            </div>
            <div className="body">
                {/* KHUNG CUỘN CHO MENU */}
                <div style={{
                    maxHeight: '700px',
                    overflowY: 'auto',
                    paddingRight: '5px',
                    borderRadius: '8px'
                }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <thead>
                            <tr style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1, boxShadow: '0 2px 2px -1px rgba(0,0,0,0.05)' }}>
                                <th style={{ padding: '12px' }}>Ảnh</th>
                                <th>Tên món ăn</th>
                                <th>Giá bán</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                                <th style={{ textAlign: 'center' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {foods.map((food) => (
                                <tr key={food._id} style={{
                                    background: food.isAvailable ? '#fff' : '#f9f9f9',
                                    opacity: food.isAvailable ? 1 : 0.7
                                }}>
                                    <td style={{ padding: '12px' }}>
                                        <div
                                            style={{
                                                width: 100, // Tăng lên 100px cho dễ nhìn
                                                height: 100,
                                                borderRadius: 12,
                                                overflow: 'hidden',
                                                cursor: 'zoom-in', // Hiệu ứng bàn tay khi rê chuột vào
                                                border: '1px solid #eee',
                                                background: '#f9f9f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onClick={() => setPreviewImage(food.image)} // Click để xem full
                                        >
                                            <img
                                                src={food.image || "https://via.placeholder.com/100"}
                                                alt={food.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover', // Để ảnh lấp đầy ô vuông cho đẹp giao diện bảng
                                                }}
                                            />
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#333' }}>{food.name}</div>
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                            {food.options?.length > 0 ? `${food.options.length} kích cỡ` : 'Tiêu chuẩn'}
                                            {food.toppings?.length > 0 && ` • ${food.toppings.length} topping`}
                                        </div>
                                    </td>
                                    <td style={{ color: '#F97350', fontWeight: '800', fontSize: '16px' }}>
                                        {food.price?.toLocaleString()}đ
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {/* NÚT GẠT BẬT/TẮT MÓN */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                            <label className="switch">
                                                <input
                                                    type="checkbox"
                                                    checked={food.isAvailable}
                                                    onChange={() => handleToggleStatus(food)}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                            <span style={{ fontSize: '10px', fontWeight: 'bold', color: food.isAvailable ? '#22C55E' : '#EF4444' }}>
                                                {food.isAvailable ? 'ĐANG BÁN' : 'HẾT MÓN'}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                                            <button className="btn small soft" onClick={() => handleEdit(food)} title="Chỉnh sửa">
                                                <i className="fa-solid fa-pen-to-square" style={{ fontSize: '16px', color: '#64748b' }}></i>
                                            </button>
                                            <button className="btn small danger" onClick={() => handleDelete(food._id)} title="Xóa món">
                                                <i className="fa-solid fa-trash-can" style={{ fontSize: '16px', color: '#EF4444' }}></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {foods.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            <i className="fa-solid fa-utensils" style={{ fontSize: '32px', marginBottom: '10px' }}></i>
                            <p>Chưa có món ăn nào trong thực đơn.</p>
                        </div>
                    )}
                </div>


            </div>
            {showModal && (
                <AddDishModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    onRefresh={() => fetchMenu(myShop._id)}
                    restaurantId={myShop._id}
                    editFood={editingFood}
                />
            )}
            {previewImage && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.8)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: 'zoom-out'
                    }}
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="Full Preview"
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            borderRadius: '8px',
                            boxShadow: '0 5px 30px rgba(0,0,0,0.5)'
                        }}
                    />
                    <button
                        style={{
                            position: 'absolute', top: 20, right: 20,
                            background: '#fff', border: 'none', borderRadius: '50%',
                            width: 40, height: 40, cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >✕</button>
                </div>
            )}
        </section>
    );
}

export default Menu;