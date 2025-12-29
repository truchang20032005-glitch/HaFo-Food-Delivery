import { useState, useEffect } from 'react';
import api from '../../services/api';

function AdminShippers() {
    const [shippers, setShippers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedShipper, setSelectedShipper] = useState(null);

    const fetchShippers = async () => {
        try {
            const res = await api.get('/shippers');
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

    // Helper: Định dạng tiền không bị lỗi undefined
    const toVND = (n) => {
        if (typeof n !== 'number') return '0đ';
        return n.toLocaleString('vi-VN') + 'đ';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const filteredShippers = shippers.filter(s => {
        const name = s.user?.fullName || '';
        const phone = s.user?.phone || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
    });

    if (loading) return (
        <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '30px', marginBottom: '10px' }}></i>
            <p>Đang tải danh sách tài xế...</p>
        </div>
    );

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontWeight: '900', color: '#1e293b' }}>Quản lý đội ngũ tài xế</h3>
                <button className="btn soft" onClick={fetchShippers} title="Tải lại">
                    <i className="fa-solid fa-rotate-right"></i> Làm mới
                </button>
            </div>

            <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input
                        placeholder="Tìm tài xế theo tên hoặc số điện thoại..."
                        style={{ padding: '12px 12px 12px 45px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', outline: 'none' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Ảnh</th>
                            <th>Họ tên</th>
                            <th>Số điện thoại</th>
                            <th>Phương tiện</th>
                            <th>Đánh giá</th>
                            <th style={{ textAlign: 'center' }}>Đơn xong</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredShippers.map(shipper => (
                            <tr key={shipper._id}>
                                <td>
                                    <img
                                        src={shipper.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                        alt="Avatar"
                                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }}
                                    />
                                </td>
                                <td><b>{shipper.user?.fullName}</b></td>
                                <td>{shipper.user?.phone}</td>
                                <td>{shipper.vehicleType} <br /><small style={{ color: '#64748b' }}>{shipper.licensePlate}</small></td>
                                <td><b style={{ color: '#F5A524' }}>★ {shipper.rating?.toFixed(1) || '5.0'}</b></td>

                                {/* ✅ HIỂN THỊ SỐ ĐƠN THẬT TỪ BACKEND */}
                                <td style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                        <span className="badge" style={{ background: '#F1F5F9', color: '#0F172A', fontWeight: '800', padding: '6px 12px', margin: 0 }}>
                                            {shipper.orders} đơn
                                        </span>
                                    </div>
                                </td>

                                <td>
                                    {shipper.isAvailable
                                        ? <span className="badge active">Sẵn sàng</span>
                                        : <span className="badge pending">Đang bận</span>
                                    }
                                </td>
                                <td>
                                    <button className="btn view" onClick={() => setSelectedShipper(shipper)}>
                                        <i className="fa-solid fa-eye"></i> Xem
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT SHIPPER - NÂNG CẤP DỮ LIỆU REAL */}
            {selectedShipper && (
                <div className="modal-bg" onClick={() => setSelectedShipper(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', width: '90%', borderRadius: '24px', padding: '30px' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' }}>
                            <div className="avatar-big" style={{ border: '4px solid #FFF1ED', width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                {/* ✅ Sử dụng ảnh thực tế từ Backend */}
                                <img
                                    src={selectedShipper.user?.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                    alt="Shipper Avatar"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => e.target.src = 'https://via.placeholder.com/150'}
                                />
                            </div>
                            <h3 style={{ color: '#1e293b', marginTop: '15px', fontSize: '22px', fontWeight: '900', marginBottom: '5px' }}>
                                {selectedShipper.user?.fullName}
                            </h3>
                            <span className="badge active" style={{ fontSize: '11px', padding: '4px 12px' }}>TÀI XẾ ĐỐI TÁC</span>
                        </div>

                        <div style={{ background: '#F8FAFC', borderRadius: '20px', padding: '20px', marginBottom: '25px' }}>
                            <div className="info-line"><b>Email:</b> <span>{selectedShipper.user?.email || 'N/A'}</span></div>
                            <div className="info-line"><b>SĐT:</b> <span>{selectedShipper.user?.phone}</span></div>
                            <div className="info-line"><b>Phương tiện:</b> <span>{selectedShipper.vehicleType} ({selectedShipper.licensePlate})</span></div>
                            <div className="info-line"><b>Khu vực:</b> <span>{selectedShipper.currentLocation || 'Chưa xác định'}</span></div>
                        </div>

                        {/* Thống kê thu nhập & đánh giá */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', textAlign: 'center', background: '#FFF7ED', padding: '20px', borderRadius: '20px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: '700' }}>Đánh giá</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: '#F97350' }}>{selectedShipper.rating} ★</div>
                            </div>
                            <div style={{ borderLeft: '1px solid #FFEDD5', borderRight: '1px solid #FFEDD5' }}>
                                <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: '700' }}>Đơn xong</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: '#F97350' }}>{selectedShipper.orders}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#C2410C', fontWeight: '700' }}>Số dư ví</div>
                                <div style={{ fontSize: '18px', fontWeight: '900', color: '#22C55E' }}>{toVND(selectedShipper.income)}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
                            Ngày gia nhập: {formatDate(selectedShipper.createdAt)}
                        </div>

                        {/* ✅ Nút đóng căn giữa tuyệt đối */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                            <button
                                className="btn primary"
                                onClick={() => setSelectedShipper(null)}
                                style={{ width: '180px', padding: '12px', borderRadius: '15px', fontWeight: '800', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            >
                                Đóng thông tin
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminShippers;