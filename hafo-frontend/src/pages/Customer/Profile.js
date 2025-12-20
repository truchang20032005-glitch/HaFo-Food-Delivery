import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../../components/Navbar';

function Profile() {
    // State User
    const [user, setUser] = useState(null);
    const [previewAvatar, setPreviewAvatar] = useState('');

    // State Form
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        gender: 'Nữ',
        birthday: '',
        addresses: []
    });

    // State cho việc thêm địa chỉ (MỚI)
    const [isAdding, setIsAdding] = useState(false); // Trạng thái đang nhập hay không
    const [newAddr, setNewAddr] = useState('');      // Nội dung địa chỉ mới

    // State Modal Đổi mật khẩu
    const [showPassModal, setShowPassModal] = useState(false);
    const [passData, setPassData] = useState({ oldPass: '', newPass: '', confirmPass: '' });

    useEffect(() => {
        const localUser = JSON.parse(localStorage.getItem('user'));
        if (localUser) {
            setUser(localUser);
            setFormData({
                fullName: localUser.fullName || '',
                phone: localUser.phone || '',
                email: localUser.email || '',
                gender: localUser.gender || 'Nữ',
                birthday: localUser.birthday || '',
                addresses: localUser.addresses || [
                    { label: 'Nhà', value: '19/13 Khu phố Thắng Lợi 1, Dĩ An' },
                    { label: 'Cty', value: '268 Lý Thường Kiệt, Q.10, TP.HCM' }
                ]
            });
        }
    }, []);

    // --- XỬ LÝ AVATAR ---
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewAvatar(url);
        }
    };

    // --- XỬ LÝ FORM ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- XỬ LÝ ĐỊA CHỈ (ĐÃ SỬA ĐẸP HƠN) ---
    const confirmAddAddress = () => {
        if (!newAddr.trim()) {
            setIsAdding(false);
            return;
        }
        const updatedAddresses = [...formData.addresses, { label: 'Mới', value: newAddr }];
        setFormData({ ...formData, addresses: updatedAddresses });
        setNewAddr('');
        setIsAdding(false); // Tắt chế độ nhập
    };

    const cancelAddAddress = () => {
        setNewAddr('');
        setIsAdding(false);
    };

    const handleRemoveAddress = (index) => {
        if (window.confirm("Xóa địa chỉ này?")) {
            const newAddrs = formData.addresses.filter((_, i) => i !== index);
            setFormData({ ...formData, addresses: newAddrs });
        }
    };

    // --- XỬ LÝ LƯU ---
    const handleSave = () => {
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert("Đã lưu hồ sơ thành công!");
        window.location.reload();
    };

    // --- XỬ LÝ ĐỔI MẬT KHẨU ---
    const handleChangePassword = () => {
        if (passData.newPass !== passData.confirmPass) {
            alert("Mật khẩu xác nhận không khớp!");
            return;
        }
        alert("Đổi mật khẩu thành công! (Demo)");
        setShowPassModal(false);
        setPassData({ oldPass: '', newPass: '', confirmPass: '' });
    };

    if (!user) return <div>Đang tải...</div>;

    return (
        <div style={{ background: '#F7F2E5', minHeight: '100vh' }}>
            <Navbar />

            <div className="hop" style={{ margin: '20px auto', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>

                {/* CỘT TRÁI: AVATAR & INFO */}
                <aside className="card" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #eadfcd', height: 'fit-content' }}>
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px', fontWeight: '800', fontSize: '16px' }}>
                        <i className="fa-solid fa-user"></i> Thông tin tài khoản
                    </div>

                    <div className="ava-wrap">
                        <div
                            className="ava-large"
                            style={{ backgroundImage: `url(${previewAvatar || '/images/avt.jpg'})` }}
                        ></div>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '18px' }}>{formData.fullName}</div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Thành viên từ 2025</div>
                            <div style={{ fontSize: '12px', color: '#22C55E', marginTop: '5px' }}><i className="fa-solid fa-shield-halved"></i> Bảo mật: Tốt</div>
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <label className="btn soft" style={{ cursor: 'pointer', border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700' }}>
                            <i className="fa-solid fa-image"></i> Đổi ảnh
                            <input type="file" hidden accept="image/*" onChange={handleAvatarChange} />
                        </label>
                        <button className="btn soft" onClick={() => setPreviewAvatar('')} style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#fff', cursor: 'pointer' }}>
                            <i className="fa-regular fa-trash-can"></i> Xóa
                        </button>
                        <button className="btn soft" onClick={() => setShowPassModal(true)} style={{ border: '1px solid #ddd', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#fff', cursor: 'pointer' }}>
                            <i className="fa-solid fa-lock"></i> Mật khẩu
                        </button>
                    </div>
                </aside>

                {/* CỘT PHẢI: FORM CHỈNH SỬA */}
                <section className="card" style={{ background: '#fff', padding: '20px', borderRadius: '14px', border: '1px solid #eadfcd' }}>
                    <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px', fontWeight: '800', fontSize: '16px' }}>
                        <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa hồ sơ
                    </div>

                    {/* Thông tin cá nhân */}
                    <div className="grid-2">
                        <div className="field-group">
                            <label>Họ và tên</label>
                            <input name="fullName" value={formData.fullName} onChange={handleChange} />
                        </div>
                        <div className="field-group">
                            <label>Giới tính</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option>Nam</option>
                                <option>Nữ</option>
                                <option>Khác</option>
                            </select>
                        </div>
                        <div className="field-group">
                            <label>Ngày sinh</label>
                            <input type="date" name="birthday" value={formData.birthday} onChange={handleChange} />
                        </div>
                        <div className="field-group">
                            <label>Biệt danh</label>
                            <input placeholder="Ví dụ: Hằng Hằng" />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #eee', margin: '20px 0' }}></div>

                    <div className="grid-2">
                        <div className="field-group">
                            <label>Số điện thoại</label>
                            <input name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="field-group">
                            <label>Email</label>
                            <input name="email" value={formData.email} onChange={handleChange} />
                        </div>
                    </div>

                    <div style={{ borderTop: '1px solid #eee', margin: '20px 0' }}></div>

                    {/* --- ĐỊA CHỈ GIAO HÀNG (Đã chỉnh sửa) --- */}
                    <div style={{ fontWeight: '800', marginBottom: '15px' }}><i className="fa-solid fa-location-dot"></i> Địa chỉ giao hàng</div>

                    {/* Danh sách địa chỉ cũ */}
                    {formData.addresses.map((addr, idx) => (
                        <div key={idx} className="addr-card">
                            <span className="addr-tag">{addr.label}</span>
                            <div className="addr-content">{addr.value}</div>
                            <div className="addr-tools">
                                <button className="btn-icon"><i className="fa-regular fa-pen-to-square"></i></button>
                                <button className="btn-icon del" onClick={() => handleRemoveAddress(idx)}><i className="fa-regular fa-trash-can"></i></button>
                            </div>
                        </div>
                    ))}

                    {/* Khung nhập địa chỉ MỚI (Chỉ hiện khi isAdding = true) */}
                    {isAdding ? (
                        <div className="addr-card" style={{ border: '1px solid #F97350', background: '#fff5f2' }}>
                            <span className="addr-tag" style={{ background: '#F97350', color: '#fff', border: 'none' }}>Mới</span>
                            <div className="addr-content" style={{ flex: 1 }}>
                                <input
                                    autoFocus
                                    placeholder="Nhập địa chỉ mới..."
                                    value={newAddr}
                                    onChange={(e) => setNewAddr(e.target.value)}
                                    style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '14px' }}
                                    onKeyDown={(e) => e.key === 'Enter' && confirmAddAddress()}
                                />
                            </div>
                            <div className="addr-tools">
                                <button onClick={confirmAddAddress} className="btn-icon" style={{ color: 'green', borderColor: 'green' }}><i className="fa-solid fa-check"></i></button>
                                <button onClick={cancelAddAddress} className="btn-icon" style={{ color: 'red', borderColor: 'red' }}><i className="fa-solid fa-xmark"></i></button>
                            </div>
                        </div>
                    ) : (
                        // Nút Thêm địa chỉ (Bấm vào mới hiện khung nhập)
                        <button onClick={() => setIsAdding(true)} className="btn soft" style={{ width: '100%', padding: '12px', border: '1px dashed #ccc', background: '#fff', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <i className="fa-solid fa-plus"></i> Thêm địa chỉ mới
                        </button>
                    )}

                    <div style={{ borderTop: '1px solid #eee', margin: '20px 0' }}></div>

                    <div className="grid-2">
                        <div className="toggle-row">
                            <label>Nhận thông báo khuyến mãi</label>
                            <label className="toggle">
                                <input type="checkbox" defaultChecked />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="toggle-row">
                            <label>Nhận hoá đơn qua email</label>
                            <label className="toggle">
                                <input type="checkbox" />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button className="btn soft" style={{ padding: '12px 24px', border: '1px solid #ddd', background: '#fff', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Huỷ</button>
                        <button onClick={handleSave} className="btn primary" style={{ padding: '12px 24px', border: 'none', background: '#F97350', color: 'white', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 0 #e05d3a' }}>
                            <i className="fa-solid fa-floppy-disk"></i> Lưu thay đổi
                        </button>
                    </div>
                </section>
            </div>

            {/* MODAL ĐỔI MẬT KHẨU */}
            {showPassModal && (
                <div className="overlay show" style={{ display: 'flex' }}>
                    <div className="modal" style={{ height: 'auto', maxWidth: '400px' }}>
                        <div className="modal__head">
                            <div className="modal__title">Đổi mật khẩu</div>
                            <button className="modal__close" onClick={() => setShowPassModal(false)}>✕</button>
                        </div>
                        <div className="modal__body">
                            <div className="field-group" style={{ marginBottom: '15px' }}>
                                <label>Mật khẩu hiện tại</label>
                                <input type="password" />
                            </div>
                            <div className="field-group" style={{ marginBottom: '15px' }}>
                                <label>Mật khẩu mới</label>
                                <input type="password" value={passData.newPass} onChange={e => setPassData({ ...passData, newPass: e.target.value })} />
                            </div>
                            <div className="field-group">
                                <label>Nhập lại mật khẩu mới</label>
                                <input type="password" value={passData.confirmPass} onChange={e => setPassData({ ...passData, confirmPass: e.target.value })} />
                            </div>
                        </div>
                        <div className="modal__foot" style={{ justifyContent: 'flex-end' }}>
                            <button onClick={handleChangePassword} className="btn primary" style={{ padding: '10px 20px', fontSize: '14px' }}>Cập nhật</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Profile;