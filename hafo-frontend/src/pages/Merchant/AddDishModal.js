import React, { useState } from 'react';
import axios from 'axios';

function AddDishModal({ isOpen, onClose, onRefresh, restaurantId }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: '',
        image: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) {
            alert("Vui lòng nhập tên và giá món!");
            return;
        }

        if (!restaurantId) {
            alert("Lỗi: Không xác định được ID nhà hàng. Vui lòng tải lại trang.");
            return;
        }

        try {
            // Gửi restaurantId xuống Backend
            await axios.post('http://localhost:5000/api/foods', {
                ...formData,
                restaurantId: restaurantId // <-- THÊM DÒNG NÀY
            });

            alert("Đã thêm món mới thành công!");
            onRefresh(); // Tải lại danh sách món
            onClose();   // Đóng modal
            setFormData({ name: '', price: '', description: '', image: '' }); // Reset form
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || error.message));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="overlay show" style={{ display: 'flex' }}>
            <div className="modal">
                <div className="modal__head">
                    <div className="modal__title">Thêm món mới</div>
                    <button className="modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="modal__body">
                    <div className="sec">
                        <h4>Thông tin món</h4>
                        <div style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Tên món *</label>
                            <input className="wiz-input" name="name" value={formData.name} onChange={handleChange} placeholder="VD: Bún bò Huế" />
                        </div>
                        <div style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Giá bán *</label>
                            <input className="wiz-input" type="number" name="price" value={formData.price} onChange={handleChange} placeholder="VD: 45000" />
                        </div>
                        <div style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Link ảnh (URL)</label>
                            <input className="wiz-input" name="image" value={formData.image} onChange={handleChange} placeholder="https://..." />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>Mô tả</label>
                            <textarea className="note" name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả ngắn về món ăn..."></textarea>
                        </div>
                    </div>
                </div>
                <div className="modal__foot" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn soft" onClick={onClose} style={{ marginRight: 10 }}>Hủy</button>
                    <button className="btn primary" onClick={handleSave}>Lưu & Thêm</button>
                </div>
            </div>
        </div>
    );
}

export default AddDishModal;