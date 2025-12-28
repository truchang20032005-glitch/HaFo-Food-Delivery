import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';

function Support() {
    //const navigate = useNavigate();
    const [activeIndex, setActiveIndex] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Theo dõi kích thước màn hình
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const faqData = [
        {
            icon: '📦',
            title: 'Vấn đề đơn hàng',
            desc: 'Hỗ trợ hủy đơn, đổi món hoặc sai sót món ăn',
            content: 'Để hỗ trợ về đơn hàng, bạn vui lòng cung cấp mã đơn hàng. HaFo hỗ trợ hủy đơn trong vòng 5 phút sau khi đặt nếu nhà hàng chưa bắt đầu chế biến. Đối với đơn hàng sai món hoặc thiếu món, bạn có thể gửi ảnh chụp hóa đơn và món ăn thực tế để chúng tôi hoàn tiền kịp thời.'
        },
        {
            icon: '💳',
            title: 'Thanh toán & Hoàn tiền',
            desc: 'Ví điện tử, lỗi giao dịch hoặc quy trình hoàn tiền',
            content: 'HaFo hỗ trợ thanh toán qua Thẻ, Ví điện tử và Tiền mặt. Nếu giao dịch bị trừ tiền nhưng đơn hàng không thành công, hệ thống sẽ tự động hoàn tiền trong vòng 24h đối với Ví điện tử và 3-7 ngày làm việc đối với thẻ ngân hàng.'
        },
        {
            icon: '🚚',
            title: 'Vận chuyển & Tài xế',
            desc: 'Thời gian giao hàng, phí ship và thông tin tài xế',
            content: 'Bạn có thể theo dõi vị trí tài xế trực tiếp trên bản đồ sau khi đơn hàng được xác nhận. Phí vận chuyển được tính dựa trên khoảng cách thực tế. Nếu tài xế có thái độ không tốt, bạn vui lòng đánh giá ngay trên ứng dụng để chúng tôi xử lý.'
        }
    ];

    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    // --- HỆ THỐNG STYLES RESPONSIVE ---
    const S = {
        heroWrapper: {
            position: 'relative', width: '100%', height: isMobile ? '350px' : '600px',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
            overflow: 'hidden', backgroundColor: '#000'
        },
        heroContentBox: {
            position: 'relative', zIndex: 3, marginLeft: isMobile ? '5%' : '8%',
            maxWidth: isMobile ? '90%' : '550px', padding: '20px', color: '#fff'
        },
        heroTitle: {
            fontSize: isMobile ? '32px' : '48px', fontWeight: 'bold', marginBottom: '15px',
            lineHeight: '1.2', textShadow: '2px 2px 8px rgba(0,0,0,0.5)'
        },
        gridContainer: {
            display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(450px, 1fr))',
            gap: isMobile ? '20px' : '30px', maxWidth: '1200px', margin: isMobile ? '30px auto' : '60px auto',
            padding: '0 15px'
        },
        modernCard: {
            backgroundColor: '#fff', padding: isMobile ? '25px' : '40px',
            borderRadius: '28px', boxShadow: '0 15px 50px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0'
        },
        faqInnerContent: {
            padding: isMobile ? '10px 10px 20px 10px' : '0px 20px 25px 68px',
            fontSize: '15px', lineHeight: '1.6', color: '#666', textAlign: 'justify'
        },
        contactWrapper: {
            display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '30px' : '0', justifyContent: 'space-around', marginBottom: '40px'
        }
    };

    return (
        <div className="support-page" style={{ backgroundColor: '#fdfaf5', minHeight: '100vh', paddingBottom: '50px' }}>
            <Navbar />

            <div className="support-hero" style={S.heroWrapper}>
                <img src="/images/supporter.jpg" alt="Support Banner" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, objectFit: 'cover', opacity: '0.8' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)', zIndex: 2 }}></div>
                <div style={S.heroContentBox}>
                    <h1 style={S.heroTitle}>Trung tâm hỗ trợ <span style={{ color: '#ff7a00' }}>HaFo</span></h1>
                    <div style={{ width: '60px', height: '5px', background: '#ff7a00', marginBottom: '25px', borderRadius: '10px' }}></div>
                    <p style={{ fontSize: isMobile ? '15px' : '18px', lineHeight: '1.7', color: 'rgba(255,255,255,0.9)' }}>
                        Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn nhanh chóng nhất.
                    </p>
                </div>
            </div>

            <div className="support-grid" style={S.gridContainer}>
                <div className="support-card" style={S.modernCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px', borderBottom: '2px solid #fff5ed', paddingBottom: '20px' }}>
                        <span style={{ fontSize: '24px', backgroundColor: '#fff5ed', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px' }}>❓</span>
                        <h3 style={{ margin: 0, color: '#333', fontSize: '20px' }}>Câu hỏi thường gặp</h3>
                    </div>
                    {faqData.map((item, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #f9f9f9' }}>
                            <div className="support-item" style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '15px 0', cursor: 'pointer' }} onClick={() => toggleAccordion(index)}>
                                <div style={{ minWidth: '40px', height: '40px', backgroundColor: '#f8f9fa', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{item.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <strong style={{ fontSize: '15px', color: '#333' }}>{item.title}</strong>
                                    {!isMobile && <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#888' }}>{item.desc}</p>}
                                </div>
                                <span style={{ color: '#ddd', fontSize: '24px', transform: activeIndex === index ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>›</span>
                            </div>
                            {activeIndex === index && (
                                <div style={{ overflow: 'hidden', transition: '0.3s' }}>
                                    <div style={S.faqInnerContent}>{item.content}</div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="support-card" style={{ ...S.modernCard, textAlign: 'center' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '22px', marginBottom: '10px', color: '#333' }}>Bạn cần kết nối trực tiếp?</h3>
                        <p style={{ color: '#777', fontSize: '14px' }}>Đội ngũ HaFo luôn túc trực 24/7 để lắng nghe bạn</p>
                    </div>
                    <div style={S.contactWrapper}>
                        <div>
                            <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: '#bdeac4ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 10px' }}>📞</div>
                            <small style={{ fontWeight: '700', color: '#444' }}>Hotline</small>
                            <span style={{ fontSize: '14px', color: '#ff7a00', display: 'block' }}>1900 1234</span>
                        </div>
                        <div>
                            <div style={{ width: '60px', height: '60px', borderRadius: '20px', backgroundColor: '#bdeac4ff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 10px' }}>✉️</div>
                            <small style={{ fontWeight: '700', color: '#444' }}>Email</small>
                            <span style={{ fontSize: '14px', color: '#ff7a00', display: 'block' }}>happyfoodcskh2025@gmail.com</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'linear-gradient(to bottom, #a9ddc1ff, #f8dccaeb)' }}>
                <div style={{ fontSize: '40px', marginBottom: '15px' }}>❤️</div>
                <h2 style={{ fontSize: isMobile ? '22px' : '28px', color: '#333', fontWeight: '700' }}>Cảm ơn bạn đã tin tưởng <span style={{ color: '#ff7a00' }}>HaFo</span>!</h2>
                <p style={{ maxWidth: '700px', margin: '15px auto', color: '#666', fontSize: '15px', lineHeight: '1.6' }}>Sự hài lòng của bạn là động lực để chúng tôi hoàn thiện mỗi ngày.</p>
                <p style={{ marginTop: '30px', fontSize: '12px', color: '#888' }}>© 2025 HaFo Food Delivery. All rights reserved.</p>
            </div>
        </div>
    );
}

export default Support;