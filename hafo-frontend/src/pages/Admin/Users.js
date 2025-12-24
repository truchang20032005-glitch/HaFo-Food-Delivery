import { useState, useEffect } from 'react';

function Users() {
    const [users, setUsers] = useState([]);
    const [filter, setFilter] = useState('all');

    // Giả lập dữ liệu nếu chưa có API lấy tất cả user
    // Thực tế: Gọi API GET /api/users (cần tạo thêm ở backend)
    useEffect(() => {
        // Mock data giống file HTML
        const mockUsers = [
            { id: 'U-001', name: 'Nguyễn Văn A', email: 'a@gmail.com', phone: '0909123456', role: 'customer', status: 'active' },
            { id: 'U-002', name: 'Trần Thị B', email: 'b@gmail.com', phone: '0912345678', role: 'merchant', status: 'locked' },
            { id: 'U-003', name: 'Lê Văn C', email: 'c@gmail.com', phone: '0988777666', role: 'shipper', status: 'active' },
        ];
        setUsers(mockUsers);
    }, []);

    const handleLock = (id) => {
        if (window.confirm(`Bạn có chắc muốn khóa tài khoản ${id}?`)) {
            // Gọi API khóa (nếu có)
            setUsers(users.map(u => u.id === id ? { ...u, status: 'locked' } : u));
        }
    };

    const handleUnlock = (id) => {
        if (window.confirm(`Mở khóa tài khoản ${id}?`)) {
            setUsers(users.map(u => u.id === id ? { ...u, status: 'active' } : u));
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'customer': return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>Khách hàng</span>;
            case 'merchant': return <span className="badge" style={{ background: '#fff7ed', color: '#c2410c' }}>Chủ quán</span>;
            case 'shipper': return <span className="badge" style={{ background: '#f0fdf4', color: '#15803d' }}>Shipper</span>;
            case 'admin': return <span className="badge" style={{ background: '#f3f4f6', color: '#374151' }}>Admin</span>;
            default: return role;
        }
    };

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>Quản lý người dùng</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Danh sách tất cả tài khoản trong hệ thống HaFo.</p>

            {/* Bộ lọc */}
            <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
                <input placeholder="Tìm theo tên hoặc email..." style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', flex: 1 }} />
                <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd' }} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">Tất cả vai trò</option>
                    <option value="customer">Khách hàng</option>
                    <option value="merchant">Chủ cửa hàng</option>
                    <option value="shipper">Shipper</option>
                </select>
                <button className="btn primary">Tìm kiếm</button>
            </div>

            {/* Bảng */}
            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.filter(u => filter === 'all' || u.role === filter).map(u => (
                            <tr key={u.id}>
                                <td><b>{u.id}</b></td>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.phone}</td>
                                <td>{getRoleBadge(u.role)}</td>
                                <td>
                                    {u.status === 'active'
                                        ? <span className="badge active">Hoạt động</span>
                                        : <span className="badge inactive">Bị khóa</span>
                                    }
                                </td>
                                <td>
                                    {u.status === 'active' ? (
                                        <button className="btn danger" onClick={() => handleLock(u.id)}><i className="fa-solid fa-ban"></i> Khóa</button>
                                    ) : (
                                        <button className="btn primary" onClick={() => handleUnlock(u.id)}><i className="fa-solid fa-unlock"></i> Mở</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Users;