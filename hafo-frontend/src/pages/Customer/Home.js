import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';

function Home() {
    const [restaurants, setRestaurants] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedArea, setSelectedArea] = useState("Tất cả");
    const [selectedType, setSelectedType] = useState("Tất cả");

    // GỌI API LẤY DANH SÁCH QUÁN THẬT TỪ BACKEND
    useEffect(() => {
        axios.get('http://localhost:5000/api/restaurants')
            .then(res => {
                setRestaurants(res.data);
                const q = res.data.find(item => item.name === "Cơm quê");
                console.log("Dữ liệu Cuisine của Cơm quê:", q?.cuisine);
                console.log("Dữ liệu Area của Cơm quê:", q?.area);
            })
            .catch(err => console.error("Lỗi lấy quán:", err));
    }, []);
    const uniqueAreas = ["Tất cả", ...new Set(restaurants.map(res => {
        if (!res.address) return null;
        const parts = res.address.split(','); // Giả sử địa chỉ ngăn cách bằng dấu phẩy
        return parts[parts.length - 1].trim(); // Lấy phần cuối cùng (thường là Quận/Thành phố)
    }).filter(Boolean))];

    // Logic lọc tổng hợp: Tìm kiếm + Khu vực + Loại món (Array)
    const filteredRestaurants = restaurants.filter(res => {
    // 1. Lọc theo tên quán (searchTerm)
        const matchesSearch = !searchTerm || 
                            res.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Lọc theo khu vực:
    // Nếu chọn "Tất cả", kết quả luôn là true.
    // Nếu chọn khu vực cụ thể, phải có res.area và nó phải khớp chính xác.
    // Thay thế dòng matchesArea cũ bằng dòng này:
        const matchesArea = selectedArea === "Tất cả" || 
                        (res.area && res.area === selectedArea) || 
                        (res.address && res.address.includes(selectedArea));

    // 3. Lọc theo loại món:
    // Nếu chọn "Tất cả", kết quả luôn là true.
    // Nếu chọn loại món cụ thể, mảng res.cuisine phải chứa loại món đó.
        const matchesType = selectedType === "Tất cả" || 
                            (Array.isArray(res.cuisine) && res.cuisine.includes(selectedType));
    
    // Quán phải thỏa mãn đồng thời cả 3 điều kiện
        return matchesSearch && matchesArea && matchesType;
    });

    // Debug để kiểm tra dữ liệu trong Console
    if (restaurants.length > 0) {
        console.log("Dữ liệu quán đầu tiên:", restaurants[0]);
    }

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar onSearch={setSearchTerm} />

            {/* Subbar: Khu vực chứa các bộ lọc */}
            <div className="subbar" style={{ background: '#fff', padding: '10px 0', borderBottom: '1px solid #e9e4d8' }}>
                <div className="hop" style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
                    
                    {/* Bộ lọc Khu vực */}
                    <select 
                        style={btnStyle} 
                        value={selectedArea} 
                        onChange={(e) => setSelectedArea(e.target.value)}
                    >
                        {uniqueAreas.map((area) => (
                            <option key={area} value={area}>
                                {area === "Tất cả" ? "Khu vực: Tất cả" : area}
                            </option>
                        ))}
                    </select>

                    {/* Bộ lọc Loại món */}
                    <select 
                        style={btnStyle} 
                        value={selectedType} 
                        onChange={(e) => setSelectedType(e.target.value)}
                    >
                        <option value="Tất cả">Loại món: Tất cả</option>
                        <option value="Cơm">Cơm</option> 
                        <option value="Bánh bao">Bánh bao</option>
                        <option value="Bún/Phở">Bún/Phở</option>
                        <option value="Chay">Chay</option>
                        <option value="Đồ uống">Đồ uống</option>
                        <option value="Món Á">Món Á</option>
                        <option value="Món Âu">Món Âu</option>
                        <option value="Ăn vặt">Ăn vặt</option>
                        <option value="Bánh mì">Bánh mì</option>
                    </select>
                </div>
            </div>

            <main className="hop" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '20px', color: '#F97350' }}>
                    {searchTerm ? `Kết quả cho "${searchTerm}"` : "Quán ngon quanh bạn 😋"}
                </h2>

                {restaurants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 50 }}>Đang tải các quán ăn...</div>
                ) : filteredRestaurants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 50, color: '#666' }}>
                        <p style={{ fontSize: '18px' }}>Không tìm thấy quán nào phù hợp với bộ lọc của bạn 😅</p>
                        <button 
                            onClick={() => {setSelectedArea("Tất cả"); setSelectedType("Tất cả"); setSearchTerm("")}}
                            style={{ color: '#F97350', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px' }}
                        >
                            Xóa tất cả bộ lọc
                        </button>
                    </div>
                ) : (
                    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {filteredRestaurants.map(res => (
                            <Link to={`/restaurant/${res._id}`} key={res._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="card" style={cardStyle}>
                                    <div style={{ height: '150px', overflow: 'hidden', position: 'relative', background: '#eee' }}>
                                        <img
                                            src={res.image || 'https://via.placeholder.com/300x200?text=HaFo+Quan'}
                                            alt={res.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                    <div style={{ padding: '12px' }}>
                                        <h3 style={{ margin: '0 0 5px', fontSize: '16px', color: '#333' }}>{res.name}</h3>
                                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px', height: '32px', overflow: 'hidden' }}>
                                            {res.address}
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: '#F5C048', fontWeight: 'bold' }}>★ {res.rating || 0}</span>
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

const btnStyle = {
    padding: '8px 15px',
    borderRadius: '20px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    outline: 'none',
    minWidth: '120px'
};

const cardStyle = {
    background: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #eee',
    height: '100%',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    cursor: 'pointer'
};

export default Home;