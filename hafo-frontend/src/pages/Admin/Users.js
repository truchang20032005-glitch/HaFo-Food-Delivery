import { useState, useEffect } from 'react';
import api from '../../services/api';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // State cho Modal Khóa
    const [showLockModal, setShowLockModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [lockReason, setLockReason] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err) {
            console.error("Lỗi tải danh sách user:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Khi bấm nút Khóa/Mở
    const handleActionClick = (user) => {
        if (user.status === 'active' || !user.status) {
            // Nếu đang Active -> Mở modal nhập lý do để KHÓA
            setSelectedUser(user);
            setLockReason('');
            setShowLockModal(true);
        } else {
            // Nếu đang Locked -> Mở khóa luôn (không cần lý do)
            if (window.confirm(`Mở khóa cho tài khoản ${user.username}?`)) {
                submitToggleStatus(user._id, '');
            }
        }
    };

    // Hàm gọi API thực sự
    const submitToggleStatus = async (userId, reason) => {
        try {
            await api.put(`/users/${userId}/toggle-status`, { reason });

            // Cập nhật giao diện
            setUsers(users.map(u =>
                u._id === userId
                    ? { ...u, status: u.status === 'active' ? 'locked' : 'active' }
                    : u
            ));
            setShowLockModal(false); // Đóng modal nếu đang mở
        } catch (err) {
            alert("Lỗi cập nhật: " + err.message);
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'customer': return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>Khách hàng</span>;
            case 'merchant': return <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>Chủ quán</span>;
            case 'shipper': return <span className="badge" style={{ background: '#f0fdf4', color: '#15803d' }}>Shipper</span>;
            case 'admin': return <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>Admin</span>;
            case 'pending_merchant': return <span className="badge pending">Chờ duyệt (Quán)</span>;
            case 'pending_shipper': return <span className="badge pending">Chờ duyệt (Shipper)</span>;
            default: return role;
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesRole = filter === 'all' || u.role === filter;
        const matchesSearch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesRole && matchesSearch;
    });

    return (
        <div>
            {/* ... (Phần Header và Bộ lọc giữ nguyên như cũ) ... */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn soft" onClick={fetchUsers} title="Tải lại">
                    <i className="fa-solid fa-rotate-right"></i>
                </button>
            </div>

            <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                <input
                    placeholder="Tìm theo tên, username hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }}
                />
                <select
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }}
                    onChange={(e) => setFilter(e.target.value)}
                >
                    <option value="all">Tất cả vai trò</option>
                    <option value="customer">Khách hàng</option>
                    <option value="merchant">Chủ cửa hàng</option>
                    <option value="shipper">Shipper</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Không tìm thấy người dùng nào.</td></tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u._id}>
                                    <td><b>{u.username}</b></td>
                                    <td>{u.fullName}</td>
                                    <td>{u.email || <i style={{ color: '#ccc' }}>Chưa cập nhật</i>}</td>
                                    <td>{u.phone || <i style={{ color: '#ccc' }}>Chưa cập nhật</i>}</td>
                                    <td>{getRoleBadge(u.role)}</td>
                                    <td>
                                        {u.status === 'active' || !u.status
                                            ? <span className="badge active">Hoạt động</span>
                                            : <span className="badge inactive">Bị khóa</span>
                                        }
                                    </td>
                                    <td>
                                        {(u.status === 'active' || !u.status) ? (
                                            <button className="btn danger" onClick={() => handleActionClick(u)}>
                                                <i className="fa-solid fa-ban"></i> Khóa
                                            </button>
                                        ) : (
                                            <button className="btn primary" onClick={() => handleActionClick(u)}>
                                                <i className="fa-solid fa-unlock"></i> Mở
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL NHẬP LÝ DO KHÓA (CUSTOM MODAL) --- */}
            {showLockModal && selectedUser && (
                <div className="modal-bg" onClick={() => setShowLockModal(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                        <h3 style={{ color: '#EF4444', marginTop: 0 }}>Khóa tài khoản</h3>
                        <p>Bạn đang khóa tài khoản: <b>{selectedUser.username}</b></p>

                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Lý do khóa:</label>
                        <textarea
                            value={lockReason}
                            onChange={(e) => setLockReason(e.target.value)}
                            placeholder="Ví dụ: Vi phạm chính sách, spam đơn hàng..."
                            style={{
                                width: '100%', height: '100px', padding: '10px',
                                borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px'
                            }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="btn soft" onClick={() => setShowLockModal(false)}>Hủy</button>
                            <button className="btn danger" onClick={() => submitToggleStatus(selectedUser._id, lockReason)}>
                                Xác nhận Khóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Users;