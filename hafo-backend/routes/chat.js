const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Food = require('../models/Food');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
    const { message, history } = req.body;

    try {
        // 1. Lấy dữ liệu món ăn
        const foods = await Food.find().limit(50).select('name price description');
        const menuContext = foods.map(f => `- ${f.name} (${f.price.toLocaleString()}đ): ${f.description || ''}`).join('\n');

        // 2. Tạo System Instruction
        const systemInstruction = `
        Bạn là nhân viên tư vấn của HaFo Food.
        MENU:
        ${menuContext}
        YÊU CẦU:
        - Chỉ bán món trong menu.
        - Trả lời ngắn gọn, vui vẻ, dùng emoji 🍔🥤.
        - Nếu khách hỏi món không có, hãy gợi ý món tương tự.
        `;

        // 3. Xử lý lịch sử chat
        let validHistory = (history || []).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }]
        }));

        // Xóa tin nhắn đầu nếu là của Bot (để tránh lỗi role)
        if (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory.shift();
        }

        // 4. KHỞI TẠO MODEL (DÙNG TÊN CHÍNH XÁC TỪ DANH SÁCH CỦA BẠN)
        // Mình chọn gemini-2.0-flash vì nó nhanh và ổn định nhất trong list
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: systemInstruction
        });

        const chat = model.startChat({
            history: validHistory,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ reply: text });

    } catch (error) {
        console.error("❌ LỖI GEMINI:", error);
        res.status(500).json({ reply: "Xin lỗi, server đang bận xíu. Bạn hỏi lại nhé!" });
    }
});

module.exports = router;