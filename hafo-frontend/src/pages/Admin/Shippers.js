import { useState, useEffect } from 'react';
import api from '../../services/api';

function AdminShippers() {
    const [shippers, setShippers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShipper, setSelectedShipper] = useState(null);

    // 1. GỌI API LẤY DANH SÁCH SHIPPER THẬT
    const fetchShippers = async () => {
        try {
            const res = await api.get('/shippers'); // Gọi API Backend vừa sửa
            setShippers(res.data);
        } catch (err) {
            console.error("Lỗi tải danh sách shipper:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShippers();
    }, []);

    // Helper hiển thị ngày
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Helper xử lý ảnh (nếu sau này có ảnh đại diện)
    const getAvatarUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/150'; // Ảnh mặc định
        if (path.startsWith('http')) return path;
        return `http://localhost:5000/${path}`;
    };

    // Lọc danh sách (Client-side)
    const filteredShippers = shippers.filter(s => {
        const name = s.user?.fullName || '';
        const phone = s.user?.phone || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn soft" onClick={fetchShippers} title="Tải lại">
                    <i className="fa-solid fa-rotate-right"></i>
                </button>
            </div>

            {/* Bộ lọc */}
            <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                <input
                    placeholder="Tìm theo tên hoặc số điện thoại..."
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {/* Có thể thêm dropdown lọc trạng thái nếu muốn */}
            </div>

            {/* Bảng dữ liệu */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Họ tên</th>
                            <th>Số điện thoại</th>
                            <th>Phương tiện</th>
                            <th>Biển số</th>
                            <th>Đánh giá</th>
                            <th>Đơn xong</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                        ) : filteredShippers.length === 0 ? (
                            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy tài xế nào.</td></tr>
                        ) : (
                            filteredShippers.map(shipper => (
                                <tr key={shipper._id}>
                                    <td><b>{shipper.user?.fullName || 'Chưa cập nhật'}</b></td>
                                    <td>{shipper.user?.phone || 'N/A'}</td>
                                    <td>{shipper.vehicleType}</td>
                                    <td><span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{shipper.licensePlate}</span></td>
                                    <td><span style={{ color: '#F5A524' }}>★</span> {shipper.rating || 5.0}</td>
                                    <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{shipper.orders}</td>
                                    <td>
                                        {shipper.isAvailable
                                            ? <span className="badge active">Đang rảnh</span>
                                            : <span className="badge pending">Đang bận</span>
                                        }
                                    </td>
                                    <td>
                                        <button className="btn view" onClick={() => setSelectedShipper(shipper)}>
                                            <i className="fa-solid fa-eye"></i> Xem
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT SHIPPER */}
            {selectedShipper && (
                <div className="modal-bg" onClick={() => setSelectedShipper(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="avatar-big" style={{ border: '3px solid #F97350' }}>
                            {/* Hiện tại chưa có trường ảnh avatar riêng cho shipper trong model, dùng tạm ảnh mặc định */}
                            <img src="/images/shipper.jpg" alt="" onError={(e) => e.target.src = 'https://via.placeholder.com/150'} />
                        </div>
                        <h3 style={{ color: '#F97350', textAlign: 'center', marginTop: '10px' }}>
                            {selectedShipper.user?.fullName}
                        </h3>

                        <div style={{ marginTop: '20px' }}>
                            <div className="info-line"><b>Email:</b> {selectedShipper.user?.email || 'N/A'}</div>
                            <div className="info-line"><b>Số điện thoại:</b> {selectedShipper.user?.phone}</div>
                            <div className="info-line"><b>Phương tiện:</b> {selectedShipper.vehicleType} - {selectedShipper.licensePlate}</div>
                            <div className="info-line"><b>Khu vực hoạt động:</b> {selectedShipper.currentLocation}</div>

                            <div style={{ display: 'flex', gap: '20px', marginTop: '15px', background: '#fff7ed', padding: '15px', borderRadius: '8px' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>Đánh giá</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#F5A524' }}>{selectedShipper.rating} ⭐</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>Đơn hoàn thành</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#F97350' }}>{selectedShipper.orders} đơn</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>Thu nhập ví</div>
                                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#22C55E' }}>{selectedShipper.income?.toLocaleString()}đ</div>
                                </div>
                            </div>

                            <div className="info-line" style={{ marginTop: '15px', border: 'none' }}>
                                <b>Trạng thái:</b>
                                {selectedShipper.isAvailable
                                    ? <span className="badge active" style={{ marginLeft: '10px' }}>Đang sẵn sàng nhận đơn</span>
                                    : <span className="badge pending" style={{ marginLeft: '10px' }}>Đang bận / Tạm nghỉ</span>
                                }
                            </div>
                            <div className="info-line" style={{ border: 'none' }}>
                                <b>Ngày tham gia:</b> {formatDate(selectedShipper.createdAt)}
                            </div>
                        </div>

                        <button className="btn-close" onClick={() => setSelectedShipper(null)}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminShippers;