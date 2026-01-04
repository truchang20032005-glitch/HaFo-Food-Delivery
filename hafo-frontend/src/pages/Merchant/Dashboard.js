import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2'; // Thêm biểu đồ
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { alertError, alertInfo } from '../../utils/hafoAlert';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, avgValue: 0, balance: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [ownerName, setOwnerName] = useState('');
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);
    const [isOpen, setIsOpen] = useState(true); // Trạng thái mở/đóng quán
    const [shopId, setShopId] = useState('');   // Lưu ID quán để gọi API

    const fmtMoney = (num) => (num || 0).toLocaleString('vi-VN') + 'đ';

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setOwnerName(user.fullName || 'Chủ quán');
            api.get(`/restaurants/my-shop/${user.id}`)
                .then(res => {
                    if (res.data) {
                        setShopId(res.data._id);    // ✅ Lưu ID quán
                        setIsOpen(res.data.isOpen); // ✅ Lưu trạng thái mở cửa
                        fetchDashboardData(res.data._id);
                    } else { setLoading(false); }
                })
                .catch(err => setLoading(false));
        }
    }, []);

    // hàm xử lý Bật/Tắt quán
    const handleToggleOpen = async () => {
        try {
            const newStatus = !isOpen;
            // Gọi API cập nhật quán (đã có sẵn ở backend/routes/restaurant.js)
            await api.put(`/restaurants/${shopId}`, { isOpen: newStatus });
            setIsOpen(newStatus);
            alertInfo(newStatus ? "🔓 Quán đã mở cửa đón khách!" : "🔒 Quán đã tạm đóng cửa!");
        } catch (err) {
            alertError("Lỗi", err.message);
        }
    };

    const fetchDashboardData = async (restaurantId) => {
        try {
            const res = await api.get(`/orders?restaurantId=${restaurantId}`); //
            const myOrders = res.data;

            // 1. Lọc đơn đã hoàn thành
            const doneOrders = myOrders.filter(o => o.status === 'done');
            const revenue = doneOrders.reduce((sum, o) => sum + o.total, 0);

            // --- XỬ LÝ DỮ LIỆU BIỂU ĐỒ THẬT (7 ngày gần nhất) ---

            // A. Tạo danh sách 7 ngày gần đây (từ 6 ngày trước đến hôm nay)
            const labels = [];
            const dailyRevenue = [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);

                // Định dạng label: "Thứ X, DD/MM"
                const label = d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
                labels.push(label);

                // B. Tính tổng doanh thu của ngày đó
                const dayTotal = doneOrders.filter(o => {
                    const orderDate = new Date(o.createdAt).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
                    return orderDate === label;
                }).reduce((sum, o) => sum + o.total, 0);

                dailyRevenue.push(dayTotal);
            }

            setChartData({
                labels: labels,
                datasets: [{
                    label: 'Doanh thu thực tế (7 ngày)',
                    data: dailyRevenue, // Dữ liệu thật đã tính toán ở trên
                    borderColor: '#F97350',
                    backgroundColor: 'rgba(249, 115, 80, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#F97350'
                }]
            });

            // Cập nhật các chỉ số khác
            setStats({
                revenue,
                orders: myOrders.length,
                avgValue: doneOrders.length > 0 ? Math.round(revenue / doneOrders.length) : 0,
                balance: revenue
            });
            setRecentOrders(myOrders.slice(0, 5));
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Đang chuẩn bị dữ liệu...</div>;

    const S = {
        greeting: { fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '8px' },
        subGreeting: { color: '#64748b', marginBottom: '25px', fontSize: '14px' },
        cardIcon: (bg) => ({ width: '45px', height: '45px', borderRadius: '12px', background: bg, display: 'grid', placeItems: 'center', marginBottom: '15px' }),
        status: (s) => ({
            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
            background: s === 'done' ? '#dcfce7' : '#fef9c3', color: s === 'done' ? '#166534' : '#854d0e'
        })
    };

    return (
        <div className="dashboard-wrapper">
            {/* LỜI CHÀO NỒNG NHIỆT */}
            <div style={S.greeting}>Chào mừng trở lại, {ownerName}! 👋</div>
            <div style={S.subGreeting}>Dưới đây là tình hình kinh doanh của quán bạn hôm nay.</div>

            {/* 1. CHỈ SỐ CHÍNH (THIẾT KẾ LẠI) */}
            <div className="cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
                <div className="panel" style={{ padding: '20px' }}>
                    <div style={S.cardIcon('#FFF1ED')}><i className="fa-solid fa-coins" style={{ color: '#F97350' }}></i></div>
                    <div className="legend">Doanh thu</div>
                    <div style={{ fontSize: '22px', fontWeight: '800' }}>{fmtMoney(stats.revenue)}</div>
                </div>
                <div className="panel" style={{ padding: '20px' }}>
                    <div style={S.cardIcon('#E0F2FE')}><i className="fa-solid fa-cart-shopping" style={{ color: '#0284c7' }}></i></div>
                    <div className="legend">Tổng đơn hàng</div>
                    <div style={{ fontSize: '22px', fontWeight: '800' }}>{stats.orders}</div>
                </div>
                <div className="panel" style={{ padding: '20px' }}>
                    <div style={S.cardIcon('#F0FDF4')}><i className="fa-solid fa-chart-line" style={{ color: '#16a34a' }}></i></div>
                    <div className="legend">Giá trị TB</div>
                    <div style={{ fontSize: '22px', fontWeight: '800' }}>{fmtMoney(stats.avgValue)}</div>
                </div>
                <div className="panel" style={{ padding: '20px' }}>
                    <div style={S.cardIcon('#FEF9C3')}><i className="fa-solid fa-wallet" style={{ color: '#ca8a04' }}></i></div>
                    <div className="legend">Số dư ví</div>
                    <div style={{ fontSize: '22px', fontWeight: '800' }}>{fmtMoney(stats.balance)}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px' }}>
                {/* BÊN TRÁI: BIỂU ĐỒ DOANH THU */}
                <div className="panel">
                    <div className="head">Xu hướng doanh thu</div>
                    <div className="body" style={{ height: '300px' }}>
                        {chartData && <Line
                            data={chartData}
                            options={{
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            // Biến số thành dạng "100k", "200k" cho gọn
                                            callback: (value) => (value / 1000) + 'k'
                                        }
                                    }
                                }
                            }}
                        />}
                    </div>
                </div>

                {/* BÊN PHẢI: THAO TÁC NHANH & VÍ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <section className="panel">
                        <div className="head" style={{ justifyContent: 'center', textAlign: 'center', width: '100%' }}>
                            Thao tác nhanh
                        </div>
                        <div className="body shortcut-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {/* NÚT BẬT/TẮT QUÁN MỚI */}
                            <div
                                onClick={handleToggleOpen}
                                className="shortcut"
                                style={{
                                    cursor: 'pointer',
                                    padding: '15px',
                                    // Khi quán ĐANG MỞ (isOpen=true), hiện nền đỏ nhạt để chuẩn bị Đóng
                                    background: isOpen ? '#FFF1F0' : '#F0FDF4',
                                    border: isOpen ? '1px solid #FCA5A5' : '1px solid #BBF7D0'
                                }}
                            >
                                {/* Icon cũng đảo ngược: Đang mở thì hiện icon đóng để nhắc hành động */}
                                <i className={`fa-solid ${isOpen ? 'fa-door-closed' : 'fa-door-open'}`}
                                    style={{ color: isOpen ? '#EF4444' : '#22C55E' }}></i>

                                <div>
                                    <b style={{ color: isOpen ? '#EF4444' : '#22C55E' }}>
                                        {/* ✅ Đang mở thì hiện chữ "Đóng cửa", đang đóng thì hiện "Mở cửa" */}
                                        {isOpen ? 'Đóng cửa' : 'Mở cửa'}
                                    </b>
                                </div>
                            </div>
                            <Link to="/merchant/menu" className="shortcut" style={{ textDecoration: 'none', color: 'inherit', padding: '15px' }}>
                                <i className="fa-solid fa-bowl-food"></i>
                                <div><b>Sửa Menu</b></div>
                            </Link>
                            <Link to="/merchant/promos" className="shortcut" style={{ textDecoration: 'none', color: 'inherit', padding: '15px' }}>
                                <i className="fa-solid fa-gift"></i>
                                <div><b>Tạo mã</b></div>
                            </Link>
                        </div>
                    </section>

                    <section className="panel" style={{ background: 'linear-gradient(135deg, #F97350 0%, #ff8a66 100%)', color: '#fff', border: 'none' }}>
                        <div className="body" style={{ padding: '25px' }}>
                            <div style={{ opacity: 0.8, fontSize: '13px' }}>Số dư khả dụng</div>
                            <div style={{ fontSize: '28px', fontWeight: '800', margin: '10px 0' }}>{fmtMoney(stats.balance)}</div>
                            <Link to="/merchant/wallet" className="btn small" style={{ background: '#fff', color: '#F97350', border: 'none', width: '100%', justifyContent: 'center' }}>
                                Rút tiền về ngân hàng
                            </Link>
                        </div>
                    </section>
                </div>
            </div>

            {/* ĐƠN HÀNG MỚI NHẤT (FILL KHOẢNG TRỐNG) */}
            <section className="panel" style={{ marginTop: '25px' }}>
                <div className="head">Đơn hàng mới nhất</div>
                <div className="body">
                    <table style={{ width: '100%' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Tổng tiền</th>
                                <th style={{ textAlign: 'center' }}>Trạng thái</th>
                                <th style={{ textAlign: 'right' }}>Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map(o => (
                                <tr key={o._id}>
                                    <td><b style={{ color: '#64748b' }}>#{o._id.slice(-6).toUpperCase()}</b></td>
                                    <td>{o.customerName || 'Khách lẻ'}</td>
                                    <td><b>{fmtMoney(o.total)}</b></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span style={S.status(o.status)}>{o.status.toUpperCase()}</span>
                                    </td>
                                    <td style={{ textAlign: 'right', color: '#94a3b8', fontSize: '12px' }}>
                                        {new Date(o.createdAt).toLocaleTimeString('vi-VN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;