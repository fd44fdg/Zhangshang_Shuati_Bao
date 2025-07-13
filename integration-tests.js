const axios = require('axios');
const mysql = require('mysql2/promise');

// 测试配置
const config = {
  apiBaseUrl: 'http://localhost:3000/api',
  adminPanelUrl: 'http://localhost:8080',
  mobileAppUrl: 'http://localhost:8081',
  database: {
    host: 'localhost',
    user: 'root',
    password: 'root123',
    database: 'zhangshang_shuati_test'
  }
};

// 测试数据
const testData = {
  admin: {
    username: 'admin',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin'
  },
  user: {
    username: 'testuser',
    email: 'testuser@example.com',
    password: 'password123',
    role: 'user'
  },
  question: {
    title: '集成测试题目',
    content: '这是一个集成测试题目',
    type: 'single',
    options: JSON.stringify(['选项A', '选项B', '选项C', '选项D']),
    correct_answer: 'A',
    explanation: '这是解析',
    difficulty: 'medium',
    subject: '数学',
    tags: JSON.stringify(['集成测试'])
  }
};

// 全局变量
let adminToken = '';
let userToken = '';
let testQuestionId = null;
let dbConnection = null;

// 工具函数
const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000
});

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 数据库操作
const connectDatabase = async () => {
  try {
    dbConnection = await mysql.createConnection(config.database);
    log('数据库连接成功', 'success');
  } catch (error) {
    log(`数据库连接失败: ${error.message}`, 'error');
    throw error;
  }
};

const cleanDatabase = async () => {
  try {
    await dbConnection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await dbConnection.execute('TRUNCATE TABLE user_favorites');
    await dbConnection.execute('TRUNCATE TABLE wrong_questions');
    await dbConnection.execute('TRUNCATE TABLE questions');
    await dbConnection.execute('TRUNCATE TABLE users');
    await dbConnection.execute('SET FOREIGN_KEY_CHECKS = 1');
    log('数据库清理完成', 'success');
  } catch (error) {
    log(`数据库清理失败: ${error.message}`, 'error');
    throw error;
  }
};

// 测试函数
const testUserRegistration = async () => {
  log('测试用户注册功能...');
  
  try {
    // 注册管理员
    const adminResponse = await api.post('/auth/register', testData.admin);
    if (adminResponse.data.success) {
      log('管理员注册成功', 'success');
      adminToken = adminResponse.data.data.token;
    } else {
      throw new Error('管理员注册失败');
    }
    
    // 注册普通用户
    const userResponse = await api.post('/auth/register', testData.user);
    if (userResponse.data.success) {
      log('普通用户注册成功', 'success');
      userToken = userResponse.data.data.token;
    } else {
      throw new Error('普通用户注册失败');
    }
    
    return true;
  } catch (error) {
    log(`用户注册测试失败: ${error.message}`, 'error');
    return false;
  }
};

const testUserLogin = async () => {
  log('测试用户登录功能...');
  
  try {
    // 管理员登录
    const adminLoginResponse = await api.post('/auth/login', {
      username: testData.admin.username,
      password: testData.admin.password
    });
    
    if (adminLoginResponse.data.success) {
      log('管理员登录成功', 'success');
      adminToken = adminLoginResponse.data.data.token;
    } else {
      throw new Error('管理员登录失败');
    }
    
    // 普通用户登录
    const userLoginResponse = await api.post('/auth/login', {
      username: testData.user.username,
      password: testData.user.password
    });
    
    if (userLoginResponse.data.success) {
      log('普通用户登录成功', 'success');
      userToken = userLoginResponse.data.data.token;
    } else {
      throw new Error('普通用户登录失败');
    }
    
    return true;
  } catch (error) {
    log(`用户登录测试失败: ${error.message}`, 'error');
    return false;
  }
};

const testQuestionManagement = async () => {
  log('测试题目管理功能...');
  
  try {
    // 创建题目（需要管理员权限）
    const createResponse = await api.post('/questions', testData.question, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (createResponse.data.success) {
      log('题目创建成功', 'success');
      testQuestionId = createResponse.data.data.question.id;
    } else {
      throw new Error('题目创建失败');
    }
    
    // 获取题目列表
    const listResponse = await api.get('/questions');
    if (listResponse.data.success && listResponse.data.data.questions.length > 0) {
      log('题目列表获取成功', 'success');
    } else {
      throw new Error('题目列表获取失败');
    }
    
    // 获取题目详情
    const detailResponse = await api.get(`/questions/${testQuestionId}`);
    if (detailResponse.data.success) {
      log('题目详情获取成功', 'success');
    } else {
      throw new Error('题目详情获取失败');
    }
    
    // 更新题目
    const updateResponse = await api.put(`/questions/${testQuestionId}`, {
      title: '更新后的题目标题'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (updateResponse.data.success) {
      log('题目更新成功', 'success');
    } else {
      throw new Error('题目更新失败');
    }
    
    return true;
  } catch (error) {
    log(`题目管理测试失败: ${error.message}`, 'error');
    return false;
  }
};

const testFavoriteFeature = async () => {
  log('测试收藏功能...');
  
  try {
    // 添加收藏
    const addResponse = await api.post('/favorites', {
      question_id: testQuestionId
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (addResponse.data.success) {
      log('添加收藏成功', 'success');
    } else {
      throw new Error('添加收藏失败');
    }
    
    // 获取收藏列表
    const listResponse = await api.get('/favorites', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (listResponse.data.success && listResponse.data.data.favorites.length > 0) {
      log('收藏列表获取成功', 'success');
    } else {
      throw new Error('收藏列表获取失败');
    }
    
    // 取消收藏
    const removeResponse = await api.delete(`/favorites/${testQuestionId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (removeResponse.data.success) {
      log('取消收藏成功', 'success');
    } else {
      throw new Error('取消收藏失败');
    }
    
    return true;
  } catch (error) {
    log(`收藏功能测试失败: ${error.message}`, 'error');
    return false;
  }
};

const testWrongQuestionFeature = async () => {
  log('测试错题本功能...');
  
  try {
    // 添加错题
    const addResponse = await api.post('/wrong-questions', {
      question_id: testQuestionId,
      user_answer: 'B'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (addResponse.data.success) {
      log('添加错题成功', 'success');
    } else {
      throw new Error('添加错题失败');
    }
    
    // 获取错题列表
    const listResponse = await api.get('/wrong-questions', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (listResponse.data.success && listResponse.data.data.wrongQuestions.length > 0) {
      log('错题列表获取成功', 'success');
    } else {
      throw new Error('错题列表获取失败');
    }
    
    // 移除错题
    const removeResponse = await api.delete(`/wrong-questions/${testQuestionId}`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    
    if (removeResponse.data.success) {
      log('移除错题成功', 'success');
    } else {
      throw new Error('移除错题失败');
    }
    
    return true;
  } catch (error) {
    log(`错题本功能测试失败: ${error.message}`, 'error');
    return false;
  }
};

const testSearchAndFilter = async () => {
  log('测试搜索和筛选功能...');
  
  try {
    // 关键词搜索
    const searchResponse = await api.get('/questions?keyword=集成测试');
    if (searchResponse.data.success) {
      log('关键词搜索成功', 'success');
    } else {
      throw new Error('关键词搜索失败');
    }
    
    // 科目筛选
    const subjectResponse = await api.get('/questions?subject=数学');
    if (subjectResponse.data.success) {
      log('科目筛选成功', 'success');
    } else {
      throw new Error('科目筛选失败');
    }
    
    // 难度筛选
    const difficultyResponse = await api.get('/questions?difficulty=medium');
    if (difficultyResponse.data.success) {
      log('难度筛选成功', 'success');
    } else {
      throw new Error('难度筛选失败');
    }
    
    // 分页测试
    const pageResponse = await api.get('/questions?page=1&pageSize=5');
    if (pageResponse.data.success) {
      log('分页功能成功', 'success');
    } else {
      throw new Error('分页功能失败');
    }
    
    return true;
  } catch (error) {
    log(`搜索和筛选测试失败: ${error.message}`, 'error');
    return false;
  }
};

const testPermissions = async () => {
  log('测试权限控制...');
  
  try {
    // 普通用户尝试创建题目（应该失败）
    try {
      await api.post('/questions', testData.question, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      throw new Error('普通用户不应该能够创建题目');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        log('权限控制正常：普通用户无法创建题目', 'success');
      } else {
        throw error;
      }
    }
    
    // 未登录用户尝试访问受保护资源（应该失败）
    try {
      await api.get('/favorites');
      throw new Error('未登录用户不应该能够访问收藏列表');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        log('权限控制正常：未登录用户无法访问受保护资源', 'success');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    log(`权限控制测试失败: ${error.message}`, 'error');
    return false;
  }
};

const testDataConsistency = async () => {
  log('测试数据一致性...');
  
  try {
    // 检查数据库中的数据是否与API返回的数据一致
    const [rows] = await dbConnection.execute(
      'SELECT * FROM questions WHERE id = ?',
      [testQuestionId]
    );
    
    if (rows.length > 0) {
      const dbQuestion = rows[0];
      const apiResponse = await api.get(`/questions/${testQuestionId}`);
      const apiQuestion = apiResponse.data.data.question;
      
      if (dbQuestion.title === apiQuestion.title && 
          dbQuestion.content === apiQuestion.content) {
        log('数据一致性检查通过', 'success');
      } else {
        throw new Error('数据库和API返回的数据不一致');
      }
    } else {
      throw new Error('数据库中找不到测试题目');
    }
    
    return true;
  } catch (error) {
    log(`数据一致性测试失败: ${error.message}`, 'error');
    return false;
  }
};

// 主测试函数
const runIntegrationTests = async () => {
  log('开始运行集成测试...', 'info');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };
  
  try {
    // 连接数据库
    await connectDatabase();
    
    // 清理数据库
    await cleanDatabase();
    
    // 等待服务启动
    log('等待服务启动...');
    await sleep(2000);
    
    // 运行测试
    const tests = [
      { name: '用户注册', fn: testUserRegistration },
      { name: '用户登录', fn: testUserLogin },
      { name: '题目管理', fn: testQuestionManagement },
      { name: '收藏功能', fn: testFavoriteFeature },
      { name: '错题本功能', fn: testWrongQuestionFeature },
      { name: '搜索和筛选', fn: testSearchAndFilter },
      { name: '权限控制', fn: testPermissions },
      { name: '数据一致性', fn: testDataConsistency }
    ];
    
    for (const test of tests) {
      results.total++;
      log(`\n执行测试: ${test.name}`);
      
      try {
        const success = await test.fn();
        if (success) {
          results.passed++;
          log(`✓ ${test.name} 测试通过`, 'success');
        } else {
          results.failed++;
          log(`✗ ${test.name} 测试失败`, 'error');
        }
      } catch (error) {
        results.failed++;
        log(`✗ ${test.name} 测试异常: ${error.message}`, 'error');
      }
      
      // 测试间隔
      await sleep(1000);
    }
    
  } catch (error) {
    log(`集成测试运行失败: ${error.message}`, 'error');
  } finally {
    // 清理资源
    if (dbConnection) {
      await dbConnection.end();
    }
    
    // 输出测试结果
    log('\n=== 集成测试结果 ===', 'info');
    log(`总测试数: ${results.total}`);
    log(`通过: ${results.passed}`, 'success');
    log(`失败: ${results.failed}`, results.failed > 0 ? 'error' : 'info');
    log(`成功率: ${((results.passed / results.total) * 100).toFixed(2)}%`);
    
    // 退出进程
    process.exit(results.failed > 0 ? 1 : 0);
  }
};

// 运行测试
if (require.main === module) {
  runIntegrationTests();
}

module.exports = {
  runIntegrationTests,
  config,
  testData
};