import { useState, useEffect } from 'react';
import api from '../../services/api';

// Thêm prop 'editFood' để nhận dữ liệu món cần sửa
function AddDishModal({ isOpen, onClose, onRefresh, restaurantId, editFood }) {
    const [formData, setFormData] = useState({
        name: '',
        price: '', // lưu dạng "45000" (raw digits) để dễ format
        description: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);

    // State cho tùy chọn nâng cao
    // price lưu dạng chuỗi digits (vd "0", "15000") để hiển thị format
    const [options, setOptions] = useState([{ name: 'Vừa', price: '0' }]);
    const [toppings, setToppings] = useState([]);

    // ====== HELPER: format tiền 45.000 ======
    const onlyDigits = (val) => String(val ?? '').replace(/\D/g, '');
    const formatVND = (val) => {
        const digits = onlyDigits(val);
        if (!digits) return '';
        // thêm dấu chấm phân tách nghìn
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // --- EFFECT: ĐIỀN DỮ LIỆU CŨ NẾU LÀ SỬA ---
    useEffect(() => {
        if (isOpen) {
            if (editFood) {
                // Chế độ Sửa: Fill data cũ
                setFormData({
                    name: editFood.name || '',
                    price: onlyDigits(editFood.price ?? ''), // raw digits
                    description: editFood.description || ''
                });

                // Nếu có ảnh cũ thì hiện preview (ảnh online/local)
                if (editFood.image) {
                    // Không cần check startsWith hay cộng localhost nữa
                    setImagePreview(editFood.image);
                } else {
                    setImagePreview('');
                }

                // Fill options & toppings (nếu có) + convert price về digits string
                if (editFood.options && editFood.options.length > 0) {
                    setOptions(
                        editFood.options.map((o) => ({
                            name: o.name || '',
                            price: onlyDigits(o.price ?? '0')
                        }))
                    );
                } else {
                    setOptions([{ name: 'Vừa', price: '0' }]);
                }

                if (editFood.toppings && editFood.toppings.length > 0) {
                    setToppings(
                        editFood.toppings.map((t) => ({
                            name: t.name || '',
                            price: onlyDigits(t.price ?? '0')
                        }))
                    );
                } else {
                    setToppings([]);
                }

                setImageFile(null);
            } else {
                // Chế độ Thêm mới: Reset trắng
                setFormData({ name: '', price: '', description: '' });
                setImageFile(null);
                setImagePreview('');
                setOptions([{ name: 'Vừa', price: '0' }]);
                setToppings([]);
            }
        }
    }, [isOpen, editFood]);

    // Text thường
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Giá gốc: gõ -> tự format (lưu raw digits)
    const handleBasePriceChange = (e) => {
        const digits = onlyDigits(e.target.value);
        setFormData({ ...formData, price: digits });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) return alert('Vui lòng chọn file ảnh!');
            if (file.size > 5 * 1024 * 1024) return alert('Ảnh không được vượt quá 5MB!');

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    // --- QUẢN LÝ SIZE ---
    const addOption = () => setOptions([...options, { name: '', price: '' }]);
    const removeOption = (idx) => setOptions(options.filter((_, i) => i !== idx));

    const updateOption = (idx, field, val) => {
        const newOpts = [...options];
        if (field === 'price') {
            newOpts[idx][field] = onlyDigits(val); // lưu raw digits
        } else {
            newOpts[idx][field] = val;
        }
        setOptions(newOpts);
    };

    // --- QUẢN LÝ TOPPING ---
    const addTopping = () => setToppings([...toppings, { name: '', price: '' }]);
    const removeTopping = (idx) => setToppings(toppings.filter((_, i) => i !== idx));

    const updateTopping = (idx, field, val) => {
        const newTopps = [...toppings];
        if (field === 'price') {
            newTopps[idx][field] = onlyDigits(val);
        } else {
            newTopps[idx][field] = val;
        }
        setToppings(newTopps);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.price) return alert("Nhập tên và giá gốc!");

        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);

            // ✅ gửi lên backend là NUMBER (không có dấu chấm)
            data.append('price', Number(formData.price || 0));

            data.append('description', formData.description);
            if (imageFile) data.append('image', imageFile);

            // ✅ options/toppings: convert price về number trước khi stringify
            const optionsPayload = options.map((o) => ({
                name: o.name,
                price: Number(onlyDigits(o.price) || 0)
            }));

            const toppingsPayload = toppings.map((t) => ({
                name: t.name,
                price: Number(onlyDigits(t.price) || 0)
            }));

            data.append('options', JSON.stringify(optionsPayload));
            data.append('toppings', JSON.stringify(toppingsPayload));

            if (editFood) {
                // --- GỌI API SỬA (PUT) ---
                /*await axios.put(`http://localhost:5000/api/foods/${editFood._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });*/
                await api.put(`/foods/${editFood._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Cập nhật món thành công!");
            } else {
                // --- GỌI API THÊM (POST) ---
                if (!restaurantId) return alert("Lỗi ID quán!");
                data.append('restaurantId', restaurantId);

                /*await axios.post('http://localhost:5000/api/foods', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });*/
                await api.post('api/foods', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert("Thêm món thành công!");
            }

            onRefresh();
            onClose();
        } catch (error) {
            alert("Lỗi: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, opacity: 1, visibility: 'visible'
        }}>
            <div style={{
                background: '#fff', width: '90%', maxWidth: '650px',
                borderRadius: '16px', maxHeight: '90vh', display: 'flex',
                flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
            }}>
                <div style={{
                    padding: '16px 20px', borderBottom: '1px solid #eee',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', background: '#FFFCF5'
                }}>
                    <h3 style={{ margin: 0, fontSize: 18 }}>
                        {editFood ? 'Chỉnh sửa món ăn' : 'Thêm món mới'}
                    </h3>
                    <button onClick={onClose} style={{
                        border: 'none', background: 'transparent',
                        fontSize: 24, cursor: 'pointer'
                    }}>×</button>
                </div>

                <div style={{ padding: '20px', overflowY: 'auto' }}>
                    <div className="sec">
                        <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#666', textTransform: 'uppercase' }}>
                            Thông tin cơ bản
                        </h4>

                        <div style={{ marginBottom: 15 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 5 }}>
                                Tên món *
                            </label>
                            <input
                                className="wiz-input"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="VD: Bún Bò Huế"
                                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                            <div>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 5 }}>
                                    Giá gốc (VNĐ) *
                                </label>

                                {/* ✅ input hiển thị 45.000 nhưng lưu raw digits */}
                                <input
                                    className="wiz-input"
                                    type="text"
                                    inputMode="numeric"
                                    name="price"
                                    value={formatVND(formData.price)}
                                    onChange={handleBasePriceChange}
                                    placeholder="45.000"
                                    onWheel={(e) => e.currentTarget.blur()}
                                    style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
                                />
                            </div>

                            <div>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 5 }}>
                                    Ảnh món
                                </label>
                                <input type="file" accept="image/*" onChange={handleImageChange} style={{ width: '100%', padding: 8 }} />
                            </div>
                        </div>

                        {imagePreview && (
                            <div style={{ marginBottom: 15, textAlign: 'center' }}>
                                <img src={imagePreview} alt="Preview" style={{ height: 100, borderRadius: 8, border: '1px solid #ddd' }} />
                            </div>
                        )}

                        <div style={{ marginBottom: 15 }}>
                            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 5 }}>
                                Mô tả ngắn
                            </label>
                            <textarea
                                className="note"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Mô tả thành phần..."
                                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8, minHeight: 60 }}
                            />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px dashed #eee', margin: '20px 0' }}></div>

                    <div className="sec">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <h4 style={{ margin: 0, fontSize: 14, color: '#666', textTransform: 'uppercase' }}>
                                Kích cỡ / Phân loại
                            </h4>
                            <button
                                type="button"
                                className="btn small soft"
                                onClick={addOption}
                                style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                            >
                                + Thêm size
                            </button>
                        </div>

                        {options.map((opt, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, marginBottom: 10 }}>
                                <input
                                    placeholder="Tên (VD: Lớn)"
                                    value={opt.name}
                                    onChange={(e) => updateOption(idx, 'name', e.target.value)}
                                    style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
                                />

                                {/* ✅ Giá size: hiển thị format */}
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Giá thêm"
                                    value={formatVND(opt.price)}
                                    onChange={(e) => updateOption(idx, 'price', e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
                                />

                                <button
                                    className="btn danger small"
                                    onClick={() => removeOption(idx)}
                                    style={{
                                        //background: '#fee2e2',
                                        border: 'none',
                                        borderRadius: 6,
                                        width: 30,
                                        height: 30,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0
                                    }}
                                >
                                    <img
                                        src="/images/remove.png"
                                        alt="Xóa"
                                        style={{ width: 20, height: 20 }}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ borderTop: '1px dashed #eee', margin: '20px 0', paddingTop: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <h4 style={{ margin: 0, fontSize: 14, color: '#666' }}>TOPPING MÓN THÊM</h4>
                            <button
                                type="button"
                                className="btn small soft"
                                onClick={addTopping}
                                style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}
                            >
                                + Thêm
                            </button>
                        </div>

                        {toppings.map((top, idx) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 10, marginBottom: 10 }}>
                                <input
                                    placeholder="Tên (VD: Chả)"
                                    value={top.name}
                                    onChange={(e) => updateTopping(idx, 'name', e.target.value)}
                                    style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
                                />

                                {/* ✅ Giá topping: hiển thị format */}
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Giá bán"
                                    value={formatVND(top.price)}
                                    onChange={(e) => updateTopping(idx, 'price', e.target.value)}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    style={{ padding: 8, border: '1px solid #ddd', borderRadius: 6 }}
                                />

                                <button
                                    className="btn danger small"
                                    onClick={() => removeTopping(idx)}
                                    style={{
                                        //background: '#fee2e2',
                                        border: 'none',
                                        borderRadius: 6,
                                        width: 30,
                                        height: 30,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0
                                    }}
                                >
                                    <img
                                        src="/images/remove.png"
                                        alt="Xóa"
                                        style={{ width: 20, height: 20 }}
                                    />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{
                    padding: '16px 20px', borderTop: '1px solid #eee',
                    display: 'flex', justifyContent: 'flex-end', gap: 10, background: '#fff'
                }}>
                    <button onClick={onClose} style={{
                        padding: '10px 20px', borderRadius: 8, border: '1px solid #ddd',
                        background: '#fff', cursor: 'pointer'
                    }}>
                        Hủy
                    </button>

                    <button
                        className="btn primary"
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            padding: '10px 20px', borderRadius: 8, border: 'none',
                            background: '#F97350', color: '#fff', fontWeight: 'bold', cursor: 'pointer'
                        }}
                    >
                        {loading ? 'Đang lưu...' : (editFood ? 'Cập nhật món' : 'Lưu món ăn')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddDishModal;
