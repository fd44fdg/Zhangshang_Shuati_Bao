// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })

// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })

// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// 登录相关命令
Cypress.Commands.add('adminLogin', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      username: 'admin',
      password: 'admin123'
    }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.data.token);
    window.localStorage.setItem('userInfo', JSON.stringify(response.body.data.user));
  });
});

Cypress.Commands.add('userLogin', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: {
      username: 'testuser',
      password: 'password123'
    }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.data.token);
    window.localStorage.setItem('userInfo', JSON.stringify(response.body.data.user));
  });
});

// 数据库操作命令
Cypress.Commands.add('seedDatabase', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/test/seed`,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    }
  });
});

Cypress.Commands.add('cleanDatabase', () => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('apiUrl')}/test/clean`,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('token')}`
    }
  });
});

// 文件上传命令
Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'text/plain') => {
  cy.get(selector).then(subject => {
    cy.fixture(fileName, 'base64').then(content => {
      const el = subject[0];
      const blob = Cypress.Blob.base64StringToBlob(content, fileType);
      const file = new File([blob], fileName, { type: fileType });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      el.files = dataTransfer.files;
      cy.wrap(subject).trigger('change', { force: true });
    });
  });
});

// 等待元素出现
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible');
});

// 等待元素消失
Cypress.Commands.add('waitForElementToDisappear', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('not.exist');
});

// 检查通知消息
Cypress.Commands.add('checkNotification', (type, message) => {
  cy.get(`.el-message--${type}`).should('be.visible').and('contain', message);
});

// 检查确认对话框
Cypress.Commands.add('confirmDialog', (confirm = true) => {
  if (confirm) {
    cy.get('.el-message-box__btns .el-button--primary').click();
  } else {
    cy.get('.el-message-box__btns .el-button--default').click();
  }
});

// 分页操作
Cypress.Commands.add('goToPage', (pageNumber) => {
  cy.get('.el-pagination .el-pager li').contains(pageNumber).click();
  cy.waitForLoading();
});

Cypress.Commands.add('changePageSize', (pageSize) => {
  cy.get('.el-pagination .el-select').click();
  cy.get(`.el-select-dropdown__item[data-value="${pageSize}"]`).click();
  cy.waitForLoading();
});

// 表格操作
Cypress.Commands.add('sortTable', (columnName, order = 'asc') => {
  cy.get('.el-table__header th').contains(columnName).click();
  if (order === 'desc') {
    cy.get('.el-table__header th').contains(columnName).click();
  }
  cy.waitForLoading();
});

Cypress.Commands.add('filterTable', (columnName, value) => {
  cy.get('.el-table__header th').contains(columnName).within(() => {
    cy.get('.el-table__column-filter-trigger').click();
  });
  cy.get('.el-table-filter__list .el-checkbox').contains(value).click();
  cy.get('.el-table-filter__bottom .el-button--primary').click();
  cy.waitForLoading();
});

// 表单验证
Cypress.Commands.add('checkFormValidation', (fieldName, errorMessage) => {
  cy.get(`[data-testid="${fieldName}"]`).parent().within(() => {
    cy.get('.el-form-item__error').should('contain', errorMessage);
  });
});

// 清除表单验证
Cypress.Commands.add('clearFormValidation', () => {
  cy.get('.el-form-item__error').should('not.exist');
});

// 模拟网络延迟
Cypress.Commands.add('simulateNetworkDelay', (delay = 1000) => {
  cy.intercept('**', (req) => {
    req.reply((res) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve(res), delay);
      });
    });
  });
});

// 检查响应式布局
Cypress.Commands.add('checkResponsive', (breakpoint) => {
  const viewports = {
    mobile: [375, 667],
    tablet: [768, 1024],
    desktop: [1280, 720]
  };
  
  if (viewports[breakpoint]) {
    cy.viewport(viewports[breakpoint][0], viewports[breakpoint][1]);
  }
});

// 截图对比
Cypress.Commands.add('compareSnapshot', (name) => {
  cy.screenshot(name);
  // 这里可以集成视觉回归测试工具
});

// 性能测试
Cypress.Commands.add('measurePerformance', (name) => {
  cy.window().then((win) => {
    const startTime = win.performance.now();
    cy.wrap(startTime).as(`${name}_startTime`);
    cy.log(`Performance measurement started for: ${name}`);
  });
});

Cypress.Commands.add('endPerformanceMeasure', (name, maxTime = 3000) => {
  cy.get(`@${name}_startTime`).then((startTime) => {
    cy.window().then((win) => {
      const endTime = win.performance.now();
      const duration = endTime - startTime;
      cy.log(`${name} took ${duration}ms`);
      expect(duration).to.be.lessThan(maxTime);
    });
  });
});