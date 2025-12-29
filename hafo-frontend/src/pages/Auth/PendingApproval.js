import { useNavigate } from 'react-router-dom';

function PendingApproval() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
        window.location.reload();
    };

    // Style nội bộ cho các hiệu ứng đặc biệt
    const S = {
        container: {
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #F7F2E5 0%, #FFF1ED 100%)', // Nền kem pha chút hồng cam nhạt
            padding: '20px'
        },
        card: {
            background: '#fff',
            padding: '50px 40px',
            borderRadius: '24px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
            maxWidth: '550px',
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
        },
        iconWrap: {
            width: '100px',
            height: '100px',
            background: '#FFF7E5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 25px',
            fontSize: '40px',
            color: '#FAD06C'
        },
        stepContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            margin: '30px 0'
        },
        dot: (active, done) => ({
            height: '8px',
            width: done ? '40px' : '20px',
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

                <h2 style={{ color: '#3A2E2E', fontSize: '24px', fontWeight: '800', marginBottom: '15px' }}>
                    Hồ sơ đang được xét duyệt
                </h2>

                <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '15px', marginBottom: '10px' }}>
                    Cảm ơn bạn đã tin tưởng và đăng ký đối tác với <b>HaFo</b>.
                </p>

                {/* Thanh tiến trình mô phỏng */}
                <div style={S.stepContainer}>
                    <div style={S.dot(false, true)}></div>
                    <div style={S.dot(true, false)}></div>
                    <div style={S.dot(false, false)}></div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '15px', borderRadius: '12px', border: '1px solid #F1F5F9', marginBottom: '30px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                        <i className="fa-solid fa-circle-info" style={{ color: '#3B82F6', marginRight: '8px' }}></i>
                        Thời gian xét duyệt dự kiến: <b>1 - 3 ngày làm việc</b>
                    </p>
                </div>

                <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', marginBottom: '30px' }}>
                    Chúng tôi sẽ gửi thông báo kết quả qua email ngay sau khi hoàn tất kiểm tra hồ sơ.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <button
                        onClick={handleLogout}
                        className="btn primary"
                        style={{
                            width: '220px',       // Độ rộng cố định
                            margin: '0 auto',     // Căn giữa nút trong khối
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
                        style={{ background: 'transparent', border: 'none', color: '#F97350', fontSize: '14px', fontWeight: '700' }}
                    >
                        Làm mới trạng thái
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PendingApproval;