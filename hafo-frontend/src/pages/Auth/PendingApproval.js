import { useNavigate } from 'react-router-dom';

function PendingApproval() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/');
        window.location.reload();
    };

    return (
        <div style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', background: '#F7F2E5', padding: 20
        }}>
            <div style={{
                background: '#fff', padding: '40px', borderRadius: '16px',
                textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '500px'
            }}>
                <i className="fa-solid fa-hourglass-half" style={{ fontSize: '60px', color: '#FAD06C', marginBottom: '20px' }}></i>
                <h2 style={{ color: '#333', marginBottom: '10px' }}>Hồ sơ đang được xét duyệt</h2>
                <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '30px' }}>
                    Cảm ơn bạn đã đăng ký đối tác với HaFo.<br />
                    Đội ngũ Admin đang kiểm tra hồ sơ của bạn. Quá trình này thường mất từ <b>1-3 ngày làm việc</b>.
                    <br /><br />
                    Kết quả sẽ được gửi qua email. Vui lòng quay lại sau!
                </p>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '12px 30px', background: '#F97350', color: '#fff',
                        border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    Đăng xuất
                </button>
            </div>
        </div>
    );
}

export default PendingApproval;