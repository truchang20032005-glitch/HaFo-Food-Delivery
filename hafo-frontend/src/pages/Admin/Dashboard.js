import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const toVND = (n) => n?.toLocaleString('vi-VN');

function AdminDashboard() {
    const [summary, setSummary] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        statusCounts: []
    });
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        // 1. Lấy số liệu tổng quan
        //axios.get('http://localhost:5000/api/analytics/admin/summary')
        api.get('/analytics/admin/summary')
            .then(res => setSummary(res.data))
            .catch(err => console.error(err));

        // 2. Lấy dữ liệu biểu đồ
        //axios.get('http://localhost:5000/api/analytics/admin/chart')
        api.get('analytics/admin/chart')
            .then(res => setChartData(res.data))
            .catch(err => console.error(err));
    }, []);

    // Cấu hình dữ liệu biểu đồ Cột (Doanh thu 7 ngày)
    const barChartData = {
        labels: chartData.map(item => item._id), // Ngày
        datasets: [{
            label: 'Doanh thu (VND)',
            data: chartData.map(item => item.dailyTotal), // Tiền
            backgroundColor: '#F97350',
            borderRadius: 6,
        }],
    };

    // Cấu hình dữ liệu biểu đồ Tròn (Trạng thái đơn)
    // Chuyển đổi array statusCounts thành format của Chart.js
    const statusLabels = summary.statusCounts.map(s => s._id);
    const statusValues = summary.statusCounts.map(s => s.count);

    const pieChartData = {
        labels: statusLabels,
        datasets: [{
            data: statusValues,
            backgroundColor: ['#F97350', '#FAD06C', '#22C55E', '#9CA3AF', '#EF4444'],
            borderWidth: 0,
        }],
    };

    return (
        <div>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Tổng quan hệ thống (Real-time)</h3>

            {/* 1. CARDS SỐ LIỆU */}
            <div className="cards">
                <div className="card-stat">
                    <div className="label">Tổng doanh thu</div>
                    <div className="big" style={{ color: '#F97350' }}>{toVND(summary.totalRevenue)}đ</div>
                </div>
                <div className="card-stat">
                    <div className="label">Tổng đơn hàng</div>
                    <div className="big">{summary.totalOrders}</div>
                </div>
                <div className="card-stat">
                    <div className="label">Người dùng</div>
                    <div className="big">1,245</div> {/* Tạm thời hardcode */}
                </div>
                <div className="card-stat">
                    <div className="label">Cửa hàng</div>
                    <div className="big">310</div> {/* Tạm thời hardcode */}
                </div>
            </div>

            {/* 2. BIỂU ĐỒ */}
            <div className="chart-wrapper">
                <div className="chart-card">
                    <h4>💰 Doanh thu 7 ngày gần nhất</h4>
                    {chartData.length > 0 ? (
                        <Bar data={barChartData} options={{ responsive: true }} />
                    ) : (
                        <p>Chưa có dữ liệu tuần này.</p>
                    )}
                </div>
                <div className="chart-card">
                    <h4>📦 Tỷ lệ trạng thái đơn</h4>
                    <div style={{ width: '70%', margin: '0 auto' }}>
                        {summary.statusCounts.length > 0 ? (
                            <Doughnut data={pieChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
                        ) : (
                            <p style={{ textAlign: 'center' }}>Chưa có đơn hàng.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. BẢNG XẾP HẠNG (Giữ nguyên Demo hoặc làm API sau) */}
            <div style={{ marginTop: '30px' }}>
                <h4>🏆 Nhà hàng nổi bật (Demo)</h4>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Hạng</th>
                                <th>Tên nhà hàng</th>
                                <th>Số đơn</th>
                                <th>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>🥇 1</td><td>Cơm Tấm Ba Ghiền</td><td>428</td><td>85.600.000đ</td></tr>
                            <tr><td>🥈 2</td><td>Bún Bò Hằng Nga</td><td>392</td><td>74.200.000đ</td></tr>
                            <tr><td>🥉 3</td><td>Phở Thìn 13 Lò Đúc</td><td>341</td><td>69.800.000đ</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;