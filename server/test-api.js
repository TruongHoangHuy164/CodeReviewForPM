// Test script để kiểm tra OpenRoute API
const axios = require('axios');

const OPENROUTE_API_KEY = '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';
const OPENROUTE_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function testAPI() {
  console.log('🧪 Testing OpenRoute API...');
  
  // Test các models có sẵn
  const models = [
    'google/gemma-2-2b-it:free',
    'google/gemma-2b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'mistralai/mistral-7b-instruct:free'
  ];
  
  console.log('API Key:', OPENROUTE_API_KEY.substring(0, 20) + '...\n');
  
  for (const model of models) {
    console.log(`\n📝 Testing model: ${model}`);
    try {
      const response = await axios.post(
        OPENROUTE_API_URL,
        {
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Hello! Please respond with a JSON object: {"test": "success"}'
            }
          ],
          temperature: 0.7,
          max_tokens: 100
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTE_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'Code Review App'
          },
          timeout: 30000
        }
      );

      console.log('✅ API Response Status:', response.status);
      if (response.data.choices && response.data.choices[0]) {
        console.log('✅ Message Content:', response.data.choices[0].message.content.substring(0, 100) + '...');
        console.log('✅ Model này hoạt động tốt!');
        break; // Dừng khi tìm thấy model hoạt động
      } else {
        console.log('❌ No choices in response');
      }
    } catch (error) {
      console.log('❌ Model này không khả dụng:');
      if (error.response?.data?.error) {
        console.log('   Error:', error.response.data.error.message || error.response.data.error);
      } else {
        console.log('   Error:', error.message);
      }
    }
  }
}

testAPI();
