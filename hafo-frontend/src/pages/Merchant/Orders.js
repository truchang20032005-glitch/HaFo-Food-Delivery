import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useLocation, useSearchParams } from 'react-router-dom';
import { alertError } from '../../utils/hafoAlert';

function Orders() {
    const [orders, setOrders] = useState([]);
    const [myShop, setMyShop] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null); // Lưu đơn đang xem chi tiết
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

    // Thêm State phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số đơn hàng trên mỗi trang
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('q')?.toLowerCase() || '';

    const location = useLocation();

    const fmtMoney = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

    // LOGIC LỌC TÌM KIẾM
    const searchedOrders = orders.filter(o =>
        o._id.toLowerCase().includes(searchQuery) ||
        (o.customer && o.customer.toLowerCase().includes(searchQuery))
    );

    // LOGIC LỌC THEO TAB (Sử dụng danh sách đã search)
    const filteredOrders = searchedOrders.filter(o => {
        if (activeTab === 'active') return ['new', 'prep', 'ready', 'pickup'].includes(o.status);
        return ['done', 'cancel'].includes(o.status);
    });

    // LOGIC PHÂN TRANG
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    // Reset về trang 1 nếu tìm kiếm hoặc đổi tab
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeTab]);

    const fetchOrdersData = useCallback(async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) return;

        try {
            const shopRes = await api.get(`/restaurants/my-shop/${user.id || user._id}`);
            if (shopRes.data) {
                setMyShop(shopRes.data); // ✅ Sử dụng setMyShop ở đây
                const ordersRes = await api.get(`/orders?restaurantId=${shopRes.data._id}`);
                const data = ordersRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setOrders(data);

                // ✅ LOGIC THÔNG MINH: Tự mở modal nếu đi từ thông báo
                if (location.state?.openId) {
                    const target = data.find(o => o._id === location.state.openId);
                    if (target) {
                        setSelectedOrder(target);
                        window.history.replaceState({}, document.title);
                    }
                }
            }
        } catch (err) {
            console.error("Lỗi lấy đơn hàng:", err);
        }
    }, [location.state]); // Chạy lại khi trạng thái điều hướng thay đổi

    useEffect(() => {
        fetchOrdersData();
    }, [fetchOrdersData]);

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/${orderId}`, { status: newStatus });
            setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
            if (selectedOrder?._id === orderId) setSelectedOrder({ ...selectedOrder, status: newStatus });
        } catch (error) {
            alertError("Lỗi cập nhật: " + error.message);
        }
    };

    // ====== HỆ THỐNG STYLES CHO MODAL CHI TIẾT "XỊN" HƠN ======
    const S = {
        badge: (s) => ({
            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
            background: s === 'new' ? '#E0F2FE' : s === 'prep' ? '#FFF7ED' : s === 'done' ? '#DCFCE7' : '#F1F5F9',
            color: s === 'new' ? '#0284C7' : s === 'prep' ? '#EA580C' : s === 'done' ? '#166534' : '#64748B'
        }),
        modalOverlay: {
            position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: '20px'
        },
        modalSheet: {
            background: '#fff', width: '100%', maxWidth: '550px',
            borderRadius: '28px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column'
        },
        sectionTitle: {
            fontSize: '13px', fontWeight: '800', color: '#94A3B8',
            marginBottom: '12px', letterSpacing: '0.5px'
        },
        infoBox: {
            background: '#F8FAFC', padding: '18px', borderRadius: '18px',
            border: '1px solid #E2E8F0', marginBottom: '25px'
        },
        itemRow: {
            display: 'flex', gap: '15px', marginBottom: '18px',
            paddingBottom: '15px', borderBottom: '1px dashed #E2E8F0'
        },
        tabBtn: (active) => ({
            padding: '10px 20px', border: 'none', background: active ? '#F97350' : 'transparent',
            color: active ? '#fff' : '#64748B', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', transition: '0.2s'
        })
    };

    if (!myShop) return <div style={{ padding: 40, textAlign: 'center' }}>Đang tải dữ liệu...</div>;

    return (
        <section className="panel">
            <div className="head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-clipboard-list" style={{ color: '#F97350' }}></i>
                        <span>Quản lý Đơn hàng</span>
                    </div>
                    <div style={{ background: '#F1F5F9', padding: '4px', borderRadius: '12px', display: 'flex', marginLeft: '20px' }}>
                        <button style={S.tabBtn(activeTab === 'active')} onClick={() => setActiveTab('active')}>Đang xử lý</button>
                        <button style={S.tabBtn(activeTab === 'history')} onClick={() => setActiveTab('history')}>Lịch sử đơn</button>
                    </div>
                </div>
            </div>

            <div className="body" style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F8FAFC', textAlign: 'left', borderBottom: '1px solid #E2E8F0' }}>
                            <th style={{ padding: '15px 20px' }}>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Tổng tiền</th>
                            <th style={{ textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ textAlign: 'right', paddingRight: '20px' }}>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '50px', color: '#94A3B8' }}>Không có đơn hàng nào ở mục này.</td></tr>
                        ) : (
                            currentItems.map(o => (
                                <tr key={o._id} style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }} onClick={() => setSelectedOrder(o)}>
                                    <td style={{ padding: '15px 20px' }}>
                                        <b style={{ color: '#F97350' }}>#{o._id.slice(-6).toUpperCase()}</b>
                                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>{new Date(o.createdAt).toLocaleTimeString('vi-VN')}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '700' }}>{o.customer.split('|')[0]}</div>
                                        <div style={{ fontSize: '12px', color: '#64748B' }}>{o.customer.split('|')[1]}</div>
                                    </td>
                                    <td><b style={{ fontSize: '15px' }}>{fmtMoney(o.total)}</b></td>
                                    <td style={{ textAlign: 'center' }}><span style={S.badge(o.status)}>{o.status.toUpperCase()}</span></td>
                                    <td style={{ textAlign: 'right', paddingRight: '20px' }} onClick={e => e.stopPropagation()}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {o.status === 'new' && <button className="btn primary small" onClick={() => handleStatusChange(o._id, 'prep')}>Xác nhận</button>}
                                            {o.status === 'prep' && <button className="btn small" style={{ background: '#22C55E', color: '#fff' }} onClick={() => handleStatusChange(o._id, 'ready')}>Xong món</button>}
                                            <button className="btn soft small" onClick={() => setSelectedOrder(o)}>Chi tiết</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* UI PHÂN TRANG */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', padding: '20px', borderTop: '1px solid #F1F5F9' }}>
                        <button
                            className="btn small soft"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                        >
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>

                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748B' }}>
                            Trang {currentPage} / {totalPages}
                        </span>

                        <button
                            className="btn small soft"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                        >
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT ĐƠN HÀNG - PHIÊN BẢN CẢI TIẾN */}
            {selectedOrder && (
                <div style={S.modalOverlay} onClick={() => setSelectedOrder(null)}>
                    <div style={S.modalSheet} onClick={e => e.stopPropagation()}>
                        {/* Header của Modal */}
                        <div style={{ padding: '24px 30px', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#1E293B' }}>Đơn hàng #{selectedOrder._id.slice(-6).toUpperCase()}</h2>
                                <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Đặt vào: {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</div>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} style={{ border: 'none', background: '#F1F5F9', width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </div>

                        {/* Nội dung chi tiết cuộn được */}
                        <div style={{ padding: '30px', maxHeight: '65vh', overflowY: 'auto' }}>
                            {/* Thông tin khách hàng */}
                            <div style={S.sectionTitle}>THÔNG TIN GIAO HÀNG</div>
                            <div style={S.infoBox}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                    <div style={{ background: '#FFF1ED', color: '#F97350', width: '36px', height: '36px', borderRadius: '10px', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                        <i className="fa-solid fa-location-dot"></i>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '16px', color: '#1E293B' }}>{selectedOrder.customer.split('|')[0]}</div>
                                        <div style={{ fontSize: '14px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>
                                            SĐT: <b>{selectedOrder.customer.split('|')[1]}</b><br />
                                            Địa chỉ: {selectedOrder.customer.split('|')[2]}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách món ăn có hình ảnh */}
                            <div style={S.sectionTitle}>DANH SÁCH MÓN ĂN</div>
                            <div style={{ marginBottom: '25px' }}>
                                {Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item, idx) => (
                                    <div key={idx} style={S.itemRow}>
                                        {/* Ảnh món ăn */}
                                        <img
                                            src={item.image || 'https://via.placeholder.com/60?text=Food'}
                                            alt={item.name}
                                            style={{ width: '65px', height: '65px', borderRadius: '14px', objectFit: 'cover', border: '1px solid #F1F5F9' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontWeight: '800', fontSize: '15px', color: '#1E293B' }}>{item.quantity}x {item.name}</div>
                                                    {item.options && (
                                                        <div style={{ fontSize: '12px', color: '#F97350', background: '#FFF1ED', padding: '2px 8px', borderRadius: '6px', display: 'inline-block', marginTop: '4px', fontWeight: '600' }}>
                                                            {item.options}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: '700', fontSize: '15px', color: '#1E293B' }}>{fmtMoney(item.price * item.quantity)}</div>
                                            </div>
                                        </div>
                                    </div>
                                )) : <div style={{ padding: '15px', background: '#FFF1ED', borderRadius: '12px', color: '#EA580C' }}>{selectedOrder.items}</div>}
                            </div>

                            {/* Tổng kết tiền */}
                            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#64748B' }}>
                                    <span>Tạm tính</span>
                                    <span>{fmtMoney(selectedOrder.total)}</span>
                                </div>
                                <div style={{ borderTop: '5px solid #F1F5F9', margin: '20px 0' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '800', fontSize: '16px', color: '#1E293B' }}>TỔNG CỘNG</span>
                                    <span style={{ fontWeight: '900', fontSize: '24px', color: '#F97350' }}>{fmtMoney(selectedOrder.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Nút hành động cuối Modal */}
                        <div style={{
                            padding: '24px 30px',
                            borderTop: '1px solid #F1F5F9',
                            background: '#fff',
                            display: 'flex',
                            gap: '15px',
                            justifyContent: 'center' // Căn toàn bộ cụm nút vào giữa modal
                        }}>
                            <button
                                className="btn soft"
                                style={{
                                    width: '140px',          // Rút ngắn nút Đóng
                                    padding: '14px',
                                    borderRadius: '14px',
                                    display: 'flex',         // Dùng flex để ép chữ vào giữa
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    textAlign: 'center'
                                }}
                                onClick={() => setSelectedOrder(null)}
                            >
                                Đóng lại
                            </button>

                            {selectedOrder.status === 'new' && (
                                <button
                                    className="btn primary"
                                    style={{
                                        width: '180px',      // Rút ngắn nút Xác nhận
                                        padding: '14px',
                                        borderRadius: '14px',
                                        display: 'flex',     // Ép chữ vào giữa tuyệt đối
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center',
                                        fontWeight: '800'
                                    }}
                                    onClick={() => handleStatusChange(selectedOrder._id, 'prep')}
                                >
                                    Xác nhận ngay
                                </button>
                            )}

                            {selectedOrder.status === 'prep' && (
                                <button
                                    className="btn"
                                    style={{
                                        width: '180px',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        background: '#22C55E',
                                        color: '#fff',
                                        border: 'none',
                                        fontWeight: '800',
                                        display: 'flex',     // Ép chữ vào giữa
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        textAlign: 'center'
                                    }}
                                    onClick={() => handleStatusChange(selectedOrder._id, 'ready')}
                                >
                                    Xong món
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default Orders;