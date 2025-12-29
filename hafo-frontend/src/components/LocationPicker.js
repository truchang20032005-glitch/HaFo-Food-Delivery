import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';

// --- FIX LỖI ICON MARKER ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- COMPONENT CON XỬ LÝ Ô TÌM KIẾM ---
function SearchField({ onLocationSelect }) {
    const map = useMap();

    useEffect(() => {
        const provider = new OpenStreetMapProvider();

        const searchControl = new GeoSearchControl({
            provider: provider,
            style: 'bar', // Hiển thị dạng thanh search ngang
            showMarker: false, // Không dùng marker mặc định của thư viện
            showPopup: false,
            autoClose: true,
            retainZoomLevel: false,
            animateZoom: true,
            keepResult: true,
            searchLabel: 'Nhập địa chỉ cần tìm...',
        });

        map.addControl(searchControl);

        // Sự kiện khi người dùng chọn một địa chỉ từ danh sách gợi ý
        map.on('geosearch/showlocation', (result) => {
            const { x, y } = result.location; // x là lng, y là lat
            onLocationSelect({ lat: y, lng: x });
        });

        return () => map.removeControl(searchControl);
    }, [map, onLocationSelect]);

    return null;
}

// --- COMPONENT CHÍNH ---
function LocationPicker({ onLocationSelect, defaultPos }) {
    // Lưu ý: Leaflet dùng [lat, lng]
    const [position, setPosition] = useState(defaultPos || [10.762622, 106.660172]);

    // Tự động cập nhật tâm bản đồ khi vị trí thay đổi (do tìm kiếm)
    function ChangeView({ center }) {
        const map = useMap();
        map.setView(center, map.getZoom());
        return null;
    }

    // Xử lý khi click thủ công trên bản đồ
    function ClickHandler() {
        useMapEvents({
            click(e) {
                const { lat, lng } = e.latlng;
                const newPos = [lat, lng];
                setPosition(newPos);
                onLocationSelect({ lat, lng });
            },
        });
        return null;
    }

    // Hàm nhận tọa độ từ ô Search và cập nhật State
    const handleSearchSelect = (pos) => {
        setPosition([pos.lat, pos.lng]);
        onLocationSelect(pos);
    };

    return (
        <div style={{ height: '400px', width: '100%', marginTop: '10px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #ddd' }}>
            <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Thanh tìm kiếm */}
                <SearchField onLocationSelect={handleSearchSelect} />

                {/* Marker hiển thị vị trí được chọn */}
                <Marker position={position} />

                {/* Các logic bổ trợ */}
                <ClickHandler />
                <ChangeView center={position} />
            </MapContainer>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                * Bạn có thể gõ địa chỉ vào ô tìm kiếm hoặc click trực tiếp để chọn vị trí chính xác.
            </p>
        </div>
    );
}

export default LocationPicker;