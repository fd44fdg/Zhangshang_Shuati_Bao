const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { db } = require('../database/mock-db'); // 引入统一数据库
const authMiddleware = require('../middleware/auth');
const { sendSuccess } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// 用户注册
router.post('/register', catchAsync(async (req, res) => {
  const { username, email, password, nickname } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, '用户名、邮箱和密码不能为空');
  }
  if (password.length < 6) {
    throw new ApiError(400, '密码长度至少6个字符');
  }

  const [existingUsers] = await pool.execute('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
  if (existingUsers.length > 0) {
    throw new ApiError(409, '用户名或邮箱已被注册'); // 409 Conflict
  }

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const [result] = await pool.execute(
    `INSERT INTO users (username, email, password, nickname, avatar) VALUES (?, ?, ?, ?, ?)`,
    [username, email, hashedPassword, nickname || username, '/static/default-avatar.svg']
  );
  const userId = result.insertId;

  // 可选：在这里可以初始化用户统计等关联数据

  const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  sendSuccess(res, {
    token,
    user: { id: userId, username, email, nickname: nickname || username, avatar: '/static/default-avatar.svg' }
  }, '注册成功', 201);
}));

// 用户登录
router.post('/login', catchAsync(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new ApiError(400, '用户名和密码不能为空');
  }

  const [users] = await pool.execute('SELECT * FROM users WHERE username = ? OR email = ?', [username, username]);
  if (users.length === 0) {
    throw new ApiError(401, '用户名或密码不正确');
  }
  const user = users[0];

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, '用户名或密码不正确');
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  sendSuccess(res, { token }, '登录成功');
}));

// 获取当前用户信息
router.get('/me', authMiddleware, catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const [users] = await pool.execute('SELECT id, username, email, nickname, avatar, role FROM users WHERE id = ?', [userId]);

  if (users.length === 0) {
    throw new ApiError(404, '用户不存在');
  }
  
  const user = users[0];
  // 确保返回的字段名与前端期望的一致, e.g., 'name'
  user.name = user.nickname || user.username;

  sendSuccess(res, user, '获取用户信息成功');
}));

// 验证token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username, email, nickname, avatar, level, points FROM users WHERE id = ?',
      [req.user.userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: users[0]
      }
    });
    
  } catch (error) {
    console.error('验证token错误:', error);
    res.status(500).json({
      success: false,
      message: '验证失败'
    });
  }
});

// 登出（客户端处理，服务端记录）
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '登出成功'
  });
});

module.exports = router;