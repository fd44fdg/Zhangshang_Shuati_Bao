const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { db, helpers } = require('../database/mock-db'); // 引入统一数据库
const { sendSuccess } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

// 内部函数：获取用户profile信息
const getUserProfile = async (userId) => {
  const [users] = await pool.execute(
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
router.get('/profile', authMiddleware, catchAsync(async (req, res) => {
  const userProfile = await getUserProfile(req.user.userId);
  
  if (!userProfile) {
    throw new ApiError(404, '用户不存在');
  }
  
  sendSuccess(res, { user: userProfile });
}));

// 更新用户信息
router.put('/profile', authMiddleware, catchAsync(async (req, res) => {
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
  
  await pool.execute(
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
    updateValues
  );
  
  // 复用获取profile的函数
  const updatedUserProfile = await getUserProfile(req.user.userId);
  
  sendSuccess(res, updatedUserProfile, '用户信息更新成功');
}));

// 修改密码
router.put('/password', authMiddleware, catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, '当前密码和新密码不能为空');
  }
  
  if (newPassword.length < 6) {
    throw new ApiError(400, '新密码长度至少6个字符');
  }
  
  // 获取当前用户密码
  const [users] = await pool.execute(
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
  await pool.execute(
    'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [hashedNewPassword, req.user.userId]
  );
  
  sendSuccess(res, null, '密码修改成功');
}));

// 获取用户统计数据
router.get('/stats', authMiddleware, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  
  const [stats] = await pool.execute(
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
    await pool.execute(
      `INSERT INTO user_stats (user_id, correct_rate, continuous_days, total_questions, correct_questions, rank_position) 
       VALUES (?, 0.00, 0, 0, 0, 0)`,
      [userId, 0.00, 0, 0, 0, 0]
    );
    
    userStats = { correctRate: 0, continuousDays: 0, totalQuestions: 0, correctQuestions: 0, rank: 0, points: 0 };
  } else {
    // 确保 correctRate 是数字
    userStats.correctRate = parseFloat(userStats.correctRate);
  }

  sendSuccess(res, userStats);
}));

// 获取用户签到状态
router.get('/checkin/status', authMiddleware, catchAsync(async (req, res) => {
  const userId = req.user.userId;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
  
  // 检查今天是否已签到
  const [todayCheckin] = await pool.execute(
    'SELECT id FROM user_checkins WHERE user_id = ? AND checkin_date = ?',
    [userId, today]
  );
  
  // 获取累计签到天数
  const [totalDays] = await pool.execute(
    'SELECT COUNT(*) as total_days FROM user_checkins WHERE user_id = ?',
    [userId]
  );
  
  // 获取连续签到天数
  const [continuousDays] = await pool.execute(
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
  
  const checkInStatus = {
    isCheckedIn: todayCheckin.length > 0,
    checkInDays: totalDays[0].total_days || 0,
    continuousCheckInDays: continuousDays[0].continuous_days || 0
  };
  
  sendSuccess(res, checkInStatus);
}));

// 执行签到操作
router.post('/checkin', authMiddleware, catchAsync(async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD格式
    
    await connection.beginTransaction();
    
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
    
    await connection.commit();
    
    const result = {
      isCheckedIn: true,
      checkInDays: totalDays[0].total_days,
      continuousCheckInDays: continuousDays[0].continuous_days,
      pointsEarned: pointsReward
    };
    
    sendSuccess(res, result, '签到成功！');
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

// 更新用户统计数据（答题后调用）
router.post('/stats/update', authMiddleware, catchAsync(async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { isCorrect, questionId } = req.body;
    const userId = req.user.userId;

    await connection.beginTransaction();
    
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

    await connection.commit();
    
    sendSuccess(res, null, '统计数据更新成功');
    
  } catch (error) {
    await connection.rollback();
    console.error('更新用户统计错误:', error);
    throw new ApiError(500, '更新统计数据失败');
  } finally {
    connection.release();
  }
}));

// GET /api/user/list - 获取用户列表（需要管理员权限）
router.get('/list', authMiddleware, (req, res) => {
  // 简单的权限检查
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 40301, message: '无权访问' });
  }

  const { name, page = 1, limit = 20 } = req.query;
  let filteredUsers = db.users;

  if (name) {
    filteredUsers = filteredUsers.filter(u => u.username.includes(name));
  }

  const pageData = filteredUsers.slice((page - 1) * limit, page * limit);
  const total = filteredUsers.length;

  res.json({
    code: 20000,
    message: 'Success',
    data: {
      total,
      items: pageData.map(({ password, ...user }) => user) // 确保不返回密码
    }
  });
});

// POST /api/user/create - 创建新用户（需要管理员权限）
router.post('/create', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ code: 40301, message: '无权访问' });
  }

  const { username, password, email, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ code: 40001, message: '用户名和密码是必填项' });
  }

  if (db.users.some(u => u.username === username)) {
    return res.status(409).json({ code: 40901, message: '用户名已存在' });
  }

  const newUser = {
    id: helpers.getNextId(db.users),
    username,
    password, // 真实应用中应哈希处理
    email: email || '',
    role: role || 'user',
    avatar: '/default-avatar.svg',
    createdAt: new Date(),
  };

  db.users.push(newUser);
  const { password: _, ...userToReturn } = newUser;

  res.status(201).json({
    code: 20000,
    message: '用户创建成功',
    data: userToReturn
  });
});

// PUT /api/user/update/:id - 更新用户信息
router.put('/update/:id', authMiddleware, (req, res) => {
    const userIdToUpdate = parseInt(req.params.id, 10);
    const { username, email, role } = req.body;

    // 管理员或用户自己可以更新信息
    if (req.user.role !== 'admin' && req.user.id !== userIdToUpdate) {
        return res.status(403).json({ code: 40301, message: '无权访问' });
    }

    const userIndex = db.users.findIndex(u => u.id === userIdToUpdate);
    if (userIndex === -1) {
        return res.status(404).json({ code: 40401, message: '用户不存在' });
    }

    const updatedUser = {
        ...db.users[userIndex],
        username: username || db.users[userIndex].username,
        email: email || db.users[userIndex].email,
        role: role || db.users[userIndex].role,
    };
    db.users[userIndex] = updatedUser;
    
    const { password, ...userToReturn } = updatedUser;

    res.json({ code: 20000, message: '更新成功', data: userToReturn });
});


// DELETE /api/user/delete/:id - 删除用户
router.delete('/delete/:id', authMiddleware, (req, res) => {
    const userIdToDelete = parseInt(req.params.id, 10);
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ code: 40301, message: '无权访问' });
    }

    const userIndex = db.users.findIndex(u => u.id === userIdToDelete);
    if (userIndex === -1) {
        return res.status(404).json({ code: 40401, message: '用户不存在' });
    }

    // 防止管理员删除自己
    if (db.users[userIndex].id === req.user.id) {
        return res.status(400).json({ code: 40002, message: '不能删除当前登录的管理员账户' });
    }

    db.users.splice(userIndex, 1);
    res.json({ code: 20000, message: '用户删除成功' });
});

// =================================================================
// =================== Admin Panel APIs ============================
// =================================================================

// Middleware to check for admin role (example)
// In a real app, this would be more robust
const isAdmin = (req, res, next) => {
    // For now, we assume if you can hit this endpoint, you are an admin
    // This should be replaced with proper role checking from the token
    next();
};

// GET /api/users/list - Get user list for admin panel
router.get('/list', authMiddleware, isAdmin, (req, res) => {
    const { keyword, status, role, page = 1, limit = 10 } = req.query;

    let filteredUsers = db.users;

    // 1. Filter by keyword
    if (keyword) {
        filteredUsers = filteredUsers.filter(u => 
            u.username.includes(keyword) || 
            (u.nickname && u.nickname.includes(keyword)) ||
            u.email.includes(keyword)
        );
    }
    
    // 2. Filter by status
    if (status !== undefined && status !== null && status !== '') {
        const numStatus = parseInt(status, 10);
        filteredUsers = filteredUsers.filter(u => u.status === numStatus);
    }

    // 3. Filter by role
    if (role) {
        filteredUsers = filteredUsers.filter(u => u.role === role);
    }

    const total = filteredUsers.length;

    // 4. Paginate
    const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

    res.json({
        code: 20000, // Matching admin panel's success code
        message: 'User list fetched successfully',
        data: {
            total,
            items: paginatedUsers
        }
    });
});

// POST /api/users - Create a new user from admin panel
router.post('/', authMiddleware, isAdmin, (req, res) => {
    const { username, nickname, email, password, role, status } = req.body;
    
    if (!username || !email || !password || !role) {
        return res.status(400).json({ code: 40000, message: 'Missing required fields' });
    }

    if (helpers.findUserByUsername(username)) {
        return res.status(400).json({ code: 40000, message: 'Username already exists' });
    }
    if (helpers.findUserByEmail(email)) {
        return res.status(400).json({ code: 40000, message: 'Email already exists' });
    }

    const newUser = helpers.addUser({
        username,
        nickname,
        email,
        password, // In a real app, hash this password
        role,
        status: status !== undefined ? status : 1, // Default to active
    });

    res.status(201).json({
        code: 20000,
        message: 'User created successfully',
        data: newUser
    });
});

// PUT /api/users/:id - Update a user from admin panel
router.put('/:id', authMiddleware, isAdmin, (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { nickname, email, role, status } = req.body;

    const user = helpers.findUserById(userId);
    if (!user) {
        return res.status(404).json({ code: 40400, message: 'User not found' });
    }
    
    // Check if new email is already taken by another user
    if (email && email !== user.email && helpers.findUserByEmail(email)) {
        return res.status(400).json({ code: 40000, message: 'Email is already in use by another account.' });
    }

    const updatedData = {};
    if (nickname !== undefined) updatedData.nickname = nickname;
    if (email !== undefined) updatedData.email = email;
    if (role !== undefined) updatedData.role = role;
    if (status !== undefined) updatedData.status = status;

    const updatedUser = helpers.updateUser(userId, updatedData);

    res.json({
        code: 20000,
        message: 'User updated successfully',
        data: updatedUser
    });
});

// DELETE /api/users/:id - Delete a user from admin panel
router.delete('/:id', authMiddleware, isAdmin, (req, res) => {
    const userId = parseInt(req.params.id, 10);

    const success = helpers.deleteUser(userId);

    if (!success) {
        return res.status(404).json({ code: 40400, message: 'User not found' });
    }

    res.json({
        code: 20000,
        message: 'User deleted successfully'
    });
});

module.exports = router;