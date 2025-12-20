import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Pending() {
    const [requests, setRequests] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);

    // 1. Hàm lấy dữ liệu thật từ Backend
    const fetchPending = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/pending/all');
            // Backend trả về { merchants: [], shippers: [] }
            // Chúng ta gộp lại thành 1 mảng để hiển thị chung, đánh dấu type
            const merchants = res.data.merchants.map(m => ({ ...m, type: 'merchant' }));
            const shippers = res.data.shippers.map(s => ({ ...s, type: 'shipper' }));

            setRequests([...merchants, ...shippers]);
        } catch (err) {
            console.error("Lỗi tải danh sách chờ:", err);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    // 2. Xử lý Duyệt (Gọi API thật)
    const handleApprove = async (req) => {
        if (window.confirm(`Xác nhận duyệt hồ sơ của ${req.name || req.fullName}?`)) {
            try {
                // Gọi API PUT /approve
                await axios.put(`http://localhost:5000/api/pending/approve/${req.type}/${req._id}`);
                alert("Đã duyệt thành công! User này giờ đã có thể đăng nhập vào trang quản lý.");
                fetchPending(); // Tải lại danh sách
                setSelectedReq(null);
            } catch (err) {
                alert("Lỗi: " + err.message);
            }
        }
    };

    // 3. Xử lý Từ chối
    const handleReject = async (req) => {
        const reason = prompt("Nhập lý do từ chối:");
        if (reason) {
            try {
                await axios.put(`http://localhost:5000/api/pending/reject/${req.type}/${req._id}`);
                alert("Đã từ chối hồ sơ.");
                fetchPending();
                setSelectedReq(null);
            } catch (err) {
                alert("Lỗi: " + err.message);
            }
        }
    };

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Danh sách chờ xét duyệt (Realtime)</h3>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Loại</th>
                            <th>Tên đối tác</th>
                            <th>Ngày đăng ký</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Hiện không có hồ sơ nào chờ duyệt.</td></tr>
                        ) : (
                            requests.map(req => (
                                <tr key={req._id}>
                                    <td>
                                        {req.type === 'merchant'
                                            ? <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>Nhà hàng</span>
                                            : <span className="badge" style={{ background: '#f0fdf4', color: '#15803d' }}>Shipper</span>
                                        }
                                    </td>
                                    <td>{req.name || req.fullName}</td>
                                    <td>{new Date(req.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td><span className="badge pending">Chờ duyệt</span></td>
                                    <td>
                                        <button className="btn" onClick={() => setSelectedReq(req)} style={{ marginRight: '5px' }}>
                                            Xem
                                        </button>
                                        <button className="btn primary" onClick={() => handleApprove(req)} style={{ marginRight: '5px' }}>
                                            Duyệt
                                        </button>
                                        <button className="btn danger" onClick={() => handleReject(req)}>
                                            X
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT */}
            {selectedReq && (
                <div className="modal-bg" onClick={() => setSelectedReq(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <h3 style={{ color: '#F97350' }}>
                            {selectedReq.type === 'merchant' ? 'Hồ sơ Nhà hàng' : 'Hồ sơ Shipper'}
                        </h3>

                        <table className="detail-table">
                            <tbody>
                                <tr><th>Tên hiển thị</th><td><b>{selectedReq.name || selectedReq.fullName}</b></td></tr>
                                <tr><th>Số điện thoại</th><td>{selectedReq.phone}</td></tr>

                                {selectedReq.type === 'merchant' ? (
                                    <>
                                        <tr><th>Địa chỉ quán</th><td>{selectedReq.address}</td></tr>
                                        <tr><th>Khu vực</th><td>{selectedReq.district}, {selectedReq.city}</td></tr>
                                        <tr><th>Người đại diện</th><td>{selectedReq.repName}</td></tr>
                                        <tr><th>Ngân hàng</th><td>{selectedReq.bankName} - {selectedReq.bankAccount}</td></tr>
                                    </>
                                ) : (
                                    <>
                                        <tr><th>Email</th><td>{selectedReq.email}</td></tr>
                                        <tr><th>Phương tiện</th><td>{selectedReq.vehicleType}</td></tr>
                                        <tr><th>Biển số</th><td>{selectedReq.licensePlate}</td></tr>
                                        <tr><th>Ngân hàng</th><td>{selectedReq.bankName} - {selectedReq.bankAccount}</td></tr>
                                    </>
                                )}
                            </tbody>
                        </table>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <button className="btn danger" onClick={() => handleReject(selectedReq)}>Từ chối</button>
                            <button className="btn primary" onClick={() => handleApprove(selectedReq)}>Duyệt ngay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Pending;