import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useLocation } from 'react-router-dom';
import { alertSuccess, alertError, alertWarning, confirmDialog } from '../../utils/hafoAlert';

function Pending() {
    const location = useLocation();
    const [requests, setRequests] = useState([]);
    const [selectedReq, setSelectedReq] = useState(null);

    // State mới để xử lý từ chối chuyên nghiệp hơn
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // 1. Hàm lấy dữ liệu thật từ Backend
    const fetchPending = useCallback(async () => {
        try {
            const res = await api.get('/pending/all');
            const merchants = res.data.merchants.map(m => ({ ...m, type: 'merchant' }));
            const shippers = res.data.shippers.map(s => ({ ...s, type: 'shipper' }));
            const all = [...merchants, ...shippers];
            setRequests(all);

            if (location.state?.openId) {
                const target = all.find(item => item._id === location.state.openId);
                if (target) {
                    setSelectedReq(target);
                    window.history.replaceState({}, document.title);
                }
            }
        } catch (err) {
            console.error("Lỗi tải hồ sơ:", err);
        }
    }, [location.state]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

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
        // 1. Kiểm tra điều kiện đầu vào
        if (!selectedReq) return;

        // 2. Sử dụng confirmDialog (nhớ có await)
        const displayName = selectedReq.name || selectedReq.fullName;
        const isConfirmed = await confirmDialog(
            "Xác nhận duyệt?",
            `Bạn có chắc chắn muốn duyệt hồ sơ của ${displayName}?`
        );

        if (isConfirmed) {
            try {
                // 3. Gọi API duyệt hồ sơ
                await api.put(`/pending/approve/${selectedReq.type}/${selectedReq._id}`);

                // 4. Thông báo thành công (Nên tách Title và Text cho đẹp)
                await alertSuccess(
                    "Thành công!",
                    "Hồ sơ đã được duyệt. Tài khoản đã sẵn sàng hoạt động."
                );

                // 5. Cập nhật lại danh sách và đóng modal chi tiết
                fetchPending();
                closeDetail();

            } catch (err) {
                // 6. Xử lý lỗi từ Server chuyên nghiệp hơn
                const errorMessage = err.response?.data?.message || err.message;
                alertError("Lỗi khi duyệt", errorMessage);
            }
        }
    };

    // 3. Xử lý Từ chối (Nâng cấp)
    const handleSubmitReject = async () => {
        if (!rejectReason.trim()) return alertWarning("Vui lòng nhập lý do từ chối");
        try {
            await api.put(`/pending/reject/${selectedReq.type}/${selectedReq._id}`, {
                reason: rejectReason
            });
            alertSuccess("Đã từ chối hồ sơ!");
            setIsRejecting(false);
            setSelectedReq(null);
            fetchPending(); // Tải lại danh sách
        } catch (err) { alertError("Lỗi", err.message); }
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
                                            <tr><th>Địa chỉ quán</th><td>{selectedReq.address}</td></tr>
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

                                            <tr><td colSpan="2" style={{ background: '#eee', fontWeight: 'bold', padding: '8px' }}>Hồ sơ ảnh (Shipper)</td></tr>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '10px' }}>
                                                {renderImageRow("Ảnh chân dung", selectedReq.avatar)}
                                                {renderImageRow("Cà vẹt xe", selectedReq.vehicleRegImage)}
                                                {renderImageRow("Bằng lái xe", selectedReq.licenseImage)}
                                                {renderImageRow("CCCD Mặt trước", selectedReq.cccdFront)}
                                                {renderImageRow("CCCD Mặt sau", selectedReq.cccdBack)} {/* ✅ ĐÃ THÊM DÒNG NÀY */}
                                            </div>
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