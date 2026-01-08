const { GoogleGenerativeAI } = require("@google/generative-ai");

// Sử dụng key Gemini má đã có trong file .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const checkContentAI = async (text) => {
    try {
        // Sử dụng model flash cho nhanh và tiết kiệm
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        Bạn là chuyên gia kiểm duyệt nội dung của ứng dụng đồ ăn HaFo.
        Nhiệm vụ: Kiểm tra xem đoạn văn bản sau có chứa từ ngữ tục tĩu, khiếm nhã, xúc phạm, thù ghét hoặc đe dọa không.
        
        Nội dung cần kiểm tra: "${text}"
        
        Quy tắc trả lời:
        - Nếu vi phạm (có từ bậy, xúc phạm...): Chỉ trả về duy nhất từ "TRUE".
        - Nếu sạch sẽ (không vi phạm): Chỉ trả về duy nhất từ "FALSE".
        - Không giải thích gì thêm.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const verdict = response.text().trim().toUpperCase();

        console.log(`🔍 Gemini quét nội dung: "${text}" | Kết quả: ${verdict}`);

        // Trả về true nếu Gemini bảo TRUE, ngược lại false
        return verdict.includes("TRUE");
    } catch (err) {
        console.error("Lỗi Gemini Moderator:", err);
        // Nếu lỗi API (hết hạn mức) thì cho qua (false) để web không bị sập
        return false;
    }
};

module.exports = { checkContentAI };