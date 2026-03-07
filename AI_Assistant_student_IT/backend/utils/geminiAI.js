// Nạp thư viện của Google
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config(); // Đảm bảo đọc được API Key từ .env

// Khởi tạo đối tượng genAI với API Key của bạn
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Hàm gọi Google Gemini AI
 * @param {string} prompt 
 * @returns {string} 
 */
async function generateAIResponse(prompt) {
    try {
      
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        
        return response.text();
    } catch (error) {
        console.error("Lỗi khi gọi Gemini API:", error);
        throw error; 
    }
}
module.exports = { generateAIResponse };