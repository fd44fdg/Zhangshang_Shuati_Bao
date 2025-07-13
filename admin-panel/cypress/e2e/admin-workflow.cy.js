describe('管理员工作流程测试', () => {
  beforeEach(() => {
    // 清理数据库并准备测试数据
    cy.cleanDatabase();
    cy.seedDatabase();
  });

  describe('登录流程', () => {
    it('应该能够成功登录管理后台', () => {
      cy.visit('/login');
      
      // 检查登录页面元素
      cy.get('.login-title').should('contain', '掌上刷题宝管理后台');
      cy.get('input[placeholder="请输入用户名"]').should('be.visible');
      cy.get('input[placeholder="请输入密码"]').should('be.visible');
      
      // 执行登录
      cy.login('admin', 'admin123');
      
      // 验证登录成功
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.get('.user-info').should('contain', 'admin');
    });

    it('应该拒绝错误的登录凭据', () => {
      cy.visit('/login');
      
      cy.get('input[placeholder="请输入用户名"]').type('admin');
      cy.get('input[placeholder="请输入密码"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      // 验证错误消息
      cy.checkNotification('error', '用户名或密码错误');
      cy.url().should('include', '/login');
    });

    it('应该验证必填字段', () => {
      cy.visit('/login');
      
      cy.get('button[type="submit"]').click();
      
      // 检查表单验证
      cy.checkFormValidation('username', '请输入用户名');
      cy.checkFormValidation('password', '请输入密码');
    });
  });

  describe('题目管理流程', () => {
    beforeEach(() => {
      cy.adminLogin();
      cy.visit('/');
    });

    it('应该能够查看题目列表', () => {
      cy.visit('/questions');
      
      // 检查页面元素
      cy.get('.page-title').should('contain', '题目管理');
      cy.get('.add-question-btn').should('be.visible');
      cy.get('.search-input').should('be.visible');
      cy.get('.el-table').should('be.visible');
      
      // 检查表格列
      cy.get('.el-table__header th').should('contain', '题目标题');
      cy.get('.el-table__header th').should('contain', '科目');
      cy.get('.el-table__header th').should('contain', '难度');
      cy.get('.el-table__header th').should('contain', '操作');
    });

    it('应该能够创建新题目', () => {
      const questionData = {
        title: 'E2E测试题目',
        content: '这是一个端到端测试题目',
        type: 'single',
        options: ['选项A', '选项B', '选项C', '选项D'],
        correct_answer: 'A',
        explanation: '这是测试解析',
        difficulty: 'medium',
        subject: '测试科目',
        tags: ['E2E', '测试']
      };
      
      cy.createQuestion(questionData);
      
      // 验证题目创建成功
      cy.visit('/questions');
      cy.searchQuestion(questionData.title);
      cy.get('.el-table__body').should('contain', questionData.title);
    });

    it('应该能够编辑题目', () => {
      cy.visit('/questions');
      
      // 点击第一个题目的编辑按钮
      cy.get('.el-table__body tr').first().within(() => {
        cy.get('.edit-btn').click();
      });
      
      // 修改题目信息
      cy.get('input[placeholder="请输入题目标题"]').clear().type('修改后的题目标题');
      cy.get('textarea[placeholder="请输入题目内容"]').clear().type('修改后的题目内容');
      
      // 保存修改
      cy.get('.save-question-btn').click();
      cy.checkNotification('success', '题目更新成功');
      
      // 验证修改成功
      cy.visit('/questions');
      cy.get('.el-table__body').should('contain', '修改后的题目标题');
    });

    it('应该能够删除题目', () => {
      cy.visit('/questions');
      
      // 获取第一个题目的标题
      cy.get('.el-table__body tr').first().find('td').first().invoke('text').then((title) => {
        // 删除题目
        cy.get('.el-table__body tr').first().within(() => {
          cy.get('.delete-btn').click();
        });
        
        // 确认删除
        cy.confirmDialog(true);
        cy.checkNotification('success', '题目删除成功');
        
        // 验证题目已删除
        cy.get('.el-table__body').should('not.contain', title.trim());
      });
    });

    it('应该能够搜索题目', () => {
      cy.visit('/questions');
      
      const searchKeyword = '数学';
      cy.searchQuestion(searchKeyword);
      
      // 验证搜索结果
      cy.get('.el-table__body tr').each(($row) => {
        cy.wrap($row).should('contain', searchKeyword);
      });
    });

    it('应该能够按科目筛选题目', () => {
      cy.visit('/questions');
      
      // 选择科目筛选
      cy.get('.subject-filter').click();
      cy.get('.el-select-dropdown__item').contains('数学').click();
      
      // 验证筛选结果
      cy.waitForLoading();
      cy.get('.el-table__body tr').each(($row) => {
        cy.wrap($row).should('contain', '数学');
      });
    });

    it('应该能够按难度筛选题目', () => {
      cy.visit('/questions');
      
      // 选择难度筛选
      cy.get('.difficulty-filter').click();
      cy.get('.el-select-dropdown__item').contains('简单').click();
      
      // 验证筛选结果
      cy.waitForLoading();
      cy.get('.el-table__body tr').each(($row) => {
        cy.wrap($row).should('contain', '简单');
      });
    });
  });

  describe('用户管理流程', () => {
    beforeEach(() => {
      cy.adminLogin();
      cy.visit('/users');
    });

    it('应该能够查看用户列表', () => {
      // 检查页面元素
      cy.get('.page-title').should('contain', '用户管理');
      cy.get('.el-table').should('be.visible');
      
      // 检查表格列
      cy.get('.el-table__header th').should('contain', '用户名');
      cy.get('.el-table__header th').should('contain', '邮箱');
      cy.get('.el-table__header th').should('contain', '角色');
      cy.get('.el-table__header th').should('contain', '注册时间');
    });

    it('应该能够搜索用户', () => {
      const searchKeyword = 'test';
      
      cy.get('.search-input').type(searchKeyword);
      cy.get('.search-btn').click();
      
      // 验证搜索结果
      cy.waitForLoading();
      cy.get('.el-table__body tr').each(($row) => {
        cy.wrap($row).should('contain', searchKeyword);
      });
    });

    it('应该能够查看用户详情', () => {
      cy.get('.el-table__body tr').first().within(() => {
        cy.get('.view-btn').click();
      });
      
      // 检查用户详情对话框
      cy.get('.el-dialog').should('be.visible');
      cy.get('.user-detail').should('be.visible');
      cy.get('.user-stats').should('be.visible');
    });
  });

  describe('数据统计流程', () => {
    beforeEach(() => {
      cy.adminLogin();
      cy.visit('/dashboard');
    });

    it('应该显示系统概览数据', () => {
      // 检查统计卡片
      cy.get('.stat-card').should('have.length.at.least', 4);
      cy.get('.stat-card').should('contain', '总题目数');
      cy.get('.stat-card').should('contain', '总用户数');
      cy.get('.stat-card').should('contain', '今日新增');
      cy.get('.stat-card').should('contain', '活跃用户');
    });

    it('应该显示图表数据', () => {
      // 检查图表容器
      cy.get('.chart-container').should('be.visible');
      cy.get('.user-trend-chart').should('be.visible');
      cy.get('.question-distribution-chart').should('be.visible');
    });

    it('应该能够切换时间范围', () => {
      // 切换到本周数据
      cy.get('.time-range-selector').click();
      cy.get('.el-select-dropdown__item').contains('本周').click();
      
      // 验证数据更新
      cy.waitForLoading();
      cy.get('.chart-container').should('be.visible');
    });
  });

  describe('系统设置流程', () => {
    beforeEach(() => {
      cy.adminLogin();
      cy.visit('/settings');
    });

    it('应该能够查看系统设置', () => {
      // 检查设置页面元素
      cy.get('.settings-tabs').should('be.visible');
      cy.get('.tab-pane').should('be.visible');
    });

    it('应该能够更新系统配置', () => {
      // 修改系统配置
      cy.get('input[name="siteName"]').clear().type('新的站点名称');
      cy.get('textarea[name="siteDescription"]').clear().type('新的站点描述');
      
      // 保存配置
      cy.get('.save-settings-btn').click();
      cy.checkNotification('success', '设置保存成功');
    });
  });

  describe('响应式布局测试', () => {
    beforeEach(() => {
      cy.adminLogin();
    });

    it('应该在移动端正确显示', () => {
      cy.checkResponsive('mobile');
      cy.visit('/');
      
      // 检查移动端布局
      cy.get('.mobile-menu-btn').should('be.visible');
      cy.get('.sidebar').should('not.be.visible');
      
      // 打开移动端菜单
      cy.get('.mobile-menu-btn').click();
      cy.get('.mobile-sidebar').should('be.visible');
    });

    it('应该在平板端正确显示', () => {
      cy.checkResponsive('tablet');
      cy.visit('/');
      
      // 检查平板端布局
      cy.get('.sidebar').should('be.visible');
      cy.get('.main-content').should('be.visible');
    });
  });

  describe('性能测试', () => {
    beforeEach(() => {
      cy.adminLogin();
    });

    it('页面加载时间应该在合理范围内', () => {
      cy.measurePerformance('dashboard-load');
      cy.visit('/');
      cy.waitForLoading();
      cy.endPerformanceMeasure('dashboard-load', 3000);
    });

    it('题目列表加载应该快速', () => {
      cy.measurePerformance('questions-load');
      cy.visit('/questions');
      cy.waitForLoading();
      cy.endPerformanceMeasure('questions-load', 2000);
    });

    afterEach(() => {
      // 性能测试不需要清理数据库
    });
  });

  afterEach(() => {
    // 清理测试数据
    cy.cleanDatabase();
  });
});