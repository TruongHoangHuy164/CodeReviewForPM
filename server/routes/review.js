const express = require('express');
const router = express.Router();
const axios = require('axios');
const CodeReview = require('../models/CodeReview');

const OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY ;
const OPENROUTE_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model rate limit tracking - lưu thời gian bị rate limit của mỗi model
const modelRateLimitMap = new Map();

// Helper function để delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function để kiểm tra model có đang bị rate limit không
function isModelRateLimited(model) {
  const rateLimitInfo = modelRateLimitMap.get(model);
  if (!rateLimitInfo) return false;
  
  // Nếu đã qua 60 giây (1 phút), cho phép thử lại
  const timeSinceLimit = Date.now() - rateLimitInfo.timestamp;
  return timeSinceLimit < 60000; // 60 seconds
}

// Helper function để đánh dấu model bị rate limit
function markModelRateLimited(model) {
  modelRateLimitMap.set(model, {
    timestamp: Date.now(),
    count: (modelRateLimitMap.get(model)?.count || 0) + 1
  });
  console.log(`⏸️ Model ${model} bị rate limit, sẽ skip trong 60 giây`);
}

// Helper function để lấy danh sách models có thể dùng (không bị rate limit)
function getAvailableModels(allModels) {
  return allModels.filter(model => !isModelRateLimited(model));
}

// Helper function to create review prompt
function createReviewPrompt(code, language = 'javascript') {
  // Thêm số dòng vào code để dễ reference
  const codeLines = code.split('\n');
  const numberedCode = codeLines.map((line, index) => {
    const lineNumber = (index + 1).toString().padStart(4, ' ');
    return `${lineNumber} | ${line}`;
  }).join('\n');

  return `Bạn là một senior developer và tech lead chuyên nghiệp với nhiều năm kinh nghiệm. Hãy review đoạn code sau đây một cách chi tiết, toàn diện và chuyên nghiệp theo các tiêu chí sau:

**QUAN TRỌNG:** Code đã được đánh số dòng để bạn dễ reference. Khi phát hiện vấn đề, BẮT BUỘC phải ghi rõ số dòng cụ thể.

**Code cần review (đã đánh số dòng):**
\`\`\`${language}
${numberedCode}
\`\`\`

**LƯU Ý ĐẶC BIỆT:**
- Mỗi dòng code đã được đánh số ở đầu dòng (format: "   1 | code")
- Khi phát hiện vấn đề, PHẢI ghi chính xác số dòng từ phần đánh số này
- Ưu tiên các vấn đề nghiêm trọng (Critical/High) trước
- Nhấn mạnh các đoạn code có thể gây lỗi production hoặc security issues

**YÊU CẦU REVIEW THEO 6 NHÓM CHÍNH:**

## 1. 🛑 RỦI RO NGHIÊM TRỌNG (Critical / High Risk) - **ƯU TIÊN CAO NHẤT**

**⚠️ ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT - PHẢI PHÂN TÍCH KỸ LƯỠNG**

Phân tích các vấn đề có thể gây hậu quả nghiêm trọng:

- **🔒 Lỗi bảo mật**: Authorization, privilege escalation, data leak, SQL injection, XSS, CSRF
  → **NHẤN MẠNH**: Các dòng code có thể bị exploit, thiếu validation input, hardcoded credentials
- **💥 Lỗi logic nghiệp vụ**: Có thể gây sai dữ liệu, approve sai, xóa nhầm
  → **NHẤN MẠNH**: Các điều kiện if/else thiếu sót, validation không đầy đủ
- **⚡ Race condition**: Data inconsistency, concurrent access issues
  → **NHẤN MẠNH**: Các đoạn code không có lock/transaction khi update data
- **🗑️ Mất dữ liệu**: Có thể gây mất dữ liệu hoặc xóa nhầm
  → **NHẤN MẠNH**: Delete operations không có backup, không có soft delete
- **🎯 Exploit potential**: Code có thể bị exploit hoặc misuse
  → **NHẤN MẠNH**: API endpoints không có rate limit, không check permissions

**Với mỗi điểm phát hiện (BẮT BUỘC):**
- **Ghi rõ số dòng** từ code đã đánh số ở trên
- **Copy chính xác đoạn code** có vấn đề từ dòng đó
- Mô tả vấn đề cụ thể và chi tiết
- Giải thích vì sao nguy hiểm với ví dụ cụ thể
- Nêu tình huống thực tế có thể xảy ra trong production
- Đánh giá mức độ rủi ro (Critical/High) với lý do

## 2. ⚠️ RỦI RO TRONG PRODUCTION (Maintainability / Scalability) - **QUAN TRỌNG**

**📊 PHẦN NÀY ẢNH HƯỞNG TRỰC TIẾP ĐẾN PRODUCTION**

Phân tích các vấn đề ảnh hưởng đến production:

- **🚫 Anti-pattern**: Express/Mongoose anti-patterns, bad practices
  → **NHẤN MẠNH**: Các dòng code vi phạm best practices, có thể gây bug khó debug
- **⚡ Performance issues**: N+1 query, populate không kiểm soát, memory leak
  → **NHẤN MẠNH**: Các vòng lặp query DB, không có pagination, load toàn bộ data
- **🧩 Business logic**: Logic business trộn vào controller, hard-coded logic
  → **NHẤN MẠNH**: Controller quá dài, có magic numbers/strings, logic không tách biệt
- **✅ Validation**: Joi/validation chưa chặt, thiếu edge cases
  → **NHẤN MẠNH**: Các dòng code nhận input nhưng không validate đầy đủ
- **❌ Error handling**: Xử lý lỗi không nhất quán, thiếu error handling
  → **NHẤN MẠNH**: Try-catch thiếu sót, không có error logging, throw error không đúng
- **📈 Scalability**: Vấn đề khi data lớn, không scale được
  → **NHẤN MẠNH**: Không có pagination, query không có index, synchronous operations

**Với mỗi điểm (BẮT BUỘC):**
- **Ghi rõ số dòng** có vấn đề
- **Copy đoạn code** cụ thể
- Mô tả vấn đề và ảnh hưởng đến production
- Dự đoán tình huống production có thể gặp (ví dụ: khi có 10k users, khi data tăng 10x)

## 3. 🧩 VẤN ĐỀ KIẾN TRÚC & CLEAN CODE

**🏗️ PHẦN NÀY ẢNH HƯỞNG ĐẾN KHẢ NĂNG BẢO TRÌ VÀ MỞ RỘNG**

Phân tích chất lượng code và kiến trúc:

- **📦 Controller quá lớn**: Quá nhiều trách nhiệm, vi phạm Single Responsibility
  → **NHẤN MẠNH**: Các hàm controller quá dài (>100 dòng), làm nhiều việc khác nhau
- **🔄 Code duplication**: DRY violation, logic trùng lặp
  → **NHẤN MẠNH**: Các đoạn code giống nhau xuất hiện nhiều lần, có thể extract thành function
- **📚 Thiếu layers**: Thiếu service layer, policy layer, helper layer
  → **NHẤN MẠNH**: Logic nghiệp vụ nằm trong controller, không có separation of concerns
- **🔗 Coupling cao**: Controller – Model – Helper coupling quá chặt
  → **NHẤN MẠNH**: Controller gọi trực tiếp model methods, khó thay đổi
- **🧪 Testability**: Khó test, khó mock, khó unit test
  → **NHẤN MẠNH**: Code không có dependency injection, hard dependencies
- **🔧 Extensibility**: Khó mở rộng trong tương lai
  → **NHẤN MẠNH**: Code cứng nhắc, không có abstraction, khó thêm tính năng mới

**Với mỗi điểm (BẮT BUỘC):**
- **Ghi rõ số dòng** hoặc phạm vi dòng có vấn đề
- **Copy đoạn code** minh họa
- Đánh giá mức độ ảnh hưởng đến maintainability (Low/Medium/High)
- Đề xuất cách refactor cụ thể

## 4. 📉 RỦI RO VỀ QUY TRÌNH & TEAMWORK

**👥 PHẦN NÀY ẢNH HƯỞNG ĐẾN TEAM VÀ QUY TRÌNH LÀM VIỆC**

Phân tích ảnh hưởng đến team và quy trình:

- **🤝 Team collaboration**: Code dễ gây bug khi nhiều dev cùng làm
  → **NHẤN MẠNH**: Các đoạn code có thể conflict khi merge, không có clear ownership
- **📖 Onboarding**: Khó onboard người mới, code không rõ ràng
  → **NHẤN MẠNH**: Code phức tạp không có comment, naming không rõ ràng, thiếu documentation
- **🔍 Hidden logic**: Logic "ẩn" không được bảo vệ bằng code/documentation
  → **NHẤN MẠNH**: Business rules không rõ ràng, magic numbers, side effects không rõ
- **⚙️ Implicit behavior**: Phụ thuộc ngầm, behavior không rõ ràng
  → **NHẤN MẠNH**: Code phụ thuộc vào thứ tự execution, global state, side effects
- **📝 Code clarity**: Code khó đọc, khó hiểu, thiếu comments
  → **NHẤN MẠNH**: Tên biến/hàm không rõ nghĩa, code quá phức tạp, thiếu comments cho logic phức tạp

**Với mỗi điểm (BẮT BUỘC):**
- **Ghi rõ số dòng** có vấn đề
- **Copy đoạn code** minh họa
- Đánh giá ảnh hưởng đến team productivity (Low/Medium/High)
- Đề xuất cách cải thiện

## 5. ✅ ĐỀ XUẤT CẢI THIỆN (ACTIONABLE)

Với mỗi vấn đề phát hiện, đưa ra đề xuất cụ thể:

- **Cách sửa cụ thể**: Code mẫu hoặc pseudo-code
- **Phân loại ưu tiên**:
  - Quick win (sửa nhanh, ít rủi ro)
  - Refactor ngắn hạn (1-2 tuần)
  - Refactor dài hạn (1-2 tháng)
- **Lợi ích**: Lợi ích khi sửa

## 6. 📊 TỔNG KẾT CHO PROJECT MANAGER

Tổng hợp lại cho PM (ngôn ngữ không quá technical):

- **3-5 rủi ro lớn nhất**: Liệt kê và giải thích ngắn gọn
- **Mức độ ảnh hưởng**: Low / Medium / High cho từng rủi ro
- **Khuyến nghị deploy**:
  - Có nên deploy không?
  - Nên fix gì trước khi deploy?
  - Technical debt đang tồn tại
- **Timeline**: Ước tính thời gian fix các vấn đề quan trọng

**Format output:**
QUAN TRỌNG: Bạn PHẢI trả về ĐÚNG định dạng JSON sau đây, không thêm bất kỳ text nào khác trước hoặc sau JSON:

{
  "summary": "Tóm tắt ngắn gọn về code với icon và format đẹp (có thể dùng \\n để xuống hàng). Nhấn mạnh các vấn đề nghiêm trọng nhất.",
  "issues": [
    {
      "category": "Critical Risk|Production Risk|Architecture|Teamwork|Other",
      "severity": "Critical|High|Medium|Low",
      "priority": "Quick Win|Short Term|Long Term",
      "line": số dòng cụ thể từ phần đánh số ở trên (BẮT BUỘC phải có nếu có vấn đề, ví dụ: 15, 23, 45-47),
      "code": "Đoạn code CHÍNH XÁC từ dòng đó (copy nguyên văn từ code gốc, KHÔNG bao gồm số dòng)",
      "issue": "Mô tả vấn đề chi tiết và rõ ràng. Nhấn mạnh tại sao đây là vấn đề nghiêm trọng.",
      "whyDangerous": "Giải thích chi tiết vì sao nguy hiểm và tình huống thực tế có thể xảy ra trong production. Đưa ra ví dụ cụ thể.",
      "impact": "Hậu quả cụ thể nếu không sửa (ảnh hưởng đến production, team, business). Định lượng nếu có thể.",
      "fix": "Cách khắc phục cụ thể với code mẫu hoặc pseudo-code. Code mẫu phải rõ ràng và có thể áp dụng ngay.",
      "benefit": "Lợi ích cụ thể khi sửa (cải thiện performance bao nhiêu %, giảm bug như thế nào, v.v.)"
    }
  ],
  "recommendations": [
    {
      "title": "Tiêu đề đề xuất",
      "description": "Mô tả chi tiết",
      "priority": "Quick Win|Short Term|Long Term",
      "effort": "Ước tính thời gian (ví dụ: 2 giờ, 1 ngày, 1 tuần)"
    }
  ],
  "codeSummary": "Bản tóm tắt lại code làm gì (có thể dùng \\n để xuống hàng, thêm icon để dễ đọc)",
  "pmSummary": {
    "topRisks": [
      {
        "risk": "Mô tả rủi ro (ngôn ngữ không technical)",
        "impact": "Low|Medium|High",
        "description": "Giải thích ngắn gọn tại sao đây là rủi ro"
      }
    ],
    "deployRecommendation": "Có nên deploy không? Nên fix gì trước khi deploy?",
    "technicalDebt": "Mô tả technical debt đang tồn tại",
    "timeline": "Ước tính thời gian fix các vấn đề quan trọng"
  }
}

QUY TẮC QUAN TRỌNG:
- Chỉ trả về JSON, không có markdown code blocks
- Category phải là một trong: Critical Risk, Production Risk, Architecture, Teamwork, Other
- Severity phải là một trong: Critical, High, Medium, Low
- Priority phải là một trong: Quick Win, Short Term, Long Term
- **QUAN TRỌNG NHẤT**: 
  - Chỉ thêm issue vào mảng nếu thực sự có vấn đề CỤ THỂ với dòng code cụ thể
  - **line PHẢI là số dòng từ phần code đã đánh số ở trên** (ví dụ: nếu code có "  15 | const user = req.user", thì line = 15)
  - **code PHẢI là đoạn code chính xác từ dòng đó** (không bao gồm số dòng, ví dụ: "const user = req.user")
- **Nếu không có vấn đề nào**, trả về mảng issues rỗng []
- **Mỗi issue PHẢI có đầy đủ**: line, code, issue, whyDangerous, impact, fix, benefit
- **Ưu tiên các vấn đề Critical/High** - liệt kê chúng trước trong mảng issues
- Không tạo issue chung chung, chỉ tạo issue khi có vấn đề thực sự ở dòng code cụ thể
- **Nhấn mạnh các vấn đề nghiêm trọng** trong summary và codeSummary
- pmSummary.topRisks: Tối đa 5 rủi ro lớn nhất, viết bằng ngôn ngữ dễ hiểu cho PM (không quá technical)
- Đảm bảo JSON hợp lệ và có thể parse được
- Trong summary và codeSummary, có thể dùng \\n để xuống hàng và thêm emoji/icon để dễ đọc

**CÁCH THỨC REVIEW:**
1. Đọc từng dòng code đã được đánh số
2. Phân tích theo 6 nhóm yêu cầu trên
3. Khi phát hiện vấn đề, ghi chính xác số dòng từ phần đánh số
4. Copy chính xác đoạn code có vấn đề (không bao gồm số dòng)
5. Mô tả chi tiết và nhấn mạnh mức độ nghiêm trọng
6. Ưu tiên liệt kê các vấn đề Critical/High trước

Hãy phân tích chi tiết từng dòng code theo 6 nhóm yêu cầu trên và chỉ đánh dấu những dòng thực sự có vấn đề. Chỉ dùng Tiếng Việt`;
}

// POST /api/review
router.post('/', async (req, res) => {
  try {
    // Kiểm tra API key
    if (!OPENROUTE_API_KEY || OPENROUTE_API_KEY.trim().length === 0 || OPENROUTE_API_KEY.includes('your-api-key')) {
      return res.status(500).json({ 
        error: 'API key chưa được cấu hình', 
        details: 'Vui lòng thêm OPENROUTE_API_KEY vào file server/.env' 
      });
    }

    const { code, language, fileName } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ error: 'Code không được để trống' });
    }
    
    // Cảnh báo nếu code quá dài
    if (code.length > 20000) {
      console.log(`⚠️ Code rất dài (${code.length} chars), có thể bị cắt response`);
    }

    // Create prompt (tự động giới hạn độ dài code nếu quá dài)
    const prompt = createReviewPrompt(code, language || 'javascript');
    
    // Log thông tin về prompt
    console.log(`📝 Prompt length: ${prompt.length} characters, Code length: ${code.length} characters`);

    // Call OpenRoute API với fallback models và luân phiên khi rate limit
    const allModels = [
      'qwen/qwen3-4b:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
      'google/gemini-2.0-flash-exp:free'
    ];

    let response;
    let lastError;
    let usedModel = null;
    
    // Retry với exponential backoff
    const makeRequestWithRetry = async (model, retries = 2) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          if (attempt > 0) {
            // Exponential backoff: 3s, 6s
            const waitTime = attempt * 3000;
            console.log(`⏳ Waiting ${waitTime/1000}s before retry ${attempt + 1}/${retries}...`);
            await delay(waitTime);
          }
          
          console.log(`🔄 Trying model: ${model}${attempt > 0 ? ` (attempt ${attempt + 1}/${retries})` : ''}`);
          
          response = await axios.post(
            OPENROUTE_API_URL,
            {
              model: model,
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature: 0.7,
              max_tokens: 10000 // Tăng lên 8000 để tránh bị cắt ngắn
            },
            {
              headers: {
                'Authorization': `Bearer ${OPENROUTE_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:3001',
                'X-Title': 'Code Review App'
              },
              timeout: 60000 // 60 seconds timeout
            }
          );
          
          // Nếu thành công, return response
          usedModel = model;
          console.log(`✅ Success with model: ${model}`);
          return response;
          
        } catch (apiError) {
          const status = apiError.response?.status;
          const errorMsg = apiError.response?.data?.error?.message || apiError.message;
          const errorData = apiError.response?.data?.error;
          
          // Nếu là lỗi 401 (Unauthorized), không retry và không thử model khác
          if (status === 401) {
            console.error(`❌ Authentication failed (401) for ${model}`);
            console.error('Error details:', errorData || errorMsg);
            throw { 
              type: 'AUTH_ERROR', 
              model, 
              error: apiError,
              message: 'API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API key trong file .env'
            };
          }
          
          // Nếu là rate limit (429), đánh dấu model và throw để thử model khác
          if (status === 429) {
            markModelRateLimited(model);
            if (attempt < retries - 1) {
              console.log(`⚠️ Rate limit hit (429) for ${model}, will retry...`);
              continue;
            } else {
              // Đã hết retry, throw để thử model khác
              throw { type: 'RATE_LIMIT', model, error: apiError };
            }
          }
          
          // Nếu là lỗi model không hợp lệ, không retry
          if (status === 404 || 
              errorMsg.includes('not a valid model') ||
              errorMsg.includes('model ID')) {
            throw { type: 'INVALID_MODEL', model, error: apiError };
          }
          
          // Nếu là lỗi 402 (Payment Required), không retry
          if (status === 402) {
            throw { 
              type: 'PAYMENT_ERROR', 
              model, 
              error: apiError,
              message: 'Tài khoản API không đủ credit. Vui lòng nạp thêm credit.'
            };
          }
          
          // Nếu là lỗi khác và không phải lần thử cuối, retry
          if (attempt < retries - 1 && status >= 500) {
            console.log(`⚠️ Server error (${status}), will retry...`);
            continue;
          }
          
          // Lỗi khác hoặc đã hết retry
          throw { type: 'OTHER', model, error: apiError };
        }
      }
    };
    
    // Lấy danh sách models có thể dùng (không bị rate limit)
    let availableModels = getAvailableModels(allModels);
    
    // Nếu tất cả models đều bị rate limit, đợi một chút rồi thử lại
    if (availableModels.length === 0) {
      console.log('⏸️ Tất cả models đều bị rate limit, đợi 30 giây...');
      await delay(30000);
      availableModels = getAvailableModels(allModels);
      
      // Nếu vẫn không có model nào, reset và thử lại
      if (availableModels.length === 0) {
        console.log('🔄 Reset rate limit tracking và thử lại...');
        modelRateLimitMap.clear();
        availableModels = allModels;
      }
    }
    
    // Thử từng model có sẵn
    for (let i = 0; i < availableModels.length; i++) {
      const model = availableModels[i];
      
      try {
        response = await makeRequestWithRetry(model);
        break; // Thành công, break khỏi loop
      } catch (errorObj) {
        const apiError = errorObj.error || errorObj;
        lastError = apiError;
        const errorMsg = apiError.response?.data?.error?.message || apiError.message;
        const status = apiError.response?.status;
        
        console.log(`❌ Model ${model} failed: ${errorMsg || status}`);
        
        // Nếu là lỗi authentication (401), không thử model khác
        if (errorObj.type === 'AUTH_ERROR' || status === 401) {
          throw new Error(errorObj.message || 'API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API key trong file .env');
        }
        
        // Nếu là lỗi payment (402), không thử model khác
        if (errorObj.type === 'PAYMENT_ERROR' || status === 402) {
          throw new Error(errorObj.message || 'Tài khoản API không đủ credit. Vui lòng nạp thêm credit.');
        }
        
        // Nếu là rate limit, đánh dấu và thử model tiếp theo
        if (errorObj.type === 'RATE_LIMIT' || status === 429 || 
            errorMsg.includes('rate limit') || errorMsg.includes('Rate limit')) {
          markModelRateLimited(model);
          
          // Nếu còn model khác, thử model tiếp theo với delay
          if (i < availableModels.length - 1) {
            console.log(`🔄 Chuyển sang model tiếp theo sau 5 giây...`);
            await delay(5000);
            continue;
          } else {
            // Đã thử hết models, đợi và thử lại từ đầu
            console.log(`⏸️ Đã thử hết models, đợi 30 giây rồi thử lại...`);
            await delay(30000);
            
            // Reset và thử lại với tất cả models
            modelRateLimitMap.clear();
            availableModels = getAvailableModels(allModels);
            i = -1; // Reset loop
            continue;
          }
        }
        
        // Nếu lỗi không phải về model ID và không phải rate limit, throw
        if (errorObj.type !== 'INVALID_MODEL' && status !== 404 && 
            !errorMsg.includes('not a valid model') &&
            !errorMsg.includes('model ID')) {
          throw apiError;
        }
        
        // Tiếp tục thử model tiếp theo
        continue;
      }
    }

    // Nếu tất cả models đều fail
    if (!response) {
      console.error('=== All Models Failed ===');
      console.error('Last Error:', lastError?.response?.data || lastError?.message);
      
      const lastStatus = lastError?.response?.status;
      const lastErrorMsg = lastError?.response?.data?.error?.message || lastError?.message || '';
      
      // Xử lý các lỗi cụ thể
      if (lastStatus === 429 || lastErrorMsg.includes('rate limit') || lastErrorMsg.includes('Rate limit')) {
        throw new Error('API đang bị giới hạn số lượng request (Rate Limit). Vui lòng đợi vài phút rồi thử lại.');
      }
      
      if (lastStatus === 401) {
        throw new Error('API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại API key.');
      }
      
      if (lastStatus === 402) {
        throw new Error('Tài khoản API không đủ credit. Vui lòng nạp thêm credit.');
      }
      
      throw new Error(
        lastErrorMsg || 
        `Tất cả các model đều không khả dụng. Lỗi: ${lastStatus || 'Unknown'}. Vui lòng thử lại sau.`
      );
    }

    if (!response.data) {
      console.error('No data in API response:', response);
      throw new Error('Response từ API không có data');
    }

    // Log response structure để debug
    console.log('API Response structure:', {
      hasChoices: !!response.data.choices,
      choicesLength: response.data.choices?.length || 0,
      firstChoice: response.data.choices?.[0] ? {
        hasMessage: !!response.data.choices[0].message,
        hasContent: !!response.data.choices[0].message?.content,
        contentLength: response.data.choices[0].message?.content?.length || 0
      } : null
    });

    if (!response.data.choices || !Array.isArray(response.data.choices) || response.data.choices.length === 0) {
      console.error('Invalid API response - no choices:', JSON.stringify(response.data, null, 2));
      throw new Error('Response từ API không có choices. Có thể model không hỗ trợ hoặc có lỗi từ API.');
    }

    const firstChoice = response.data.choices[0];
    if (!firstChoice.message) {
      console.error('Invalid API response - no message:', JSON.stringify(firstChoice, null, 2));
      throw new Error('Response từ API không có message trong choice.');
    }

    let aiResponse = firstChoice.message.content || '';
    const finishReason = firstChoice.finish_reason;
    
    // Nếu response bị cắt do length, thử request tiếp phần còn lại
    if (finishReason === 'length' && aiResponse.trim().length > 0) {
      console.log('⚠️ Response bị cắt ngắn, thử request tiếp phần còn lại...');
      try {
        // Request tiếp với prompt yêu cầu tiếp tục
        const continueResponse = await axios.post(
          OPENROUTE_API_URL,
          {
            model: usedModel,
            messages: [
              {
                role: 'user',
                content: prompt
              },
              {
                role: 'assistant',
                content: aiResponse
              },
              {
                role: 'user',
                content: 'Tiếp tục phần còn lại của response JSON. Chỉ trả về phần còn lại, không lặp lại phần đã có.'
              }
            ],
            temperature: 0.7,
            max_tokens: 4000
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTE_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:3001',
              'X-Title': 'Code Review App'
            },
            timeout: 60000
          }
        );
        
        if (continueResponse.data?.choices?.[0]?.message?.content) {
          const continuedContent = continueResponse.data.choices[0].message.content;
          aiResponse += continuedContent;
          console.log('✅ Đã lấy được phần tiếp theo của response');
        }
      } catch (continueError) {
        console.warn('⚠️ Không thể lấy phần tiếp theo:', continueError.message);
        // Vẫn tiếp tục với phần response đã có
      }
    }
    
    if (!aiResponse || aiResponse.trim().length === 0) {
      console.error('Empty content in response:', {
        choice: firstChoice,
        message: firstChoice.message,
        finishReason: finishReason
      });
      
      // Kiểm tra finish_reason
      if (finishReason === 'length') {
        // Nếu đã thử request tiếp mà vẫn rỗng
        throw new Error('Response từ API bị cắt ngắn. Code của bạn có thể quá dài. Hãy thử review từng phần nhỏ hơn.');
      }
      
      if (finishReason === 'content_filter') {
        throw new Error('Response từ API bị lọc do nội dung không phù hợp.');
      }
      
      throw new Error('API không trả về nội dung. Có thể model gặp vấn đề hoặc prompt quá dài.');
    }
    
    // Log thông tin về response
    console.log(`📊 Response length: ${aiResponse.length} characters, finish_reason: ${finishReason}`);
    
    // Try to parse JSON from response
    let reviewData;
    try {
      // Extract JSON from markdown code blocks if present
      let jsonString = aiResponse;
      
      // Try to extract JSON from code blocks
      const jsonBlockMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonBlockMatch) {
        jsonString = jsonBlockMatch[1];
      } else {
        // Try to find JSON object in the response
        const jsonObjectMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0];
        }
      }
      
      reviewData = JSON.parse(jsonString);
      
      // Validate và normalize structure
      if (!reviewData.summary && !reviewData.codeSummary) {
        reviewData.summary = aiResponse.substring(0, 200);
      }
      
      // Normalize issues array
      if (!reviewData.issues || !Array.isArray(reviewData.issues)) {
        reviewData.issues = [];
      } else {
        // Đảm bảo mỗi issue có đầy đủ fields
        reviewData.issues = reviewData.issues.map(issue => ({
          category: issue.category || 'Other',
          severity: issue.severity || 'Medium',
          priority: issue.priority || 'Short Term',
          line: issue.line || null,
          code: issue.code || '',
          issue: issue.issue || '',
          whyDangerous: issue.whyDangerous || '',
          impact: issue.impact || '',
          fix: issue.fix || '',
          benefit: issue.benefit || ''
        }));
      }
      
      // Normalize recommendations array - QUAN TRỌNG
      if (!reviewData.recommendations) {
        reviewData.recommendations = [];
      } else if (!Array.isArray(reviewData.recommendations)) {
        // Nếu không phải array, convert thành array
        if (typeof reviewData.recommendations === 'string') {
          reviewData.recommendations = [{
            title: reviewData.recommendations,
            description: '',
            priority: 'Short Term',
            effort: ''
          }];
        } else {
          reviewData.recommendations = [];
        }
      } else {
        // Đảm bảo recommendations là array of objects
        reviewData.recommendations = reviewData.recommendations.map(rec => {
          // Nếu là string, convert thành object
          if (typeof rec === 'string') {
            return {
              title: rec,
              description: '',
              priority: 'Short Term',
              effort: ''
            };
          }
          // Nếu là object, đảm bảo có đầy đủ fields
          if (typeof rec === 'object' && rec !== null) {
            return {
              title: rec.title || 'Đề xuất cải thiện',
              description: rec.description || '',
              priority: rec.priority || 'Short Term',
              effort: rec.effort || ''
            };
          }
          // Fallback
          return {
            title: 'Đề xuất cải thiện',
            description: '',
            priority: 'Short Term',
            effort: ''
          };
        });
      }
      
      // Normalize codeSummary
      if (!reviewData.codeSummary) {
        reviewData.codeSummary = reviewData.summary || '';
      }
      
      // Normalize pmSummary
      if (!reviewData.pmSummary) {
        reviewData.pmSummary = {
          topRisks: [],
          deployRecommendation: '',
          technicalDebt: '',
          timeline: ''
        };
      } else {
        // Đảm bảo pmSummary có đầy đủ structure
        if (!reviewData.pmSummary.topRisks || !Array.isArray(reviewData.pmSummary.topRisks)) {
          reviewData.pmSummary.topRisks = [];
        } else {
          reviewData.pmSummary.topRisks = reviewData.pmSummary.topRisks.map(risk => ({
            risk: risk.risk || '',
            impact: risk.impact || 'Medium',
            description: risk.description || ''
          }));
        }
        reviewData.pmSummary.deployRecommendation = reviewData.pmSummary.deployRecommendation || '';
        reviewData.pmSummary.technicalDebt = reviewData.pmSummary.technicalDebt || '';
        reviewData.pmSummary.timeline = reviewData.pmSummary.timeline || '';
      }
      
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response (first 500 chars):', aiResponse.substring(0, 500));
      // If JSON parsing fails, create a structured response from text
      const lines = aiResponse.split('\n').filter(line => line.trim());
      reviewData = {
        summary: lines.slice(0, 3).join(' ') || aiResponse.substring(0, 200),
        issues: [],
        recommendations: [],
        codeSummary: aiResponse.substring(0, 500),
        pmSummary: {
          topRisks: [],
          deployRecommendation: 'Không thể parse response từ AI',
          technicalDebt: '',
          timeline: ''
        }
      };
    }

    // Save to database
    const codeReview = new CodeReview({
      code: code.substring(0, 10000), // Limit code length
      language: language || 'javascript',
      fileName: fileName || 'unknown',
      review: reviewData,
      rawResponse: aiResponse,
      createdAt: new Date()
    });

    await codeReview.save();

    res.json({
      success: true,
      review: reviewData,
      reviewId: codeReview._id
    });

  } catch (error) {
    console.error('Review error:', error);
    console.error('Error stack:', error.stack);
    
    // Return more detailed error information
    const errorMessage = error.message || 
                        error.response?.data?.error?.message || 
                        'Lỗi không xác định khi review code';
    
    // Xác định status code phù hợp
    let statusCode = 500;
    if (error.message.includes('rate limit') || 
        error.message.includes('Rate Limit') || 
        error.message.includes('Rate limit') ||
        error.response?.status === 429) {
      statusCode = 429;
    } else if (error.message.includes('API key') || 
               error.message.includes('không hợp lệ') ||
               error.response?.status === 401) {
      statusCode = 401;
    } else if (error.message.includes('credit') ||
               error.response?.status === 402) {
      statusCode = 402;
    } else if (error.response?.status) {
      statusCode = error.response.status;
    }
    
    res.status(statusCode).json({ 
      error: 'Lỗi khi review code', 
      details: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        fullError: error.toString(),
        status: error.response?.status
      })
    });
  }
});

module.exports = router;
