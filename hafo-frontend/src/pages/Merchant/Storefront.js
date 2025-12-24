import { useState, useEffect } from 'react';
import api from '../../services/api';

function Storefront() {
    const [shop, setShop] = useState(null);
    const [formData, setFormData] = useState({});

    // Lấy thông tin quán của chính user đang đăng nhập
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            //axios.get(`http://localhost:5000/api/restaurants/my-shop/${user.id}`)
            api.get(`/restaurants/my-shop/${user.id}`)
                .then(res => {
                    setShop(res.data);
                    setFormData(res.data); // Fill dữ liệu vào form
                })
                .catch(err => console.error(err));
        }
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSave = async () => {
        try {
            //await axios.put(`http://localhost:5000/api/restaurants/${shop._id}`, formData);
            await api.put(`/restaurants/${shop._id}`, formData);
            alert("Đã cập nhật thông tin quán!");
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    if (!shop) return <div>Đang tải...</div>;

    return (
        <div className="panel">
            <div className="head">Thông tin cửa hàng</div>
            <div className="body">
                <div className="row" style={{ alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: '20px' }}>
                        <label>Tên quán hiển thị</label>
                        {/* Dùng value và onChange để sửa được */}
                        <input name="name" value={formData.name || ''} onChange={handleChange} />

                        <label>Địa chỉ</label>
                        <input name="address" value={formData.address || ''} onChange={handleChange} />

                        <div className="row" style={{ marginTop: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label>Giờ mở cửa</label>
                                <input type="time" name="openTime" value={formData.openTime || ''} onChange={handleChange} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label>Giờ đóng cửa</label>
                                <input type="time" name="closeTime" value={formData.closeTime || ''} onChange={handleChange} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hr"></div>
                <div style={{ textAlign: 'right' }}>
                    <button className="btn primary" onClick={handleSave}>Lưu thay đổi</button>
                </div>
            </div>
        </div>
    );
}
export default Storefront;