const request = require('supertest');
const app = require('../server');
const bcrypt = require('bcryptjs');

describe('用户认证模块测试', () => {
  describe('POST /api/auth/register', () => {
    test('应该成功注册新用户', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('注册成功');
      expect(response.body.data.user.username).toBe(userData.username);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    test('应该拒绝重复的用户名', async () => {
      // 先创建一个用户
      await global.testUtils.createTestUser({ username: 'existinguser' });

      const userData = {
        username: 'existinguser',
        email: 'another@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名已存在');
    });

    test('应该拒绝重复的邮箱', async () => {
      // 先创建一个用户
      await global.testUtils.createTestUser({ email: 'existing@example.com' });

      const userData = {
        username: 'newuser',
        email: 'existing@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('邮箱已存在');
    });

    test('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('缺少必填字段');
    });

    test('应该验证密码长度', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // 太短
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码长度');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 创建测试用户
      await global.testUtils.createTestUser({
        username: 'loginuser',
        email: 'login@example.com',
        password: 'password123'
      });
    });

    test('应该成功登录有效用户', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('登录成功');
      expect(response.body.data.user.username).toBe(loginData.username);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    test('应该支持邮箱登录', async () => {
      const loginData = {
        username: 'login@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(loginData.username);
    });

    test('应该拒绝错误的密码', async () => {
      const loginData = {
        username: 'loginuser',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('密码错误');
    });

    test('应该拒绝不存在的用户', async () => {
      const loginData = {
        username: 'nonexistentuser',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户不存在');
    });

    test('应该验证必填字段', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('用户名和密码不能为空');
    });
  });

  describe('GET /api/auth/profile', () => {
    let userToken;
    let testUser;

    beforeEach(async () => {
      // 创建测试用户并获取token
      testUser = await global.testUtils.createTestUser({
        username: 'profileuser',
        email: 'profile@example.com'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'profileuser',
          password: 'password123'
        });

      userToken = loginResponse.body.data.token;
    });

    test('应该返回用户资料', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('profileuser');
      expect(response.body.data.user.email).toBe('profile@example.com');
      expect(response.body.data.user.password).toBeUndefined();
    });

    test('应该拒绝无效的token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('无效的token');
    });

    test('应该拒绝缺少token的请求', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('未提供认证token');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let userToken;
    let testUser;

    beforeEach(async () => {
      testUser = await global.testUtils.createTestUser({
        username: 'updateuser',
        email: 'update@example.com'
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'updateuser',
          password: 'password123'
        });

      userToken = loginResponse.body.data.token;
    });

    test('应该成功更新用户资料', async () => {
      const updateData = {
        username: 'updateduser',
        email: 'updated@example.com'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe(updateData.username);
      expect(response.body.data.user.email).toBe(updateData.email);
    });

    test('应该成功更新密码', async () => {
      const updateData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // 验证新密码可以登录
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'updateuser',
          password: 'newpassword123'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    test('应该拒绝错误的当前密码', async () => {
      const updateData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('当前密码错误');
    });
  });
});