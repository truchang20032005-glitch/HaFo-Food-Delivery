import { useState, useEffect } from 'react';
import api from '../../services/api';

function Shops() {
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState('');
    const [selectedShop, setSelectedShop] = useState(null);

    // 1. GỌI API LẤY DANH SÁCH QUÁN THẬT
    const fetchShops = async () => {
        try {
            const res = await api.get('/restaurants'); // Gọi API Backend vừa sửa
            setShops(res.data);
        } catch (err) {
            console.error("Lỗi tải danh sách cửa hàng:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const toVND = (n) => n?.toLocaleString('vi-VN');

    // Helper hiển thị ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Helper xử lý ảnh
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/150';
        if (path.startsWith('http')) return path;
        return `http://localhost:5000/${path}`;
    };

    // Xử lý lọc (Client-side filtering)
    const filteredShops = shops.filter(shop => {
        const ownerName = shop.owner?.fullName || ''; // Lấy tên chủ quán an toàn
        const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ownerName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRating = ratingFilter ? (shop.rating || 0) >= parseFloat(ratingFilter) : true;

        return matchesSearch && matchesRating;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn soft" onClick={fetchShops} title="Tải lại">
                    <i className="fa-solid fa-rotate-right"></i>
                </button>
            </div>

            {/* BỘ LỌC */}
            <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                <input
                    placeholder="Tìm theo tên quán hoặc chủ quán..."
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    onChange={(e) => setRatingFilter(e.target.value)}
                >
                    <option value="">Tất cả rating</option>
                    <option value="4.5">≥ 4.5 sao</option>
                    <option value="4.0">≥ 4.0 sao</option>
                    <option value="3.5">≥ 3.5 sao</option>
                </select>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Ảnh</th>
                            <th>Tên cửa hàng</th>
                            <th>Chủ cửa hàng</th>
                            <th>Địa chỉ</th>
                            <th>Rating</th>
                            <th>Tổng đơn</th>
                            <th>Doanh thu</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                        ) : filteredShops.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy cửa hàng nào.</td></tr>
                        ) : (
                            filteredShops.map(shop => (
                                <tr key={shop._id}>
                                    <td>
                                        <img
                                            src={getImageUrl(shop.image)}
                                            alt={shop.name}
                                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee' }}
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/40'}
                                        />
                                    </td>
                                    <td title={shop.name}><b>{shop.name}</b></td>
                                    <td>{shop.owner?.fullName || 'Không xác định'}</td>
                                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '13px', color: '#666' }} title={shop.address}>
                                        {shop.address}
                                    </td>
                                    <td><span style={{ color: '#F5A524' }}>★</span> {shop.rating || 0}</td>
                                    <td style={{ textAlign: 'center' }}>{shop.orders}</td>
                                    <td style={{ fontWeight: 'bold', color: '#F97350' }}>{toVND(shop.revenue)}đ</td>
                                    <td>
                                        <button className="btn view" onClick={() => setSelectedShop(shop)}>
                                            <i className="fa-solid fa-eye"></i> Xem
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT */}
            {selectedShop && (
                <div className="modal-bg" onClick={() => setSelectedShop(null)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="avatar-big" style={{ border: 'none', borderRadius: '12px', width: '100%', height: '150px', marginBottom: '15px' }}>
                            <img src={getImageUrl(selectedShop.image)} alt="Shop" style={{ borderRadius: '12px' }} />
                        </div>
                        <h3 style={{ color: '#F97350', marginBottom: '5px' }}>{selectedShop.name}</h3>
                        <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', marginTop: 0 }}>
                            Tham gia ngày: {formatDate(selectedShop.createdAt)}
                        </p>

                        <div className="info-line"><b>Chủ cửa hàng:</b> {selectedShop.owner?.fullName}</div>
                        <div className="info-line"><b>SĐT Liên hệ:</b> {selectedShop.phone}</div>
                        <div className="info-line"><b>Email:</b> {selectedShop.owner?.email || 'N/A'}</div>
                        <div className="info-line"><b>Địa chỉ:</b> {selectedShop.address}</div>
                        <div className="info-line"><b>Khu vực:</b> {selectedShop.district}, {selectedShop.city}</div>
                        <div className="info-line"><b>Giờ hoạt động:</b> {selectedShop.openTime} - {selectedShop.closeTime}</div>
                        <div className="info-line"><b>Ẩm thực:</b> {selectedShop.cuisine?.join(', ')}</div>

                        <div style={{ background: '#fff7ed', padding: '10px', borderRadius: '8px', marginTop: '15px' }}>
                            <div className="info-line" style={{ border: 'none', padding: 0, marginBottom: 5 }}><b>Tổng đơn hàng:</b> {selectedShop.orders}</div>
                            <div className="info-line" style={{ border: 'none', padding: 0, marginBottom: 0 }}><b>Tổng doanh thu:</b> {toVND(selectedShop.revenue)}đ</div>
                        </div>

                        <div className="info-line" style={{ marginTop: '15px', border: 'none' }}>
                            <b>Trạng thái:</b>
                            {selectedShop.isOpen
                                ? <span className="badge active">Đang mở cửa</span>
                                : <span className="badge inactive">Đang đóng cửa</span>
                            }
                        </div>

                        <button className="btn-close" onClick={() => setSelectedShop(null)}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Shops;