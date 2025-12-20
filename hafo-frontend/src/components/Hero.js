import React from 'react';

function Hero() {
    const backgroundUrl = '/images/banner.jpg';
    return (
        <>
            <section className="mo-dau" style={{ backgroundImage: `url(${backgroundUrl})` }}>
                <div className="mo-dau__noi-dung">
                    <div className="mo-dau__van-ban">
                        <h1>HaFo – Giao món ngon tận tay bạn!</h1>
                        <p>Dễ dàng đặt món ăn yêu thích từ những quán ngon quanh bạn.</p>
                        <a className="nut-chinh" href="#menu-list">Đặt món ngay</a>
                    </div>
                    <aside className="the-doi-tac">
                        <b>Trở thành Đối tác nhà hàng</b>
                        <small>Đưa món ăn của bạn đến hàng ngàn khách hàng</small>
                    </aside>
                </div>
            </section>
            <section className="gioi-thieu" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <h2 style={{ color: '#F97350' }}>HaFo – Nhanh, tiện, ngon và thân thiện</h2>
                <p>HaFo mang đến trải nghiệm đặt món nhanh chóng, dễ dùng và đáng tin cậy.
                    Hãy để chúng tôi giao đến bạn hương vị nóng hổi từ những quán ăn yêu thích.</p>
            </section>
        </>
    );
}
export default Hero;