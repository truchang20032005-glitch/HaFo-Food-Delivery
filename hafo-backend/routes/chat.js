const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Food = require('../models/Food');

// Tốt nhất nên để trong file .env: GEMINI_API_KEY=...
const genAI = new GoogleGenerativeAI("AIzaSyD6Zpu4uttRDjaVxrqQM0QgBnvz27C6YUU");

router.post('/', async (req, res) => {
    const { message, history } = req.body;

    try {
        // 1. Lấy dữ liệu món ăn để "dạy" cho AI
        const foods = await Food.find().limit(30).select('name price description');
        const foodContext = foods.map(f => `- ${f.name} (${f.price}đ): ${f.description}`).join('\n');

        // 2. Tạo Prompt (Kịch bản) cho AI
        const systemPrompt = `
        Bạn là HaFo Bot - trợ lý ảo chuyên tư vấn món ăn của ứng dụng HaFo Food.
        Phong cách: Thân thiện, vui vẻ, hay dùng emoji 😋🍔.
        Nhiệm vụ: Gợi ý món ăn dựa trên menu sau đây:
        ${foodContext}
        
        Quy tắc:
        - Chỉ gợi ý món có trong menu trên.
        - Nếu khách hỏi món không có, hãy khéo léo gợi ý món khác tương tự.
        - Trả lời ngắn gọn dưới 100 từ.
        `;

        // 3. Gọi Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const chat = model.startChat({
            history: history.map(h => ({
                role: h.sender === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }],
            })),
        });

        const result = await chat.sendMessage(systemPrompt + "\n\nKhách hàng: " + message);
        const response = result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("Lỗi Chat AI:", error);
        res.json({ reply: "Hic, server AI đang bận xíu. Bạn thử hỏi lại sau nhé! 🤖" });
    }
});

module.exports = router;