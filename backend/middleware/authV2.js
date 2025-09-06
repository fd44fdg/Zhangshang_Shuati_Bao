const jwt = require('jsonwebtoken')
const crypto = require('crypto')
// 使用统一 knex 实例，避免 getDB 未定义导致 500
const db = require('../config/db')

// Secret 兼容：若未单独配置 ACCESS/REFRESH，则回退到 TOKEN_SECRET/JWT_SECRET
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.TOKEN_SECRET || process.env.JWT_SECRET || 'dev-access-secret'
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.TOKEN_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret'

function signAccess(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' })
}

function signRefresh(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_TTL || '30d' })
}

function hash(str) { 
  return crypto.createHash('sha256').update(str).digest('hex') 
}

async function storeRefresh(userId, token) {
  const decoded = jwt.decode(token)
  const exp = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  await db('refresh_tokens').insert({ user_id: userId, token_hash: hash(token), expires_at: exp })
}

async function revokeRefresh(token) {
  await db('refresh_tokens').where({ token_hash: hash(token) }).update({ revoked: 1 })
}

async function isRefreshValid(token, userId) {
  const row = await db('refresh_tokens').select('revoked', 'expires_at').where({ token_hash: hash(token), user_id: userId }).first()
  if (!row) return false
  if (row.revoked) return false
  if (new Date(row.expires_at).getTime() < Date.now()) return false
  return true
}

function setCookies(res, access, refresh) {
  const base = {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
  }
  res.cookie('access', access, { ...base, maxAge: 15 * 60 * 1000, path: '/api/v1' })
  res.cookie('refresh', refresh, { ...base, maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/v1/auth' })
}

function clearCookies(res) {
  res.cookie('access', '', { maxAge: 0, path: '/api/v1' })
  res.cookie('refresh', '', { maxAge: 0, path: '/api/v1/auth' })
}

function verifyAccess(req, res, next) {
  const token = req.cookies?.access
  if (!token) return res.status(401).json({ success: false, message: 'NO_TOKEN' })
  
  try {
  req.user = jwt.verify(token, ACCESS_SECRET)
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'ACCESS_EXPIRED' })
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false })
    
    const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles].filter(Boolean)
    if (!roles.some(r => userRoles.includes(r))) {
      return res.status(403).json({ success: false, message: 'FORBIDDEN' })
    }
    next()
  }
}

async function writeAudit(req, action, resourceType, resourceId, beforeObj, afterObj) {
  try {
    await db('audit_logs').insert({
      actor_id: req.user?.id || null,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      before_json: beforeObj ? JSON.stringify(beforeObj) : null,
      after_json: afterObj ? JSON.stringify(afterObj) : null,
      ip: req.ip,
      ua: req.headers['user-agent'] || ''
    })
  } catch (e) {
    console.error('Audit log failed:', e.message)
  }
}

module.exports = {
  signAccess,
  signRefresh,
  setCookies,
  clearCookies,
  storeRefresh,
  revokeRefresh,
  isRefreshValid,
  verifyAccess,
  requireRoles,
  writeAudit
}
