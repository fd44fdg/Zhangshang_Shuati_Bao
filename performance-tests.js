const axios = require('axios');
const { performance } = require('perf_hooks');

// 性能测试配置
const config = {
  baseUrl: 'http://localhost:3000/api',
  adminPanelUrl: 'http://localhost:8080',
  mobileAppUrl: 'http://localhost:8081',
  concurrency: {
    low: 10,
    medium: 50,
    high: 100
  },
  duration: {
    short: 30000,  // 30秒
    medium: 60000, // 1分钟
    long: 300000   // 5分钟
  },
  thresholds: {
    responseTime: {
      excellent: 100,
      good: 500,
      acceptable: 1000,
      poor: 2000
    },
    throughput: {
      minimum: 100, // 每秒最少请求数
      target: 500,  // 目标每秒请求数
      excellent: 1000 // 优秀每秒请求数
    },
    errorRate: {
      maximum: 0.01 // 最大错误率 1%
    }
  }
};

// 测试数据
const testData = {
  user: {
    username: 'perftest_user',
    email: 'perftest@example.com',
    password: 'password123'
  },
  question: {
    title: '性能测试题目',
    content: '这是一个性能测试题目',
    type: 'single',
    options: JSON.stringify(['选项A', '选项B', '选项C', '选项D']),
    correct_answer: 'A',
    explanation: '这是解析',
    difficulty: 'medium',
    subject: '数学'
  }
};

// 工具函数
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    perf: '\x1b[35m'
  };
  console.log(`${colors[type]}[${timestamp}] ${message}\x1b[0m`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 性能指标收集器
class PerformanceCollector {
  constructor() {
    this.metrics = {
      requests: [],
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  start() {
    this.metrics.startTime = performance.now();
  }

  end() {
    this.metrics.endTime = performance.now();
  }

  recordRequest(responseTime, success = true, error = null) {
    this.metrics.requests.push({
      responseTime,
      success,
      timestamp: performance.now(),
      error
    });

    if (!success) {
      this.metrics.errors.push({
        error,
        timestamp: performance.now()
      });
    }
  }

  getStatistics() {
    const requests = this.metrics.requests;
    const totalDuration = this.metrics.endTime - this.metrics.startTime;
    const successfulRequests = requests.filter(r => r.success);
    const responseTimes = successfulRequests.map(r => r.responseTime);

    return {
      totalRequests: requests.length,
      successfulRequests: successfulRequests.length,
      failedRequests: requests.length - successfulRequests.length,
      errorRate: (requests.length - successfulRequests.length) / requests.length,
      throughput: requests.length / (totalDuration / 1000), // 每秒请求数
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        p50: this.percentile(responseTimes, 0.5),
        p90: this.percentile(responseTimes, 0.9),
        p95: this.percentile(responseTimes, 0.95),
        p99: this.percentile(responseTimes, 0.99)
      },
      duration: totalDuration
    };
  }

  percentile(arr, p) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}

// HTTP客户端
const createHttpClient = () => {
  return axios.create({
    baseURL: config.baseUrl,
    timeout: 10000,
    validateStatus: () => true // 不抛出错误，让我们手动处理
  });
};

// 性能测试函数
const performanceTest = async (testFn, options = {}) => {
  const {
    concurrency = config.concurrency.low,
    duration = config.duration.short,
    name = 'Performance Test'
  } = options;

  log(`开始性能测试: ${name}`, 'perf');
  log(`并发数: ${concurrency}, 持续时间: ${duration}ms`, 'info');

  const collector = new PerformanceCollector();
  const workers = [];
  let shouldStop = false;

  // 停止信号
  setTimeout(() => {
    shouldStop = true;
  }, duration);

  collector.start();

  // 创建并发工作者
  for (let i = 0; i < concurrency; i++) {
    const worker = async () => {
      while (!shouldStop) {
        const startTime = performance.now();
        try {
          await testFn();
          const endTime = performance.now();
          collector.recordRequest(endTime - startTime, true);
        } catch (error) {
          const endTime = performance.now();
          collector.recordRequest(endTime - startTime, false, error.message);
        }
        
        // 小延迟避免过度压力
        await sleep(10);
      }
    };
    
    workers.push(worker());
  }

  // 等待所有工作者完成
  await Promise.all(workers);
  collector.end();

  const stats = collector.getStatistics();
  
  // 输出结果
  log(`\n=== ${name} 性能测试结果 ===`, 'perf');
  log(`总请求数: ${stats.totalRequests}`);
  log(`成功请求数: ${stats.successfulRequests}`);
  log(`失败请求数: ${stats.failedRequests}`);
  log(`错误率: ${(stats.errorRate * 100).toFixed(2)}%`);
  log(`吞吐量: ${stats.throughput.toFixed(2)} 请求/秒`);
  log(`响应时间统计 (ms):`);
  log(`  最小值: ${stats.responseTime.min.toFixed(2)}`);
  log(`  最大值: ${stats.responseTime.max.toFixed(2)}`);
  log(`  平均值: ${stats.responseTime.avg.toFixed(2)}`);
  log(`  P50: ${stats.responseTime.p50.toFixed(2)}`);
  log(`  P90: ${stats.responseTime.p90.toFixed(2)}`);
  log(`  P95: ${stats.responseTime.p95.toFixed(2)}`);
  log(`  P99: ${stats.responseTime.p99.toFixed(2)}`);

  // 性能评估
  const assessment = assessPerformance(stats);
  log(`\n性能评估: ${assessment.overall}`, assessment.color);
  
  return { stats, assessment };
};

// 性能评估函数
const assessPerformance = (stats) => {
  const { responseTime, throughput, errorRate } = stats;
  const thresholds = config.thresholds;
  
  let score = 0;
  let issues = [];
  
  // 响应时间评估
  if (responseTime.avg <= thresholds.responseTime.excellent) {
    score += 30;
  } else if (responseTime.avg <= thresholds.responseTime.good) {
    score += 25;
  } else if (responseTime.avg <= thresholds.responseTime.acceptable) {
    score += 15;
    issues.push('响应时间偏慢');
  } else {
    score += 5;
    issues.push('响应时间过慢');
  }
  
  // 吞吐量评估
  if (throughput >= thresholds.throughput.excellent) {
    score += 30;
  } else if (throughput >= thresholds.throughput.target) {
    score += 25;
  } else if (throughput >= thresholds.throughput.minimum) {
    score += 15;
    issues.push('吞吐量偏低');
  } else {
    score += 5;
    issues.push('吞吐量过低');
  }
  
  // 错误率评估
  if (errorRate <= thresholds.errorRate.maximum) {
    score += 40;
  } else {
    score += 10;
    issues.push('错误率过高');
  }
  
  let overall, color;
  if (score >= 90) {
    overall = '优秀';
    color = 'success';
  } else if (score >= 75) {
    overall = '良好';
    color = 'success';
  } else if (score >= 60) {
    overall = '一般';
    color = 'warning';
  } else {
    overall = '较差';
    color = 'error';
  }
  
  return { overall, color, score, issues };
};

// 具体测试场景
const testScenarios = {
  // 用户注册性能测试
  userRegistration: async () => {
    const client = createHttpClient();
    const userData = {
      ...testData.user,
      username: `perftest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: `perftest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`
    };
    
    const response = await client.post('/auth/register', userData);
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`Registration failed: ${response.status}`);
    }
  },

  // 用户登录性能测试
  userLogin: async () => {
    const client = createHttpClient();
    const response = await client.post('/auth/login', {
      username: testData.user.username,
      password: testData.user.password
    });
    
    if (response.status !== 200) {
      throw new Error(`Login failed: ${response.status}`);
    }
  },

  // 题目列表查询性能测试
  questionsList: async () => {
    const client = createHttpClient();
    const response = await client.get('/questions?page=1&pageSize=20');
    
    if (response.status !== 200) {
      throw new Error(`Questions list failed: ${response.status}`);
    }
  },

  // 题目详情查询性能测试
  questionDetail: async () => {
    const client = createHttpClient();
    const response = await client.get('/questions/1');
    
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Question detail failed: ${response.status}`);
    }
  },

  // 题目搜索性能测试
  questionSearch: async () => {
    const client = createHttpClient();
    const keywords = ['数学', '英语', '物理', '化学', '生物'];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    
    const response = await client.get(`/questions?keyword=${keyword}`);
    
    if (response.status !== 200) {
      throw new Error(`Question search failed: ${response.status}`);
    }
  },

  // 混合场景测试
  mixedScenario: async () => {
    const scenarios = [
      testScenarios.questionsList,
      testScenarios.questionDetail,
      testScenarios.questionSearch
    ];
    
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    await scenario();
  }
};

// 前端性能测试
const frontendPerformanceTest = async () => {
  log('开始前端性能测试...', 'perf');
  
  const puppeteer = require('puppeteer');
  
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // 测试管理后台首页加载
    log('测试管理后台首页加载性能...');
    const startTime = performance.now();
    await page.goto(config.adminPanelUrl, { waitUntil: 'networkidle0' });
    const loadTime = performance.now() - startTime;
    
    log(`管理后台首页加载时间: ${loadTime.toFixed(2)}ms`);
    
    // 测试移动端应用加载
    log('测试移动端应用加载性能...');
    const mobileStartTime = performance.now();
    await page.goto(config.mobileAppUrl, { waitUntil: 'networkidle0' });
    const mobileLoadTime = performance.now() - mobileStartTime;
    
    log(`移动端应用加载时间: ${mobileLoadTime.toFixed(2)}ms`);
    
    await browser.close();
    
    return {
      adminPanelLoadTime: loadTime,
      mobileAppLoadTime: mobileLoadTime
    };
  } catch (error) {
    log(`前端性能测试失败: ${error.message}`, 'error');
    return null;
  }
};

// 数据库性能测试
const databasePerformanceTest = async () => {
  log('开始数据库性能测试...', 'perf');
  
  const mysql = require('mysql2/promise');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root123',
      database: 'zhangshang_shuati_test'
    });
    
    const tests = [
      {
        name: '简单查询',
        query: 'SELECT COUNT(*) as count FROM questions'
      },
      {
        name: '复杂查询',
        query: `
          SELECT q.*, u.username 
          FROM questions q 
          LEFT JOIN users u ON q.created_by = u.id 
          WHERE q.difficulty = 'medium' 
          ORDER BY q.created_at DESC 
          LIMIT 20
        `
      },
      {
        name: '聚合查询',
        query: `
          SELECT subject, difficulty, COUNT(*) as count 
          FROM questions 
          GROUP BY subject, difficulty
        `
      }
    ];
    
    const results = {};
    
    for (const test of tests) {
      const startTime = performance.now();
      await connection.execute(test.query);
      const endTime = performance.now();
      
      results[test.name] = endTime - startTime;
      log(`${test.name}: ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    await connection.end();
    return results;
  } catch (error) {
    log(`数据库性能测试失败: ${error.message}`, 'error');
    return null;
  }
};

// 主测试函数
const runPerformanceTests = async () => {
  log('开始性能测试套件...', 'perf');
  
  const results = {};
  
  try {
    // 1. API性能测试
    log('\n=== API性能测试 ===', 'perf');
    
    // 低并发测试
    results.lowConcurrency = await performanceTest(
      testScenarios.mixedScenario,
      {
        concurrency: config.concurrency.low,
        duration: config.duration.short,
        name: '低并发混合场景测试'
      }
    );
    
    await sleep(5000); // 间隔
    
    // 中等并发测试
    results.mediumConcurrency = await performanceTest(
      testScenarios.mixedScenario,
      {
        concurrency: config.concurrency.medium,
        duration: config.duration.short,
        name: '中等并发混合场景测试'
      }
    );
    
    await sleep(5000); // 间隔
    
    // 高并发测试
    results.highConcurrency = await performanceTest(
      testScenarios.mixedScenario,
      {
        concurrency: config.concurrency.high,
        duration: config.duration.short,
        name: '高并发混合场景测试'
      }
    );
    
    // 2. 前端性能测试
    log('\n=== 前端性能测试 ===', 'perf');
    results.frontend = await frontendPerformanceTest();
    
    // 3. 数据库性能测试
    log('\n=== 数据库性能测试 ===', 'perf');
    results.database = await databasePerformanceTest();
    
    // 4. 生成性能报告
    generatePerformanceReport(results);
    
  } catch (error) {
    log(`性能测试执行失败: ${error.message}`, 'error');
    process.exit(1);
  }
};

// 生成性能报告
const generatePerformanceReport = (results) => {
  log('\n=== 性能测试总结报告 ===', 'perf');
  
  // API性能总结
  log('\nAPI性能对比:');
  ['lowConcurrency', 'mediumConcurrency', 'highConcurrency'].forEach(key => {
    if (results[key]) {
      const stats = results[key].stats;
      log(`${key}: 吞吐量 ${stats.throughput.toFixed(2)} req/s, 平均响应时间 ${stats.responseTime.avg.toFixed(2)}ms`);
    }
  });
  
  // 前端性能总结
  if (results.frontend) {
    log('\n前端性能:');
    log(`管理后台加载时间: ${results.frontend.adminPanelLoadTime.toFixed(2)}ms`);
    log(`移动端应用加载时间: ${results.frontend.mobileAppLoadTime.toFixed(2)}ms`);
  }
  
  // 数据库性能总结
  if (results.database) {
    log('\n数据库性能:');
    Object.entries(results.database).forEach(([test, time]) => {
      log(`${test}: ${time.toFixed(2)}ms`);
    });
  }
  
  // 保存报告
  const reportPath = './performance-report.json';
  require('fs').writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    results
  }, null, 2));
  
  log(`\n性能测试报告已保存到: ${reportPath}`, 'success');
};

// 运行测试
if (require.main === module) {
  runPerformanceTests();
}

module.exports = {
  runPerformanceTests,
  performanceTest,
  testScenarios,
  config
};