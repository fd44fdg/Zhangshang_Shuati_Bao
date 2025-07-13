const jwt = require('jsonwebtoken');
const { db } = require('../database/mock-db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long-and-secure';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 40102, message: '认证失败：请求头缺少Token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 从解码后的token中获取用户ID
    const userId = decoded.id;
    
    // 在我们的模拟数据库中查找用户
    const user = db.users.find(u => u.id === userId);

    if (!user) {
      return res.status(401).json({ code: 40103, message: '认证失败：用户不存在' });
    }

    // 将用户信息（不含密码）附加到请求对象上
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 40104, message: '认证失败：Token已过期' });
    }
    return res.status(401).json({ code: 40105, message: '认证失败：无效的Token' });
  }
};

module.exports = authMiddleware;
module.exports.authenticateToken = authMiddleware;