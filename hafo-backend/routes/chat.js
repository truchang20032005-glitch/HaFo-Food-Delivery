const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Food = require('../models/Food');
const Order = require('../models/Order');
const ChatHistory = require('../models/ChatHistory');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
    // 1. Nhận thêm userId, userName và address từ frontend gửi lên
    const { message, history, userId, userName, address } = req.body;

    try {
        let preferenceContext = "Khách hàng này là người mới hoặc chưa có lịch sử đặt hàng.";
        if (userId) {
            const completedOrders = await Order.find({ userId, status: 'done' }).limit(10);
            if (completedOrders.length > 0) {
                // Gom tất cả tên món ăn đã từng mua
                const purchasedItems = completedOrders.flatMap(o => o.items.map(i => i.name));
                // Đếm tần suất (ví dụ: "Trà sữa": 3, "Cơm tấm": 1)
                const counts = purchasedItems.reduce((acc, name) => {
                    acc[name] = (acc[name] || 0) + 1;
                    return acc;
                }, {});
                const topItems = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(i => i[0]);
                preferenceContext = `Khách hàng thường xuyên đặt: ${topItems.join(', ')}. Hãy ưu tiên gợi ý các món tương tự hoặc các combo liên quan.`;
            }
        }
        // 2. Lấy danh sách món ăn làm bối cảnh (Context)
        const foodsData = await Food.find().limit(20).select('name price description image');
        const menuContext = foodsData.map(f =>
            `- Tên: ${f.name}, Giá: ${f.price}đ, Ảnh: ${f.image}, Mô tả: ${f.description}`
        ).join('\n');

        // 3. Lấy thông tin đơn hàng gần nhất của User này để AI trả lời thông minh
        let orderContext = "Khách hàng hiện chưa có đơn hàng nào.";
        if (userId) {
            const lastOrder = await Order.findOne({ userId }).sort({ createdAt: -1 });
            if (lastOrder) {
                const orderIdStr = lastOrder._id.toString();
                orderContext = `Đơn hàng gần nhất: #${orderIdStr.slice(-6)}, Trạng thái: ${lastOrder.status}, Tổng tiền: ${lastOrder.total.toLocaleString()}đ.`;
            }
        }

        // 4. System Instruction nâng cao: Yêu cầu trả về JSON
        const systemInstruction = `
        Bạn là HaFo AI - Trợ lý vui vẻ của app đồ ăn HaFo Food 🍔.
        Khách hàng tên: ${userName || 'Bạn'}. Địa chỉ: ${address || 'Chưa cập nhật'}.
        ${orderContext}
        MENU HÔM NAY:
        ${menuContext}

        NHIỆM VỤ:
        - Luôn trả lời bằng định dạng JSON có cấu trúc sau: { "reply": "nội dung chữ", "foods": [] }
        - Trong "foods", object PHẢI chứa đủ: { "_id", "name", "price", "image", "description" }
        - Trường "image" PHẢI lấy chính xác từ MENU mình đã cung cấp ở trên, không được tự chế.
        - Nếu khách hỏi về đơn hàng, hãy dùng thông tin ${orderContext} để trả lời, còn khách không hỏi tới thì không sử dụng.
        - Nếu khách hỏi món không có, hãy gợi ý món tương tự.
        - Trả lời thân thiện, bắt trend.
        - Dựa vào sở thích "${preferenceContext}", hãy chào hỏi và gợi ý món một cách tinh tế.
        - Cố gắng trả lời nhanh nhất có thể.
        `;
        let validHistory = (history || []).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: typeof msg.text === 'string' ? msg.text : msg.reply }]
        }));

        while (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory.shift();
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest", // Hoặc bản flash mới nhất bạn có
            systemInstruction: systemInstruction,
            generationConfig: { responseMimeType: "application/json" } // Ép trả về JSON
        });

        const chat = model.startChat({
            history: validHistory,
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        // Parse kết quả JSON từ AI và gửi về Frontend
        const finalData = JSON.parse(responseText);

        if (userId) {
            await ChatHistory.findOneAndUpdate(
                { userId },
                {
                    $push: {
                        messages: [
                            { sender: 'user', text: message },
                            { sender: 'bot', text: finalData.reply, foods: finalData.foods }
                        ]
                    }
                },
                { upsert: true } // Nếu chưa có bảng thì tạo mới
            );
        }
        res.json(finalData);

    } catch (error) {
        console.error("LỖI AI:", error);
        res.status(500).json({ reply: "Hic, mình bận xíu, bạn hỏi lại nhé!", foods: [] });
    }
});

// LẤY LỊCH SỬ KHI MỞ APP
router.get('/history/:userId', async (req, res) => {
    try {
        const history = await ChatHistory.findOne({ userId: req.params.userId });
        res.json(history ? history.messages : []);
    } catch (err) { res.status(500).json(err); }
});

// RESET LỊCH SỬ (Gọi khi Login/Logout tùy ý má)
router.delete('/history/:userId', async (req, res) => {
    await ChatHistory.findOneAndDelete({ userId: req.params.userId });
    res.json({ message: "Đã reset lịch sử chat" });
});

module.exports = router;