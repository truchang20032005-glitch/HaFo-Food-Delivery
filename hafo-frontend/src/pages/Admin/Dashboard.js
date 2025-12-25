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
        totalUsers: 0, // Thêm
        totalShops: 0, // Thêm
        statusCounts: []
    });
    const [chartData, setChartData] = useState([]);
    const [topRestaurants, setTopRestaurants] = useState([]); // State cho bảng xếp hạng

    useEffect(() => {
        // 1. Lấy số liệu tổng quan
        api.get('/analytics/admin/summary')
            .then(res => setSummary(res.data))
            .catch(err => console.error("Lỗi summary:", err));

        // 2. Lấy dữ liệu biểu đồ
        api.get('/analytics/admin/chart')
            .then(res => setChartData(res.data))
            .catch(err => console.error("Lỗi chart:", err));

        // 3. Lấy Top nhà hàng (API Mới)
        api.get('/analytics/admin/top-restaurants')
            .then(res => setTopRestaurants(res.data))
            .catch(err => console.error("Lỗi top restaurants:", err));
    }, []);

    // Cấu hình biểu đồ
    const barChartData = {
        labels: chartData.map(item => item._id),
        datasets: [{
            label: 'Doanh thu (VND)',
            data: chartData.map(item => item.dailyTotal),
            backgroundColor: '#F97350',
            borderRadius: 6,
        }],
    };

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
            {/* 1. CARDS SỐ LIỆU THẬT */}
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
                    <div className="label">Khách hàng</div>
                    <div className="big">{summary.totalUsers}</div> {/* Data thật */}
                </div>
                <div className="card-stat">
                    <div className="label">Cửa hàng</div>
                    <div className="big">{summary.totalShops}</div> {/* Data thật */}
                </div>
            </div>

            {/* 2. BIỂU ĐỒ */}
            <div className="chart-wrapper">
                <div className="chart-card">
                    <h4>💰 Doanh thu 7 ngày gần nhất</h4>
                    {chartData.length > 0 ? (
                        <Bar data={barChartData} options={{ responsive: true }} />
                    ) : (
                        <p style={{ textAlign: 'center', color: '#999' }}>Chưa có dữ liệu tuần này.</p>
                    )}
                </div>
                <div className="chart-card">
                    <h4>📦 Tỷ lệ trạng thái đơn</h4>
                    <div style={{ width: '70%', margin: '0 auto' }}>
                        {summary.statusCounts.length > 0 ? (
                            <Doughnut data={pieChartData} options={{ plugins: { legend: { position: 'bottom' } } }} />
                        ) : (
                            <p style={{ textAlign: 'center', color: '#999' }}>Chưa có đơn hàng.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* 3. BẢNG XẾP HẠNG (DATA THẬT) */}
            <div style={{ marginTop: '30px' }}>
                <h4>🏆 Top 5 Nhà hàng doanh thu cao nhất</h4>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Hạng</th>
                                <th>Tên nhà hàng</th>
                                <th>Đơn hoàn thành</th>
                                <th>Doanh thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topRestaurants.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Chưa có dữ liệu xếp hạng.</td></tr>
                            ) : (
                                topRestaurants.map((shop, index) => (
                                    <tr key={index}>
                                        <td>
                                            {index === 0 && '🥇'}
                                            {index === 1 && '🥈'}
                                            {index === 2 && '🥉'}
                                            {index > 2 && `#${index + 1}`}
                                        </td>
                                        <td><b>{shop.name}</b></td>
                                        <td>{shop.totalOrders} đơn</td>
                                        <td style={{ fontWeight: 'bold', color: '#F97350' }}>{toVND(shop.totalRevenue)}đ</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;