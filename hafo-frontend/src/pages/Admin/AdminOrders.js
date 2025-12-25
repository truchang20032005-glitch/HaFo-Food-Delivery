import { useState, useEffect } from 'react';
import api from '../../services/api'; // Import axios instance

function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    // 1. GỌI API LẤY DANH SÁCH ĐƠN HÀNG
    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders'); // Gọi API Backend
            setOrders(res.data);
        } catch (err) {
            console.error("Lỗi tải đơn hàng:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []); // Chạy 1 lần khi vào trang

    // Helper: Format tiền
    const toVND = (n) => n?.toLocaleString('vi-VN');

    // Helper: Format ngày tháng
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            hour: '2-digit', minute: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    // Helper: Badge trạng thái
    const getStatusBadge = (s) => {
        switch (s) {
            case 'done': return <span className="badge active">Hoàn thành</span>;
            case 'pickup': return <span className="badge pending" style={{ background: '#dbeafe', color: '#1e40af' }}>Đang giao</span>;
            case 'prep': return <span className="badge pending">Đang chuẩn bị</span>;
            case 'new': return <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>Mới đặt</span>;
            case 'cancel': return <span className="badge inactive">Đã hủy</span>;
            default: return <span className="badge">{s}</span>;
        }
    };

    // Lọc đơn hàng theo trạng thái
    const filteredOrders = orders.filter(o => !filterStatus || o.status === filterStatus);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn soft" onClick={fetchOrders} title="Tải lại">
                    <i className="fa-solid fa-rotate-right"></i>
                </button>
            </div>

            {/* BỘ LỌC */}
            <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                <input placeholder="Tìm theo mã đơn, khách, quán..." style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }} />
                <select
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="new">Mới đặt</option>
                    <option value="prep">Đang xử lý</option>
                    <option value="pickup">Đang giao</option>
                    <option value="done">Hoàn thành</option>
                    <option value="cancel">Đã hủy</option>
                </select>
                <button className="btn primary">Lọc</button>
            </div>

            {/* BẢNG DỮ LIỆU */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Cửa hàng</th>
                            <th>Thời gian</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy đơn hàng nào.</td></tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order._id}>
                                    {/* Lấy 6 ký tự cuối của ID cho gọn */}
                                    <td><b style={{ color: '#F97350' }}>#{order._id.slice(-6).toUpperCase()}</b></td>

                                    {/* Parse chuỗi customer để lấy tên (vì format lưu là "Tên | SĐT | ĐC") */}
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{order.customer.split('|')[0]}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>{order.customer.split('|')[1]}</div>
                                    </td>

                                    {/* Hiển thị tên quán (nếu đã populate) hoặc ID quán */}
                                    <td>{order.restaurantId?.name || 'Không xác định'}</td>

                                    <td>{formatDate(order.createdAt)}</td>

                                    <td style={{ fontWeight: 'bold' }}>{toVND(order.total)}đ</td>

                                    <td>{getStatusBadge(order.status)}</td>

                                    <td>
                                        <button className="btn view" onClick={() => setSelectedOrder(order)}>
                                            <i className="fa-solid fa-eye"></i> Xem
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT ĐƠN HÀNG (REAL DATA) */}
            {selectedOrder && (
                <div className="modal-bg" onClick={() => setSelectedOrder(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
                        <h3 style={{ color: '#F97350', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            Chi tiết đơn hàng #{selectedOrder._id.slice(-6).toUpperCase()}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                            <div>
                                <div className="info-line"><b>Ngày đặt:</b> {formatDate(selectedOrder.createdAt)}</div>
                                <div className="info-line"><b>Trạng thái:</b> {getStatusBadge(selectedOrder.status)}</div>
                                <div className="info-line"><b>Cửa hàng:</b> {selectedOrder.restaurantId?.name}</div>
                            </div>
                            <div>
                                <div className="info-line"><b>Khách hàng:</b> {selectedOrder.customer.split('|')[0]}</div>
                                <div className="info-line"><b>SĐT:</b> {selectedOrder.customer.split('|')[1]}</div>
                                <div className="info-line"><b>Địa chỉ:</b> {selectedOrder.customer.split('|')[2]}</div>
                            </div>
                        </div>

                        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '10px' }}>Danh sách món ăn:</h4>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {selectedOrder.items.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #eee', paddingBottom: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>
                                                {item.quantity}x {item.name}
                                            </div>
                                            {item.options && (
                                                <div style={{ fontSize: '12px', color: '#666' }}>
                                                    Options: {item.options}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ fontWeight: 'bold' }}>{toVND(item.price * item.quantity)}đ</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #ddd', fontSize: '18px', fontWeight: 'bold', color: '#F97350' }}>
                                <span>Tổng tiền:</span>
                                <span>{toVND(selectedOrder.total)}đ</span>
                            </div>
                        </div>

                        <button className="btn-close" onClick={() => setSelectedOrder(null)}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminOrders;