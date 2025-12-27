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
            const res = await api.get('/restaurants');
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

    const toVND = (n) => {
        if (typeof n !== 'number') return '0đ';
        return n.toLocaleString('vi-VN') + 'đ';
    };

    // Helper hiển thị ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Xử lý lọc (Client-side filtering)
    const filteredShops = shops.filter(shop => {
        const ownerName = shop.owner?.fullName || '';
        const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ownerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRating = ratingFilter ? (shop.rating || 0) >= parseFloat(ratingFilter) : true;
        return matchesSearch && matchesRating;
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#1e293b' }}>Danh sách đối tác nhà hàng</h3>
                <button className="btn soft" onClick={fetchShops} title="Tải lại">
                    <i className="fa-solid fa-rotate-right"></i> Làm mới dữ liệu
                </button>
            </div>

            {/* BỘ LỌC CHUYÊN NGHIỆP */}
            <div style={{ marginBottom: '25px', display: 'flex', gap: '15px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input
                        placeholder="Tìm theo tên quán hoặc tên chủ quán..."
                        style={{ padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', outline: 'none' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    style={{ padding: '12px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', outline: 'none', cursor: 'pointer' }}
                    onChange={(e) => setRatingFilter(e.target.value)}
                >
                    <option value="">Tất cả đánh giá</option>
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
                            <th>Cửa hàng</th>
                            <th>Chủ sở hữu</th>
                            <th>Địa chỉ</th>
                            <th>Đánh giá</th>
                            <th style={{ textAlign: 'center' }}>Đơn hàng</th>
                            <th>Doanh thu</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}><i className="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>
                        ) : filteredShops.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Không có cửa hàng nào phù hợp.</td></tr>
                        ) : (
                            filteredShops.map(shop => (
                                <tr key={shop._id}>
                                    <td>
                                        <img
                                            src={shop.image || 'https://via.placeholder.com/50'}
                                            alt={shop.name}
                                            style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #f1f5f9' }}
                                        />
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '800', color: '#1e293b' }}>{shop.name}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {shop._id.slice(-6).toUpperCase()}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{shop.owner?.fullName || 'N/A'}</div>
                                        <div style={{ fontSize: '12px', color: '#64748b' }}>{shop.phone}</div>
                                    </td>
                                    <td style={{ maxWidth: '180px', fontSize: '13px', color: '#64748b' }}>
                                        <span title={shop.address}>{shop.address}</span>
                                    </td>
                                    <td><b style={{ color: '#F5A524' }}>★ {shop.rating || 0}</b></td>
                                    <td style={{ textAlign: 'center' }}><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{shop.orders}</span></td>
                                    <td><b style={{ color: '#F97350' }}>{toVND(shop.revenue)}</b></td>
                                    <td>
                                        <button className="btn view" onClick={() => setSelectedShop(shop)}>
                                            <i className="fa-solid fa-eye"></i> Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT CỬA HÀNG */}
            {selectedShop && (
                <div className="modal-bg" onClick={() => setSelectedShop(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px', width: '90%', borderRadius: '24px', padding: '0', overflow: 'hidden' }}>
                        {/* Banner Ảnh */}
                        <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                            <img src={selectedShop.image || 'https://via.placeholder.com/600x200'} alt="Shop Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                {selectedShop.isOpen
                                    ? <span className="badge active" style={{ padding: '8px 15px', fontSize: '12px' }}>Đang mở cửa</span>
                                    : <span className="badge inactive" style={{ padding: '8px 15px', fontSize: '12px' }}>Đang đóng cửa</span>
                                }
                            </div>
                        </div>

                        <div style={{ padding: '30px' }}>
                            <h3 style={{ color: '#1e293b', margin: '0 0 5px', fontSize: '24px', fontWeight: '900' }}>{selectedShop.name}</h3>
                            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '25px' }}>Ngày tham gia hệ thống: {formatDate(selectedShop.createdAt)}</div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '25px' }}>
                                {/* Cột 1: Thông tin liên hệ */}
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Thông tin chủ sở hữu</div>
                                    <div className="info-line"><b>Chủ quán:</b> {selectedShop.owner?.fullName}</div>
                                    <div className="info-line"><b>Điện thoại:</b> {selectedShop.phone}</div>
                                    <div className="info-line"><b>Email:</b> {selectedShop.owner?.email || 'N/A'}</div>
                                </div>
                                {/* Cột 2: Vận hành */}
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Vận hành & Ẩm thực</div>
                                    <div className="info-line"><b>Giờ mở:</b> {selectedShop.openTime} - {selectedShop.closeTime}</div>
                                    <div className="info-line"><b>Ẩm thực:</b> {selectedShop.cuisine?.join(', ') || 'Đang cập nhật'}</div>
                                    <div className="info-line"><b>Khu vực:</b> {selectedShop.district}</div>
                                </div>
                            </div>

                            <div className="info-line" style={{ border: 'none', background: '#f8fafc', padding: '15px', borderRadius: '15px', marginBottom: '25px' }}>
                                <b>Địa chỉ:</b> <span style={{ color: '#475569' }}>{selectedShop.address}</span>
                            </div>

                            {/* Thống kê doanh số (KPI Box) */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', padding: '20px', background: '#FFF7ED', borderRadius: '20px', textAlign: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: '700' }}>Đánh giá</div>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#F97350' }}>
                                        {selectedShop.rating ? `${selectedShop.rating} ★` : '0 ★'}
                                    </div>
                                </div>
                                <div style={{ borderLeft: '1px solid #FFEDD5', borderRight: '1px solid #FFEDD5' }}>
                                    <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: '700' }}>Tổng đơn</div>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#F97350' }}>
                                        {selectedShop.orders || 0} {/* Hiện 0 nếu undefined */}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: '700' }}>Doanh thu</div>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#F97350' }}>
                                        {toVND(selectedShop.revenue)} {/* Sẽ hiện 0đ nếu undefined */}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                                <button
                                    className="btn primary"
                                    onClick={() => setSelectedShop(null)}
                                    style={{
                                        width: '180px',
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        fontWeight: '800',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        // Thêm 3 dòng dưới đây để ép chữ vào giữa tuyệt đối
                                        textAlign: 'center',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center'
                                    }}
                                >
                                    Đóng cửa sổ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Shops;