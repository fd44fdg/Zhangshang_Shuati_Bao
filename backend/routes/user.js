const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { verifyToken: authMiddleware } = require('../middleware/auth');
const { sendSuccess } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config');

const router = express.Router();

// 设置头像上传存储目录
// 确保 uploads 文件夹存在
const uploadDir = path.join(__dirname, '../public/uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 使用用户ID和时间戳命名，确保唯一
    const userId = req.user.userId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${userId}-${timestamp}${ext}`);
  }
});

// 文件类型过滤
const fileFilter = (req, file, cb) => {
  // 允许的图像类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, '只支持JPEG、JPG、PNG和GIF格式的图像'), false);
  }
};

// 创建ulter上传中间件
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制图像大小为5MB
  }
});

// 内部函数：获取用户profile信息
const getUserProfile = async (userId) => {
  const users = await db.query(
    `SELECT 
       id, username, email, nickname, avatar, gender, birthday, bio, 
       learning_goal AS learningGoal, 
       level, points, 
       created_at AS createdAt 
     FROM users WHERE id = ?`,
    [userId]
  );
  return users[0];
};

// 获取用户信息
router.get('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const userProfile = await getUserProfile(req.user.userId);
  
  if (!userProfile) {
    throw new ApiError(404, '用户不存在');
  }
  
  sendSuccess(res, { user: userProfile });
}));

// 更新用户信息
router.put('/profile', authMiddleware, asyncHandler(async (req, res) => {
  const { nickname, avatar, gender, birthday, bio, learning_goal } = req.body;
  
  // 构建更新字段
  const updateFields = [];
  const updateValues = [];
  
  if (nickname !== undefined) {
    updateFields.push('nickname = ?');
    updateValues.push(nickname);
  }
  
  if (avatar !== undefined) {
    updateFields.push('avatar = ?');
    updateValues.push(avatar);
  }
  
  if (gender !== undefined) {
    updateFields.push('gender = ?');
    updateValues.push(gender);
  }
  
  if (birthday !== undefined) {
    updateFields.push('birthday = ?');
    updateValues.push(birthday);
  }
  
  if (bio !== undefined) {
    updateFields.push('bio = ?');
    updateValues.push(bio);
  }
  
  if (learning_goal !== undefined) {
    updateFields.push('learning_goal = ?');
    updateValues.push(learning_goal);
  }
  
  if (updateFields.length === 0) {
    throw new ApiError(400, '没有要更新的字段');
  }
  
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(req.user.userId);
  
  await db.query(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );
  
  // 复用获取profile的函数
  const updatedUserProfile = await getUserProfile(req.user.userId);
  
  sendSuccess(res, updatedUserProfile, '用户信息更新成功');
}));

// 修改密码
router.put('/password', authMiddleware, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, '当前密码和新密码不能为空');
  }
  
  if (newPassword.length < 6) {
    throw new ApiError(400, '新密码长度至少6个字符');
  }
  
  // 获取当前用户密码
  const users = await db.query(
    'SELECT password FROM users WHERE id = ?',
    [req.user.userId]
  );
  
  if (users.length === 0) {
    throw new ApiError(404, '用户不存在');
  }
  
  // 验证当前密码
  const isValidPassword = await bcrypt.compare(currentPassword, users[0].password);
  if (!isValidPassword) {
    throw new ApiError(400, '当前密码错误');
  }
  
  // 加密新密码
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
  
  // 更新密码
  await db.query(
    'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [hashedNewPassword, req.user.userId]
  );
  
  sendSuccess(res, null, '密码修改成功');
}));

// 头像上传接口
router.post('/avatar', authMiddleware, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, '请选择要上传的头像');
  }
  
  // 构建头像访问路径
  const avatarUrl = `/static/uploads/avatars/${req.file.filename}`;
  
  // 更新用户的头像 URL
  await db.query(
    'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [avatarUrl, req.user.userId]
  );
  
  // 返回成功响应
  sendSuccess(res, { url: avatarUrl }, '头像上传成功');
}));

// 获取用户统计数据
router.get('/stats', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  
  const stats = await db.query(
    `SELECT 
       s.correct_rate AS correctRate, 
       s.continuous_days AS continuousDays, 
       s.total_questions AS totalQuestions, 
       s.correct_questions AS correctQuestions, 
       s.rank_position AS rank,
       u.points
     FROM user_stats s
     JOIN users u ON s.user_id = u.id
     WHERE s.user_id = ?`,
    [userId]
  );
  
  let userStats = stats[0];

  if (!userStats) {
    // 如果没有统计数据，创建默认数据
    await db.query(
      `INSERT INTO user_stats (user_id, correct_rate, continuous_days, total_questions, correct_questions, rank_position) 
       VALUES (?, 0.00, 0, 0, 0, 0)`,
      [userId]
    );
    
    userStats = { correctRate: 0, continuousDays: 0, totalQuestions: 0, correctQuestions: 0, rank: 0, points: 0 };
  } else {
    // 确保 correctRate 是数字
    userStats.correctRate = parseFloat(userStats.correctRate);
  }

  sendSuccess(res, userStats);
}));

// 获取用户签到状态
router.get('/checkin/status', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
  
  // 检查今天是否已签到
  const todayCheckin = await db.query(
    'SELECT id FROM user_checkins WHERE user_id = ? AND checkin_date = ?',
    [userId, today]
  );
  
  // 获取累计签到天数
  const totalDays = await db.query(
    'SELECT COUNT(*) as total_days FROM user_checkins WHERE user_id = ?',
    [userId]
  );
  
  // 获取连续签到天数（SQLite简化版）
  let continuousDays;
  if (db.isUsingSqlite) {
    // SQLite简化版：直接返回累计天数
    continuousDays = totalDays;
  } else {
    // MySQL复杂查询
    continuousDays = await db.query(
      `SELECT COUNT(*) as continuous_days 
       FROM (
         SELECT checkin_date,
                ROW_NUMBER() OVER (ORDER BY checkin_date DESC) as rn,
                DATE_SUB(checkin_date, INTERVAL ROW_NUMBER() OVER (ORDER BY checkin_date DESC) DAY) as grp
         FROM user_checkins 
         WHERE user_id = ? 
         ORDER BY checkin_date DESC
       ) t 
       WHERE grp = (SELECT DATE_SUB(MAX(checkin_date), INTERVAL ROW_NUMBER() OVER (ORDER BY MAX(checkin_date) DESC) DAY) 
                    FROM user_checkins WHERE user_id = ? LIMIT 1)`,
      [userId, userId]
    );
  }
  
  const checkInStatus = {
    isCheckedIn: todayCheckin.length > 0,
    checkInDays: totalDays[0].total_days || 0,
    continuousCheckInDays: (continuousDays[0] && continuousDays[0].continuous_days) || totalDays[0].total_days || 0
  };
  
  sendSuccess(res, checkInStatus);
}));

// 执行签到操作
router.post('/checkin', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
  
  if (db.isUsingSqlite) {
    // SQLite简化版本（无事务）
    
    // 检查今天是否已签到
    const existingCheckin = await db.query(
      'SELECT id FROM user_checkins WHERE user_id = ? AND checkin_date = ?',
      [userId, today]
    );
    
    if (existingCheckin.length > 0) {
      throw new ApiError(400, '今天已经签到过了');
    }
    
    // 记录签到
    await db.query(
      'INSERT INTO user_checkins (user_id, checkin_date) VALUES (?, ?)',
      [userId, today]
    );
    
    // 增加积分奖励
    const pointsReward = 5; // 签到奖励5分
    await db.query(
      'UPDATE users SET points = points + ? WHERE id = ?',
      [pointsReward, userId]
    );
    
    // 获取更新后的签到状态
    const totalDays = await db.query(
      'SELECT COUNT(*) as total_days FROM user_checkins WHERE user_id = ?',
      [userId]
    );
    
    const result = {
      isCheckedIn: true,
      checkInDays: totalDays[0].total_days,
      continuousCheckInDays: totalDays[0].total_days, // SQLite简化版
      pointsEarned: pointsReward
    };
    
    sendSuccess(res, result, '签到成功！');
    
  } else {
    // MySQL事务版本
    const connection = await db.beginTransaction();
    try {
      
      // 检查今天是否已签到
      const [existingCheckin] = await connection.execute(
        'SELECT id FROM user_checkins WHERE user_id = ? AND checkin_date = ?',
        [userId, today]
      );
      
      if (existingCheckin.length > 0) {
        throw new ApiError(400, '今天已经签到过了');
      }
      
      // 记录签到
      await connection.execute(
        'INSERT INTO user_checkins (user_id, checkin_date) VALUES (?, ?)',
        [userId, today]
      );
      
      // 增加积分奖励
      const pointsReward = 5; // 签到奖励5分
      await connection.execute(
        'UPDATE users SET points = points + ? WHERE id = ?',
        [pointsReward, userId]
      );
      
      // 获取更新后的签到状态
      const [totalDays] = await connection.execute(
        'SELECT COUNT(*) as total_days FROM user_checkins WHERE user_id = ?',
        [userId]
      );
      
      const [continuousDays] = await connection.execute(
        `SELECT COUNT(*) as continuous_days 
         FROM (
           SELECT checkin_date,
                  ROW_NUMBER() OVER (ORDER BY checkin_date DESC) as rn,
                  DATE_SUB(checkin_date, INTERVAL ROW_NUMBER() OVER (ORDER BY checkin_date DESC) DAY) as grp
           FROM user_checkins 
           WHERE user_id = ? 
           ORDER BY checkin_date DESC
         ) t 
         WHERE grp = (SELECT DATE_SUB(MAX(checkin_date), INTERVAL ROW_NUMBER() OVER (ORDER BY MAX(checkin_date) DESC) DAY) 
                      FROM user_checkins WHERE user_id = ? LIMIT 1)`,
        [userId, userId]
      );
      
      await db.commitTransaction(connection);
      
      const result = {
        isCheckedIn: true,
        checkInDays: totalDays[0].total_days,
        continuousCheckInDays: continuousDays[0].continuous_days,
        pointsEarned: pointsReward
      };
      
      sendSuccess(res, result, '签到成功！');
      
    } catch (error) {
      await db.rollbackTransaction(connection);
      throw error;
    }
  }
}));

// 更新用户统计数据（答题后调用）
router.post('/stats/update', authMiddleware, asyncHandler(async (req, res) => {
  const { isCorrect, questionId } = req.body;
  const userId = req.user.userId;
  
  if (db.isUsingSqlite) {
    // SQLite简化版本（无事务）
    
    // 1. 记录答题
    await db.query(
      `INSERT INTO user_answers (user_id, question_id, is_correct) 
       VALUES (?, ?, ?)`,
      [userId, questionId, isCorrect]
    );
    
    // 2. 获取当前统计
    const statsResult = await db.query(
      'SELECT total_questions, correct_questions FROM user_stats WHERE user_id = ?',
      [userId]
    );
    
    let { total_questions, correct_questions } = statsResult[0] || { total_questions: 0, correct_questions: 0 };

    // 3. 计算新统计数据
    total_questions += 1;
    if (isCorrect) {
      correct_questions += 1;
    }
    const newCorrectRate = total_questions > 0 ? (correct_questions / total_questions) : 0;
      
    // 4. 更新统计表
    await db.query(
      `UPDATE user_stats 
       SET total_questions = ?, correct_questions = ?, correct_rate = ?
         WHERE user_id = ?`,
      [total_questions, correct_questions, newCorrectRate, userId]
    );
      
    // 5. 如果答对，增加积分
    if (isCorrect) {
      const pointsToAdd = 10; // 答对一题加10分
      await db.query(
        'UPDATE users SET points = points + ? WHERE id = ?',
        [pointsToAdd, userId]
      );
    }
    
    sendSuccess(res, null, '统计数据更新成功');
    
  } else {
    // MySQL事务版本
    const connection = await db.beginTransaction();
    try {
      
      // 1. 记录答题
      await connection.execute(
        `INSERT INTO user_answers (user_id, question_id, is_correct) 
         VALUES (?, ?, ?)`,
        [userId, questionId, isCorrect]
      );
      
      // 2. 获取当前统计
      const [statsResult] = await connection.execute(
        'SELECT total_questions, correct_questions FROM user_stats WHERE user_id = ?',
        [userId]
      );
      
      let { total_questions, correct_questions } = statsResult[0];

      // 3. 计算新统计数据
      total_questions += 1;
      if (isCorrect) {
        correct_questions += 1;
      }
      const newCorrectRate = total_questions > 0 ? (correct_questions / total_questions) : 0;
        
      // 4. 更新统计表
      await connection.execute(
        `UPDATE user_stats 
         SET total_questions = ?, correct_questions = ?, correct_rate = ?
           WHERE user_id = ?`,
        [total_questions, correct_questions, newCorrectRate, userId]
      );
        
      // 5. 如果答对，增加积分
      if (isCorrect) {
        const pointsToAdd = 10; // 答对一题加10分
        await connection.execute(
          'UPDATE users SET points = points + ? WHERE id = ?',
          [pointsToAdd, userId]
        );
      }

      await db.commitTransaction(connection);
      
      sendSuccess(res, null, '统计数据更新成功');
      
    } catch (error) {
      await db.rollbackTransaction(connection);
      console.error('更新用户统计错误:', error);
      throw new ApiError(500, '更新统计数据失败');
    }
  }
}));

// GET /api/user/list - 获取用户列表（需要管理员权限）
router.get('/list', authMiddleware, asyncHandler(async (req, res) => {
  // 简单的权限检查
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 40301, message: '无权访问' });
  }

  const { name, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  
  let query = `SELECT id, username, email, nickname, avatar, gender, birthday, bio, 
               learning_goal AS learningGoal, level, points, role, status, 
               created_at AS createdAt, updated_at AS updatedAt 
               FROM users`;
  let countQuery = 'SELECT COUNT(*) as total FROM users';
  const params = [];
  const countParams = [];

  if (name) {
    query += ' WHERE username LIKE ? OR nickname LIKE ? OR email LIKE ?';
    countQuery += ' WHERE username LIKE ? OR nickname LIKE ? OR email LIKE ?';
    const searchTerm = `%${name}%`;
    params.push(searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), offset);

  const [users] = await db.execute(query, params);
  const [[{ total }]] = await db.execute(countQuery, countParams);

  res.json({
    code: 20000,
    message: 'Success',
    data: {
      total,
      items: users
    }
  });
}));

// POST /api/user/create - 创建新用户（需要管理员权限）
router.post('/create', authMiddleware, asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 40301, message: '无权访问' });
  }

  const { username, password, email, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ code: 40001, message: '用户名和密码是必填项' });
  }

  // 检查用户名是否已存在
  const [existingUsers] = await db.execute('SELECT id FROM users WHERE username = ?', [username]);
  if (existingUsers.length > 0) {
    return res.status(409).json({ code: 40901, message: '用户名已存在' });
  }

  // 检查邮箱是否已存在
  if (email) {
    const [existingEmails] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmails.length > 0) {
      return res.status(409).json({ code: 40902, message: '邮箱已存在' });
    }
  }

  // 加密密码
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 创建新用户
  const [result] = await db.execute(
    `INSERT INTO users (username, password, email, role, avatar, status) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [username, hashedPassword, email || '', role || 'user', '/default-avatar.svg', 1]
  );

  // 获取创建的用户信息
  const [newUsers] = await db.execute(
    `SELECT id, username, email, nickname, avatar, gender, birthday, bio, 
     learning_goal AS learningGoal, level, points, role, status, 
     created_at AS createdAt, updated_at AS updatedAt 
     FROM users WHERE id = ?`,
    [result.insertId]
  );

  // 为新用户创建统计记录
  await db.execute(
    `INSERT INTO user_stats (user_id, correct_rate, continuous_days, total_questions, correct_questions, rank_position) 
     VALUES (?, 0.00, 0, 0, 0, 0)`,
    [result.insertId]
  );

  res.status(201).json({
    code: 20000,
    message: '用户创建成功',
    data: newUsers[0]
  });
}));

// PUT /api/user/update/:id - 更新用户信息
router.put('/update/:id', authMiddleware, asyncHandler(async (req, res) => {
    const userIdToUpdate = parseInt(req.params.id, 10);
    const { username, email, role } = req.body;

    // 管理员或用户自己可以更新信息
    if (req.user.role !== 'admin' && req.user.userId !== userIdToUpdate) {
        return res.status(403).json({ code: 40301, message: '无权访问' });
    }

    // 检查用户是否存在
    const [existingUsers] = await db.execute('SELECT id FROM users WHERE id = ?', [userIdToUpdate]);
    if (existingUsers.length === 0) {
        return res.status(404).json({ code: 40401, message: '用户不存在' });
    }

    // 构建更新字段
    const updateFields = [];
    const updateValues = [];

    if (username !== undefined) {
        // 检查用户名是否已被其他用户使用
        const [usernameCheck] = await db.execute('SELECT id FROM users WHERE username = ? AND id != ?', [username, userIdToUpdate]);
        if (usernameCheck.length > 0) {
            return res.status(409).json({ code: 40901, message: '用户名已存在' });
        }
        updateFields.push('username = ?');
        updateValues.push(username);
    }

    if (email !== undefined) {
        // 检查邮箱是否已被其他用户使用
        const [emailCheck] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, userIdToUpdate]);
        if (emailCheck.length > 0) {
            return res.status(409).json({ code: 40902, message: '邮箱已存在' });
        }
        updateFields.push('email = ?');
        updateValues.push(email);
    }

    if (role !== undefined) {
        updateFields.push('role = ?');
        updateValues.push(role);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ code: 40001, message: '没有要更新的字段' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userIdToUpdate);

    // 执行更新
    await db.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
    );

    // 获取更新后的用户信息
    const [updatedUsers] = await db.execute(
        `SELECT id, username, email, nickname, avatar, gender, birthday, bio, 
         learning_goal AS learningGoal, level, points, role, status, 
         created_at AS createdAt, updated_at AS updatedAt 
         FROM users WHERE id = ?`,
        [userIdToUpdate]
    );

    res.json({ code: 20000, message: '更新成功', data: updatedUsers[0] });
}));

// DELETE /api/user/delete/:id - 删除用户
router.delete('/delete/:id', authMiddleware, asyncHandler(async (req, res) => {
    const userIdToDelete = parseInt(req.params.id, 10);
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ code: 40301, message: '无权访问' });
    }

    // 检查用户是否存在
    const [existingUsers] = await db.execute('SELECT id, role FROM users WHERE id = ?', [userIdToDelete]);
    if (existingUsers.length === 0) {
        return res.status(404).json({ code: 40401, message: '用户不存在' });
    }

    // 防止管理员删除自己
    if (userIdToDelete === req.user.userId) {
        return res.status(400).json({ code: 40002, message: '不能删除当前登录的管理员账户' });
    }

    if (db.isUsingSqlite) {
      // SQLite简化版本（无事务）
      try {
        // 删除用户相关的统计数据
        await db.query('DELETE FROM user_stats WHERE user_id = ?', [userIdToDelete]);
        
        // 删除用户签到记录
        await db.query('DELETE FROM user_checkins WHERE user_id = ?', [userIdToDelete]);
        
        // 删除用户答题记录
        await db.query('DELETE FROM user_answers WHERE user_id = ?', [userIdToDelete]);
        
        // 删除用户收藏
        await db.query('DELETE FROM user_favorites WHERE user_id = ?', [userIdToDelete]);
        
        // 删除用户错题记录
        await db.query('DELETE FROM user_wrong_questions WHERE user_id = ?', [userIdToDelete]);
        
        // 删除用户文章相关记录（如果表存在）
        try {
          await db.query('DELETE FROM user_article_likes WHERE user_id = ?', [userIdToDelete]);
          await db.query('DELETE FROM user_article_favorites WHERE user_id = ?', [userIdToDelete]);
          await db.query('DELETE FROM article_comments WHERE user_id = ?', [userIdToDelete]);
        } catch (e) {
          // 忽略表不存在的错误
        }
        
        // 最后删除用户
        await db.query('DELETE FROM users WHERE id = ?', [userIdToDelete]);

        res.json({ code: 20000, message: '用户删除成功' });
      } catch (error) {
        throw error;
      }
    } else {
      // MySQL事务版本
      const connection = await db.beginTransaction();
      try {
          // 删除用户相关的统计数据
          await connection.execute('DELETE FROM user_stats WHERE user_id = ?', [userIdToDelete]);
          
          // 删除用户签到记录
          await connection.execute('DELETE FROM user_checkins WHERE user_id = ?', [userIdToDelete]);
          
          // 删除用户答题记录
          await connection.execute('DELETE FROM user_answers WHERE user_id = ?', [userIdToDelete]);
          
          // 删除用户收藏
          await connection.execute('DELETE FROM user_favorites WHERE user_id = ?', [userIdToDelete]);
          
          // 删除用户错题记录
          await connection.execute('DELETE FROM user_wrong_questions WHERE user_id = ?', [userIdToDelete]);
          
          // 删除用户文章相关记录
          await connection.execute('DELETE FROM user_article_likes WHERE user_id = ?', [userIdToDelete]);
          await connection.execute('DELETE FROM user_article_favorites WHERE user_id = ?', [userIdToDelete]);
          await connection.execute('DELETE FROM article_comments WHERE user_id = ?', [userIdToDelete]);
          
          // 最后删除用户
          await connection.execute('DELETE FROM users WHERE id = ?', [userIdToDelete]);

          await db.commitTransaction(connection);
          res.json({ code: 20000, message: '用户删除成功' });
      } catch (error) {
          await db.rollbackTransaction(connection);
          throw error;
      }
    }
}));

module.exports = router;