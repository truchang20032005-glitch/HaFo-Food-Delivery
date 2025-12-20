import React, { useState } from 'react';

function Shops() {
    // Mock Data (Sau này thay bằng API)
    const MOCK_SHOPS = [
        { id: 'S-001', name: 'Cơm Tấm Ba Ghiền', owner: 'Lê Hồng C', address: '84 Đặng Văn Ngữ, Phú Nhuận', rating: 4.0, orders: 428, revenue: 85600000, status: 'active', joinDate: '15/05/2022', img: '[https://via.placeholder.com/150](https://via.placeholder.com/150)' },
        { id: 'S-002', name: 'Bún Bò Hằng Nga', owner: 'Nguyễn Thị H', address: '12 Nguyễn Tri Phương, Q10', rating: 3.4, orders: 392, revenue: 74200000, status: 'active', joinDate: '20/11/2023', img: '[https://via.placeholder.com/150](https://via.placeholder.com/150)' },
        { id: 'S-003', name: 'Phở Thìn 13 Lò Đúc', owner: 'Phạm Văn D', address: '13 Lò Đúc, Q1', rating: 4.6, orders: 341, revenue: 69800000, status: 'active', joinDate: '10/01/2024', img: '[https://via.placeholder.com/150](https://via.placeholder.com/150)' },
    ];

    const [shops, setShops] = useState(MOCK_SHOPS);
    const [searchTerm, setSearchTerm] = useState('');
    const [ratingFilter, setRatingFilter] = useState('');

    // State cho Modal
    const [selectedShop, setSelectedShop] = useState(null);

    // Xử lý lọc
    const filteredShops = shops.filter(shop => {
        const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.owner.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRating = ratingFilter ? shop.rating >= parseFloat(ratingFilter) : true;
        return matchesSearch && matchesRating;
    });

    const toVND = (n) => n.toLocaleString('vi-VN');

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Quản lý nhà hàng</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Danh sách tất cả các cửa hàng đối tác trong hệ thống HaFo.</p>

            {/* BỘ LỌC */}
            <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                <input
                    placeholder="Tìm theo tên hoặc chủ cửa hàng..."
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
                <button className="btn primary">Lọc</button>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
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
                        {filteredShops.map(shop => (
                            <tr key={shop.id}>
                                <td><b>{shop.id}</b></td>
                                <td title={shop.name}><b>{shop.name}</b></td>
                                <td>{shop.owner}</td>
                                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={shop.address}>
                                    {shop.address}
                                </td>
                                <td><span style={{ color: '#F5A524' }}>★</span> {shop.rating}</td>
                                <td>{shop.orders}</td>
                                <td style={{ fontWeight: 'bold', color: '#F97350' }}>{toVND(shop.revenue)}</td>
                                <td>
                                    <button className="btn" onClick={() => setSelectedShop(shop)}>
                                        <i className="fa-solid fa-eye"></i> Xem
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT */}
            {selectedShop && (
                <div className="modal-bg" onClick={() => setSelectedShop(null)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="avatar-big">
                            <img src={selectedShop.img} alt="Shop" />
                        </div>
                        <h3>{selectedShop.name}</h3>

                        <div className="info-line"><b>Chủ cửa hàng:</b> {selectedShop.owner}</div>
                        <div className="info-line"><b>Địa chỉ:</b> {selectedShop.address}</div>
                        <div className="info-line"><b>Đánh giá:</b> {selectedShop.rating} ⭐</div>
                        <div className="info-line"><b>Tổng đơn:</b> {selectedShop.orders}</div>
                        <div className="info-line"><b>Doanh thu:</b> {toVND(selectedShop.revenue)} VND</div>
                        <div className="info-line"><b>Ngày tham gia:</b> {selectedShop.joinDate}</div>
                        <div className="info-line">
                            <b>Trạng thái:</b>
                            <span className="badge active">Hoạt động</span>
                        </div>

                        <button className="btn-close" onClick={() => setSelectedShop(null)}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Shops;