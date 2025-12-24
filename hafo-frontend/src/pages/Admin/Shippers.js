import { useState } from 'react';

function AdminShippers() {
    // Mock Data (Giả lập)
    const MOCK_SHIPPERS = [
        { id: 'SP-001', name: 'Nguyễn Minh Tài', phone: '0912000001', vehicle: 'Xe máy', rating: 4.9, orders: 856, status: 'available' },
        { id: 'SP-002', name: 'Phạm Khoa', phone: '0912000002', vehicle: 'Xe máy', rating: 4.7, orders: 720, status: 'busy' },
        { id: 'SP-003', name: 'Võ Đức Huy', phone: '0912000003', vehicle: 'Xe máy', rating: 4.5, orders: 504, status: 'inactive' },
    ];

    const [shippers, setShippers] = useState(MOCK_SHIPPERS);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShipper, setSelectedShipper] = useState(null);

    // Lọc danh sách
    const filteredShippers = shippers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
    );

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Quản lý Shipper</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Danh sách tài xế giao hàng đang hoạt động trong hệ thống HaFo.</p>

            {/* Bộ lọc */}
            <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                <input
                    placeholder="Tìm theo tên hoặc số điện thoại..."
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="available">Đang rảnh</option>
                    <option value="busy">Đang giao</option>
                    <option value="inactive">Nghỉ hoạt động</option>
                </select>
                <button className="btn primary">Lọc</button>
            </div>

            {/* Bảng dữ liệu */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ tên</th>
                            <th>Số điện thoại</th>
                            <th>Phương tiện</th>
                            <th>Đánh giá</th>
                            <th>Đơn hoàn thành</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredShippers.map(shipper => (
                            <tr key={shipper.id}>
                                <td><b>{shipper.id}</b></td>
                                <td>{shipper.name}</td>
                                <td>{shipper.phone}</td>
                                <td>{shipper.vehicle}</td>
                                <td>{shipper.rating} ⭐</td>
                                <td>{shipper.orders}</td>
                                <td>
                                    {shipper.status === 'available' && <span className="badge active">Đang rảnh</span>}
                                    {shipper.status === 'busy' && <span className="badge pending">Đang giao</span>}
                                    {shipper.status === 'inactive' && <span className="badge inactive">Nghỉ hoạt động</span>}
                                </td>
                                <td>
                                    <button className="btn" onClick={() => setSelectedShipper(shipper)}>
                                        <i className="fa-solid fa-eye"></i> Xem
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT SHIPPER */}
            {selectedShipper && (
                <div className="modal-bg" onClick={() => setSelectedShipper(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
                        <div className="avatar-big">
                            <img src="/images/shipper.jpg" alt="" onError={(e) => e.target.src = 'https://via.placeholder.com/80'} />
                        </div>
                        <h3 style={{ color: '#F97350' }}>{selectedShipper.name}</h3>

                        <div style={{ textAlign: 'left', marginTop: '20px' }}>
                            <div className="info-line"><b>Số điện thoại:</b> {selectedShipper.phone}</div>
                            <div className="info-line"><b>Phương tiện:</b> {selectedShipper.vehicle}</div>
                            <div className="info-line"><b>Đánh giá:</b> {selectedShipper.rating} ⭐</div>
                            <div className="info-line"><b>Đơn hoàn thành:</b> {selectedShipper.orders}</div>
                            <div className="info-line">
                                <b>Trạng thái:</b>
                                {selectedShipper.status === 'available' ? ' Đang rảnh' : (selectedShipper.status === 'busy' ? ' Đang bận' : ' Nghỉ')}
                            </div>
                            <div className="info-line"><b>Ngày tham gia:</b> 05/03/2022</div>
                            <div className="info-line"><b>Khu vực:</b> TP. Hồ Chí Minh</div>
                        </div>

                        <button className="btn-close" onClick={() => setSelectedShipper(null)}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminShippers;