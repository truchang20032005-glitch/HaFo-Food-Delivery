import React, { useState } from 'react';
import axios from 'axios';

function AddDishModal({ isOpen, onClose, onRefresh, restaurantId }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        description: ''
    });
    const [imageFile, setImageFile] = useState(null); // ← State cho file ảnh
    const [imagePreview, setImagePreview] = useState(''); // ← Preview ảnh
    const [loading, setLoading] = useState(false);

    // --- STATE CHO TÙY CHỌN NÂNG CAO ---
    const [options, setOptions] = useState([{ name: 'Vừa', price: 0 }]); // Mặc định có size Vừa
    const [toppings, setToppings] = useState([]); // Mặc định không có topping

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // ✅ XỬ LÝ CHỌN FILE ẢNH
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Kiểm tra loại file
            if (!file.type.startsWith('image/')) {
                alert('Vui lòng chọn file ảnh!');
                return;
            }

            // Kiểm tra kích thước (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Ảnh không được vượt quá 5MB!');
                return;
            }

            setImageFile(file);

            // Tạo preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // ✅ XÓA ẢNH ĐÃ CHỌN
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview('');
    };

    // --- QUẢN LÝ SIZE ---
    const addOption = () => setOptions([...options, { name: '', price: 0 }]);
    const removeOption = (idx) => setOptions(options.filter((_, i) => i !== idx));
    const updateOption = (idx, field, val) => {
        const newOpts = [...options];
        newOpts[idx][field] = field === 'price' ? Number(val) : val;
        setOptions(newOpts);
    };

    // --- QUẢN LÝ TOPPING ---
    const addTopping = () => setToppings([...toppings, { name: '', price: 0 }]);
    const removeTopping = (idx) => setToppings(toppings.filter((_, i) => i !== idx));
    const updateTopping = (idx, field, val) => {
        const newTopps = [...toppings];
        newTopps[idx][field] = field === 'price' ? Number(val) : val;
        setToppings(newTopps);
    };


    const handleSave = async () => {
        // Validation
        if (!formData.name || !formData.price) {
            alert("Vui lòng nhập tên và giá món!");
            return;
        }

        if (!restaurantId) {
            alert("Lỗi: Không xác định được ID nhà hàng.");
            return;
        }

        setLoading(true);

        try {
            // ✅ SỬ DỤNG FormData để gửi file
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('price', formData.price);
            submitData.append('description', formData.description);
            submitData.append('restaurantId', restaurantId);

            if (imageFile) {
                submitData.append('image', imageFile); // ← Thêm file ảnh
            }

            // Gửi mảng object dưới dạng JSON string để Backend parse
            submitData.append('options', JSON.stringify(options));
            submitData.append('toppings', JSON.stringify(toppings));

            const response = await axios.post('http://localhost:5000/api/foods', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            console.log('✅ Thêm món thành công:', response.data);
            alert("Đã thêm món mới thành công!");

            // Reset form
            setFormData({ name: '', price: '', description: '' });
            setImageFile(null);
            setImagePreview('');

            // Refresh và đóng modal
            onRefresh();
            onClose();

        } catch (error) {
            console.error('❌ Lỗi thêm món:', error.response?.data || error.message);
            alert("Lỗi thêm món: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`modal ${isOpen ? 'show' : ''}`}>
            <div className="sheet">
                {/* HEADER */}
                <div className="head">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Thêm món mới</span>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.5 : 1,
                                color: '#666'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* BODY */}
                <div className="body">
                    <div className="sec" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h4 style={{ marginTop: 0, marginBottom: 20, color: 'var(--cam)' }}>
                            📋 Thông tin món ăn
                        </h4>

                        {/* TÊN MÓN */}
                        <div style={{ marginBottom: 16 }}>
                            <label>Tên món *</label>
                            <input
                                className="wiz-input"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="VD: Bún bò Huế"
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* GIÁ BÁN */}
                        <div style={{ marginBottom: 16 }}>
                            <label>Giá bán (VNĐ) *</label>
                            <input
                                type="number"
                                className="wiz-input"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="VD: 45000"
                                min="0"
                                step="1000"
                                disabled={loading}
                                required
                            />
                        </div>

                        {/* SIZE / TÙY CHỌN */}
                        <div className="sec">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <h4 style={{ margin: 0 }}>Kích cỡ / Phân loại</h4>
                                <button type="button" className="btn small soft" onClick={addOption}>+ Thêm size</button>
                            </div>
                            {options.map((opt, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, marginBottom: 10 }}>
                                    <input className="wiz-input" placeholder="Tên (VD: Lớn)" value={opt.name} onChange={e => updateOption(idx, 'name', e.target.value)} />
                                    <input className="wiz-input" type="number" placeholder="Giá thêm" value={opt.price} onChange={e => updateOption(idx, 'price', e.target.value)} />
                                    <button className="btn danger small" onClick={() => removeOption(idx)} style={{ height: '100%' }}>X</button>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px dashed #eee', margin: '20px 0' }}></div>

                        {/* TOPPING */}
                        <div className="sec">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <h4 style={{ margin: 0 }}>Topping (Món thêm)</h4>
                                <button type="button" className="btn small soft" onClick={addTopping}>+ Thêm topping</button>
                            </div>
                            {toppings.length === 0 && <div style={{ color: '#999', fontSize: 13, fontStyle: 'italic' }}>Chưa có topping nào.</div>}

                            {toppings.map((top, idx) => (
                                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, marginBottom: 10 }}>
                                    <input className="wiz-input" placeholder="Tên (VD: Thêm chả)" value={top.name} onChange={e => updateTopping(idx, 'name', e.target.value)} />
                                    <input className="wiz-input" type="number" placeholder="Giá bán" value={top.price} onChange={e => updateTopping(idx, 'price', e.target.value)} />
                                    <button className="btn danger small" onClick={() => removeTopping(idx)} style={{ height: '100%' }}>X</button>
                                </div>
                            ))}
                        </div>

                        {/* ✅ UPLOAD ẢNH */}
                        <div style={{ marginBottom: 16 }}>
                            <label>Ảnh món ăn</label>

                            {!imagePreview ? (
                                <div style={{
                                    border: '2px dashed var(--line)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    background: '#FFFCF5',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.style.borderColor = 'var(--cam)';
                                    }}
                                    onDragLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--line)';
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.style.borderColor = 'var(--line)';
                                        const file = e.dataTransfer.files[0];
                                        if (file) {
                                            handleImageChange({ target: { files: [file] } });
                                        }
                                    }}
                                    onClick={() => document.getElementById('imageInput').click()}>
                                    <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '32px', color: 'var(--cam)', marginBottom: '10px' }}></i>
                                    <p style={{ margin: '10px 0 5px', fontWeight: 'bold' }}>
                                        Click hoặc kéo thả ảnh vào đây
                                    </p>
                                    <p style={{ fontSize: '13px', color: '#888', margin: 0 }}>
                                        JPG, PNG, WEBP (tối đa 5MB)
                                    </p>
                                    <input
                                        id="imageInput"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        disabled={loading}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            ) : (
                                <div style={{
                                    position: 'relative',
                                    border: '1px solid var(--line)',
                                    borderRadius: '12px',
                                    padding: '10px',
                                    background: '#FFFCF5'
                                }}>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{
                                            width: '100%',
                                            maxHeight: '300px',
                                            objectFit: 'contain',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <button
                                        onClick={handleRemoveImage}
                                        disabled={loading}
                                        style={{
                                            position: 'absolute',
                                            top: '20px',
                                            right: '20px',
                                            background: 'rgba(0,0,0,0.7)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            cursor: 'pointer',
                                            fontSize: '18px'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* MÔ TẢ */}
                        <div style={{ marginBottom: 16 }}>
                            <label>Mô tả món ăn</label>
                            <textarea
                                className="note"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Mô tả ngắn gọn về món ăn, nguyên liệu, vị..."
                                rows="4"
                                disabled={loading}
                                style={{ minHeight: '100px' }}
                            />
                        </div>

                        {/* BUTTONS */}
                        <div style={{
                            display: 'flex',
                            gap: 10,
                            justifyContent: 'flex-end',
                            marginTop: 24,
                            paddingTop: 16,
                            borderTop: '1px solid var(--line)'
                        }}>
                            <button
                                type="button"
                                className="btn soft"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="btn primary"
                                onClick={handleSave}
                                disabled={loading}
                            >
                                {loading ? '⏳ Đang lưu...' : '💾 Lưu & Thêm'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddDishModal;