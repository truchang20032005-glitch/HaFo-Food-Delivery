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
                <div className="modal-bg" onClick={() => setSelectedOrder(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px', width: '90%', borderRadius: '24px', padding: '30px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>

                        {/* Header Modal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h3 style={{ color: '#F97350', margin: 0, fontSize: '24px', fontWeight: '900' }}>
                                Chi tiết đơn hàng #{selectedOrder._id.slice(-6).toUpperCase()}
                            </h3>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                style={{ border: 'none', background: '#f1f5f9', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '20px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Thông tin chung: Chia 2 cột */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '25px', marginBottom: '25px', padding: '20px', background: '#F8FAFC', borderRadius: '20px' }}>
                            <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '15px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>Thông tin đơn</div>
                                <div style={{ marginBottom: '6px' }}><b>Ngày đặt:</b> <span style={{ color: '#475569' }}>{formatDate(selectedOrder.createdAt)}</span></div>
                                <div style={{ marginBottom: '6px' }}><b>Trạng thái:</b> {getStatusBadge(selectedOrder.status)}</div>
                                <div><b>Cửa hàng:</b> <span style={{ color: '#475569' }}>{selectedOrder.restaurantId?.name}</span></div>
                            </div>
                            <div style={{ paddingLeft: '5px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.5px' }}>Thông tin khách hàng</div>
                                <div style={{ marginBottom: '6px' }}><b>Khách:</b> <span style={{ color: '#475569' }}>{selectedOrder.customer.split('|')[0]}</span></div>
                                <div style={{ marginBottom: '6px' }}><b>SĐT:</b> <span style={{ color: '#475569' }}>{selectedOrder.customer.split('|')[1]}</span></div>
                                <div style={{ fontSize: '13px', lineHeight: '1.4' }}><b>Địa chỉ:</b> <span style={{ color: '#475569' }}>{selectedOrder.customer.split('|')[2]}</span></div>
                            </div>
                        </div>

                        {/* Danh sách món ăn có hình ảnh & thanh cuộn */}
                        <div style={{ border: '1px solid #f1f5f9', borderRadius: '20px', padding: '20px' }}>
                            <h4 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fa-solid fa-utensils" style={{ color: '#F97350' }}></i> Danh sách món ăn:
                            </h4>

                            <div style={{ maxHeight: '320px', overflowY: 'auto', paddingRight: '10px' }}>
                                {selectedOrder.items.map((item, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            gap: '15px',
                                            marginBottom: '15px',
                                            borderBottom: index === selectedOrder.items.length - 1 ? 'none' : '1px solid #f8fafc',
                                            paddingBottom: '15px',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {/* Hình ảnh món ăn */}
                                        <img
                                            src={item.image || "https://via.placeholder.com/60"}
                                            alt={item.name}
                                            style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #f1f5f9' }}
                                        />

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', color: '#1e293b' }}>
                                                <span>{item.quantity}x {item.name}</span>
                                                <span style={{ color: '#475569' }}>{toVND(item.price * item.quantity)}đ</span>
                                            </div>
                                            {item.options && (
                                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontStyle: 'italic' }}>
                                                    Ghi chú: {item.options}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tổng thanh toán */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '20px',
                                paddingTop: '20px',
                                borderTop: '2px solid #F7F2E5',
                                fontSize: '22px',
                                fontWeight: '900',
                                color: '#F97350'
                            }}>
                                <span style={{ color: '#1e293b', fontSize: '18px' }}>TỔNG THANH TOÁN:</span>
                                <span>{toVND(selectedOrder.total)}đ</span>
                            </div>
                        </div>

                        <button
                            className="btn primary"
                            onClick={() => setSelectedOrder(null)}
                            style={{ width: '100%', marginTop: '25px', padding: '15px', borderRadius: '15px', fontWeight: '800', fontSize: '16px' }}
                        >
                            Đóng chi tiết
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminOrders;