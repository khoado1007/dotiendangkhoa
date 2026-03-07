require('dotenv').config();

async function checkAvailableModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.log("Không tìm thấy API Key trong file .env!");
        return;
    }

    console.log("Đang tải danh sách các model được hỗ trợ từ Google...");
    
    try {
        // Gọi API của Google để lấy danh sách
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.models) {
            console.log("\n=== DANH SÁCH CÁC MODEL BẠN CÓ THỂ DÙNG ===");
            
            // Lọc ra các model có hỗ trợ chức năng tạo văn bản (generateContent)
            const textModels = data.models.filter(m => 
                m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
            );
            
            textModels.forEach(m => {
                // In ra tên model (đã cắt bỏ chữ 'models/' ở đầu cho dễ nhìn)
                console.log(`👉 ${m.name.replace('models/', '')}`);
            });
            console.log("============================================\n");
        } else {
            console.log("Lỗi khi tải danh sách:", data);
        }
    } catch (error) {
        console.error("Lỗi:", error);
    }
}

checkAvailableModels();