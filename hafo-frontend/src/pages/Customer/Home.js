import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';

function Home() {
    const [restaurants, setRestaurants] = useState([]);

    // GỌI API LẤY DANH SÁCH QUÁN THẬT TỪ BACKEND
    useEffect(() => {
        axios.get('http://localhost:5000/api/restaurants')
            .then(res => setRestaurants(res.data))
            .catch(err => console.error("Lỗi lấy quán:", err));
    }, []);

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar />

            <div className="subbar" style={{ background: '#fff', padding: '10px 0', borderBottom: '1px solid #e9e4d8' }}>
                <div className="hop" style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                    <button className="btn soft">Khu vực: Tất cả ▾</button>
                    <button className="btn soft">Loại món: Tất cả ▾</button>
                </div>
            </div>

            <main className="hop" style={{ padding: '20px' }}>
                <h2 style={{ marginBottom: '20px', color: '#F97350' }}>Quán ngon quanh bạn 😋</h2>

                {restaurants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 50 }}>Đang tải các quán ăn...</div>
                ) : (
                    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {restaurants.map(res => (
                            // Link tới trang chi tiết với ID thật của quán
                            <Link to={`/restaurant/${res._id}`} key={res._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="card" style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #eee', height: '100%', transition: '0.2s' }}>
                                    <div style={{ height: '150px', overflow: 'hidden', position: 'relative' }}>
                                        {/* Nếu không có ảnh thì dùng ảnh placeholder */}
                                        <img
                                            src={res.image || 'https://via.placeholder.com/300x200?text=HaFo+Quan'}
                                            alt={res.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ padding: '12px' }}>
                                        <h3 style={{ margin: '0 0 5px', fontSize: '16px' }}>{res.name}</h3>
                                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>{res.address}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#F5C048', fontWeight: 'bold' }}>★ {res.rating || 5.0}</span>
                                            <span style={{ color: '#F97350', fontWeight: 'bold', fontSize: '13px' }}>Xem Menu</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}

export default Home;