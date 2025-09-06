const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');
const { sendSuccess } = require('../utils/responseHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const authService = require('../services/authService');
// 统一使用 knex （config/database 返回的是旧风格，仅用于MySQL pool）
const db = require('../config/db');
const {
  signAccess,
  signRefresh,
  setCookies,
  clearCookies,
  storeRefresh,
  revokeRefresh,
  isRefreshValid
} = require('../middleware/authV2');

const router = express.Router();

async function findUserByName(username) {
  return db('users').select('id','username','password_hash','role as roles').where({ username }).first()
}

router.post('/register', asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV !== 'production' && req.baseUrl && req.baseUrl.endsWith('/api/v1')) {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', '</api/v1/auth/register>; rel="successor-version"');
  }
    console.log('[E2E-DEBUG] auth route /register - received request', { path: req.path, method: req.method });
    const newUser = await authService.register(req.body);
    console.log('[E2E-DEBUG] auth route /register - service returned');
    sendSuccess(res, newUser, '注册成功', 201);
}));

// New cookie-based login
router.post('/login-v2', asyncHandler(async (req, res) => {
  const { username, password } = req.body || {}
  
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' })
  }
  
  const user = await findUserByName(username)
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }
  
  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' })
  }
  
  const roles = Array.isArray(user.roles) ? user.roles : [user.roles].filter(Boolean)
  const access = signAccess({ id: user.id, username: user.username, roles })
  const refresh = signRefresh({ id: user.id })
  
  await storeRefresh(user.id, refresh)
  setCookies(res, access, refresh)
  
  res.json({ success: true })
}))

router.post('/refresh', asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh
  if (!token) {
    return res.status(401).json({ success: false, message: 'No refresh token' })
  }
  
  try {
  const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || process.env.TOKEN_SECRET || process.env.JWT_SECRET)
    const valid = await isRefreshValid(token, decoded.id)
    
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' })
    }
    
  const user = await db('users').select('id','username','role as roles').where({ id: decoded.id }).first()
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' })
    }
    
    const roles = Array.isArray(user.roles) ? user.roles : [user.roles].filter(Boolean)
    const newAccess = signAccess({ id: user.id, username: user.username, roles })
    
    setCookies(res, newAccess, token)
    res.json({ success: true })
    
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }
}))

router.post('/logout-v2', asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh
  if (token) {
    await revokeRefresh(token)
  }
  clearCookies(res)
  res.json({ success: true })
}))

router.get('/me', asyncHandler(async (req, res) => {
  const access = req.cookies?.access
  if (!access) {
    return res.status(401).json({ success: false, message: 'No access token' })
  }
  // 与 signAccess 使用同一套回退 secret，避免未设置 ACCESS_TOKEN_SECRET 时报 500
  const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.TOKEN_SECRET || process.env.JWT_SECRET
  try {
    const decoded = jwt.verify(access, ACCESS_SECRET)
    res.json({ 
      success: true, 
      data: { 
        id: decoded.id, 
        username: decoded.username, 
        roles: decoded.roles || [] 
      }
    })
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Invalid access token' })
  }
}))

router.post('/login', asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV !== 'production' && req.baseUrl && req.baseUrl.endsWith('/api/v1')) {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', '</api/v1/auth/login>; rel="successor-version"');
  }
    console.log('[E2E-DEBUG] auth route /login - received request', { path: req.path, method: req.method });
    const result = await authService.login(req.body);
    console.log('[E2E-DEBUG] auth route /login - service returned');
    sendSuccess(res, result, '登录成功');
}));

router.post('/change-password', verifyToken, asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  sendSuccess(res, null, '密码修改成功');
}));

router.post('/logout', verifyToken, asyncHandler(async (req, res) => {
  sendSuccess(res, null, '退出登录成功');
}));

router.get('/verify', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  const ApiError = require('../utils/ApiError');
  const jwt = require('jsonwebtoken');
  const db = require('../config/db');
  const config = require('../config');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, '未提供认证令牌');
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: [config.jwt.algorithm || 'HS256'],
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
    });
    const user = await db('users')
      .select('id', 'username', 'email', 'nickname', 'avatar_url', 'role')
      .where({ id: decoded.id })
      .first();
    
    if (!user) {
      throw new ApiError(401, '用户不存在');
    }
    
    sendSuccess(res, { user }, '令牌有效');
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, '认证令牌已过期');
    } else {
      throw new ApiError(401, '无效的认证令牌');
    }
  }
}));

router.post('/wechat-login', asyncHandler(async (req, res) => {
  const result = await authService.wechatLogin(req.body.code);
  sendSuccess(res, result, '登录成功');
}));

module.exports = router;
