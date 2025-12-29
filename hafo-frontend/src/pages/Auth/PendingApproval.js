import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function PendingApproval() {
    const navigate = useNavigate();

    // --- BIẾN CHECK: Kiểm tra xem có đang ở màn hình điện thoại không ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        // Lắng nghe sự kiện thay đổi kích thước màn hình
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
        window.location.reload();
    };

    // Style nội bộ được điều chỉnh linh hoạt theo biến isMobile
    const S = {
        container: {
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F7F2E5 0%, #FFF1ED 100%)',
            padding: isMobile ? '10px' : '20px' // Giảm padding ngoài trên mobile
        },
        card: {
            background: '#fff',
            // Laptop giữ 50px 40px, Mobile thu gọn còn 30px 20px
            padding: isMobile ? '30px 20px' : '50px 40px',
            borderRadius: isMobile ? '16px' : '24px', // Bo góc ít hơn trên mobile
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            maxWidth: '550px',
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
        },
        iconWrap: {
            width: isMobile ? '80px' : '100px', // Icon nhỏ lại một chút
            height: isMobile ? '80px' : '100px',
            background: '#FFF7E5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 25px',
            fontSize: isMobile ? '32px' : '40px',
            color: '#FAD06C'
        },
        stepContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            margin: isMobile ? '20px 0' : '30px 0'
        },
        dot: (active, done) => ({
            height: '8px',
            width: done ? (isMobile ? '30px' : '40px') : '20px',
            borderRadius: '4px',
            background: done ? '#22C55E' : (active ? '#F97350' : '#E2E8F0'),
            transition: 'all 0.3s ease'
        })
    };

    return (
        <div style={S.container}>
            <div style={S.card} className="animate-pop-in">
                {/* Trang trí góc card */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '5px', background: '#F97350' }}></div>

                <div style={S.iconWrap}>
                    <i className="fa-solid fa-hourglass-half fa-spin-pulse"></i>
                </div>

                <h2 style={{
                    color: '#3A2E2E',
                    fontSize: isMobile ? '20px' : '24px', // Chữ tiêu đề nhỏ hơn trên mobile
                    fontWeight: '800',
                    marginBottom: '15px'
                }}>
                    Hồ sơ đang được xét duyệt
                </h2>

                <p style={{
                    color: '#64748b',
                    lineHeight: '1.7',
                    fontSize: isMobile ? '14px' : '15px',
                    marginBottom: '10px'
                }}>
                    Cảm ơn bạn đã tin tưởng và đăng ký đối tác với <b>HaFo</b>.
                </p>

                {/* Thanh tiến trình mô phỏng */}
                <div style={S.stepContainer}>
                    <div style={S.dot(false, true)}></div>
                    <div style={S.dot(true, false)}></div>
                    <div style={S.dot(false, false)}></div>
                </div>

                <div style={{
                    background: '#F8FAFC',
                    padding: '15px',
                    borderRadius: '12px',
                    border: '1px solid #F1F5F9',
                    marginBottom: '30px'
                }}>
                    <p style={{ margin: 0, fontSize: isMobile ? '13px' : '14px', color: '#475569' }}>
                        <i className="fa-solid fa-circle-info" style={{ color: '#3B82F6', marginRight: '8px' }}></i>
                        Thời gian xét duyệt dự kiến:<br /> <b>1 - 3 ngày làm việc</b>
                    </p>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', marginBottom: '30px' }}>
                    Chúng tôi sẽ gửi thông báo kết quả qua email ngay sau khi hoàn tất kiểm tra hồ sơ.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={handleLogout}
                        className="btn primary"
                        style={{
                            width: isMobile ? '100%' : '220px', // Full width trên mobile
                            margin: '0 auto',
                            padding: '12px',
                            fontSize: '15px',
                            boxShadow: '0 4px 12px rgba(249, 115, 80, 0.2)',
                        }}
                    >
                        <i className="fa-solid fa-right-from-bracket" style={{ marginRight: '8px' }}></i>
                        Đăng xuất tài khoản
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="btn soft"
                        style={{ background: 'transparent', border: 'none', color: '#F97350', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}
                    >
                        Làm mới trạng thái
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PendingApproval;