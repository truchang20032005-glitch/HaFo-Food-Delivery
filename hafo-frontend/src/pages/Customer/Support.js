import React, { useState } from 'react'; // 1. Thêm useState
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar'; 

function Support() {
    const navigate = useNavigate();

    // 2. Trạng thái quản lý việc mở mục nào (null là đóng hết)
    const [activeIndex, setActiveIndex] = useState(null);

    // 3. Dữ liệu câu hỏi lồng nội dung chi tiết
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

    return (
        <div className="support-page" style={{ backgroundColor: '#fdfaf5', minHeight: '100vh', paddingBottom: '50px' }}>
            <Navbar />

            {/* --- HERO SECTION --- */}
            <div className="support-hero" style={heroWrapperStyle}>
                <img 
                    src="/images/supporter.jpg" 
                    alt="Support Banner" 
                    style={bannerImgStyle}
                />
                
                <div style={gradientOverlayStyle}></div>

                <div style={heroContentBoxStyle}>
                    <h1 style={heroTitleStyle}>
                        Trung tâm hỗ trợ <span style={{color: '#ff7a00'}}>HaFo</span>
                    </h1>
                    
                    <div style={heroDividerStyle}></div>

                    <p style={heroTextStyle}>
                        Chúng tôi luôn sẵn sàng lắng nghe và giải đáp mọi thắc mắc của bạn. Đội ngũ hỗ trợ tận tâm của HaFo cam kết mang đến thông tin nhanh chóng, chính xác, giúp bạn trải nghiệm dịch vụ một cách tiện lợi và an tâm nhất.
                    </p>
                </div>
            </div>

            {/* --- CONTENT GRID --- */}
            <div className="support-grid" style={gridContainerStyle}>
                
                {/* Cụm 1: Câu hỏi thường gặp - CÓ ACCORDION */}
                <div className="support-card" style={modernCardStyle}>
                    <div style={headerStyle}>
                        <span style={iconHeaderStyle}>❓</span>
                        <h3 style={{ margin: 0, color: '#333', fontSize: '22px' }}>Câu hỏi thường gặp</h3>
                    </div>
                    
                    {faqData.map((item, index) => (
                        <div key={index} style={{ borderBottom: '1px solid #f9f9f9' }}>
                            {/* Phần tiêu đề bấm vào được */}
                            <div 
                                className="support-item" 
                                style={modernItemStyle}
                                onClick={() => toggleAccordion(index)}
                            >
                                <div style={iconBoxStyle}>{item.icon}</div>
                                <div style={{ flex: 1 }}>
                                    <strong style={{ fontSize: '16px', color: '#333' }}>{item.title}</strong>
                                    <p style={subTextStyle}>{item.desc}</p>
                                </div>
                                <span style={{ 
                                    ...arrowStyle, 
                                    transform: activeIndex === index ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease',
                                    display: 'inline-block'
                                }}>
                                    ›
                                </span>
                            </div>

                            {/* Phần nội dung chi tiết ẩn/hiện */}
                            {activeIndex === index && (
                                <div style={faqContentDetailStyle}>
                                    <div style={faqInnerContentStyle}>
                                        {item.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Cụm 2: Liên hệ trực tiếp */}
                <div className="support-card" style={{ ...modernCardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ marginBottom: '30px' }}>
                        <h3 style={{ fontSize: '24px', marginBottom: '10px', color: '#333' }}>Bạn cần kết nối trực tiếp?</h3>
                        <p style={{ color: '#777', fontSize: '15px' }}>Đội ngũ HaFo luôn túc trực 24/7 để lắng nghe bạn</p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '40px' }}>
                        <div style={contactBoxStyle}>
                            <div style={iconCircleStyle}>📞</div>
                            <small style={{ fontWeight: '700', color: '#444', display: 'block' }}>Hotline</small>
                            <span style={{ fontSize: '14px', color: '#ff7a00' }}>1900 1234</span>
                        </div>
                        <div style={contactBoxStyle}>
                            <div style={iconCircleStyle}>✉️</div>
                            <small style={{ fontWeight: '700', color: '#444', display: 'block' }}>Email</small>
                            <span style={{ fontSize: '14px', color: '#ff7a00' }}>support@hafo.vn</span>
                        </div>
                    </div>
                    <p style={{ color: '#bbb', fontSize: '13px', marginTop: '10px' }}>Thời gian phản hồi trung bình: 5 phút</p>
                    <p style={{ color: '#888', fontSize: '14px', marginTop: '10px' }}>Chúng tôi cam kết bảo mật thông tin khách hàng</p>
                </div>
            </div>
            {/* --- THANK YOU SECTION --- */}
            <div className="support-footer" style={{ 
                textAlign: 'center', 
                padding: '80px 20px', 
                marginTop: '40px',
                borderTop: '1px solid #eee',
                background: 'linear-gradient(to bottom, #a9ddc1ff, #f8dccaeb)'
            }}>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>❤️</div>
                <h2 style={{ 
                    fontSize: '28px', 
                    color: '#333', 
                    fontWeight: '700',
                    marginBottom: '15px' 
                }}>
                    Cảm ơn bạn đã tin tưởng chọn <span style={{color: '#ff7a00'}}>HaFo</span>!
                </h2>
                <p style={{ 
                    maxWidth: '750px', 
                    margin: '0 auto', 
                    color: '#666', 
                    lineHeight: '1.6',
                    fontSize: '16px',
                    whiteSpace: 'pre-line' // Giúp nhận diện xuống dòng
                }}>
                    Sự hài lòng của bạn là động lực để đội ngũ chúng tôi không ngừng hoàn thiện dịch vụ mỗi ngày.{"\n"}
                    Chúc bạn luôn có những bữa ăn ngon miệng và trọn vẹn niềm vui cùng HaFo!
                </p>
                <p style={{ marginTop: '40px', fontSize: '12px', color: '#bbb' }}>
                    © 2025 HaFo Food Delivery. All rights reserved.
                </p>
            </div>
        </div>
    );
}

// --- HỆ THỐNG STYLES ---
const heroWrapperStyle = {
    position: 'relative',
    width: '100%',
    height: '600px', 
    display: 'flex', 
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    backgroundColor: '#000'
};

const bannerImgStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    objectFit: 'cover',
    objectPosition: 'right center', 
    opacity: '0.8'
};

const gradientOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)',
    zIndex: 2
};

const heroContentBoxStyle = {
    position: 'relative', 
    zIndex: 3, 
    marginLeft: '8%', 
    maxWidth: '550px',
    padding: '30px',
    color: '#fff'
};

const heroTitleStyle = {
    fontSize: '48px', 
    fontWeight: 'bold', 
    marginBottom: '20px', 
    lineHeight: '1.2',
    textShadow: '2px 2px 8px rgba(0,0,0,0.5)'
};

const heroDividerStyle = {
    width: '60px', 
    height: '5px', 
    background: '#ff7a00', 
    marginBottom: '25px', 
    borderRadius: '10px'
};

const heroTextStyle = {
    fontSize: '18px', 
    lineHeight: '1.7', 
    color: 'rgba(255,255,255,0.9)', 
    textAlign: 'left'
};

const gridContainerStyle = {
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
    gap: '30px', 
    maxWidth: '1200px', 
    margin: '60px auto',
    padding: '0 20px'
};

const modernCardStyle = {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '28px',
    boxShadow: '0 15px 50px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0',
};

const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '25px',
    borderBottom: '2px solid #fff5ed',
    paddingBottom: '20px'
};

const iconHeaderStyle = {
    fontSize: '24px',
    backgroundColor: '#fff5ed',
    width: '50px',
    height: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '15px'
};

const modernItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px 0',
    cursor: 'pointer',
};

const iconBoxStyle = {
    width: '48px',
    height: '48px',
    backgroundColor: '#f8f9fa',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px'
};

const subTextStyle = {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#888',
};

const arrowStyle = {
    color: '#ddd',
    fontSize: '28px',
    fontWeight: '300',
    marginLeft: '10px'
};

const faqContentDetailStyle = {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease-in-out',
};

const faqInnerContentStyle = {
    padding: '0px 20px 25px 68px',
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#666',
    textAlign: 'justify'
};

const contactBoxStyle = {
    textAlign: 'center',
    flex: 1
};

const iconCircleStyle = {
    width: '65px',
    height: '65px',
    borderRadius: '22px',
    backgroundColor: '#bdeac4ff',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    margin: '0 auto 15px',
    boxShadow: '0 10px 25px rgba(94, 255, 0, 0.2)'
};
const socialIconStyle = {
    fontSize: '14px',
    color: '#ff7a00',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 16px',
    backgroundColor: '#fff',
    borderRadius: '20px',
    border: '1px solid #ff7a00',
    transition: '0.3s'
};

export default Support;