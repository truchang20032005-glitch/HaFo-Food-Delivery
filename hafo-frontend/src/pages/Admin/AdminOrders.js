import { useState } from 'react';

function AdminOrders() {
    // Mock Data
    const MOCK_ORDERS = [
        { id: 'HF-10293', customer: 'Nguyễn Văn A', shop: 'Cơm Tấm Ba Ghiền', shipper: 'Nguyễn Minh', date: '09/11/2025', total: 120000, status: 'done' },
        { id: 'HF-10294', customer: 'Trần Thị B', shop: 'Bún Bò Hằng Nga', shipper: 'Phạm Khoa', date: '08/11/2025', total: 89000, status: 'pickup' },
        { id: 'HF-10295', customer: 'Lê Hồng C', shop: 'Phở Thìn', shipper: 'Võ Đức Huy', date: '08/11/2025', total: 65000, status: 'prep' },
        { id: 'HF-10296', customer: 'Phạm Văn D', shop: 'Trà Sữa Koi', shipper: '', date: '08/11/2025', total: 45000, status: 'cancel' },
    ];

    const [orders, setOrders] = useState(MOCK_ORDERS);
    const [filterStatus, setFilterStatus] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);

    const filteredOrders = orders.filter(o => !filterStatus || o.status === filterStatus);

    const getStatusBadge = (s) => {
        switch (s) {
            case 'done': return <span className="badge active">Hoàn thành</span>;
            case 'pickup': return <span className="badge pending">Đang giao</span>;
            case 'prep': return <span className="badge inactive" style={{ background: '#fff7ed', color: '#c2410c' }}>Đang xử lý</span>;
            case 'cancel': return <span className="badge inactive">Đã hủy</span>;
            default: return <span className="badge">{s}</span>;
        }
    };

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Quản lý đơn hàng</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Danh sách đơn hàng từ các cửa hàng và khách hàng trong hệ thống HaFo.</p>

            {/* BỘ LỌC */}
            <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                <input placeholder="Tìm theo mã đơn, khách, quán..." style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }} />
                <select
                    style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="prep">Đang xử lý</option>
                    <option value="pickup">Đang giao</option>
                    <option value="done">Hoàn thành</option>
                    <option value="cancel">Đã hủy</option>
                </select>
                <button className="btn primary">Lọc</button>
            </div>

            {/* BẢNG */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Cửa hàng</th>
                            <th>Shipper</th>
                            <th>Ngày đặt</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.map(order => (
                            <tr key={order.id}>
                                <td><b>{order.id}</b></td>
                                <td>{order.customer}</td>
                                <td>{order.shop}</td>
                                <td>{order.shipper || <i style={{ color: '#999' }}>Chưa có</i>}</td>
                                <td>{order.date}</td>
                                <td>{order.total.toLocaleString()}đ</td>
                                <td>{getStatusBadge(order.status)}</td>
                                <td>
                                    <button className="btn view" onClick={() => setSelectedOrder(order)}>
                                        <i className="fa-solid fa-eye"></i> Xem
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT ĐƠN */}
            {selectedOrder && (
                <div className="modal-bg" onClick={() => setSelectedOrder(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <h3 style={{ color: '#F97350' }}>Chi tiết đơn hàng</h3>

                        <div className="info-line"><b>Mã đơn:</b> {selectedOrder.id}</div>
                        <div className="info-line"><b>Khách hàng:</b> {selectedOrder.customer}</div>
                        <div className="info-line"><b>Cửa hàng:</b> {selectedOrder.shop}</div>
                        <div className="info-line"><b>Shipper:</b> {selectedOrder.shipper}</div>
                        <div className="info-line"><b>Ngày đặt:</b> {selectedOrder.date}</div>
                        <div className="info-line"><b>Tổng tiền:</b> {selectedOrder.total.toLocaleString()} VND</div>
                        <div className="info-line"><b>Trạng thái:</b> {getStatusBadge(selectedOrder.status)}</div>

                        <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '15px 0' }} />

                        <h4>Chi tiết món ăn (Demo):</h4>
                        <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                            <li>1x Cơm sườn trứng</li>
                            <li>1x Canh chua cá lóc</li>
                        </ul>

                        <button className="btn-close" onClick={() => setSelectedOrder(null)}>Đóng</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminOrders;