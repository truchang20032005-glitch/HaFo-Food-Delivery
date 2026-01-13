const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Food = require('../models/Food');
const Order = require('../models/Order');
const ChatHistory = require('../models/ChatHistory');
const Restaurant = require('../models/Restaurant');
const { checkContentAI } = require('../utils/aiModerator'); // ✅ Import AI
const { handleViolation } = require('./user'); // ✅ Import hàm xử phạt
const Notification = require('../models/Notification');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const stopWords = ['cho', 'hỏi', 'mình', 'muốn', 'tìm', 'mua', 'có', 'không', 'gì', 'bán', 'đâu', 'ở', 'tại', 'nhỉ', 'với', 'nhé', 'nha', 'gợi', 'ý', 'vài', 'món', '1'];

router.post('/', async (req, res) => {
    // 1. Nhận thêm userId, userName và address từ frontend gửi lên
    const { message, history, userId, userName, address } = req.body;

    try {
        // 🟢 BƯỚC 1: QUÉT NGÔN TỪ CỦA KHÁCH TRƯỚC KHI GỬI CHO GEMINI
        // const isBad = await checkContentAI(message);
        // if (isBad) {
        //     if (userId) {
        //         await handleViolation(userId, "Dùng từ ngữ không phù hợp với Chatbot AI");
        //     }
        //     return res.json({
        //         reply: "Hic, HaFo AI xin phép không trả lời những tin nhắn có từ ngữ như vậy ạ. Bạn hãy giữ lịch sự nhé!",
        //         foods: []
        //     });
        // }

        // 🟢 BƯỚC 2: NẾU SẠCH THÌ MỚI CHẠY LOGIC GEMINI PHÍA DƯỚI
        // 1. TÌM KIẾM THÔNG MINH
        const words = message.toLowerCase().split(' ');
        const cleanKeywords = words.filter(word => word.length > 1 && !stopWords.includes(word));

        // ✅ KHAI BÁO searchRegex Ở ĐÂY ĐỂ AI ĐỌC ĐƯỢC (Dòng này má bị thiếu nè!)
        const searchRegex = cleanKeywords.length > 0 ? cleanKeywords.join(' ') : message;

        let searchQuery = {};
        if (cleanKeywords.length > 0) {
            const combinedPhrase = cleanKeywords.join(' ');
            searchQuery = {
                $or: [
                    { name: { $regex: combinedPhrase, $options: 'i' } }, // Tìm "sữa chua" nguyên cụm
                    { name: { $all: cleanKeywords.map(k => new RegExp(k, 'i')) } } // Hoặc chứa cả "sữa" VÀ "chua"
                ]
            };
        } else {
            searchQuery = { name: { $regex: message, $options: 'i' } };
        }

        // 1. Chạy query lấy dữ liệu món ăn
        let foodsData = await Food.find(searchQuery)
            .populate('restaurant')
            .select('name price description image restaurant options')
            .limit(20);

        // 2. Tìm dự phòng nếu tìm chính xác (AND-SEARCH) không có kết quả
        if (foodsData.length === 0) {
            const orRegex = cleanKeywords.length > 0 ? cleanKeywords.join('|') : message;
            foodsData = await Food.find({ name: { $regex: orRegex, $options: 'i' } })
                .populate('restaurant')
                .limit(20);
        }

        // Đánh dấu để báo cho AI biết có tìm thấy món khớp không
        let isMatchFound = foodsData.length > 0;

        // 3. Nếu vẫn trắng tay, lấy đại vài món gợi ý của quán
        if (foodsData.length === 0) {
            isMatchFound = false;
            foodsData = await Food.find().limit(10).populate('restaurant');
        }

        // Tạo menu cho AI đọc
        const menuContext = foodsData.map(f =>
            `- _id: ${f._id}, Tên: ${f.name}, Giá: ${f.price}, Quán: ${f.restaurant?.name || 'HaFo'}`
        ).join('\n');

        // 2. LẤY SỞ THÍCH & ĐƠN HÀNG (GIỮ NGUYÊN LOGIC CỦA MÁ)
        let preferenceContext = "Khách hàng mới.";
        if (userId) {
            const completedOrders = await Order.find({ userId, status: 'done' }).limit(10);
            if (completedOrders.length > 0) {
                const purchasedItems = completedOrders.flatMap(o => o.items.map(i => i.name));
                const counts = purchasedItems.reduce((acc, name) => { acc[name] = (acc[name] || 0) + 1; return acc; }, {});
                const topItems = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(i => i[0]);
                preferenceContext = `Khách thường đặt: ${topItems.join(', ')}.`;
            }
        }

        let orderContext = "Chưa có đơn hàng.";
        if (userId) {
            const lastOrder = await Order.findOne({ userId }).sort({ createdAt: -1 });
            if (lastOrder) {
                orderContext = `Đơn hàng gần nhất: #${lastOrder._id.toString().slice(-6)}, Trạng thái: ${lastOrder.status}.`;
            }
        }

        // 3. System Instruction nâng cao: Yêu cầu trả về JSON
        const systemInstruction = `
        Bạn là HaFo AI - Trợ lý vui vẻ của app đồ ăn HaFo Food 🍔.
        Khách hàng tên: ${userName || 'Bạn'}. Địa chỉ: ${address || 'Chưa cập nhật'}.
        ${orderContext}
        MENU HÔM NAY:
        ${menuContext}

        NHIỆM VỤ:
        - Ưu tiên món khớp tên khách hỏi (vd: hỏi "sữa chua" chỉ hiện "sữa chua").
        - Nếu không thấy món (isMatchFound=${isMatchFound}), trả lời: "Dạ hiện tại bên em chưa có món này, bạn tham khảo thử mấy món này của HaFo nha:".
        - Chỉ gợi ý sở thích "${preferenceContext}" nếu liên quan trực tiếp đến món khách đang tìm.
        - Trả lời nhanh, ngắn gọn bằng JSON: { "reply": "...", "foods": [{"_id", "name", "price", "image", "description"}], "isBad": false }
        - Trường "price" là Number, "image" lấy chính xác từ menu.
        - Trả lời về đơn hàng nếu khách hỏi dựa trên: ${orderContext}.
        `;
        const recentHistory = (history || []).slice(-10);

        let validHistory = recentHistory.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text || msg.reply || "" }]
        }));

        while (validHistory.length > 0 && validHistory[0].role === 'model') {
            validHistory.shift();
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest", // Hoặc bản flash mới nhất bạn có
            systemInstruction: systemInstruction,
            generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 500,
                temperature: 0.7
            }
        });

        const chat = model.startChat({
            history: validHistory,
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        // Parse kết quả JSON từ AI và gửi về Frontend
        let finalData;
        try {
            const cleanText = responseText.replace(/```json|```/g, "").trim();
            finalData = JSON.parse(cleanText);
        } catch (firstError) {
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    finalData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("Không tìm thấy khối JSON");
                }
            } catch (secondError) {
                console.error("LỖI KHÔNG THỂ ĐỌC JSON TỪ AI. Nội dung gốc:", responseText);
                finalData = {
                    reply: responseText || "Hic, HaFo AI đang bảo trì não bộ một tí, bạn hỏi lại câu khác nha!",
                    foods: []
                };
            }
        }

        if (finalData.foods && finalData.foods.length > 0) {
            finalData.foods = finalData.foods.map(botFood => {
                // Tìm món thật trong DB khớp nhất
                const realFood = foodsData.find(f =>
                    f._id.toString() === (botFood._id || botFood.id)?.toString() ||
                    f.name.toLowerCase().includes(botFood.name?.toLowerCase()) ||
                    botFood.name?.toLowerCase().includes(f.name.toLowerCase())
                );

                // Lấy thông tin quán từ món tìm được hoặc món đầu tiên (để không bao giờ bị rỗng)
                const source = realFood || foodsData[0];
                const resObj = source.restaurant;
                const rId = resObj?._id || resObj;

                return {
                    ...botFood,
                    _id: source._id,
                    image: source.image,
                    restaurantId: rId, // ✅ Đảm bảo Checkout.js đọc được
                    restaurantName: resObj?.name || "Cửa hàng HaFo",
                    resLat: resObj?.location?.coordinates[1] || 10.762622,
                    resLng: resObj?.location?.coordinates[0] || 106.660172,
                    options: source.options // Lấy thêm options để không bị lỗi giá
                };
            });
        }

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

// RESET LỊCH SỬ
router.delete('/history/:userId', async (req, res) => {
    try {
        await ChatHistory.findOneAndDelete({ userId: req.params.userId });
        res.json({ message: "Đã reset lịch sử chat" });
    } catch (err) {
        console.error("Lỗi xóa lịch sử chat:", err);
        res.status(500).json({ error: "Không thể xóa lịch sử chat" });
    }
});

module.exports = router;