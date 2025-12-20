import React, { useState } from 'react';

function Complaints() {
    // Mock Data (Giả lập dữ liệu từ file HTML)
    const MOCK_COMPLAINTS = [
        {
            id: 'K-101',
            sender: 'Lê Hà (Khách)',
            target: 'Shipper Nguyễn Minh',
            type: 'Giao trễ',
            status: 'pending',
            content: 'Shipper giao trễ 30 phút, thái độ không tốt khi tôi hỏi lý do.'
        },
        {
            id: 'K-102',
            sender: 'Quán Cơm Tấm (Merchant)',
            target: 'Shipper Phạm Khoa',
            type: 'Làm đổ món',
            status: 'resolved',
            content: 'Shipper làm đổ canh trong quá trình vận chuyển.'
        },
        {
            id: 'K-103',
            sender: 'Trần Văn Tài (Shipper)',
            target: 'Khách hàng B',
            type: 'Boom hàng',
            status: 'pending',
            content: 'Khách không nghe máy, tôi đợi 15 phút không thấy ra nhận.'
        }
    ];

    const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);
    const [selected, setSelected] = useState(null);

    // Xử lý: Đánh dấu đã xong
    const handleResolve = () => {
        setComplaints(complaints.map(c =>
            c.id === selected.id ? { ...c, status: 'resolved' } : c
        ));
        alert(`Đã xử lý khiếu nại ${selected.id}`);
        setSelected(null);
    };

    // Xử lý: Phạt/Khóa
    const handlePunish = () => {
        if (window.confirm(`Bạn có chắc muốn khóa tài khoản bị tố cáo trong đơn ${selected.id}?`)) {
            alert("Đã khóa tài khoản vi phạm!");
            handleResolve(); // Coi như đã xử lý xong
        }
    };

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Xử lý khiếu nại</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Danh sách các báo cáo sự cố từ người dùng.</p>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Người gửi</th>
                            <th>Đối tượng bị báo cáo</th>
                            <th>Loại vi phạm</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {complaints.map(item => (
                            <tr key={item.id}>
                                <td><b>{item.id}</b></td>
                                <td>{item.sender}</td>
                                <td>{item.target}</td>
                                <td>{item.type}</td>
                                <td>
                                    {item.status === 'pending'
                                        ? <span className="badge pending">Chờ xử lý</span>
                                        : <span className="badge active">Đã giải quyết</span>
                                    }
                                </td>
                                <td>
                                    <button className="btn" onClick={() => setSelected(item)}>
                                        Xem
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CHI TIẾT */}
            {selected && (
                <div className="modal-bg" onClick={() => setSelected(null)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h3 style={{ color: '#F97350' }}>Chi tiết khiếu nại</h3>

                        <div className="info-line"><b>Mã:</b> {selected.id}</div>
                        <div className="info-line"><b>Người gửi:</b> {selected.sender}</div>
                        <div className="info-line"><b>Đối tượng:</b> {selected.target}</div>
                        <div className="info-line"><b>Vấn đề:</b> {selected.type}</div>

                        <div style={{ background: '#fff7ed', padding: '15px', borderRadius: '8px', margin: '15px 0', border: '1px dashed #F97350', color: '#333' }}>
                            <b>Nội dung:</b>
                            <p style={{ margin: '5px 0 0' }}>{selected.content}</p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            {selected.status === 'pending' && (
                                <>
                                    <button className="btn danger" onClick={handlePunish}>Vô hiệu tài khoản</button>
                                    <button className="btn primary" onClick={handleResolve}>Đánh dấu đã xử lý</button>
                                </>
                            )}
                            <button className="btn" onClick={() => setSelected(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Complaints;