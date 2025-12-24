import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';

function MerchantPromos() {
    const [promos, setPromos] = useState([]);
    const [shopId, setShopId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [loading, setLoading] = useState(false);

    const [keyword, setKeyword] = useState('');

    // Form: dùng string cho field tiền để format trong input
    const [formData, setFormData] = useState({
        id: '',
        code: '',
        type: 'amount',   // amount | percent
        value: '',        // string digits (hoặc percent string)
        minOrder: '',     // string digits
        limit: '100'      // string digits
    });

    // ===== Helpers =====
    const digitsOnly = (v) => String(v ?? '').replace(/\D/g, '');
    const formatVND = (v) => {
        const d = digitsOnly(v);
        if (!d) return '';
        return d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };
    const toNumber = (v) => Number(digitsOnly(v) || 0);
    const toVND = (n) => Number(n || 0).toLocaleString('vi-VN');

    // ===== Load shop + promos =====
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            //axios.get(`http://localhost:5000/api/restaurants/my-shop/${user.id}`)
            api.get(`/restaurants/my-shop/${user.id}`)
                .then(res => {
                    if (res.data) {
                        setShopId(res.data._id);
                        fetchPromos(res.data._id);
                    }
                })
                .catch(err => console.error(err));
        }
    }, []);

    const fetchPromos = async (rId) => {
        try {
            //const res = await axios.get(`http://localhost:5000/api/promos/${rId}`);
            const res = await api.get(`/promos/${rId}`);
            setPromos(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // ===== Modal actions =====
    const resetForm = () => {
        setFormData({
            id: '',
            code: '',
            type: 'amount',
            value: '',
            minOrder: '',
            limit: '100'
        });
        setIsEdit(false);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (p) => {
        setFormData({
            id: p._id,
            code: p.code || '',
            type: p.type || 'amount',
            value: String(p.value ?? ''),
            minOrder: String(p.minOrder ?? ''),
            limit: String(p.limit ?? '100')
        });
        setIsEdit(true);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setLoading(false);
    };

    // ===== Input handlers =====
    const setCode = (v) => setFormData({ ...formData, code: v.toUpperCase() });

    const setType = (t) => {
        setFormData({ ...formData, type: t });
    };

    const setValue = (v) => {
        if (formData.type === 'percent') {
            // percent: chỉ digits, giới hạn 1..100
            const d = digitsOnly(v);
            if (!d) return setFormData({ ...formData, value: '' });
            let n = Number(d);
            if (n > 100) n = 100;
            setFormData({ ...formData, value: String(n) });
        } else {
            // amount: digits
            setFormData({ ...formData, value: digitsOnly(v) });
        }
    };

    const setMinOrder = (v) => setFormData({ ...formData, minOrder: digitsOnly(v) });
    const setLimit = (v) => setFormData({ ...formData, limit: digitsOnly(v) });

    // ===== Preview text =====
    const previewText = useMemo(() => {
        const code = formData.code.trim().toUpperCase() || 'MA_GIAM_GIA';
        const valueNum = formData.type === 'percent' ? Number(formData.value || 0) : toNumber(formData.value);
        const minNum = toNumber(formData.minOrder);
        const limitNum = toNumber(formData.limit);

        const discount = formData.type === 'percent'
            ? `Giảm ${valueNum || 0}%`
            : `Giảm ${toVND(valueNum)}đ`;

        const min = minNum > 0 ? ` cho đơn từ ${toVND(minNum)}đ` : '';
        const limit = limitNum > 0 ? ` • SL: ${limitNum}` : '';

        return `${code} • ${discount}${min}${limit}`;
    }, [formData]);

    // ===== Validate + Save =====
    const validate = () => {
        const code = formData.code.trim();
        if (!code) return 'Vui lòng nhập Mã Code!';
        if (code.length < 3) return 'Mã Code tối thiểu 3 ký tự!';

        const limitNum = toNumber(formData.limit);
        if (limitNum < 1) return 'Số lượng mã phải >= 1!';

        if (formData.type === 'percent') {
            const p = Number(formData.value || 0);
            if (!p) return 'Vui lòng nhập % giảm!';
            if (p < 1 || p > 100) return 'Phần trăm giảm phải từ 1 đến 100!';
        } else {
            const amt = toNumber(formData.value);
            if (!amt) return 'Vui lòng nhập số tiền giảm!';
            if (amt < 1000) return 'Giảm theo VNĐ nên >= 1.000đ cho hợp lý!';
        }
        return null;
    };

    const handleSave = async () => {
        const msg = validate();
        if (msg) return alert(msg);

        setLoading(true);
        try {
            const payload = {
                code: formData.code.toUpperCase(),
                type: formData.type,
                value: formData.type === 'percent' ? Number(formData.value || 0) : toNumber(formData.value),
                minOrder: toNumber(formData.minOrder),
                limit: toNumber(formData.limit)
            };

            if (isEdit) {
                //await axios.put(`http://localhost:5000/api/promos/update/${formData.id}`, payload);
                await api.put(`/promos/update/${formData.id}`, payload);
                alert('Cập nhật thành công!');
            } else {
                /*await axios.post('http://localhost:5000/api/promos', {
                    restaurantId: shopId,
                    ...payload
                });*/
                await api.post('/promos', {
                    restaurantId: shopId,
                    ...payload
                });
                alert('Tạo mã thành công!');
            }

            closeModal();
            fetchPromos(shopId);
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    // ===== Toggle / Delete =====
    const handleToggle = async (id) => {
        try {
            //await axios.put(`http://localhost:5000/api/promos/${id}`);
            await api.put(`/promos/${id}`);
            setPromos(promos.map(p => p._id === id ? { ...p, isActive: !p.isActive } : p));
        } catch (err) {
            alert('Lỗi cập nhật trạng thái');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bạn chắc chắn muốn xóa mã này?')) {
            try {
                //await axios.delete(`http://localhost:5000/api/promos/${id}`);
                await api.delete(`/promos/${id}`);
                setPromos(promos.filter(p => p._id !== id));
            } catch (err) {
                alert('Lỗi xóa mã');
            }
        }
    };

    // ===== Search =====
    const filteredPromos = useMemo(() => {
        const k = keyword.trim().toLowerCase();
        if (!k) return promos;
        return promos.filter(p => (p.code || '').toLowerCase().includes(k));
    }, [keyword, promos]);

    return (
        <div className="panel">
            <div className="head">Quản lý Khuyến mãi</div>

            <div className="body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                    <input
                        placeholder="Tìm mã giảm giá..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd', width: '300px' }}
                    />

                    <button className="btn primary small" onClick={openAddModal}>
                        <i className="fa-solid fa-plus"></i> Tạo mã mới
                    </button>
                </div>

                <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: 12, textAlign: 'left' }}>Mã Code</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Giảm giá</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Đơn tối thiểu</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Lượt dùng</th>
                            <th style={{ padding: 12, textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: 12, textAlign: 'right' }}>Hành động</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filteredPromos.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#999' }}>
                                    Chưa có mã giảm giá nào.
                                </td>
                            </tr>
                        ) : (
                            filteredPromos.map(p => (
                                <tr key={p._id} style={{ borderBottom: '1px dashed #eee' }}>
                                    <td style={{ padding: 12 }}>
                                        <span style={{
                                            color: '#F97350',
                                            border: '1px dashed #F97350',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontWeight: 'bold',
                                            background: '#fff5f2'
                                        }}>
                                            {p.code}
                                        </span>
                                    </td>

                                    <td style={{ padding: 12 }}>
                                        {p.type === 'percent'
                                            ? <b style={{ color: '#22C55E' }}>{p.value}%</b>
                                            : <b>{toVND(p.value)}đ</b>
                                        }
                                    </td>

                                    <td style={{ padding: 12 }}>{toVND(p.minOrder)}đ</td>
                                    <td style={{ padding: 12 }}>{p.limit}</td>

                                    <td style={{ textAlign: 'center', padding: 12 }}>
                                        <label className="switch">
                                            <input type="checkbox" checked={p.isActive} onChange={() => handleToggle(p._id)} />
                                            <span className="slider round"></span>
                                        </label>
                                    </td>

                                    <td style={{ textAlign: 'right', padding: 12 }}>
                                        <button
                                            className="btn small soft"
                                            onClick={() => openEditModal(p)}
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                boxShadow: 'none',
                                                background: 'transparent',
                                                padding: 0,
                                            }}
                                        >
                                            <img
                                                src="/images/edit.png"
                                                alt="Sửa"
                                                style={{ width: 18, height: 18 }}
                                            />
                                        </button>

                                        <button
                                            className="btn small danger"
                                            onClick={() => handleDelete(p._id)}
                                            style={{
                                                //background: '#fee2e2',
                                                border: 'none',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <img
                                                src="/images/delete.png"
                                                alt="Xóa"
                                                style={{ width: 18, height: 18 }}
                                            />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL */}
            {showModal && (
                <div
                    className="overlay show"
                    style={{
                        display: 'flex',
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000
                    }}
                    onClick={closeModal}
                >
                    <div
                        className="modal-box"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#fff',
                            width: '520px',
                            maxWidth: '92vw',
                            borderRadius: '16px',
                            padding: '24px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
                            <div>
                                <h3 style={{ margin: 0, color: '#F97350' }}>{isEdit ? 'Chỉnh sửa mã' : 'Tạo mã khuyến mãi'}</h3>
                                <div style={{ marginTop: 6, color: '#777', fontSize: 13 }}>
                                    Preview: <b>{previewText}</b>
                                </div>
                            </div>
                            <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>×</button>
                        </div>

                        <div style={{ display: 'grid', gap: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6, fontSize: 13 }}>Mã Code (VD: SALE50)</label>
                                <input
                                    className="wiz-input"
                                    value={formData.code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="Nhập mã..."
                                    style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6, fontSize: 13 }}>Loại giảm</label>
                                    <select
                                        className="wiz-input"
                                        value={formData.type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="amount">Số tiền (VNĐ)</option>
                                        <option value="percent">Phần trăm (%)</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6, fontSize: 13 }}>
                                        Giá trị giảm {formData.type === 'percent' ? '(%)' : '(VNĐ)'}
                                    </label>

                                    {formData.type === 'percent' ? (
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            className="wiz-input"
                                            value={formData.value}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder="VD: 20"
                                            onWheel={(e) => e.currentTarget.blur()}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            className="wiz-input"
                                            value={formatVND(formData.value)}
                                            onChange={(e) => setValue(e.target.value)}
                                            placeholder="VD: 15.000"
                                        />
                                    )}

                                    {formData.type === 'amount' && formData.value && (
                                        <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                                            = <b>{toVND(toNumber(formData.value))}đ</b>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6, fontSize: 13 }}>Đơn tối thiểu (VNĐ)</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        className="wiz-input"
                                        value={formatVND(formData.minOrder)}
                                        onChange={(e) => setMinOrder(e.target.value)}
                                        placeholder="VD: 50.000"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 6, fontSize: 13 }}>Số lượng mã</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="wiz-input"
                                        value={formData.limit}
                                        onChange={(e) => setLimit(e.target.value)}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        placeholder="VD: 100"
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20, paddingTop: 14, borderTop: '1px solid #eee' }}>
                            <button className="btn soft" onClick={closeModal}>Hủy</button>
                            <button className="btn primary" onClick={handleSave} disabled={loading}>
                                {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Tạo mã')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MerchantPromos;