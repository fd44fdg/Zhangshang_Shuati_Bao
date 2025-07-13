const request = require('supertest');
const app = require('../server');

describe('题目管理模块测试', () => {
  let adminToken;
  let userToken;
  let testAdmin;
  let testUser;

  beforeEach(async () => {
    // 创建管理员用户
    testAdmin = await global.testUtils.createTestUser({
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin'
    });

    // 创建普通用户
    testUser = await global.testUtils.createTestUser({
      username: 'user',
      email: 'user@example.com',
      role: 'user'
    });

    // 获取管理员token
    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'password123'
      });
    adminToken = adminLoginResponse.body.data.token;

    // 获取用户token
    const userLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'user',
        password: 'password123'
      });
    userToken = userLoginResponse.body.data.token;
  });

  describe('POST /api/questions', () => {
    test('管理员应该能够创建题目', async () => {
      const questionData = {
        title: '新题目',
        content: '这是一个新题目的内容',
        type: 'single',
        options: ['选项A', '选项B', '选项C', '选项D'],
        correct_answer: 'A',
        explanation: '这是解析',
        difficulty: 'medium',
        subject: '数学',
        tags: ['代数', '基础']
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('题目创建成功');
      expect(response.body.data.question.title).toBe(questionData.title);
      expect(response.body.data.question.content).toBe(questionData.content);
      expect(response.body.data.question.id).toBeDefined();
    });

    test('普通用户不应该能够创建题目', async () => {
      const questionData = {
        title: '新题目',
        content: '这是一个新题目的内容',
        type: 'single',
        options: ['选项A', '选项B', '选项C', '选项D'],
        correct_answer: 'A'
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(questionData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });

    test('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必填字段');
    });

    test('应该验证题目类型', async () => {
      const questionData = {
        title: '新题目',
        content: '内容',
        type: 'invalid_type',
        options: ['A', 'B'],
        correct_answer: 'A'
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(questionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的题目类型');
    });
  });

  describe('GET /api/questions', () => {
    beforeEach(async () => {
      // 创建测试题目
      await global.testUtils.createTestQuestion({
        title: '数学题1',
        subject: '数学',
        difficulty: 'easy',
        tags: JSON.stringify(['代数'])
      });
      await global.testUtils.createTestQuestion({
        title: '英语题1',
        subject: '英语',
        difficulty: 'medium',
        tags: JSON.stringify(['语法'])
      });
      await global.testUtils.createTestQuestion({
        title: '数学题2',
        subject: '数学',
        difficulty: 'hard',
        tags: JSON.stringify(['几何'])
      });
    });

    test('应该返回题目列表', async () => {
      const response = await request(app)
        .get('/api/questions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toHaveLength(3);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(10);
    });

    test('应该支持分页', async () => {
      const response = await request(app)
        .get('/api/questions?page=1&pageSize=2')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toHaveLength(2);
      expect(response.body.data.total).toBe(3);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(2);
    });

    test('应该支持按科目筛选', async () => {
      const response = await request(app)
        .get('/api/questions?subject=数学')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toHaveLength(2);
      expect(response.body.data.questions.every(q => q.subject === '数学')).toBe(true);
    });

    test('应该支持按难度筛选', async () => {
      const response = await request(app)
        .get('/api/questions?difficulty=easy')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toHaveLength(1);
      expect(response.body.data.questions[0].difficulty).toBe('easy');
    });

    test('应该支持关键词搜索', async () => {
      const response = await request(app)
        .get('/api/questions?keyword=数学')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toHaveLength(2);
    });

    test('应该支持多条件组合筛选', async () => {
      const response = await request(app)
        .get('/api/questions?subject=数学&difficulty=easy')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions).toHaveLength(1);
      expect(response.body.data.questions[0].subject).toBe('数学');
      expect(response.body.data.questions[0].difficulty).toBe('easy');
    });
  });

  describe('GET /api/questions/:id', () => {
    let testQuestion;

    beforeEach(async () => {
      testQuestion = await global.testUtils.createTestQuestion({
        title: '详情测试题目',
        content: '这是详情测试题目的内容'
      });
    });

    test('应该返回题目详情', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.question.id).toBe(testQuestion.id);
      expect(response.body.data.question.title).toBe(testQuestion.title);
      expect(response.body.data.question.content).toBe(testQuestion.content);
    });

    test('应该返回404当题目不存在', async () => {
      const response = await request(app)
        .get('/api/questions/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('题目不存在');
    });

    test('应该验证ID格式', async () => {
      const response = await request(app)
        .get('/api/questions/invalid_id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的题目ID');
    });
  });

  describe('PUT /api/questions/:id', () => {
    let testQuestion;

    beforeEach(async () => {
      testQuestion = await global.testUtils.createTestQuestion({
        title: '原始题目',
        content: '原始内容'
      });
    });

    test('管理员应该能够更新题目', async () => {
      const updateData = {
        title: '更新后的题目',
        content: '更新后的内容',
        difficulty: 'hard'
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.question.title).toBe(updateData.title);
      expect(response.body.data.question.content).toBe(updateData.content);
      expect(response.body.data.question.difficulty).toBe(updateData.difficulty);
    });

    test('普通用户不应该能够更新题目', async () => {
      const updateData = {
        title: '更新后的题目'
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });

    test('应该返回404当题目不存在', async () => {
      const response = await request(app)
        .put('/api/questions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '新标题' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('题目不存在');
    });
  });

  describe('DELETE /api/questions/:id', () => {
    let testQuestion;

    beforeEach(async () => {
      testQuestion = await global.testUtils.createTestQuestion({
        title: '待删除题目'
      });
    });

    test('管理员应该能够删除题目', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('题目删除成功');

      // 验证题目已被删除
      const getResponse = await request(app)
        .get(`/api/questions/${testQuestion.id}`)
        .expect(404);
    });

    test('普通用户不应该能够删除题目', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('权限不足');
    });

    test('应该返回404当题目不存在', async () => {
      const response = await request(app)
        .delete('/api/questions/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('题目不存在');
    });
  });

  describe('POST /api/questions/batch', () => {
    test('管理员应该能够批量创建题目', async () => {
      const questionsData = [
        {
          title: '批量题目1',
          content: '内容1',
          type: 'single',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'A',
          subject: '数学'
        },
        {
          title: '批量题目2',
          content: '内容2',
          type: 'multiple',
          options: ['A', 'B', 'C', 'D'],
          correct_answer: 'AB',
          subject: '英语'
        }
      ];

      const response = await request(app)
        .post('/api/questions/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ questions: questionsData })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(2);
      expect(response.body.data.questions).toHaveLength(2);
    });

    test('应该处理部分失败的情况', async () => {
      const questionsData = [
        {
          title: '有效题目',
          content: '内容',
          type: 'single',
          options: ['A', 'B'],
          correct_answer: 'A',
          subject: '数学'
        },
        {
          // 缺少必填字段
          title: '无效题目'
        }
      ];

      const response = await request(app)
        .post('/api/questions/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ questions: questionsData })
        .expect(207); // 部分成功

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(1);
      expect(response.body.data.failed).toBe(1);
      expect(response.body.data.errors).toHaveLength(1);
    });
  });
});