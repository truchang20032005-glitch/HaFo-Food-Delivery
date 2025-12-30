// backend/routes/momo.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');

router.post('/payment', async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        // Dùng bộ Key "quốc dân" từ GitHub bạn vừa gửi
        const partnerCode = "MOMO";
        const accessKey = "F8BBA842ECF85";
        const secretkey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";

        const requestId = partnerCode + new Date().getTime();
        const orderInfo = "Thanh toán đơn hàng HaFo #" + orderId.slice(-6);

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

        const redirectUrl = `${frontendUrl}/order-tracking/${orderId}`; // Link quay về web
        const ipnUrl = `${backendUrl}/api/momo/callback`;

        const requestType = "captureWallet";
        const extraData = "";

        // TẠO CHỮ KÝ (Copy y chang logic từ GitHub của bạn)
        const rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;

        const signature = crypto.createHmac('sha256', secretkey)
            .update(rawSignature)
            .digest('hex');

        const requestBody = {
            partnerCode, accessKey, requestId, amount: amount.toString(),
            orderId, orderInfo, redirectUrl, ipnUrl, extraData,
            requestType, signature, lang: 'vi'
        };

        // Gửi yêu cầu sang MoMo Sandbox
        const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody);

        // Trả về payUrl cho Frontend
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;