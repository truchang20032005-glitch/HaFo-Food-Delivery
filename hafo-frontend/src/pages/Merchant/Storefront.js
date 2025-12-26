import { useState, useEffect } from 'react';
import api from '../../services/api';

function Storefront() {
    const [shop, setShop] = useState(null);
    // Thêm state xử lý ảnh
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const [formData, setFormData] = useState({});

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            api.get(`/restaurants/my-shop/${user.id}`)
                .then(res => {
                    setShop(res.data);
                    setFormData(res.data);
                    // Nếu đã có ảnh từ DB thì hiện lên
                    if (res.data.image) setImagePreview(res.data.image);
                })
                .catch(err => console.error(err));
        }
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Hàm xử lý khi chọn file ảnh mới
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        try {
            // CHUYỂN ĐỔI SANG FORM DATA ĐỂ GỬI ẢNH
            const data = new FormData();
            data.append('name', formData.name);
            data.append('address', formData.address);
            data.append('openTime', formData.openTime);
            data.append('closeTime', formData.closeTime);

            // Nếu có chọn ảnh mới thì mới gửi lên
            if (imageFile) {
                data.append('image', imageFile);
            }

            await api.put(`/restaurants/${shop._id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("✅ Đã cập nhật thông tin quán thành công!");
        } catch (err) {
            alert("❌ Lỗi: " + err.message);
        }
    };

    if (!shop) return <div>Đang tải...</div>;

    return (
        <div className="card">
            <div className="head">Thông tin cửa hàng</div>
            <div className="body">
                <div className="row" style={{ alignItems: 'flex-start' }}>
                    {/* Cột bên trái: Ảnh đại diện */}
                    <div style={{ width: '150px', marginRight: '20px', textAlign: 'center' }}>
                        <div style={{
                            width: '100%', height: '150px', borderRadius: '12px',
                            overflow: 'hidden', border: '1px solid #ddd', marginBottom: '10px'
                        }}>
                            <img
                                src={imagePreview || 'https://via.placeholder.com/150'}
                                alt="Shop Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <label htmlFor="shop-img" className="btn small soft" style={{ cursor: 'pointer', display: 'inline-block' }}>
                            Đổi ảnh
                        </label>
                        <input
                            id="shop-img"
                            type="file"
                            hidden
                            onChange={handleImageChange}
                            accept="image/*"
                        />
                    </div>

                    {/* Cột bên phải: Form nhập liệu */}
                    <div style={{ flex: 1 }}>
                        <label>Tên quán hiển thị</label>
                        <input name="name" value={formData.name || ''} onChange={handleChange} />

                        <label>Địa chỉ</label>
                        <input name="address\" value={formData.address || ''} onChange={handleChange} />

                        <div className="row" style={{ marginTop: '10px', gap: '15px' }}>
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