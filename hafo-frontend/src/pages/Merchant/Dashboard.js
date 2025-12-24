import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';

function Dashboard() {
    const fmtMoney = (num) => (num || 0).toLocaleString('vi-VN') + 'đ';

    // State lưu dữ liệu THẬT (Khởi tạo bằng 0)
    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        avgValue: 0,
        balance: 0,
        payout: 0,
        progress: 0
    });

    const [loading, setLoading] = useState(true);

    // Hàm lấy đơn hàng của quán và tính toán số liệu
    const fetchOrdersAndCalculate = async (restaurantId) => {
        try {
            // QUAN TRỌNG: Gọi API có lọc theo restaurantId để không lấy nhầm của quán khác
            //const res = await axios.get(`http://localhost:5000/api/orders?restaurantId=${restaurantId}`);
            const res = await api.get(`/orders?restaurantId=${restaurantId}`);
            const myOrders = res.data;

            // --- TÍNH TOÁN SỐ LIỆU TỪ DỮ LIỆU THẬT ---

            // 1. Tổng đơn hàng (Tất cả trạng thái)
            const totalOrders = myOrders.length;

            // 2. Doanh thu (Chỉ tính những đơn đã hoàn tất 'done')
            const doneOrders = myOrders.filter(o => o.status === 'done');
            const revenue = doneOrders.reduce((sum, o) => sum + o.total, 0);

            // 3. Giá trị trung bình đơn
            const avgValue = doneOrders.length > 0 ? Math.round(revenue / doneOrders.length) : 0;

            // 4. Số dư khả dụng (Demo: Giả sử bằng doanh thu hiện tại)
            const balance = revenue;

            // Cập nhật State để hiển thị ra màn hình
            setStats({
                revenue,
                orders: totalOrders,
                avgValue,
                balance,
                payout: 0,
                progress: 0
            });
            setLoading(false);

        } catch (err) {
            console.error("Lỗi tính toán:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // 1. Tìm xem User này sở hữu quán nào
            //axios.get(`http://localhost:5000/api/restaurants/my-shop/${user.id}`)
            api.get(`/restaurants/my-shop/${user.id}`)
                .then(res => {
                    if (res.data) {
                        // 2. Nếu có quán -> Lấy ID quán đó để tính số liệu
                        fetchOrdersAndCalculate(res.data._id);
                    } else {
                        // Nếu chưa có quán (tài khoản mới tinh) -> Dừng loading, số liệu mặc định là 0
                        setLoading(false);
                    }
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, []);

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải dữ liệu doanh thu...</div>;

    return (
        <div className="dashboard-content">
            {/* 1. METRICS CARDS (Hiển thị stats thật) */}
            <div className="cards">
                <div className="metric">
                    <div className="label">Doanh thu</div>
                    <div className="val" style={{ color: '#F97350' }}>{fmtMoney(stats.revenue)}</div>
                    <div className="legend">Tổng doanh thu thực tế</div>
                </div>
                <div className="metric">
                    <div className="label">Tổng đơn hàng</div>
                    <div className="val">{stats.orders}</div>
                    <div className="legend">Đơn hàng đã nhận</div>
                </div>
                <div className="metric">
                    <div className="label">Giá trị TB/đơn</div>
                    <div className="val">{fmtMoney(stats.avgValue)}</div>
                    <div className="legend">Trung bình mỗi đơn</div>
                </div>
            </div>

            {/* 2. THAO TÁC NHANH */}
            <div className="grid" style={{ marginTop: '16px', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <section className="panel">
                    <div className="head">Thao tác nhanh</div>
                    <div className="body shortcut-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <Link to="/merchant/menu" className="shortcut" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <i className="fa-solid fa-plus"></i>
                            <div><b>Thêm món</b><div className="legend">Tạo nhanh</div></div>
                        </Link>
                        <Link to="/merchant/promos" className="shortcut" style={{ textDecoration: 'none', color: 'inherit' }}>
                            <i className="fa-solid fa-tag"></i>
                            <div><b>Khuyến mãi</b><div className="legend">Tạo mã giảm giá</div></div>
                        </Link>
                    </div>
                </section>

                <section className="panel">
                    <div className="head">Ví tiền</div>
                    <div className="body">
                        <div className="box" style={{ marginBottom: '10px' }}>
                            <div className="legend">Số dư khả dụng</div>
                            <div className="big" style={{ color: '#F97350', fontSize: '24px' }}>{fmtMoney(stats.balance)}</div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Dashboard;