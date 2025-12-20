import React, { useState, useEffect } from 'react';
import axios from 'axios';

function MerchantPromos() {
    const [promos, setPromos] = useState([]);
    const [shopId, setShopId] = useState(null);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            axios.get(`http://localhost:5000/api/restaurants/my-shop/${user.id}`)
                .then(res => {
                    if (res.data) {
                        setShopId(res.data._id);
                        return axios.get(`http://localhost:5000/api/promos/${res.data._id}`);
                    }
                })
                .then(res => { if (res) setPromos(res.data); })
                .catch(err => console.error(err));
        }
    }, []);

    const handleCreate = async () => {
        const code = prompt("Nhập mã giảm giá (VD: SALE50):");
        const val = prompt("Nhập số tiền giảm (VD: 5000):");
        if (code && val && shopId) {
            try {
                await axios.post('http://localhost:5000/api/promos', {
                    restaurantId: shopId,
                    code: code.toUpperCase(),
                    value: parseInt(val),
                    type: 'amount'
                });
                // Reload
                const res = await axios.get(`http://localhost:5000/api/promos/${shopId}`);
                setPromos(res.data);
            } catch (err) { alert(err.message); }
        }
    };

    const handleToggle = async (id) => {
        await axios.put(`http://localhost:5000/api/promos/${id}`);
        // Refresh local state simple way
        setPromos(promos.map(p => p._id === id ? { ...p, isActive: !p.isActive } : p));
    };

    return (
        <div className="panel">
            <div className="head">Quản lý Khuyến mãi</div>
            <div className="body">
                <button className="btn primary small" onClick={handleCreate} style={{ marginBottom: 15 }}>
                    <i className="fa-solid fa-plus"></i> Tạo mã mới
                </button>

                <table style={{ width: '100%', fontSize: '14px' }}>
                    <thead>
                        <tr><th>Mã</th><th>Giảm</th><th>Trạng thái</th><th>Hành động</th></tr>
                    </thead>
                    <tbody>
                        {promos.map(p => (
                            <tr key={p._id} style={{ borderBottom: '1px dashed #eee' }}>
                                <td style={{ padding: '10px 0' }}><b style={{ color: '#F97350' }}>{p.code}</b></td>
                                <td>{p.value.toLocaleString()}đ</td>
                                <td>{p.isActive ? <span className="tag green">Đang chạy</span> : <span className="tag gray">Đã tắt</span>}</td>
                                <td>
                                    <button className="btn small soft" onClick={() => handleToggle(p._id)}>
                                        {p.isActive ? 'Tắt' : 'Bật'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
export default MerchantPromos;