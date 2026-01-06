import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { alertError, alertSuccess } from '../../utils/hafoAlert';

function PendingApproval() {
    const navigate = useNavigate();
    const { user, logout, login } = useAuth(); // ✅ Lấy login để cập nhật lại user state

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [loading, setLoading] = useState(true);
    const [statusInfo, setStatusInfo] = useState(null); // Lưu { status: 'pending'|'rejected', rejectReason: '...' }

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);

        // ✅ GỌI API KIỂM TRA TRẠNG THÁI HỒ SƠ
        const checkStatus = async () => {
            try {
                const userId = user?._id || user?.id;
                if (!userId) return;

                // Giả sử có route này bên backend để lấy trạng thái hồ sơ mới nhất
                const res = await api.get(`/pending/my-status/${userId}`);
                setStatusInfo(res.data);
            } catch (err) {
                console.error("Lỗi kiểm tra hồ sơ:", err);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
        return () => window.removeEventListener('resize', handleResize);
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    // ✅ HÀM XỬ LÝ ĐĂNG KÝ LẠI
    const handleRetry = async () => {
        try {
            const userId = user?._id || user?.id;

            // ✅ BƯỚC 1: Lưu lại loại hồ sơ (merchant/shipper) vào biến cục bộ TRƯỚC khi reset
            const currentType = statusInfo?.type;

            // ✅ BƯỚC 2: Gọi API reset
            await api.post(`/pending/reset-application/${userId}`);

            // ✅ BƯỚC 3: Cập nhật User State
            const newUser = { ...user, role: 'customer', approvalStatus: 'none' };
            localStorage.setItem('user', JSON.stringify(newUser));
            login(newUser, localStorage.getItem('token'));

            // ✅ BƯỚC 4: Chuyển hướng ngay dựa trên biến targetType đã lưu
            if (currentType === 'merchant') {
                navigate('/merchant-register');
            } else if (currentType === 'shipper') {
                navigate('/shipper-register');
            } else {
                navigate('/become-partner');
            }

            alertSuccess("Sẵn sàng!", "Vui lòng cập nhật lại thông tin hồ sơ.");
        } catch (err) {
            alertError("Lỗi hệ thống", "Không thể thực hiện reset.");
        }
    };

    if (loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F2E5' }}>Đang kiểm tra hồ sơ...</div>;
    }

    const isRejected = statusInfo?.status === 'rejected';

    const S = {
        container: {
            height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #F7F2E5 0%, #FFF1ED 100%)', padding: isMobile ? '15px' : '20px'
        },
        card: {
            background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '32px',
            padding: isMobile ? '30px 20px' : '50px 40px', textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative'
        },
        iconBox: {
            fontSize: '60px', marginBottom: '20px'
        },
        reasonBox: {
            background: '#FFF1F0', border: '1px solid #FFA39E', padding: '15px',
            borderRadius: '16px', marginBottom: '20px', textAlign: 'left'
        }
    };

    return (
        <div style={S.container}>
            <div className="animate__animated animate__fadeIn" style={S.card}>

                {/* HIỂN THỊ ICON THEO TRẠNG THÁI */}
                <div style={S.iconBox}>{isRejected ? '❌' : '⏳'}</div>

                <h2 style={{ color: isRejected ? '#EF4444' : '#F97350', fontSize: '24px', fontWeight: '900', marginBottom: '10px' }}>
                    {isRejected ? 'Hồ sơ bị từ chối' : 'Đang chờ xét duyệt'}
                </h2>

                {/* HIỂN THỊ LÝ DO NẾU BỊ TỪ CHỐI */}
                {isRejected ? (
                    <>
                        <div style={S.reasonBox}>
                            <div style={{ color: '#CF1322', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }}>Lý do từ chối:</div>
                            <div style={{ color: '#475569', fontSize: '14px', fontStyle: 'italic' }}>
                                "{statusInfo?.rejectReason || 'Thông tin cung cấp chưa chính xác hoặc không rõ ràng.'}"
                            </div>
                        </div>
                        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>
                            Bạn hãy nhấn nút bên dưới để cập nhật lại thông tin và gửi lại hồ sơ cho Admin nhé!
                        </p>
                    </>
                ) : (
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '30px' }}>
                        Hồ sơ của bạn đang được hệ thống HaFo kiểm tra. <br />
                        Chúng tôi sẽ phản hồi kết quả sớm nhất qua ứng dụng.
                    </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isRejected && (
                        <button
                            onClick={handleRetry}
                            className="btn primary"
                            style={{ width: '100%', padding: '14px', borderRadius: '15px', fontWeight: '800', background: '#22C55E' }}
                        >
                            <i className="fa-solid fa-rotate-right" style={{ marginRight: '8px' }}></i>
                            Chỉnh sửa & Gửi lại đơn
                        </button>
                    )}

                    <button
                        onClick={handleLogout}
                        className="btn primary"
                        style={{
                            width: '100%', padding: '14px', borderRadius: '15px', fontWeight: '800',
                            background: isRejected ? '#F1F5F9' : '#F97350',
                            color: isRejected ? '#475569' : '#fff'
                        }}
                    >
                        <i className="fa-solid fa-right-from-bracket" style={{ marginRight: '8px' }}></i>
                        Đăng xuất tài khoản
                    </button>

                    {!isRejected && (
                        <button
                            onClick={() => window.location.reload()}
                            style={{ background: 'transparent', border: 'none', color: '#F97350', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }}
                        >
                            Làm mới trạng thái
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PendingApproval;