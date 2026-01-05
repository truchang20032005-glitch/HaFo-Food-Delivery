import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Navbar from '../../components/Navbar';
import { removeVietnameseTones } from '../../utils/stringUtils';

// Hàm tính khoảng cách (Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

function Home() {
    const [restaurants, setRestaurants] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [userLocation, setUserLocation] = useState(null);
    const [sortBy, setSortBy] = useState("default");

    // State cho bộ lọc
    const [selectedCity, setSelectedCity] = useState("Tất cả"); // MỚI: Thêm state Thành phố
    const [selectedDistrict, setSelectedDistrict] = useState("Tất cả");
    const [selectedCuisine, setSelectedCuisine] = useState("Tất cả");

    // State danh sách các option cho bộ lọc
    const [cities, setCities] = useState([]); // MỚI: Danh sách thành phố
    const [districts, setDistricts] = useState([]);
    const [cuisines, setCuisines] = useState([]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn("Không lấy được vị trí:", err)
        );
    }, []);

    // 1. GỌI API LẤY DANH SÁCH QUÁN THẬT TỪ BACKEND
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const res = await api.get('/restaurants');
                const data = res.data;
                setRestaurants(data);

                // A. Lấy danh sách Thành phố duy nhất từ dữ liệu thật
                const uniqueCities = ["Tất cả", ...new Set(data.map(r => r.city).filter(Boolean))];
                setCities(uniqueCities);

                // B. Lấy danh sách Loại món duy nhất
                const uniqueCuisines = ["Tất cả", ...new Set(data.map(r => r.cuisine).flat().filter(Boolean))];
                setCuisines(uniqueCuisines);

            } catch (err) {
                console.error("Lỗi lấy quán:", err);
            }
        };
        fetchRestaurants();
    }, []);

    useEffect(() => {
        if (selectedCity === "Tất cả") {
            setDistricts(["Tất cả"]);
            setSelectedDistrict("Tất cả");
        } else {
            // Lọc ra các quận thuộc về thành phố đã chọn
            const filteredDist = restaurants
                .filter(r => r.city === selectedCity)
                .map(r => r.district)
                .filter(Boolean);

            const uniqueDistricts = ["Tất cả", ...new Set(filteredDist)];
            setDistricts(uniqueDistricts);
            setSelectedDistrict("Tất cả"); // Reset quận về "Tất cả" khi đổi thành phố
        }
    }, [selectedCity, restaurants]);

    // 2. Logic lọc tổng hợp: Đã tách biệt hoàn toàn
    const filteredAndSortedRestaurants = useMemo(() => {
        let result = [...restaurants];

        // A. Lọc theo tìm kiếm (Dùng debouncedSearch thay vì searchTerm)
        const searchLow = removeVietnameseTones(debouncedSearch.trim().toLowerCase());
        if (searchLow !== "") {
            result = result.filter(res =>
                removeVietnameseTones(res.name.toLowerCase()).includes(searchLow) ||
                removeVietnameseTones(res.address?.toLowerCase() || "").includes(searchLow)
            );
        }
        // B. Lọc theo khu vực/món ăn (Chỉ khi không tìm kiếm)
        if (selectedCity !== "Tất cả") result = result.filter(r => r.city === selectedCity);
        if (selectedDistrict !== "Tất cả") result = result.filter(r => r.district === selectedDistrict);
        if (selectedCuisine !== "Tất cả") result = result.filter(r => r.cuisine?.includes(selectedCuisine));


        // ✅ C. SẮP XẾP
        if (sortBy === "rating") {
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        } else if (sortBy === "distance" && userLocation) {
            result.sort((a, b) => {
                const distA = calculateDistance(userLocation.lat, userLocation.lng, a.location?.coordinates[1], a.location?.coordinates[0]);
                const distB = calculateDistance(userLocation.lat, userLocation.lng, b.location?.coordinates[1], b.location?.coordinates[0]);
                return distA - distB;
            });
        } else if (sortBy === "price") {
            // Giả sử mỗi quán có trường avgPrice hoặc lấy minPrice từ menu
            result.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
        }

        return result;
    }, [restaurants, debouncedSearch, selectedCity, selectedDistrict, selectedCuisine, sortBy, userLocation]);

    const handleSearch = (value) => {
        setSearchTerm(value);
    };

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar onSearch={handleSearch} searchValue={searchTerm} />

            {/* Subbar: Khu vực chứa các bộ lọc */}
            <div className="subbar" style={{ background: '#fff', padding: '15px 0', borderBottom: '1px solid #e9e4d8', position: 'sticky', top: '64px', zIndex: 40 }}>
                <div className="hop" style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '0 20px', maxWidth: '1200px', margin: '0 auto', alignItems: 'center' }}>

                    <span style={{ fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap' }}> <i className="fa-solid fa-filter"></i> Bộ lọc:</span>

                    {/* Bộ lọc Khu vực (Dynamic) */}
                    {/* 1. Bộ lọc Thành phố (MỚI) */}
                    <select
                        style={selectStyle}
                        value={selectedCity}
                        onChange={(e) => {
                            setSelectedCity(e.target.value);
                            setSearchTerm(""); // ✅ Tách biệt: Chọn filter thì xóa search
                        }}
                    >
                        {cities.map((city) => (
                            <option key={city} value={city}>
                                {city === "Tất cả" ? "Thành phố: Tất cả" : city}
                            </option>
                        ))}
                    </select>

                    {/* 2. Bộ lọc Quận/Huyện (Dynamic dựa trên City) */}
                    <select
                        style={selectStyle}
                        value={selectedDistrict}
                        onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setSearchTerm(""); // ✅ Tách biệt: Chọn filter thì xóa search
                        }}
                        disabled={selectedCity === "Tất cả"} // Khóa nếu chưa chọn TP cụ thể
                    >
                        {districts.map((dist) => (
                            <option key={dist} value={dist}>
                                {dist === "Tất cả" ? "Quận/Huyện: Tất cả" : dist}
                            </option>
                        ))}
                    </select>

                    {/* Bộ lọc Loại món (Dynamic) */}
                    <select
                        style={selectStyle}
                        value={selectedCuisine}
                        onChange={(e) => {
                            setSelectedCuisine(e.target.value);
                            setSearchTerm(""); // ✅ Tách biệt: Chọn filter thì xóa search
                        }}
                    >
                        {cuisines.map((type) => (
                            <option key={type} value={type}>
                                {type === "Tất cả" ? "Loại món: Tất cả" : type}
                            </option>
                        ))}
                    </select>

                    {/* ✅ BỘ LỌC SẮP XẾP MỚI */}
                    <span style={{ fontWeight: 'bold', color: '#555', whiteSpace: 'nowrap' }}> <i className="fa-solid fa-sort"></i> Sắp xếp:</span>
                    <select style={selectStyle} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="default">Mặc định</option>
                        <option value="rating">⭐ Đánh giá cao nhất</option>
                        <option value="distance">📍 Gần tôi nhất</option>
                        <option value="price">💰 Giá thấp đến cao</option>
                    </select>

                    {/* Nút Reset nếu đang lọc */}
                    {(selectedCity !== "Tất cả" || selectedDistrict !== "Tất cả" || selectedCuisine !== "Tất cả" || searchTerm) && (
                        <button
                            onClick={() => {
                                setSelectedCity("Tất cả");
                                setSelectedDistrict("Tất cả");
                                setSelectedCuisine("Tất cả");
                                setSearchTerm("");
                            }}
                            style={{ ...btnResetStyle }}
                        >
                            Xóa lọc ✕
                        </button>
                    )}
                </div>
            </div>

            <main className="hop" style={{ padding: '30px 20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '20px', color: '#F97350', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {searchTerm ? `Kết quả cho "${searchTerm}"` : "Quán ngon quanh bạn 😋"}
                    <span style={{ fontSize: '14px', color: '#666', fontWeight: 'normal', background: '#fff', padding: '2px 8px', borderRadius: '10px', border: '1px solid #ddd' }}>
                        {filteredAndSortedRestaurants.length} kết quả
                    </span>
                </h2>

                {restaurants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 50 }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, color: '#F97350' }}></i>
                        <p>Đang tải dữ liệu quán...</p>
                    </div>
                ) : filteredAndSortedRestaurants.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 50, color: '#666' }}>
                        <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" alt="Empty" style={{ width: 200, opacity: 0.5 }} />
                        <p style={{ fontSize: '18px', marginTop: 10 }}>Không tìm thấy quán nào phù hợp 😅</p>
                        <button
                            onClick={() => { setSelectedDistrict("Tất cả"); setSelectedCuisine("Tất cả"); setSearchTerm("") }}
                            style={{ color: '#F97350', background: 'none', border: '1px solid #F97350', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}
                        >
                            Xem tất cả quán
                        </button>
                    </div>
                ) : (
                    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px' }}>
                        {filteredAndSortedRestaurants.map(res => (
                            <Link to={`/restaurant/${res._id}`} key={res._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div className="card" style={cardStyle}>
                                    {/* Ảnh quán */}
                                    <div style={{ height: '160px', overflow: 'hidden', position: 'relative', background: '#eee' }}>
                                        <img
                                            src={res.image || 'https://via.placeholder.com/300x200?text=HaFo+Quan'}
                                            alt={res.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: '0.3s',
                                                // ✅ HIỆU ỨNG MỜ VÀ ĐEN TRẮNG KHI ĐÓNG CỬA
                                                filter: res.isOpen ? 'none' : 'grayscale(0.8) blur(2px)',
                                                opacity: res.isOpen ? 1 : 0.8
                                            }}
                                            onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=HaFo+App'}
                                        />
                                        {/* Badge trạng thái */}
                                        <div style={{ position: 'absolute', top: 10, left: 10, background: res.isOpen ? '#22C55E' : '#999', color: '#fff', fontSize: 11, padding: '4px 8px', borderRadius: 4, fontWeight: 'bold' }}>
                                            {res.isOpen ? 'Đang mở cửa' : 'Đóng cửa'}
                                        </div>
                                    </div>

                                    {/* Nội dung card */}
                                    <div style={{ padding: '15px' }}>
                                        <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#333', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={res.name}>
                                            {res.name}
                                        </h3>

                                        {/* Địa chỉ */}
                                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '12px', display: 'flex', alignItems: 'flex-start', gap: 5, height: '36px', overflow: 'hidden' }}>
                                            <i className="fa-solid fa-location-dot" style={{ marginTop: 2 }}></i>
                                            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                {res.address}, {res.district}
                                            </span>
                                        </div>
                                        {userLocation && (
                                            <div style={{ fontSize: '12px', color: '#F97350', fontWeight: 'bold', marginBottom: '8px' }}>
                                                <i className="fa-solid fa-person-walking"></i> Cách bạn: {
                                                    calculateDistance(
                                                        userLocation.lat,
                                                        userLocation.lng,
                                                        res.location?.coordinates[1],
                                                        res.location?.coordinates[0]
                                                    ).toFixed(1)
                                                } km
                                            </div>
                                        )}

                                        {/* Cuisine Tags */}
                                        <div style={{ marginBottom: 10, display: 'flex', gap: 5, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                            {res.cuisine?.slice(0, 3).map((tag, idx) => (
                                                <span key={idx} style={{ fontSize: 11, background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, color: '#555' }}>
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        <div style={{ borderTop: '1px solid #eee', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ color: res.rating > 0 ? '#F5C048' : '#999', fontWeight: 'bold', fontSize: 13 }}>
                                                {res.rating > 0 ? (
                                                    <>
                                                        <i className="fa-solid fa-star"></i> {res.rating.toFixed(1)}
                                                    </>
                                                ) : (
                                                    "Chưa có đánh giá"
                                                )}
                                            </span>
                                            <span style={{ color: '#F97350', fontWeight: 'bold', fontSize: '13px', background: '#fff5f2', padding: '4px 10px', borderRadius: '20px' }}>
                                                Xem Menu →
                                            </span>
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

// --- CSS IN JS ---
const selectStyle = {
    padding: '6px 30px 6px 12px', // Giảm padding để thanh nhỏ hơn
    borderRadius: '20px',
    border: '1px solid #ddd',
    background: '#fff',
    cursor: 'pointer',
    fontSize: '13px',            // Giảm cỡ chữ xuống 13px
    outline: 'none',
    minWidth: '120px',            // Giảm chiều rộng tối thiểu (cũ là 140px)
    maxWidth: '180px',            // Giới hạn chiều rộng tối đa
    height: '36px',               // Cố định chiều cao cho cân đối
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23333%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px top 50%', // Chỉnh lại vị trí mũi tên
    backgroundSize: '10px auto',
    fontWeight: '600',            // Tăng độ đậm chữ lên một chút cho nét
    color: '#444',
    whiteSpace: 'nowrap',         // Ngăn xuống dòng
    textOverflow: 'ellipsis',     // Nếu chữ quá dài thì hiện dấu ...
    overflow: 'hidden'
};

const btnResetStyle = {
    padding: '8px 12px',
    borderRadius: '20px',
    border: 'none',
    background: '#fee2e2',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap'
};

const cardStyle = {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1px solid #eee',
    height: '100%',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
    cursor: 'pointer'
};

export default Home;