import { useState, useEffect } from 'react';
import api from '../../services/api';

function Pending() {
    const [requests, setRequests] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);

    // State mới để xử lý từ chối chuyên nghiệp hơn
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // 1. Hàm lấy dữ liệu thật từ Backend
    const fetchPending = async () => {
        try {
            //const res = await axios.get('http://localhost:5000/api/pending/all');
            const res = await api.get('/pending/all');
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

    // Reset state khi đóng hoặc mở modal
    const closeDetail = () => {
        setSelectedReq(null);
        setIsRejecting(false);
        setRejectReason('');
    };

    const openDetail = (req) => {
        setSelectedReq(req);
        setIsRejecting(false);
        setRejectReason('');
    };

    // 2. Xử lý Duyệt
    const handleApprove = async () => {
        if (!selectedReq) return;
        if (window.confirm(`Xác nhận duyệt hồ sơ của ${selectedReq.name || selectedReq.fullName}?`)) {
            try {
                //await axios.put(`http://localhost:5000/api/pending/approve/${selectedReq.type}/${selectedReq._id}`);
                await api.put(`/pending/approve/${selectedReq.type}/${selectedReq._id}`);
                alert("Đã duyệt thành công! Tài khoản đã được kích hoạt.");
                fetchPending();
                closeDetail();
            } catch (err) {
                alert("Lỗi: " + err.message);
            }
        }
    };

    // 3. Xử lý Từ chối (Nâng cấp)
    const handleSubmitReject = async () => {
        if (!rejectReason.trim()) {
            alert("Vui lòng nhập lý do từ chối!");
            return;
        }

        try {
            // Gửi reason trong body (tham số thứ 2 của axios.put)
            /*await axios.put(
                `http://localhost:5000/api/pending/reject/${selectedReq.type}/${selectedReq._id}`,
                { reason: rejectReason } // <--- QUAN TRỌNG: Gửi lý do xuống đây
            );*/
            await api.put(`/pending/reject/${selectedReq.type}/${selectedReq._id}`, { reason: rejectReason });

            alert("Đã từ chối hồ sơ và gửi email thông báo.");
            fetchPending();
            closeDetail();
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

    // --- HELPER HIỂN THỊ ẢNH (ĐÃ FIX LỖI) ---
    const renderImageRow = (label, path) => {
        if (!path) return null;

        return (
            <div style={{ marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '13px' }}>{label}:</div>
                <a href={path} target="_blank" rel="noreferrer">
                    <img
                        src={path}
                        alt={label}
                        style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
                        onError={(e) => e.target.src = 'https://via.placeholder.com/300?text=Lỗi+Ảnh'}
                    />
                </a>
            </div>
        );
    };

    return (
        <div>
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
                                        <button className="btn" onClick={() => openDetail(req)}>
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
            {selectedReq && (
                <div className="modal-bg" onClick={closeDetail}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ color: '#F97350', margin: 0 }}>
                                {selectedReq.type === 'merchant' ? 'Hồ sơ Nhà hàng' : 'Hồ sơ Shipper'}
                            </h3>
                            <button onClick={closeDetail} style={{ border: 'none', background: 'transparent', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                        </div>

                        <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
                            <table className="detail-table">
                                <tbody>
                                    {/* THÔNG TIN CHUNG */}
                                    <tr><th>Tên hiển thị</th><td><b>{selectedReq.name || selectedReq.fullName}</b></td></tr>
                                    <tr><th>Số điện thoại</th><td>{selectedReq.phone}</td></tr>
                                    <tr><th>Email</th><td>{selectedReq.email}</td></tr>

                                    {selectedReq.type === 'merchant' ? (
                                        <>
                                            <tr><td colSpan="2" style={{ background: '#eee', fontWeight: 'bold', padding: '8px' }}>Thông tin Quán</td></tr>
                                            <tr><th>Địa chỉ quán</th><td>{selectedReq.address}, {selectedReq.district}, {selectedReq.city}</td></tr>
                                            <tr><th>Loại hình</th><td>{selectedReq.serviceType === 'food' ? 'Giao đồ ăn' : 'Giao thực phẩm'}</td></tr>
                                            <tr><th>Ẩm thực</th><td>{selectedReq.cuisine?.join(', ')}</td></tr>

                                            <tr><td colSpan="2" style={{ background: '#eee', fontWeight: 'bold', padding: '8px' }}>Pháp lý & Ngân hàng</td></tr>
                                            <tr><th>Chủ sở hữu</th><td>{selectedReq.ownerName} ({selectedReq.idCard})</td></tr>
                                            <tr><th>Ngân hàng</th><td>{selectedReq.bankName} - {selectedReq.bankAccount} ({selectedReq.bankOwner})</td></tr>

                                            <tr><td colSpan="2" style={{ background: '#eee', fontWeight: 'bold', padding: '8px' }}>Hồ sơ ảnh</td></tr>
                                            {renderImageRow("Ảnh mặt tiền", selectedReq.avatar)}
                                            {renderImageRow("CCCD Mặt trước", selectedReq.idCardFront)}
                                            {renderImageRow("CCCD Mặt sau", selectedReq.idCardBack)}
                                            {renderImageRow("Giấy phép KD", selectedReq.businessLicense)}
                                        </>
                                    ) : (
                                        <>
                                            <tr><td colSpan="2" style={{ background: '#eee', fontWeight: 'bold', padding: '8px' }}>Thông tin Xe & Hoạt động</td></tr>
                                            <tr><th>Địa chỉ</th><td>{selectedReq.address}, {selectedReq.district}, {selectedReq.city}</td></tr>
                                            <tr><th>Phương tiện</th><td>{selectedReq.vehicleType}</td></tr>
                                            <tr><th>Biển số xe</th><td>{selectedReq.licensePlate}</td></tr>
                                            <tr><th>Ngân hàng</th><td>{selectedReq.bankName} - {selectedReq.bankAccount}</td></tr>

                                            <tr><td colSpan="2" style={{ background: '#eee', fontWeight: 'bold', padding: '8px' }}>Hồ sơ ảnh</td></tr>
                                            {renderImageRow("Ảnh chân dung", selectedReq.avatar)}
                                            {renderImageRow("Cà vẹt xe", selectedReq.vehicleRegImage)}
                                            {renderImageRow("Bằng lái xe", selectedReq.licenseImage)}
                                            {renderImageRow("CCCD Mặt trước", selectedReq.cccdFront)}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PHẦN NÚT HÀNH ĐỘNG (ĐƯỢC NÂNG CẤP) */}
                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>

                            {!isRejecting ? (
                                // 1. Chế độ xem bình thường
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                    <button className="btn danger" onClick={() => setIsRejecting(true)}>
                                        Từ chối hồ sơ
                                    </button>
                                    <button className="btn primary" onClick={handleApprove}>
                                        <i className="fa-solid fa-check"></i> Duyệt ngay
                                    </button>
                                </div>
                            ) : (
                                // 2. Chế độ nhập lý do từ chối
                                <div style={{ animation: 'fadeIn 0.3s' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#dc2626' }}>
                                        Lý do từ chối hồ sơ này:
                                    </label>
                                    <textarea
                                        autoFocus
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Ví dụ: Ảnh CCCD bị mờ, Thông tin không khớp..."
                                        style={{
                                            width: '100%', minHeight: '80px', padding: '10px',
                                            borderRadius: '8px', border: '1px solid #dc2626',
                                            fontFamily: 'inherit', resize: 'vertical'
                                        }}
                                    ></textarea>
                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                        <button className="btn soft" onClick={() => setIsRejecting(false)}>
                                            Quay lại
                                        </button>
                                        <button className="btn danger" onClick={handleSubmitReject}>
                                            Xác nhận Từ chối
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

export default Pending;