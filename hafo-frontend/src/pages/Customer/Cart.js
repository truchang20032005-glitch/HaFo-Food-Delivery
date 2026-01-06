import { Link } from 'react-router-dom';
import { useState } from 'react';
import Navbar from '../../components/Navbar';
import { useCart } from '../../context/CartContext';
import { confirmDialog, alertSuccess } from '../../utils/hafoAlert';
import FoodModal from '../../components/FoodModal';

const toVND = (n) => n?.toLocaleString('vi-VN');

function Cart() {
    const {
        cartItems, updateQuantity, removeFromCart,
        totalAmount, subtotal, clearCart, updateItemOptions,
        applyVoucher, appliedVoucher, voucherError
    } = useCart();

    const [voucherInput, setVoucherInput] = useState('');

    // Hàm xử lý ảnh (Fix lỗi không hiện ảnh)
    const getImageUrl = (path) => {
        if (!path) return 'https://via.placeholder.com/100?text=Food';
        return path; // Link Cloudinary đã là URL đầy đủ rồi
    };

    // Hàm xử lý xóa toàn bộ có xác nhận
    const handleClearCart = async () => {
        const isConfirmed = await confirmDialog(
            "Làm trống giỏ hàng?",
            "Bạn có chắc chắn muốn xóa toàn bộ món ăn đã chọn không?"
        );

        if (isConfirmed) {
            clearCart();

            await alertSuccess("Đã làm trống!", "Giỏ hàng của bạn hiện tại không có món nào.");
        }
    };

    // Hàm nhóm các món ăn theo nhà hàng
    const groupedItems = cartItems.reduce((acc, item) => {
        const rId = item.restaurantId || 'unknown';
        if (!acc[rId]) {
            acc[rId] = {
                name: item.restaurantName || 'Nhà hàng không xác định',
                items: []
            };
        }
        acc[rId].items.push(item);
        return acc;
    }, {});

    // ✅ 1. Thêm State để quản lý việc sửa món
    const [editingItem, setEditingItem] = useState(null);

    // ✅ 2. Định nghĩa hàm handleOpenEditModal (Hàm này fix lỗi má đang gặp)
    const handleOpenEditModal = (item) => {
        setEditingItem(item);
    };

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh', paddingBottom: 50 }}>
            <Navbar />

            {/* Header phụ */}
            <div style={{ background: '#fff', borderBottom: '1px solid #e9e4d8', padding: '15px 0' }}>
                <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
                    <h2 style={{ margin: 0, fontSize: '22px', color: '#3A2E2E' }}>Giỏ hàng của bạn 🛒</h2>

                </div>
            </div>

            <main style={{ maxWidth: '1000px', margin: '20px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '25px', alignItems: 'start' }}>

                {/* --- CỘT TRÁI: DANH SÁCH MÓN --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '15px', // Đổi từ -10px thành 15px để tạo khoảng cách với danh sách bên dưới
                        paddingRight: '5px'   // Thêm một chút lề phải để không sát mép ngoài
                    }}>
                        <button
                            onClick={handleClearCart}
                            style={{
                                background: 'none',
                                border: '1px solid #ff4d4f',
                                color: '#ff4d4f',
                                padding: '5px 12px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: '0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#FFF1F0'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                        >
                            <i className="fa-solid fa-trash-can" style={{ marginRight: '6px' }}></i>
                            Xóa tất cả
                        </button>
                    </div>
                    {cartItems.length === 0 ? (
                        <div style={{ background: '#fff', padding: '50px 20px', borderRadius: '16px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                            <img src="https://cdn-icons-png.flaticon.com/512/11329/11329060.png" alt="Empty" style={{ width: '120px', opacity: 0.5, marginBottom: '20px' }} />
                            <h3 style={{ color: '#555', margin: '0 0 10px' }}>Chưa có món nào!</h3>
                            <p style={{ color: '#888', marginBottom: '20px' }}>Bụng đói rồi, hãy chọn món ngon ngay thôi.</p>
                            <Link to="/home" style={{ display: 'inline-block', padding: '10px 25px', background: '#F97350', color: '#fff', textDecoration: 'none', borderRadius: '25px', fontWeight: 'bold' }}>
                                Đi chợ ngay
                            </Link>
                        </div>
                    ) : (
                        // Duyệt qua từng nhà hàng trong groupedItems
                        Object.entries(groupedItems).map(([restaurantId, group]) => (
                            <div key={restaurantId} style={{ background: '#fff', borderRadius: '16px', border: '1px solid #eadfcd', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>

                                {/* Header Nhà hàng & Phí Ship */}
                                <div style={{ padding: '12px 15px', background: '#FFF9F4', borderBottom: '1px solid #FFE0D1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 'bold', color: '#333', fontSize: '15px' }}>
                                        <i className="fa-solid fa-shop" style={{ color: '#F97350', marginRight: 8 }}></i>
                                        {group.name}
                                    </div>
                                </div>

                                {/* Danh sách món của nhà hàng này */}
                                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {group.items.map((item, index) => (
                                        <div
                                            key={item.uniqueId}
                                            style={{
                                                display: 'flex',
                                                gap: '15px',
                                                alignItems: 'center',
                                                borderBottom: index === group.items.length - 1 ? 'none' : '1px solid #f9f9f9',
                                                paddingBottom: index === group.items.length - 1 ? 0 : 15
                                            }}
                                        >
                                            {/* 1. Ảnh món ăn */}
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #f0f0f0' }}
                                                onError={(e) => e.target.src = 'https://via.placeholder.com/80'}
                                            />

                                            {/* 2. Nội dung chi tiết */}
                                            <div style={{ flex: 1 }}>
                                                {/* Dòng tiêu đề: Tên món + Nút Sửa + Nút Xóa */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                    <h4 style={{ margin: 0, fontSize: '15px', color: '#333', fontWeight: '600', flex: 1 }}>
                                                        {item.name}
                                                    </h4>

                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        {/* ✨ Nút Sửa tinh tế */}
                                                        <button
                                                            onClick={() => handleOpenEditModal(item)}
                                                            style={{
                                                                background: 'none',
                                                                border: 'none',
                                                                color: '#F97350',
                                                                fontSize: '12px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '3px',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                transition: '0.2s'
                                                            }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = '#FFF5F2'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                                                        >
                                                            <i className="fa-solid fa-pen-to-square" style={{ fontSize: '11px' }}></i> Sửa
                                                        </button>

                                                        {/* Nút Xóa khỏi giỏ */}
                                                        <button
                                                            onClick={() => removeFromCart(item.uniqueId)}
                                                            style={{ border: 'none', background: 'none', color: '#ccc', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
                                                        >
                                                            <i className="fa-solid fa-xmark"></i>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Thông tin Size, Topping và Ghi chú */}
                                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', lineHeight: '1.4' }}>
                                                    <span style={{
                                                        background: '#FFF5F2',
                                                        color: '#F97350',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        fontWeight: 'bold',
                                                        marginRight: '6px',
                                                        fontSize: '11px'
                                                    }}>
                                                        {item.selectedSize}
                                                    </span>
                                                    {item.selectedToppings && item.selectedToppings.length > 0 ? (
                                                        item.selectedToppings.map(t => t.name).join(', ')
                                                    ) : (
                                                        <span style={{ color: '#999' }}>Không thêm topping</span>
                                                    )}

                                                    {item.note && (
                                                        <div style={{ color: '#888', fontStyle: 'italic', marginTop: '4px', fontSize: '11px' }}>
                                                            📝 "{item.note}"
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Giá tiền và Bộ tăng giảm số lượng */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#F97350', fontSize: '15px' }}>
                                                        {toVND(item.finalPrice)}đ
                                                    </div>

                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        border: '1px solid #E2E8F0',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        background: '#fff'
                                                    }}>
                                                        <button
                                                            onClick={() => updateQuantity(item.uniqueId, -1)}
                                                            style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#64748B' }}
                                                        >
                                                            −
                                                        </button>
                                                        <span style={{ width: '30px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold', color: '#1E293B' }}>
                                                            {item.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.uniqueId, 1)}
                                                            style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', color: '#F97350' }}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* --- CỘT PHẢI: THANH TOÁN --- */}
                <div style={{ position: 'sticky', top: '90px' }}>
                    <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #eadfcd', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <h4 style={{ margin: '0 0 15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Tóm tắt đơn hàng</h4>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', color: '#555' }}>
                            <span>Tạm tính ({cartItems.length} món)</span>
                            <b>{toVND(subtotal)}đ</b>
                        </div>

                        {/* Ô NHẬP VOUCHER REAL */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <input
                                    value={voucherInput}
                                    onChange={(e) => setVoucherInput(e.target.value)}
                                    placeholder="Nhập mã (HAFO50, STUDENT...)"
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: voucherError ? '1px solid red' : '1px solid #ddd', fontSize: '13px' }}
                                />
                                <button
                                    onClick={() => applyVoucher(voucherInput)}
                                    style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '8px', padding: '0 12px', fontSize: '13px', cursor: 'pointer' }}
                                >
                                    Áp dụng
                                </button>
                            </div>
                            {voucherError && <div style={{ color: 'red', fontSize: '11px', marginTop: '5px' }}>{voucherError}</div>}
                            {appliedVoucher && (
                                <div style={{ color: '#22C55E', fontSize: '12px', marginTop: '5px', fontWeight: '500' }}>
                                    ✅ Đã giảm {toVND(appliedVoucher.discountAmount)}đ (Mã: {appliedVoucher.code})
                                </div>
                            )}
                        </div>

                        <div style={{ borderTop: '2px dashed #eee', margin: '15px 0' }}></div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '18px' }}>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>Tổng cộng</span>
                            <span style={{ fontWeight: 'bold', color: '#F97350' }}>{toVND(totalAmount)}đ</span>
                        </div>

                        <Link to="/checkout" style={{ textDecoration: 'none' }}>
                            <button
                                disabled={cartItems.length === 0}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: cartItems.length === 0 ? '#ddd' : '#F97350',
                                    color: '#fff',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                                    boxShadow: cartItems.length === 0 ? 'none' : '0 4px 15px rgba(249, 115, 80, 0.4)',
                                    transition: '0.3s'
                                }}
                            >
                                Thanh toán ngay
                            </button>
                        </Link>
                    </div>
                </div>
            </main>
            <FoodModal
                isOpen={!!editingItem}
                onClose={() => setEditingItem(null)}
                food={editingItem} // Modal cần dữ liệu món để hiển thị
                editItem={editingItem} // Truyền item hiện tại để Modal biết là đang "Sửa"
                onAddToCart={(updatedData) => {
                    // Logic cập nhật món trong giỏ hàng (sẽ làm ở Bước 2)
                    updateItemOptions(editingItem.uniqueId, updatedData);
                    setEditingItem(null);
                }}
            />
        </div>
    );
}

export default Cart;