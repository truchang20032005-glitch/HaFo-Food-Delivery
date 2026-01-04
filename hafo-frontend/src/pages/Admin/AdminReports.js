import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { alertSuccess, alertError, alertWarning } from '../../utils/hafoAlert';

function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminNote, setAdminNote] = useState('');

    const location = useLocation();

    const fetchReports = useCallback(async () => {
        try {
            const res = await api.get('/reports');
            const data = res.data;
            setReports(data);

            if (location.state?.openId) {
                const target = data.find(r => r._id === location.state.openId);
                if (target) {
                    setSelectedReport(target);
                    window.history.replaceState({}, document.title);
                }
            }
        } catch (err) {
            console.error("Lỗi tải báo cáo:", err);
        } finally {
            setLoading(false);
        }
    }, [location.state]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleUpdateStatus = async (id, status) => {
        if (!adminNote.trim()) return alertWarning("Thiếu thông tin", "Vui lòng nhập ghi chú xử lý!");
        try {
            await api.put(`/reports/${id}/status`, { status, adminNote });
            await alertSuccess("Thành công", "Đã cập nhật trạng thái xử lý!");
            setSelectedReport(null);
            setAdminNote('');
            fetchReports();
        } catch (err) { alertError("Lỗi", err.message); }
    };

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải báo cáo...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontWeight: '900' }}>Trung tâm xử lý khiếu nại</h3>
                <button className="btn soft" onClick={fetchReports}><i className="fa-solid fa-rotate-right"></i> Làm mới</button>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Người khiếu nại</th>
                            <th>Lý do</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Đang tải báo cáo...</td></tr>
                        ) : reports.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Không có khiếu nại nào cần xử lý.</td></tr>
                        ) : (
                            reports.map(r => (
                                <tr key={r._id}>
                                    <td><b style={{ color: '#F97350' }}>#{r.orderId?._id.slice(-6).toUpperCase()}</b></td>
                                    <td>
                                        <div style={{ fontWeight: '700' }}>{r.reporterId?.fullName}</div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>{r.reporterRole === 'shipper' ? '🛵 Tài xế' : '🏠 Nhà hàng'}</div>
                                    </td>
                                    <td style={{ maxWidth: '250px' }}><span className="text-truncate">{r.reason}</span></td>
                                    <td style={{ fontSize: '12px' }}>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                                    <td>
                                        <span className={`badge ${r.status === 'pending' ? 'pending' : (r.status === 'processed' ? 'active' : 'inactive')}`}>
                                            {r.status === 'pending' ? 'Chờ xử lý' : (r.status === 'processed' ? 'Đã giải quyết' : 'Đã bỏ qua')}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="btn view" onClick={() => setSelectedReport(r)}>Chi tiết</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT KHIẾU NẠI */}
            {selectedReport && (
                <div className="modal-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="admin-modal" style={{ maxWidth: '600px', width: '100%' }}>
                        <h3 style={{ marginTop: 0 }}>Chi tiết báo cáo khiếu nại</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>
                                    Người khiếu nại ({selectedReport.reporterRole === 'shipper' ? 'Tài xế' : 'Nhà hàng'})
                                </div>
                                <div style={{ fontWeight: 'bold' }}>{selectedReport.reporterId?.fullName}</div>
                                <div style={{ fontSize: '13px', color: '#666' }}>SĐT: {selectedReport.reporterId?.phone || "N/A"}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', color: '#999', textTransform: 'uppercase' }}>Đơn hàng liên quan</div>
                                <div style={{ fontWeight: 'bold' }}>#{selectedReport.orderId?._id}</div>
                                <div style={{ fontSize: '13px', color: '#666' }}>Khách hàng: {selectedReport.orderId?.customer?.split('|')[0]}</div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '12px' }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>NỘI DUNG ĐÁNH GIÁ CỦA KHÁCH:</div>
                            <div style={{ fontStyle: 'italic' }}>"{selectedReport.reviewContent || "Trống"}"</div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <div style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>LÝ DO KHIẾU NẠI:</div>
                            <div style={{ fontWeight: '500' }}>{selectedReport.reason}</div>
                        </div>

                        {selectedReport.status !== 'pending' && (
                            <div style={{ marginTop: '20px', padding: '15px', background: '#e6f4ea', borderRadius: '12px', color: '#1e7e34' }}>
                                <b>Admin đã xử lý:</b> {selectedReport.adminNote}
                            </div>
                        )}

                        {selectedReport.status === 'pending' && (
                            <div style={{ marginTop: '20px' }}>
                                <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Ghi chú xử lý (Admin):</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Nhập nội dung phản hồi hoặc lý do quyết định..."
                                    style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button className="btn soft" onClick={() => setSelectedReport(null)}>Đóng</button>
                            {selectedReport.status === 'pending' && (
                                <>
                                    <button className="btn inactive" onClick={() => handleUpdateStatus(selectedReport._id, 'ignored')}>Bỏ qua</button>
                                    <button className="btn primary" onClick={() => handleUpdateStatus(selectedReport._id, 'processed')}>Xác nhận giải quyết</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminReports;