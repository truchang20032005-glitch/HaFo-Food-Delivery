import { useState, useEffect } from 'react';
import api from '../../services/api';

function AddDishModal({ isOpen, onClose, onRefresh, restaurantId, editFood }) {
    const [formData, setFormData] = useState({ name: '', price: '', description: '' });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState([{ name: 'Vừa', price: '0' }]);
    const [toppings, setToppings] = useState([]);

    // ====== LOGIC HELPERS ======
    const onlyDigits = (val) => String(val ?? '').replace(/\D/g, '');
    const formatVND = (val) => {
        const digits = onlyDigits(val);
        return digits ? digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
    };

    useEffect(() => {
        if (isOpen) {
            if (editFood) {
                setFormData({
                    name: editFood.name || '',
                    price: onlyDigits(editFood.price ?? ''),
                    description: editFood.description || ''
                });
                setImagePreview(editFood.image || '');
                setOptions(editFood.options?.length ? editFood.options.map(o => ({ name: o.name, price: onlyDigits(o.price) })) : [{ name: 'Vừa', price: '0' }]);
                setToppings(editFood.toppings?.length ? editFood.toppings.map(t => ({ name: t.name, price: onlyDigits(t.price) })) : []);
                setImageFile(null);
            } else {
                setFormData({ name: '', price: '', description: '' });
                setImagePreview('');
                setOptions([{ name: 'Vừa', price: '0' }]);
                setToppings([]);
                setImageFile(null);
            }
        }
    }, [isOpen, editFood]);

    const handleSave = async () => {
        if (!formData.name || !formData.price) return alert("Má ơi, nhập tên với giá món đã!");
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('price', Number(formData.price));
            data.append('description', formData.description);
            if (imageFile) data.append('image', imageFile);

            const optionsPayload = options.filter(o => o.name.trim()).map(o => ({ name: o.name, price: Number(onlyDigits(o.price)) }));
            const toppingsPayload = toppings.filter(t => t.name.trim()).map(t => ({ name: t.name, price: Number(onlyDigits(t.price)) }));

            data.append('options', JSON.stringify(optionsPayload));
            data.append('toppings', JSON.stringify(toppingsPayload));

            if (editFood) {
                await api.put(`/foods/${editFood._id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
            } else {
                data.append('restaurantId', restaurantId);
                await api.post('/foods', data, { headers: { 'Content-Type': 'multipart/form-data' } });
            }
            onRefresh(); onClose();
        } catch (error) {
            alert("Lỗi rồi má: " + (error.response?.data?.message || error.message));
        } finally { setLoading(false); }
    };

    if (!isOpen) return null;

    // ====== HỆ THỐNG STYLES NẰM TRONG FILE ======
    const S = {
        overlay: {
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, padding: '20px'
        },
        sheet: {
            background: '#fff', width: '100%', maxWidth: '650px', borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex',
            flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', position: 'relative'
        },
        header: {
            padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center', background: '#fff'
        },
        body: { padding: '24px', overflowY: 'auto', background: '#f8fafc' },
        card: {
            background: '#fff', borderRadius: '16px', padding: '20px',
            border: '1px solid #e2e8f0', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        },
        label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '8px' },
        input: {
            width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0',
            fontSize: '15px', outline: 'none', transition: 'all 0.2s', background: '#fff'
        },
        imageZone: {
            width: '100%', height: '140px', borderRadius: '12px', border: '2px dashed #cbd5e1',
            background: '#f1f5f9', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden'
        }
    };

    return (
        <div style={S.overlay}>
            <div style={S.sheet}>
                {/* Header */}
                <div style={S.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: '#FFF1ED', borderRadius: '10px', display: 'grid', placeItems: 'center' }}>
                            <i className={`fa-solid ${editFood ? 'fa-pen-to-square' : 'fa-plus'}`} style={{ color: '#F97350' }}></i>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e293b' }}>
                            {editFood ? 'Cập nhật món ăn' : 'Thêm món ăn mới'}
                        </h3>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>×</button>
                </div>

                <div style={S.body}>
                    {/* Thông tin cơ bản */}
                    <div style={S.card}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', marginBottom: '20px' }}>
                            <div>
                                <label style={S.label}>Tên món ăn *</label>
                                <input
                                    style={S.input}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="VD: Phở Bò Tái Lăn"
                                />
                            </div>
                            <div>
                                <label style={S.label}>Giá bán gốc *</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        style={{ ...S.input, textAlign: 'right', paddingRight: '35px' }}
                                        value={formatVND(formData.price)}
                                        onChange={(e) => setFormData({ ...formData, price: onlyDigits(e.target.value) })}
                                        placeholder="0"
                                    />
                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 'bold', fontSize: '13px' }}>đ</span>
                                </div>
                            </div>
                        </div>

                        {/* Upload Ảnh */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={S.label}>Hình ảnh món ăn</label>
                            <div style={S.imageZone} onClick={() => document.getElementById('fileInput').click()}>
                                {imagePreview ? (
                                    <img src={imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                                ) : (
                                    <>
                                        <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: '24px', color: '#94a3b8', marginBottom: '8px' }}></i>
                                        <span style={{ fontSize: '13px', color: '#64748b' }}>Nhấn để tải ảnh lên</span>
                                    </>
                                )}
                                <input id="fileInput" type="file" hidden onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        setImageFile(file);
                                        setImagePreview(URL.createObjectURL(file));
                                    }
                                }} />
                            </div>
                        </div>

                        <div>
                            <label style={S.label}>Mô tả món</label>
                            <textarea
                                style={{ ...S.input, minHeight: '80px', resize: 'none' }}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả thành phần, hương vị..."
                            />
                        </div>
                    </div>

                    {/* Options & Toppings */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        {/* SIZE */}
                        <div style={{ ...S.card, marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>KÍCH CỠ</span>
                                <button onClick={() => setOptions([...options, { name: '', price: '' }])} style={{ border: 'none', background: '#FFF1ED', color: '#F97350', fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>+ THÊM</button>
                            </div>
                            {options.map((opt, i) => (
                                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input style={{ ...S.input, padding: '8px 12px', fontSize: '13px' }} placeholder="Size" value={opt.name} onChange={(e) => { const n = [...options]; n[i].name = e.target.value; setOptions(n); }} />
                                    <input style={{ ...S.input, padding: '8px 12px', width: '80px', fontSize: '13px', textAlign: 'right' }} placeholder="+0" value={formatVND(opt.price)} onChange={(e) => { const n = [...options]; n[i].price = onlyDigits(e.target.value); setOptions(n); }} />
                                    <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', width: '32px', borderRadius: '8px', cursor: 'pointer' }}><i className="fa-solid fa-trash"></i></button>
                                </div>
                            ))}
                        </div>

                        {/* TOPPING */}
                        <div style={{ ...S.card, marginBottom: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontWeight: '800', fontSize: '14px', color: '#1e293b' }}>TOPPING</span>
                                <button onClick={() => setToppings([...toppings, { name: '', price: '' }])} style={{ border: 'none', background: '#F0FDF4', color: '#16a34a', fontSize: '11px', fontWeight: '800', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}>+ THÊM</button>
                            </div>
                            {toppings.map((top, i) => (
                                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                    <input style={{ ...S.input, padding: '8px 12px', fontSize: '13px' }} placeholder="Tên" value={top.name} onChange={(e) => { const n = [...toppings]; n[i].name = e.target.value; setToppings(n); }} />
                                    <input style={{ ...S.input, padding: '8px 12px', width: '80px', fontSize: '13px', textAlign: 'right' }} placeholder="0" value={formatVND(top.price)} onChange={(e) => { const n = [...toppings]; n[i].price = onlyDigits(e.target.value); setToppings(n); }} />
                                    <button onClick={() => setToppings(toppings.filter((_, idx) => idx !== i))} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', width: '32px', borderRadius: '8px', cursor: 'pointer' }}><i className="fa-solid fa-trash"></i></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#fff' }}>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', color: '#64748b', fontWeight: '700', cursor: 'pointer', padding: '12px 20px' }}>Hủy bỏ</button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            background: '#F97350', color: '#fff', border: 'none',
                            padding: '12px 32px', borderRadius: '14px', fontWeight: '800',
                            cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(249, 115, 80, 0.3)'
                        }}
                    >
                        {loading ? 'Đang lưu...' : (editFood ? 'Cập nhật món' : 'Thêm vào menu')}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AddDishModal;