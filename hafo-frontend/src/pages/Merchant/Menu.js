import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import AddDishModal from './AddDishModal';

function Menu() {
    const [foods, setFoods] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [myShop, setMyShop] = useState(null);
    const [loading, setLoading] = useState(true);

    // 1. Tải thông tin quán và menu
    const fetchShopAndMenu = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            try {
                // Lấy thông tin quán
                const shopRes = await axios.get(`http://localhost:5000/api/restaurants/my-shop/${user.id}`);

                if (shopRes.data) {
                    setMyShop(shopRes.data);
                    // Có quán rồi mới lấy menu
                    fetchMenu(shopRes.data._id);
                }
            } catch (err) {
                console.error("Chưa có thông tin quán hoặc lỗi:", err);
            } finally {
                setLoading(false);
            }
        }
    };

    // Hàm lấy menu riêng
    const fetchMenu = async (restaurantId) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/restaurants/${restaurantId}/menu`);
            setFoods(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchShopAndMenu();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Bạn chắc chắn muốn xóa món này?")) {
            try {
                await axios.delete(`http://localhost:5000/api/foods/${id}`);
                // Load lại menu sau khi xóa
                if (myShop) fetchMenu(myShop._id);
            } catch (err) {
                alert("Lỗi xóa món");
            }
        }
    };

    if (loading) return <div style={{ padding: 20 }}>Đang tải...</div>;

    // --- LOGIC QUAN TRỌNG: CHƯA CÓ QUÁN THÌ KHÔNG CHO THÊM MÓN ---
    if (!myShop) {
        return (
            <div className="panel">
                <div className="head">Quản lý Menu</div>
                <div className="body" style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Bạn chưa cập nhật thông tin cửa hàng.</p>
                    <p>Vui lòng vào mục <b>"Thông tin quán"</b> để tạo quán trước khi thêm món ăn.</p>
                    <Link to="/merchant/storefront" className="btn primary">Tạo cửa hàng ngay</Link>
                </div>
            </div>
        );
    }

    return (
        <section className="panel">
            <div className="head">Quản lý Menu ({foods.length} món)</div>
            <div className="body">
                <button className="btn primary small" onClick={() => setShowModal(true)} style={{ marginBottom: 15 }}>
                    <i className="fa-solid fa-plus"></i> Thêm món mới
                </button>

                {foods.length === 0 ? (
                    <p style={{ color: '#888', fontStyle: 'italic' }}>Chưa có món ăn nào. Hãy thêm món đầu tiên!</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '10px' }}>Ảnh</th>
                                <th>Tên món</th>
                                <th>Giá bán</th>
                                <th>Mô tả</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {foods.map(food => (
                                <tr key={food._id} style={{ borderBottom: '1px dashed #efe2cc' }}>
                                    <td style={{ padding: '10px' }}>
                                        <img 
                                            src={food.image ? `http://localhost:5000/${food.image}` : 'https://via.placeholder.com/40'} 
                                            alt={food.name}
                                            style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} 
                                        />
                                    </td>
                                    <td><b>{food.name}</b></td>
                                    <td style={{ color: '#F97350', fontWeight: 'bold' }}>{food.price?.toLocaleString()}đ</td>
                                    <td style={{ fontSize: '13px', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {food.description}
                                    </td>
                                    <td>
                                        <button className="btn small soft" onClick={() => handleDelete(food._id)} style={{ color: 'red' }}>Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Modal Thêm Món */}
                {showModal && (
                    <AddDishModal
                        isOpen={showModal}
                        onClose={() => setShowModal(false)}
                        onRefresh={() => fetchMenu(myShop._id)}
                        restaurantId={myShop._id}
                    />
                )}
            </div>
        </section>
    );

    
}



export default Menu;