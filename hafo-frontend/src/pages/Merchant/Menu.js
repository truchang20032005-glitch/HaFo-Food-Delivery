import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AddDishModal from './AddDishModal';

function Menu() {
    const [foods, setFoods] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [myShop, setMyShop] = useState(null);
    const [loading, setLoading] = useState(true);

    // State lưu món đang được chọn để sửa
    const [editingFood, setEditingFood] = useState(null);

    // ... (Phần fetchShopInfo giữ nguyên) ...
    const fetchShopInfo = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            try {
                const res = await axios.get(`http://localhost:5000/api/restaurants/my-shop/${user.id}`);
                if (res.data) {
                    setMyShop(res.data);
                    fetchMenu(res.data._id);
                } else {
                    console.log("Chưa tìm thấy quán...");
                }
            } catch (err) {
                console.error("Lỗi lấy thông tin quán:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => { fetchShopInfo(); }, []);

    const fetchMenu = async (restaurantId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/restaurants/${restaurantId}/menu`);
            setFoods(res.data);
        } catch (err) { console.error(err); }
    };

    // Hàm mở modal Thêm
    const handleAdd = () => {
        setEditingFood(null); // Reset
        setShowModal(true);
    };

    // Hàm mở modal Sửa
    const handleEdit = (food) => {
        setEditingFood(food); // Lưu món cần sửa
        setShowModal(true);
    };

    // Hàm Xóa món (Giữ nguyên)
    const handleDelete = async (id) => {
        if (window.confirm("Bạn chắc chắn muốn xóa món này?")) {
            try {
                await axios.delete(`http://localhost:5000/api/foods/${id}`);
                fetchMenu(myShop._id);
            } catch (err) { alert("Lỗi xóa: " + err.message); }
        }
    };

    if (loading) return <div style={{ padding: 20 }}>Đang tải...</div>;
    if (!myShop) return <div style={{ textAlign: 'center', padding: 40 }}>Lỗi dữ liệu quán.</div>;

    return (
        <section className="panel">
            <div className="head">Quản lý thực đơn</div>
            <div className="body">

                <div className="row" style={{ marginBottom: '10px' }}>
                    <div style={{ fontWeight: 'bold', color: '#F97350', fontSize: '16px' }}>{myShop.name}</div>
                    <button className="btn primary small" onClick={handleAdd}>
                        <i className="fa-solid fa-plus"></i> Thêm món
                    </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Ảnh</th>
                            <th>Tên món</th>
                            <th>Giá</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {foods.map((food) => (
                            <tr key={food._id} style={{ borderBottom: '1px dashed #efe2cc' }}>
                                <td style={{ padding: '10px' }}>
                                    <img
                                        src={food.image ? `http://localhost:5000/${food.image}` : 'https://via.placeholder.com/40'}
                                        alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }}
                                    />
                                </td>
                                <td>
                                    <b>{food.name}</b>
                                    {/* Hiển thị label nếu có nhiều size/topping */}
                                    {(food.options?.length > 1 || food.toppings?.length > 0) && (
                                        <div style={{ fontSize: 11, color: '#666' }}>+Tùy chọn</div>
                                    )}
                                </td>
                                <td style={{ color: '#F97350', fontWeight: 'bold' }}>{food.price?.toLocaleString()}đ</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <button
                                            className="btn small soft"
                                            onClick={() => handleEdit(food)}
                                        >
                                            <i className="fa-solid fa-pen"></i>Sửa
                                        </button>

                                        <button
                                            className="btn small danger"
                                            onClick={() => handleDelete(food._id)}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                padding: 0,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <img
                                                src="/images/delete.png"
                                                alt="Xóa"
                                                style={{ width: 22, height: 22, display: 'block' }}
                                            />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {showModal && (
                    <AddDishModal
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        onRefresh={() => fetchMenu(myShop._id)}
                        restaurantId={myShop._id}
                        editFood={editingFood} // Truyền món cần sửa vào Modal
                    />
                )}
            </div>
        </section>
    );
}

export default Menu;