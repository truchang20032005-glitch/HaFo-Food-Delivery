import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';

function MerchantPromos() {
    const [promos, setPromos] = useState([]);
    const [shopId, setShopId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');

    // Form data bao gồm cả ngày bắt đầu/kết thúc
    const [formData, setFormData] = useState({
        id: '',
        code: '',
        type: 'amount',
        value: '',
        minOrder: '',
        limit: '100',
        startDate: '',
        endDate: ''
    });

    // ====== HELPERS ======
    const digitsOnly = (v) => String(v ?? '').replace(/\D/g, '');
    const formatVND = (v) => {
        const d = digitsOnly(v);
        return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
    };
    const toNumber = (v) => Number(digitsOnly(v) || 0);
    const toVND = (n) => Number(n || 0).toLocaleString('vi-VN');

    // ====== CSS SYSTEM (BỎ TRONG FILE THEO Ý MÁ) ======
    const S = {
        panel: { background: '#fff', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
        head: { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' },
        overlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
        sheet: { background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' },
        card: { background: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid #e2e8f0', marginBottom: '16px' },
        input: { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none', transition: 'all 0.2s' },
        label: { display: 'block', fontSize: '13px', fontWeight: '700', color: '#475569', marginBottom: '6px' },
        badge: { padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }
    };

    // ====== LOGIC NGHIỆP VỤ ======
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            api.get(`/restaurants/my-shop/${user.id}`).then(res => {
                if (res.data) {
                    setShopId(res.data._id);
                    fetchPromos(res.data._id);
                }
            });
        }
    }, []);

    const fetchPromos = async (rId) => {
        try {
            const res = await api.get(`/promos/${rId}`);
            setPromos(res.data);
        } catch (err) { console.error(err); }
    };

    const openModal = (p = null) => {
        if (p) {
            setFormData({
                id: p._id,
                code: p.code,
                type: p.type,
                value: String(p.value),
                minOrder: String(p.minOrder),
                limit: String(p.limit),
                startDate: p.startDate ? p.startDate.split('T')[0] : '',
                endDate: p.endDate ? p.endDate.split('T')[0] : ''
            });
            setIsEdit(true);
        } else {
            setFormData({ id: '', code: '', type: 'amount', value: '', minOrder: '', limit: '100', startDate: '', endDate: '' });
            setIsEdit(false);
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.code || !formData.value) return alert("Má ơi, nhập đủ thông tin mã đã!");
        setLoading(true);
        try {
            const payload = {
                ...formData,
                value: formData.type === 'percent' ? Number(formData.value) : toNumber(formData.value),
                minOrder: toNumber(formData.minOrder),
                limit: toNumber(formData.limit),
                restaurantId: shopId
            };

            if (isEdit) {
                await api.put(`/promos/update/${formData.id}`, payload);
            } else {
                await api.post('/promos', payload);
            }
            fetchPromos(shopId);
            setShowModal(false);
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Xóa thiệt hả má?")) {
            await api.delete(`/promos/${id}`);
            fetchPromos(shopId);
        }
    };

    const handleToggle = async (id) => {
        await api.put(`/promos/${id}`);
        fetchPromos(shopId);
    };

    const filtered = useMemo(() => {
        return promos.filter(p => p.code.toLowerCase().includes(keyword.toLowerCase()));
    }, [promos, keyword]);

    return (
        <div style={S.panel}>
            <div style={S.head}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-tag" style={{ color: '#F97350' }}></i>
                    <span style={{ fontWeight: '800' }}>Quản lý Khuyến mãi</span>
                </div>
                <button className="btn primary small" onClick={() => openModal()}>
                    <i className="fa-solid fa-plus"></i> Tạo mã mới
                </button>
            </div>

            <div className="body" style={{ padding: '24px' }}>
                <input
                    placeholder="Tìm kiếm mã..."
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    style={{ ...S.input, maxWidth: '300px', marginBottom: '20px' }}
                />

                <table style={{ width: '100%' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc' }}>
                            <th>Mã Giảm Giá</th>
                            <th>Mức Giảm</th>
                            <th>Thời Hạn</th>
                            <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                            <th style={{ textAlign: 'right' }}>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p._id}>
                                <td><b style={{ color: '#F97350', border: '1px dashed #F97350', padding: '4px 8px', borderRadius: '6px' }}>{p.code}</b></td>
                                <td>{p.type === 'percent' ? `${p.value}%` : `${toVND(p.value)}đ`}<br /><small>Đơn từ {toVND(p.minOrder)}đ</small></td>
                                <td style={{ fontSize: '12px', color: '#64748b' }}>
                                    {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : '...'} -
                                    {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : '...'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <label className="switch">
                                        <input type="checkbox" checked={p.isActive} onChange={() => handleToggle(p._id)} />
                                        <span className="slider"></span>
                                    </label>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button className="btn small soft" onClick={() => openModal(p)} style={{ marginRight: '8px' }}><i className="fa-solid fa-pen"></i></button>
                                    <button className="btn small danger" onClick={() => handleDelete(p._id)}><i className="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL THEO STYLE THÊM MÓN */}
            {showModal && (
                <div style={S.overlay}>
                    <div style={S.sheet}>
                        <div style={{ ...S.head, background: '#fff' }}>
                            <span style={{ fontWeight: '800', fontSize: '18px' }}>{isEdit ? 'Chỉnh sửa mã' : 'Tạo mã khuyến mãi'}</span>
                            <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>
                        <div style={{ padding: '24px', background: '#f8fafc', overflowY: 'auto' }}>
                            <div style={S.card}>
                                <label style={S.label}>Mã giảm giá *</label>
                                <input style={{ ...S.input, textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }} value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="VD: CHAOHE2025" />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={S.card}>
                                    <label style={S.label}>Loại giảm</label>
                                    <select style={S.input} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="amount">Số tiền cố định (VNĐ)</option>
                                        <option value="percent">Phần trăm (%)</option>
                                    </select>
                                </div>
                                <div style={S.card}>
                                    <label style={S.label}>Giá trị giảm *</label>
                                    <input style={S.input} value={formData.type === 'percent' ? formData.value : formatVND(formData.value)} onChange={e => setFormData({ ...formData, value: digitsOnly(e.target.value) })} placeholder="0" />
                                </div>
                            </div>

                            <div style={S.card}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={S.label}>Ngày bắt đầu</label>
                                        <input type="date" style={S.input} value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={S.label}>Ngày kết thúc</label>
                                        <input type="date" style={S.input} value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={S.card}>
                                    <label style={S.label}>Đơn tối thiểu</label>
                                    <input style={S.input} value={formatVND(formData.minOrder)} onChange={e => setFormData({ ...formData, minOrder: digitsOnly(e.target.value) })} placeholder="0" />
                                </div>
                                <div style={S.card}>
                                    <label style={S.label}>Số lượng phát hành</label>
                                    <input type="number" style={S.input} value={formData.limit} onChange={e => setFormData({ ...formData, limit: e.target.value })} />
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button className="btn" onClick={() => setShowModal(false)}>Hủy</button>
                            <button className="btn primary" onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Xác nhận tạo')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MerchantPromos;