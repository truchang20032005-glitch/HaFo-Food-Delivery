import { useState, useEffect } from 'react';
import api from '../../services/api';

function AdminReports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminNote, setAdminNote] = useState('');

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports');
            setReports(res.data);
        } catch (err) {
            console.error("Lỗi tải báo cáo:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.put(`/reports/${id}/status`, { status, adminNote });
            alert("Đã cập nhật trạng thái xử lý!");
            setSelectedReport(null);
            setAdminNote('');
            fetchReports();
        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };

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
                                        <div style={{ fontWeight: '700' }}>{r.shipperId?.fullName}</div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>{r.shipperId?.phone}</div>
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
                <div className="modal-bg" onClick={() => setSelectedReport(null)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', borderRadius: '24px', padding: '30px' }}>
                        <h3 style={{ color: '#F97350', marginBottom: '20px' }}>Chi tiết khiếu nại</h3>

                        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
                            <div style={{ marginBottom: '10px' }}><b>Nội dung đánh giá của khách:</b></div>
                            <div style={{ fontStyle: 'italic', color: '#64748b', background: '#fff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                "{selectedReport.reviewContent || "Không có nội dung văn bản"}"
                            </div>
                            <div style={{ marginTop: '15px' }}><b>Lý do tài xế khiếu nại:</b></div>
                            <div style={{ color: '#1e293b', fontWeight: '500' }}>{selectedReport.reason}</div>
                        </div>

                        {selectedReport.status === 'pending' && (
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ fontWeight: '700', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Ghi chú xử lý (Admin):</label>
                                <textarea
                                    value={adminNote}
                                    onChange={(e) => setAdminNote(e.target.value)}
                                    placeholder="Nhập nội dung phản hồi hoặc lý do quyết định..."
                                    style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', outline: 'none' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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