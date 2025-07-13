# 掌上刷题系统 - 测试指南

本文档详细介绍了掌上刷题系统的测试框架、测试类型和执行方法。

## 目录

- [测试概述](#测试概述)
- [环境准备](#环境准备)
- [测试类型](#测试类型)
- [快速开始](#快速开始)
- [详细测试指南](#详细测试指南)
- [持续集成](#持续集成)
- [故障排除](#故障排除)

## 测试概述

我们的测试策略包括以下几个层次：

```
┌─────────────────────────────────────┐
│           用户验收测试 (UAT)          │
├─────────────────────────────────────┤
│              端到端测试 (E2E)         │
├─────────────────────────────────────┤
│              集成测试                │
├─────────────────────────────────────┤
│              单元测试                │
└─────────────────────────────────────┘
```

### 测试覆盖范围

- **后端API**: Node.js + Express + MySQL
- **管理后台**: Vue 3 + Element Plus
- **移动端应用**: uni-app
- **数据库**: MySQL 数据层
- **集成**: 前后端接口集成
- **性能**: 负载和压力测试

## 环境准备

### 1. 系统要求

- Node.js >= 16.0.0
- npm >= 8.0.0
- MySQL >= 8.0
- Chrome/Chromium (用于E2E测试)

### 2. 安装依赖

```bash
# 安装所有项目依赖
npm run install:all

# 或者分别安装
npm install                           # 根目录依赖
cd backend && npm install             # 后端依赖
cd ../admin-panel && npm install      # 管理后台依赖
cd ../zhangshang-shuati-app && npm install  # 移动端依赖
```

### 3. 数据库配置

```sql
-- 创建测试数据库
CREATE DATABASE zhangshang_shuati_test;

-- 创建测试用户（可选）
CREATE USER 'test_user'@'localhost' IDENTIFIED BY 'test_password';
GRANT ALL PRIVILEGES ON zhangshang_shuati_test.* TO 'test_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. 环境变量配置

创建测试环境配置文件：

```bash
# backend/.env.test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root123
DB_NAME=zhangshang_shuati_test
JWT_SECRET=test_jwt_secret
PORT=3000

# admin-panel/.env.test
VUE_APP_API_BASE_URL=http://localhost:3000/api

# zhangshang-shuati-app/.env.test
VUE_APP_API_BASE_URL=http://localhost:3000/api
```

## 测试类型

### 1. 单元测试 (Unit Tests)

**目的**: 测试单个函数、组件或模块的功能

**工具**: Jest, Vue Test Utils

**覆盖范围**:
- 后端API路由和控制器
- 前端Vue组件
- 工具函数和服务

### 2. 集成测试 (Integration Tests)

**目的**: 测试不同模块之间的交互

**工具**: Jest + Supertest + MySQL

**覆盖范围**:
- API接口集成
- 数据库操作
- 前后端数据流

### 3. 端到端测试 (E2E Tests)

**目的**: 模拟真实用户操作流程

**工具**: Cypress

**覆盖范围**:
- 完整用户工作流
- 跨浏览器兼容性
- UI交互测试

### 4. 性能测试 (Performance Tests)

**目的**: 验证系统性能指标

**工具**: 自定义性能测试框架

**覆盖范围**:
- API响应时间
- 并发处理能力
- 前端加载性能
- 数据库查询性能

### 5. 用户验收测试 (UAT)

**目的**: 验证业务需求满足度

**方式**: 手动测试 + 自动化验证

**覆盖范围**:
- 业务流程完整性
- 用户体验
- 功能正确性

## 快速开始

### 运行所有测试

```bash
# 运行完整测试套件
npm test

# 或者使用详细模式
npm run test:all
```

### 运行特定类型测试

```bash
# 只运行单元测试
npm run test:unit

# 只运行集成测试
npm run test:integration

# 只运行E2E测试
npm run test:e2e

# 只运行性能测试
npm run test:performance
```

### 运行特定项目测试

```bash
# 后端测试
npm run test:backend

# 管理后台测试
npm run test:admin

# 移动端测试
npm run test:mobile
```

## 详细测试指南

### 后端测试

#### 单元测试

```bash
cd backend

# 运行所有单元测试
npm test

# 运行特定测试文件
npm test -- auth.test.js

# 监听模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

#### 测试文件结构

```
backend/tests/
├── setup.js              # 测试环境配置
├── auth.test.js          # 用户认证测试
├── questions.test.js     # 题目管理测试
├── favorites.test.js     # 收藏功能测试
├── wrong-questions.test.js # 错题本测试
└── utils/
    ├── testHelpers.js    # 测试辅助函数
    └── mockData.js       # 模拟数据
```

#### 编写测试示例

```javascript
// tests/example.test.js
const request = require('supertest');
const app = require('../app');
const { createTestUser, cleanupTestData } = require('./utils/testHelpers');

describe('示例API测试', () => {
  let testUser;
  
  beforeEach(async () => {
    testUser = await createTestUser();
  });
  
  afterEach(async () => {
    await cleanupTestData();
  });
  
  test('应该返回用户信息', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${testUser.token}`)
      .expect(200);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.id).toBe(testUser.id);
  });
});
```

### 前端测试

#### 管理后台测试

```bash
cd admin-panel

# 运行单元测试
npm run test:unit

# 监听模式
npm run test:unit:watch

# 覆盖率报告
npm run test:unit:coverage

# E2E测试
npm run test:e2e

# E2E测试（无头模式）
npm run test:e2e:headless
```

#### Vue组件测试示例

```javascript
// tests/unit/Login.spec.js
import { mount } from '@vue/test-utils';
import Login from '@/components/Login.vue';
import { createStore } from 'vuex';

describe('Login.vue', () => {
  let wrapper;
  let store;
  
  beforeEach(() => {
    store = createStore({
      modules: {
        auth: {
          namespaced: true,
          actions: {
            login: jest.fn()
          }
        }
      }
    });
    
    wrapper = mount(Login, {
      global: {
        plugins: [store]
      }
    });
  });
  
  test('应该渲染登录表单', () => {
    expect(wrapper.find('form').exists()).toBe(true);
    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });
  
  test('应该验证必填字段', async () => {
    await wrapper.find('form').trigger('submit');
    expect(wrapper.find('.error-message').exists()).toBe(true);
  });
});
```

#### Cypress E2E测试示例

```javascript
// cypress/e2e/login.cy.js
describe('用户登录流程', () => {
  beforeEach(() => {
    cy.visit('/login');
  });
  
  it('应该成功登录管理员', () => {
    cy.get('[data-cy="username"]').type('admin');
    cy.get('[data-cy="password"]').type('admin123');
    cy.get('[data-cy="login-btn"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy="user-menu"]').should('contain', 'admin');
  });
  
  it('应该显示错误信息当凭据无效时', () => {
    cy.get('[data-cy="username"]').type('invalid');
    cy.get('[data-cy="password"]').type('invalid');
    cy.get('[data-cy="login-btn"]').click();
    
    cy.get('[data-cy="error-message"]')
      .should('be.visible')
      .and('contain', '用户名或密码错误');
  });
});
```

### 集成测试

集成测试验证前后端接口的完整交互：

```bash
# 运行集成测试
node integration-tests.js

# 或者通过npm脚本
npm run test:integration
```

集成测试会：
1. 启动后端服务
2. 初始化测试数据库
3. 执行API调用测试
4. 验证数据一致性
5. 清理测试数据

### 性能测试

```bash
# 运行性能测试
node performance-tests.js

# 或者通过npm脚本
npm run test:performance
```

性能测试包括：
- **负载测试**: 正常负载下的性能
- **压力测试**: 高负载下的性能
- **并发测试**: 多用户同时访问
- **持久性测试**: 长时间运行稳定性

#### 性能指标

- **响应时间**: < 1秒（优秀），< 2秒（良好）
- **吞吐量**: > 500 req/s（目标）
- **错误率**: < 1%
- **并发用户**: 支持100+并发

## 测试数据管理

### 测试数据策略

1. **隔离性**: 每个测试使用独立的数据
2. **可重复性**: 测试结果应该一致
3. **清理性**: 测试后自动清理数据

### 测试数据工厂

```javascript
// tests/utils/testDataFactory.js
class TestDataFactory {
  static createUser(overrides = {}) {
    return {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      role: 'user',
      ...overrides
    };
  }
  
  static createQuestion(overrides = {}) {
    return {
      title: '测试题目',
      content: '这是一个测试题目',
      type: 'single',
      options: JSON.stringify(['A', 'B', 'C', 'D']),
      correct_answer: 'A',
      difficulty: 'medium',
      subject: '数学',
      ...overrides
    };
  }
}

module.exports = TestDataFactory;
```

## 持续集成

### GitHub Actions配置

```yaml
# .github/workflows/test.yml
name: 测试流水线

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root123
          MYSQL_DATABASE: zhangshang_shuati_test
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
    - uses: actions/checkout@v3
    
    - name: 设置Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: 安装依赖
      run: npm run install:all
    
    - name: 运行单元测试
      run: npm run test:unit
    
    - name: 运行集成测试
      run: npm run test:integration
      env:
        DB_HOST: 127.0.0.1
        DB_USER: root
        DB_PASSWORD: root123
        DB_NAME: zhangshang_shuati_test
    
    - name: 运行E2E测试
      run: npm run test:e2e:headless
    
    - name: 上传覆盖率报告
      uses: codecov/codecov-action@v3
```

### 测试报告

测试完成后会生成以下报告：

- `test-report.json`: 综合测试报告
- `coverage/`: 代码覆盖率报告
- `performance-report.json`: 性能测试报告
- `cypress/reports/`: E2E测试报告

## 故障排除

### 常见问题

#### 1. 数据库连接失败

```bash
# 检查MySQL服务状态
net start mysql80  # Windows
sudo systemctl start mysql  # Linux

# 验证数据库连接
mysql -u root -p -e "SELECT 1;"

# 检查测试数据库是否存在
mysql -u root -p -e "SHOW DATABASES LIKE 'zhangshang_shuati_test';"
```

#### 2. 端口冲突

```bash
# 检查端口占用
netstat -ano | findstr :3000  # Windows
lsof -i :3000  # Linux/Mac

# 杀死占用进程
taskkill /PID <PID> /F  # Windows
kill -9 <PID>  # Linux/Mac
```

#### 3. 依赖安装失败

```bash
# 清理npm缓存
npm cache clean --force

# 删除node_modules重新安装
rm -rf node_modules package-lock.json
npm install

# 使用yarn替代npm
yarn install
```

#### 4. Cypress测试失败

```bash
# 安装Cypress依赖
npx cypress install

# 验证Cypress安装
npx cypress verify

# 以交互模式运行Cypress
npx cypress open
```

### 调试技巧

#### 1. 单元测试调试

```bash
# 运行特定测试文件
npm test -- --testNamePattern="用户登录"

# 详细输出
npm test -- --verbose

# 调试模式
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### 2. 集成测试调试

```javascript
// 在测试中添加调试信息
console.log('Request:', request.body);
console.log('Response:', response.body);

// 使用调试器
debugger;
```

#### 3. E2E测试调试

```javascript
// 在Cypress测试中添加调试
cy.debug();
cy.pause();

// 截图
cy.screenshot('debug-screenshot');

// 查看元素
cy.get('[data-cy="element"]').debug();
```

### 性能优化建议

1. **并行测试**: 使用Jest的并行执行功能
2. **测试隔离**: 避免测试间的相互依赖
3. **模拟外部服务**: 使用Mock减少外部依赖
4. **增量测试**: 只运行变更相关的测试

## 最佳实践

### 1. 测试命名

```javascript
// 好的测试命名
describe('用户认证模块', () => {
  describe('POST /api/auth/login', () => {
    test('应该在提供有效凭据时返回JWT令牌', () => {
      // 测试实现
    });
    
    test('应该在提供无效凭据时返回401错误', () => {
      // 测试实现
    });
  });
});
```

### 2. 测试结构

遵循AAA模式：
- **Arrange**: 准备测试数据
- **Act**: 执行被测试的操作
- **Assert**: 验证结果

```javascript
test('应该创建新用户', async () => {
  // Arrange
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };
  
  // Act
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
  
  // Assert
  expect(response.status).toBe(201);
  expect(response.body.success).toBe(true);
  expect(response.body.data.user.username).toBe(userData.username);
});
```

### 3. 测试覆盖率目标

- **语句覆盖率**: ≥ 80%
- **分支覆盖率**: ≥ 75%
- **函数覆盖率**: ≥ 85%
- **行覆盖率**: ≥ 80%

### 4. 测试维护

- 定期更新测试用例
- 移除过时的测试
- 重构重复的测试代码
- 保持测试文档更新

---

## 联系方式

如果在测试过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目的Issue列表
3. 联系开发团队

**文档版本**: 1.0  
**最后更新**: 2024年  
**维护者**: 测试团队