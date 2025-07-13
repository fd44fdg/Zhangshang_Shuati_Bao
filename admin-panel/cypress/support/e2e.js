// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// 全局配置
Cypress.on('uncaught:exception', (err, runnable) => {
  // 忽略某些不影响测试的错误
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// 自定义命令
Cypress.Commands.add('login', (username = 'admin', password = 'admin123') => {
  cy.visit('/login');
  cy.get('input[placeholder="请输入用户名"]').type(username);
  cy.get('input[placeholder="请输入密码"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

Cypress.Commands.add('logout', () => {
  cy.get('.user-dropdown').click();
  cy.get('.logout-btn').click();
  cy.url().should('include', '/login');
});

Cypress.Commands.add('createQuestion', (questionData) => {
  const defaultQuestion = {
    title: '测试题目',
    content: '这是一个测试题目',
    type: 'single',
    options: ['选项A', '选项B', '选项C', '选项D'],
    correct_answer: 'A',
    explanation: '这是解析',
    difficulty: 'medium',
    subject: '数学',
    tags: ['测试']
  };
  
  const question = { ...defaultQuestion, ...questionData };
  
  cy.visit('/questions');
  cy.get('.add-question-btn').click();
  
  cy.get('input[placeholder="请输入题目标题"]').type(question.title);
  cy.get('textarea[placeholder="请输入题目内容"]').type(question.content);
  
  // 选择题目类型
  cy.get('.question-type-select').click();
  cy.get(`[data-value="${question.type}"]`).click();
  
  // 填写选项
  question.options.forEach((option, index) => {
    cy.get(`input[placeholder="选项${String.fromCharCode(65 + index)}"]`).type(option);
  });
  
  // 设置正确答案
  cy.get('.correct-answer-select').click();
  cy.get(`[data-value="${question.correct_answer}"]`).click();
  
  // 填写解析
  cy.get('textarea[placeholder="请输入题目解析"]').type(question.explanation);
  
  // 设置难度
  cy.get('.difficulty-select').click();
  cy.get(`[data-value="${question.difficulty}"]`).click();
  
  // 设置科目
  cy.get('input[placeholder="请输入科目"]').type(question.subject);
  
  // 保存题目
  cy.get('.save-question-btn').click();
  cy.get('.el-message--success').should('be.visible');
});

Cypress.Commands.add('deleteQuestion', (questionTitle) => {
  cy.visit('/questions');
  cy.contains('.question-item', questionTitle).within(() => {
    cy.get('.delete-btn').click();
  });
  cy.get('.el-message-box__btns .el-button--primary').click();
  cy.get('.el-message--success').should('be.visible');
});

Cypress.Commands.add('searchQuestion', (keyword) => {
  cy.visit('/questions');
  cy.get('input[placeholder="搜索题目"]').type(keyword);
  cy.get('.search-btn').click();
  cy.wait(1000); // 等待搜索结果
});

// API 拦截器
Cypress.Commands.add('mockApiResponse', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as('apiCall');
});

// 等待加载完成
Cypress.Commands.add('waitForLoading', () => {
  cy.get('.loading', { timeout: 10000 }).should('not.exist');
});

// 检查表格数据
Cypress.Commands.add('checkTableData', (expectedData) => {
  cy.get('.el-table__body tr').should('have.length', expectedData.length);
  expectedData.forEach((item, index) => {
    cy.get('.el-table__body tr').eq(index).within(() => {
      Object.keys(item).forEach(key => {
        cy.contains(item[key]).should('be.visible');
      });
    });
  });
});

// 填写表单
Cypress.Commands.add('fillForm', (formData) => {
  Object.keys(formData).forEach(key => {
    const value = formData[key];
    if (typeof value === 'string') {
      cy.get(`[data-testid="${key}"], input[name="${key}"], textarea[name="${key}"]`)
        .first()
        .clear()
        .type(value);
    } else if (typeof value === 'boolean') {
      if (value) {
        cy.get(`[data-testid="${key}"], input[name="${key}"]`).first().check();
      } else {
        cy.get(`[data-testid="${key}"], input[name="${key}"]`).first().uncheck();
      }
    }
  });
});