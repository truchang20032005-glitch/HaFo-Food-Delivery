import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Merchant.css';

function MerchantLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // State lưu thông tin quán thật của người dùng đang đăng nhập
    const [myShop, setMyShop] = useState(null);

    const isActive = (path) => location.pathname.includes(path) ? 'active' : '';

    // Khi vào trang, gọi API để biết mình là quán nào
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            //axios.get(`http://localhost:5000/api/restaurants/my-shop/${user.id}`)
            api.get(`/restaurants/my-shop/${user.id}`)
                .then(res => {
                    if (res.data) {
                        setMyShop(res.data);
                    }
                })
                .catch(err => console.error(err));
        }
    }, []);

    const handleLogout = () => {
        if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            navigate('/');
            window.location.reload();
        }
    };

    return (
        <div className="merchant-app" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
            {/* HEADER */}
            <header className="top">
                <div className="top-inner">
                    <div className="brand">
                        <span>HaFo Merchant</span>
                    </div>
                    <div className="search">
                        <input placeholder="Tìm đơn #, tên món..." />
                        <button className="btn"><i className="fa-solid fa-magnifying-glass"></i> Tìm</button>
                    </div>

                    <div className="top-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {/* Profile Avatar & Menu Dropdown */}
                        <div className="profile" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            {/* Hiển thị avatar quán thật, nếu chưa có thì dùng placeholder */}
                            <img
                                className="avatar"
                                src={myShop?.image || "[https://via.placeholder.com/40?text=Shop](https://via.placeholder.com/40?text=Shop)"}
                                alt="Avatar"
                                style={{ objectFit: 'cover' }}
                            />

                            {/* Menu Dropdown Đăng xuất */}
                            {showProfileMenu && (
                                <div style={{ position: 'absolute', top: '120%', right: 0, background: '#fff', border: '1px solid #e5dfd2', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', minWidth: '180px', zIndex: 100, overflow: 'hidden' }}>
                                    <div style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '13px', color: '#666', background: '#f9f9f9' }}>
                                        Xin chào, <b>{myShop ? myShop.name : 'Đối tác mới'}</b>
                                    </div>
                                    <button onClick={handleLogout} style={{ width: '100%', textAlign: 'left', padding: '12px', background: 'none', border: 'none', color: '#d00', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="wrap">
                <div className="grid">
                    {/* SIDEBAR */}
                    <aside>
                        <section className="panel">
                            <div className="head">Cửa hàng của bạn</div>
                            <div className="body">
                                <div className="row">
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <img
                                            style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }}
                                            src={myShop?.image || "[https://via.placeholder.com/150?text=No+Img](https://via.placeholder.com/150?text=No+Img)"}
                                            alt=""
                                        />
                                        <div>
                                            {/* Hiển thị TÊN QUÁN THẬT từ Database */}
                                            <div style={{ fontWeight: '800', fontSize: '15px', lineHeight: '1.2' }}>
                                                {myShop ? myShop.name : "Đang cập nhật..."}
                                            </div>
                                            <div className="legend" style={{ fontSize: '10px', marginTop: '2px' }}>
                                                {myShop ? `ID: ${myShop._id.slice(-6).toUpperCase()}` : "Chưa có ID"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="hr"></div>

                                <div className="list-col">
                                    <Link to="/merchant/dashboard" className={`btn ${isActive('dashboard') ? 'active' : 'soft'}`}><i className="fa-solid fa-chart-line"></i> Tổng quan</Link>
                                    <Link to="/merchant/menu" className={`btn ${isActive('menu') ? 'active' : ''}`}><i className="fa-solid fa-utensils"></i> Quản lý Menu</Link>
                                    <Link to="/merchant/orders" className={`btn ${isActive('orders') ? 'active' : ''}`}><i className="fa-solid fa-clock-rotate-left"></i> Đơn hàng</Link>
                                    <Link to="/merchant/storefront" className={`btn ${isActive('storefront') ? 'active' : ''}`}><i className="fa-solid fa-store"></i> Thông tin quán</Link>
                                    <Link to="/merchant/reviews" className={`btn ${isActive('reviews') ? 'active' : ''}`}><i className="fa-solid fa-star"></i> Đánh giá</Link>
                                    <Link to="/merchant/promos" className={`btn ${isActive('promos') ? 'active' : ''}`}><i className="fa-solid fa-tag"></i> Khuyến mãi</Link>
                                    <Link to="/merchant/wallet" className={`btn ${isActive('wallet') ? 'active' : ''}`}><i className="fa-solid fa-wallet"></i> Ví & Đối soát</Link>
                                </div>
                            </div>
                        </section>
                    </aside>

                    <div className="main-content">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default MerchantLayout;