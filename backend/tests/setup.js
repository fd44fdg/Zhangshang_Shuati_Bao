const fs = require('fs');
const path = require('path');

// 测试数据库配置 - 使用内存数据库进行测试
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'memory'; // 使用内存数据库
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
process.env.PORT = '3001';

// 模拟数据库连接
const mockDb = {
  users: new Map(),
  questions: new Map(),
  userStats: new Map(),
  userAnswers: new Map(),
  userFavorites: new Map(),
  userWrongQuestions: new Map(),
  userStudyRecords: new Map()
};

// 全局模拟数据库
global.mockDb = mockDb;

// 全局测试设置
beforeAll(async () => {
  // 创建测试数据库连接
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });

  // 创建测试数据库
  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
  await connection.end();

  // 初始化数据库表结构
  await initDatabase();
});

// 每个测试后清理数据
afterEach(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  // 清理测试数据（保留表结构）
  await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
  await connection.execute('TRUNCATE TABLE user_study_records');
  await connection.execute('TRUNCATE TABLE user_wrong_questions');
  await connection.execute('TRUNCATE TABLE user_answers');
  await connection.execute('TRUNCATE TABLE user_favorites');
  await connection.execute('TRUNCATE TABLE user_stats');
  await connection.execute('TRUNCATE TABLE questions');
  await connection.execute('TRUNCATE TABLE users');
  await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

  await connection.end();
});

// 所有测试完成后清理
afterAll(async () => {
  console.log('🧹 测试完成，清理资源...');
  // 清理全局模拟数据库
  global.mockDb = null;
});

// 测试工具函数
const createTestUser = async (userData = {}) => {
  const bcrypt = require('bcryptjs');
  
  const defaultUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'user'
  };

  const user = { ...defaultUser, ...userData };
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const userId = Date.now(); // 简单的ID生成
  user.id = userId;
  user.password = hashedPassword;
  
  // 存储到内存数据库
  global.mockDb.users.set(userId, user);
  return user;
};

const createTestQuestion = async (questionData = {}) => {
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
  const questionId = Date.now() + Math.random(); // 简单的ID生成
  question.id = questionId;
  
  // 存储到内存数据库
  global.mockDb.questions.set(questionId, question);
  return question;
};

global.testUtils = {
  createTestUser,
  createTestQuestion,
  mockDb: () => global.mockDb
};

module.exports = {
  createTestUser,
  createTestQuestion,
  mockDb: () => global.mockDb
};