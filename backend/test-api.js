const axios = require('axios');

const API_BASE = 'http://localhost:3002/api/v1';

async function testApis() {
  console.log('🧪 开始测试前后端API连接...\n');
  
  try {
    // 测试1: 健康检查
    console.log('1. 测试健康检查...');
    const healthResponse = await axios.get('http://localhost:3002/health');
    console.log('✅ 健康检查成功:', healthResponse.data);
    
    // 测试2: 系统设置
    console.log('\n2. 测试系统设置...');
    const settingsResponse = await axios.get(`${API_BASE}/system/settings`);
    console.log('✅ 系统设置获取成功:', settingsResponse.data);
    
    // 测试3: 用户注册
    console.log('\n3. 测试用户注册...');
    const testUser = {
      username: 'testuser_' + Date.now(),
      email: `test_${Date.now()}@example.com`,
      password: 'test123456',
      nickname: '测试用户'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ 用户注册成功:', registerResponse.data);
    
    // 测试4: 用户登录
    console.log('\n4. 测试用户登录...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: testUser.username,
      password: testUser.password
    });
    console.log('✅ 用户登录成功:', loginResponse.data);
    
    console.log('\n🎉 所有API测试通过！前后端连接正常！');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
  }
}

testApis();