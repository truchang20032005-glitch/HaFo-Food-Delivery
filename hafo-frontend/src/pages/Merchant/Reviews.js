import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

function Reviews() {
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        let isMounted = true;

        const loadReviews = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));

                // Không có user -> không load
                const userId = user?._id || user?.id;
                if (!userId) return;

                // 1) Lấy shop của merchant
                const shopRes = await axios.get(
                    `http://localhost:5000/api/restaurants/my-shop/${userId}`
                );

                const shop = shopRes?.data;
                const restaurantId = shop?._id;
                if (!restaurantId) return;

                // 2) Lấy orders theo restaurantId
                const ordersRes = await axios.get(
                    `http://localhost:5000/api/orders?restaurantId=${restaurantId}`
                );

                const orders = Array.isArray(ordersRes?.data) ? ordersRes.data : [];

                // 3) Lọc các đơn có đánh giá (linh hoạt vì backend có thể chưa có isReviewed)
                const rated = orders.filter(
                    (o) =>
                        o?.isReviewed === true ||
                        typeof o?.rating === 'number' ||
                        (typeof o?.review === 'string' && o.review.trim() !== '')
                );

                if (isMounted) setReviews(rated);
            } catch (err) {
                console.error('Lỗi load reviews:', err);
                if (isMounted) setReviews([]); // fallback để UI không crash
            }
        };

        loadReviews();

        return () => {
            isMounted = false;
        };
    }, []);

    const avgRating = useMemo(() => {
        const nums = reviews
            .map((r) => (typeof r?.rating === 'number' ? r.rating : null))
            .filter((x) => x !== null);

        if (nums.length === 0) return null;

        const sum = nums.reduce((a, b) => a + b, 0);
        return (sum / nums.length).toFixed(1);
    }, [reviews]);

    const renderStars = (n) => {
        const rating = Math.max(0, Math.min(5, Number(n) || 0));
        return [...Array(5)].map((_, i) => (
            <i
                key={i}
                className={`fa-solid fa-star ${i < rating ? 'active' : ''}`}
                style={{ color: i < rating ? '#F5A524' : '#ddd' }}
            />
        ));
    };

    return (
        <div className="panel">
            <div className="head">Đánh giá từ khách hàng</div>

            <div className="body">
                <div
                    style={{
                        display: 'flex',
                        gap: '20px',
                        alignItems: 'center',
                        marginBottom: '20px',
                    }}
                >
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#F97350' }}>
                        {avgRating ?? '—'}{' '}
                        <span style={{ fontSize: '16px', color: '#F5A524' }}>★</span>
                    </div>
                    <div className="legend">Dựa trên {reviews.length} đánh giá</div>
                </div>

                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Khách hàng</th>
                            <th>Đánh giá</th>
                            <th>Nhận xét</th>
                            <th>Món</th>
                            <th>Ngày</th>
                        </tr>
                    </thead>

                    <tbody>
                        {reviews.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                                    Chưa có đánh giá nào.
                                </td>
                            </tr>
                        ) : (
                            reviews.map((r) => {
                                const id = r?.id || r?._id || Math.random().toString(16);

                                // customer có thể null/undefined, tránh crash split
                                const customerName =
                                    (r?.customer || '').split('|')[0]?.trim() || 'Không rõ';

                                const rating = typeof r?.rating === 'number' ? r.rating : 5;
                                const reviewText =
                                    (typeof r?.review === 'string' && r.review.trim() !== ''
                                        ? r.review
                                        : 'Không có lời bình');

                                const itemsText = r?.items || '';

                                const dateText = r?.createdAt
                                    ? new Date(r.createdAt).toLocaleDateString('vi-VN')
                                    : '';

                                return (
                                    <tr key={id} style={{ borderBottom: '1px dashed #eee' }}>
                                        <td style={{ padding: '12px 0' }}>{customerName}</td>
                                        <td>{renderStars(rating)}</td>
                                        <td>{reviewText}</td>
                                        <td style={{ fontSize: '13px', color: '#666' }}>
                                            {itemsText}
                                        </td>
                                        <td style={{ fontSize: '13px' }}>{dateText}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Reviews;
