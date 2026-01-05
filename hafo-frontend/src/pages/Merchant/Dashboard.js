import { useState, useEffect, useCallback } from 'react';
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
    const [topDishes, setTopDishes] = useState([]);
    const [promoStats, setPromoStats] = useState([]);

    // State cho bộ lọc ngày (Báo cáo chi tiết)
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 ngày trước
        end: new Date().toISOString().split('T')[0]
    });

    const checkOpenStatus = (openTime, closeTime) => {
        if (!openTime || !closeTime) return true;
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [hOpen, mOpen] = openTime.split(':').map(Number);
        const [hClose, mClose] = closeTime.split(':').map(Number);

        const openMinutes = hOpen * 60 + mOpen;
        const closeMinutes = hClose * 60 + mClose;

        return currentTime >= openMinutes && currentTime <= closeMinutes;
    };

    const fmtMoney = (num) => (num || 0).toLocaleString('vi-VN') + 'đ';

    const fetchDashboardData = useCallback(async (restaurantId) => {
        try {
            // Gửi params ngày lên backend để lọc chính xác
            const res = await api.get(`/orders`, {
                params: {
                    restaurantId,
                    startDate: dateRange.start,
                    endDate: dateRange.end
                }
            });
            const myOrders = res.data;
            const promoRes = await api.get(`/promos/${restaurantId}`);
            // Chỉ lấy 5 mã đang hoạt động hoặc dùng nhiều nhất để hiện Dashboard
            const sortedPromos = (promoRes.data || [])
                .sort((a, b) => (b.usedCount || 0) - (a.usedCount || 0))
                .slice(0, 5);
            setPromoStats(sortedPromos);

            const doneOrders = myOrders.filter(o => o.status === 'done');
            const dishMap = {};
            doneOrders.forEach(order => {
                if (Array.isArray(order.items)) {
                    order.items.forEach(item => {
                        if (dishMap[item.name]) {
                            dishMap[item.name].qty += item.quantity;
                        } else {
                            dishMap[item.name] = {
                                name: item.name,
                                qty: item.quantity,
                                image: item.image // Lấy ảnh từ dữ liệu đơn hàng
                            };
                        }
                    });
                }
            });

            // Sắp xếp và lấy Top 5
            const sortedTopDishes = Object.values(dishMap)
                .sort((a, b) => b.qty - a.qty)
                .slice(0, 5);

            setTopDishes(sortedTopDishes);

            // --- KẾT THÚC LOGIC ---
            const revenue = doneOrders.reduce((sum, o) => sum + o.total, 0);

            // Xử lý biểu đồ dựa trên khoảng ngày đã chọn
            const labels = [];
            const dailyRevenue = [];
            const start = new Date(dateRange.start);
            const end = new Date(dateRange.end);

            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                labels.push(label);

                const dayTotal = doneOrders.filter(o => {
                    const orderDate = new Date(o.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                    return orderDate === label;
                }).reduce((sum, o) => sum + o.total, 0);

                dailyRevenue.push(dayTotal);
            }

            setChartData({
                labels,
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: dailyRevenue,
                    borderColor: '#F97350',
                    backgroundColor: 'rgba(249, 115, 80, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            });

            setStats({
                revenue,
                orders: myOrders.length,
                avgValue: doneOrders.length > 0 ? Math.round(revenue / doneOrders.length) : 0,
                balance: revenue
            });
            setRecentOrders(myOrders.slice(0, 5));
            setLoading(false);
        } catch (err) {
            alertError("Lỗi tải dữ liệu", err.message);
            setLoading(false);
        }
    }, [dateRange]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setOwnerName(user.fullName || 'Chủ quán');
            api.get(`/restaurants/my-shop/${user.id}`)
                .then(res => {
                    if (res.data) {
                        const shop = res.data;
                        setShopId(shop._id);

                        // ✅ SỬA LỖI TẠI ĐÂY: Kiểm tra giờ sau khi có dữ liệu shop
                        const autoStatus = checkOpenStatus(shop.openTime, shop.closeTime);
                        setIsOpen(shop.isOpen && autoStatus);

                        fetchDashboardData(shop._id);
                    }
                })
                .catch(() => setLoading(false));
        }
    }, [fetchDashboardData]);

    // hàm xử lý Bật/Tắt quán
    const handleToggleOpen = async () => {
        try {
            const newStatus = !isOpen;
            await api.put(`/restaurants/${shopId}`, { isOpen: newStatus });
            setIsOpen(newStatus);
            alertInfo(newStatus ? "🔓 Quán đã mở cửa!" : "🔒 Quán đã đóng cửa!");
        } catch (err) {
            alertError("Lỗi", err.message);
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
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center', // Căn giữa theo trục dọc cho cân đối
                marginBottom: '30px',
                padding: '10px 0'
            }}>
                {/* BÊN TRÁI: LỜI CHÀO */}
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap', // Để tự xuống nguyên cụm nếu màn hình quá nhỏ
                        gap: '8px',       // Khoảng cách giữa các chữ
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }}>
                        <span>Chào mừng trở lại,</span>
                        <span style={{ color: '#F97350' }}>{ownerName}</span>
                        <span>! 👋</span>
                    </div>
                    <div style={{
                        color: '#64748b',
                        fontSize: '14px',
                        marginTop: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <i className="fa-solid fa-calendar-day" style={{ fontSize: '12px' }}></i>
                        Báo cáo từ <b style={{ color: '#1e293b' }}>{new Date(dateRange.start).toLocaleDateString('vi-VN')}</b> đến <b style={{ color: '#1e293b' }}>{new Date(dateRange.end).toLocaleDateString('vi-VN')}</b>
                    </div>
                </div>

                {/* BÊN PHẢI: UI LỌC NGÀY XỊN XÒ */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#fff',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    border: '1.5px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', // Đổ bóng nhẹ cho nổi khối
                    transition: 'all 0.3s ease'
                }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#F97350'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px', color: '#64748b' }}>
                        <i className="fa-regular fa-calendar" style={{ fontSize: '14px', color: '#F97350' }}></i>
                        <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Thời gian:</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: '10px', padding: '2px 8px' }}>
                        <input
                            type="date"
                            className="f-input"
                            value={dateRange.start}
                            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                            style={{ width: '130px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
                        />
                        <span style={{ color: '#cbd5e1', padding: '0 5px' }}>—</span>
                        <input
                            type="date"
                            className="f-input"
                            value={dateRange.end}
                            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                            style={{ width: '130px', border: 'none', background: 'transparent', fontSize: '13px', fontWeight: '600', color: '#334155', cursor: 'pointer' }}
                        />
                    </div>

                    {/* Nút refresh nhanh dữ liệu */}
                    <button
                        onClick={() => fetchDashboardData(shopId)}
                        style={{
                            marginLeft: '10px',
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            border: 'none',
                            background: '#FFF1ED',
                            color: '#F97350',
                            cursor: 'pointer',
                            display: 'grid',
                            placeItems: 'center',
                            transition: '0.2s'
                        }}
                        onMouseOver={e => { e.currentTarget.style.background = '#F97350'; e.currentTarget.style.color = '#fff' }}
                        onMouseOut={e => { e.currentTarget.style.background = '#FFF1ED'; e.currentTarget.style.color = '#F97350' }}
                        title="Cập nhật dữ liệu"
                    >
                        <i className="fa-solid fa-arrows-rotate"></i>
                    </button>
                </div>
            </div>

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

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '25px', alignItems: 'start' }}>
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

                {/* 🔥 PANEL MÓN BÁN CHẠY MỚI THÊM 🔥 */}
                <section className="panel" style={{ border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div className="head" style={{ borderBottom: '1px solid #f1f5f9', padding: '15px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-fire" style={{ color: '#ef4444' }}></i>
                            <span style={{ fontWeight: '800', fontSize: '15px' }}>Món bán chạy nhất</span>
                        </div>
                    </div>
                    <div className="body" style={{ padding: '20px' }}>
                        {topDishes.length > 0 ? topDishes.map((dish, index) => {
                            const maxQty = topDishes[0].qty;
                            const percent = (dish.qty / maxQty) * 100;

                            return (
                                <div key={index} style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                        {/* Ảnh món ăn nhỏ xinh */}
                                        <img
                                            src={dish.image || 'https://via.placeholder.com/40?text=Food'}
                                            alt={dish.name}
                                            style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #f1f5f9' }}
                                        />

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {/* Huy chương xếp hạng */}
                                                    <span style={{
                                                        fontSize: '11px', fontWeight: '900', color: index === 0 ? '#CA8A04' : '#64748B',
                                                        background: index === 0 ? '#FEF9C3' : '#F1F5F9',
                                                        padding: '2px 6px', borderRadius: '4px'
                                                    }}>
                                                        #{index + 1}
                                                    </span>
                                                    <b style={{ fontSize: '13px', color: '#1E293B' }}>{dish.name}</b>
                                                </div>
                                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#F97350' }}>
                                                    {dish.qty} <span style={{ fontSize: '10px', color: '#94A3B8', fontWeight: '400' }}>suất</span>
                                                </div>
                                            </div>

                                            {/* Thanh Progress bar mượt mà */}
                                            <div style={{ height: '5px', background: '#F1F5F9', borderRadius: '10px', marginTop: '6px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${percent}%`, height: '100%',
                                                    background: index === 0 ? 'linear-gradient(90deg, #F97350, #FF5F6D)' : '#cbd5e1',
                                                    borderRadius: '10px',
                                                    transition: 'width 1s ease-in-out'
                                                }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                                <i className="fa-solid fa-chart-pie" style={{ fontSize: '24px', marginBottom: '10px', opacity: 0.3 }}></i>
                                <p style={{ fontSize: '12px' }}>Chưa có dữ liệu trong khoảng thời gian này</p>
                            </div>
                        )}
                    </div>
                </section>

                <section className="panel" style={{ minHeight: '390px', display: 'flex', flexDirection: 'column' }}>
                    <div className="head"><i className="fa-solid fa-ticket" style={{ color: '#0ea5e9', marginRight: '8px' }}></i> <span style={{ fontWeight: '800', fontSize: '15px' }}>Hiệu quả khuyến mãi</span></div>
                    <div className="body" style={{ padding: '20px' }}>
                        {promoStats.map((promo, index) => {
                            const percent = Math.min(((promo.usedCount || 0) / (promo.limit || 1)) * 100, 100);
                            return (
                                <div key={index} style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}>
                                        <span style={{ background: '#E0F2FE', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>{promo.code}</span>
                                        <span>Đã dùng: <b>{promo.usedCount || 0}</b> / {promo.limit}</span>
                                    </div>
                                    <div style={{ height: '6px', background: '#F1F5F9', borderRadius: '10px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${percent}%`,
                                            height: '100%',
                                            background: percent > 90 ? '#ef4444' : '#38bdf8',
                                            transition: '1s'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })}
                        {promoStats.length === 0 && <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>Chưa có dữ liệu khuyến mãi.</div>}
                    </div>
                </section>
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
                                    <td>{o.customer ? o.customer.split('|')[0] : 'Khách lẻ'}</td>
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