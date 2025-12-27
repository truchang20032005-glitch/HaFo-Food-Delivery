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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
    const [stats, setStats] = useState({ revenue: 0, orders: 0, avgValue: 0, balance: 0 });
    const [recentOrders, setRecentOrders] = useState([]);
    const [ownerName, setOwnerName] = useState('');
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState(null);

    const fmtMoney = (num) => (num || 0).toLocaleString('vi-VN') + 'đ';

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setOwnerName(user.fullName || 'Chủ quán');
            api.get(`/restaurants/my-shop/${user.id}`)
                .then(res => {
                    if (res.data) {
                        fetchDashboardData(res.data._id);
                    } else { setLoading(false); }
                })
                .catch(err => setLoading(false));
        }
    }, []);

    const fetchDashboardData = async (restaurantId) => {
        try {
            const res = await api.get(`/orders?restaurantId=${restaurantId}`);
            const myOrders = res.data;

            // --- TÍNH TOÁN SỐ LIỆU ---
            const doneOrders = myOrders.filter(o => o.status === 'done');
            const revenue = doneOrders.reduce((sum, o) => sum + o.total, 0);

            setStats({
                revenue,
                orders: myOrders.length,
                avgValue: doneOrders.length > 0 ? Math.round(revenue / doneOrders.length) : 0,
                balance: revenue // Số dư tạm tính
            });

            // Lấy 5 đơn gần nhất
            setRecentOrders(myOrders.slice(0, 5));

            // --- XỬ LÝ DỮ LIỆU BIỂU ĐỒ (DEMO) ---
            setChartData({
                labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'],
                datasets: [{
                    label: 'Doanh thu tuần này',
                    data: [120000, 190000, 150000, 250000, 220000, 300000, revenue / 10], // Demo data
                    borderColor: '#F97350',
                    backgroundColor: 'rgba(249, 115, 80, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            });

            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
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
            <div style={S.subGreeting}>Dưới đây là tình hình kinh doanh của quán má hôm nay.</div>

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
                        {chartData && <Line data={chartData} options={{ maintainAspectRatio: false }} />}
                    </div>
                </div>

                {/* BÊN PHẢI: THAO TÁC NHANH & VÍ */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <section className="panel">
                        <div className="head">Thao tác nhanh</div>
                        <div className="body shortcut-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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