const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Food = require('../models/Food');
const Order = require('../models/Order');
const ChatHistory = require('../models/ChatHistory');
const Restaurant = require('../models/Restaurant');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/', async (req, res) => {
    // 1. Nhận thêm userId, userName và address từ frontend gửi lên
    const { message, history, userId, userName, address } = req.body;

    try {
        // 1. TÌM KIẾM THÔNG MINH
        const keywords = message.split(' ').filter(word => word.length > 1);
        const searchRegex = keywords.length > 0 ? keywords.join('|') : message;

        const searchQuery = {
            $or: [
                { name: { $regex: searchRegex, $options: 'i' } },
                { description: { $regex: searchRegex, $options: 'i' } }
            ]
        };

        let foodsData = await Food.find(searchQuery)
            .limit(15)
            .populate('restaurant') // ✅ Populate để lấy name, location
            .select('name price description image restaurant options');

        let isMatchFound = true;

        if (foodsData.length === 0) {
            isMatchFound = false; // ✅ Nếu không tìm thấy món khớp, đánh dấu là false
            foodsData = await Food.find().limit(8).populate('restaurant');
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
        - Nếu trong danh sách trên có món liên quan đến từ khóa "${searchRegex}", TUYỆT ĐỐI KHÔNG ĐƯỢC nói là "Không có". Hãy giới thiệu món đó ngay.
        - Nếu thực sự không thấy món khách hỏi (isMatchFound = ${isMatchFound}), hãy trả lời: "Dạ hiện tại bên em chưa có món này, nhưng má tham khảo thử mấy món cực phẩm này của HaFo nha:" và liệt kê các món trong danh sách trên.
        - Luôn trả lời bằng định dạng JSON có cấu trúc sau: { "reply": "nội dung chữ", "foods": [] }
        - TRONG "foods", TRƯỜNG "_id" LÀ BẮT BUỘC VÀ PHẢI LẤY ĐÚNG TỪ MENU TRÊN.
        - Trong "foods", object PHẢI chứa đủ: { "_id", "name", "price", "image", "description" }
        - Trường "price" PHẢI là KIỂU SỐ (Number) và KHÔNG được chứa ký tự "đ" hay dấu chấm phân cách.
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

// RESET LỊCH SỬ (Gọi khi Login/Logout tùy ý má)
router.delete('/history/:userId', async (req, res) => {
    await ChatHistory.findOneAndDelete({ userId: req.params.userId });
    res.json({ message: "Đã reset lịch sử chat" });
});

module.exports = router;