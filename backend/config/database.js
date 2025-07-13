const mysql = require('mysql2/promise');
require('dotenv').config();

// 检查是否为测试环境
const isTestEnv = process.env.NODE_ENV === 'test' || process.env.DB_TYPE === 'memory';

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1145',
  database: process.env.DB_NAME || 'zhangshang_shuati',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池或模拟数据库
let pool;
if (isTestEnv) {
  // 测试环境使用模拟数据库
  pool = {
    async execute(sql, params) {
      // 模拟数据库操作
      return [[], {}];
    },
    async getConnection() {
      return {
        release() {},
        async execute(sql, params) {
          return [[], {}];
        },
        async end() {}
      };
    },
    async end() {}
  };
} else {
  pool = mysql.createPool(dbConfig);
}

// 测试数据库连接
async function testConnection() {
  if (isTestEnv) {
    console.log('✅ 测试环境：使用内存数据库');
    return true;
  }
  
  try {
    const connection = await pool.getConnection();
    console.log('✅ 数据库连接成功!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

// 初始化数据库和表
async function initDatabase() {
  if (isTestEnv) {
    console.log('✅ 测试环境：跳过数据库初始化');
    return true;
  }
  
  try {
    console.log('🔄 开始初始化数据库...');
    
    // 创建数据库（如果不存在）
    const tempPool = mysql.createPool({
      ...dbConfig,
      database: undefined
    });
    
    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 ${dbConfig.database} 创建成功或已存在`);
    
    await tempPool.end();
    
    // 重新测试连接
    await testConnection();
    
    // 创建用户表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nickname VARCHAR(50),
        phone VARCHAR(20),
        avatar VARCHAR(255) DEFAULT '/static/default-avatar.png',
        gender ENUM('male', 'female', 'other') DEFAULT 'other',
        birthday DATE,
        bio TEXT,
        learning_goal TEXT,
        role ENUM('user', 'admin') DEFAULT 'user',
        status TINYINT DEFAULT 1 COMMENT '0:禁用 1:启用',
        level INT DEFAULT 1,
        points INT DEFAULT 0,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建用户统计表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        correct_rate DECIMAL(5,2) DEFAULT 0.00,
        continuous_days INT DEFAULT 0,
        total_questions INT DEFAULT 0,
        correct_questions INT DEFAULT 0,
        rank_position INT DEFAULT 0,
        last_practice_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // 创建题目表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type ENUM('single', 'multiple', 'judge') NOT NULL,
        options JSON,
        correct_answer VARCHAR(10) NOT NULL,
        explanation TEXT,
        difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
        subject VARCHAR(50),
        tags JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 创建用户答题记录表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT NOT NULL,
        user_answer VARCHAR(10) NOT NULL,
        is_correct BOOLEAN NOT NULL,
        answer_time INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);
    
    // 创建用户收藏表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_favorites (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_question (user_id, question_id)
      )
    `);
    
    // 创建错题记录表（基于答题记录中的错误答案）
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_wrong_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT NOT NULL,
        wrong_count INT DEFAULT 1,
        last_wrong_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_mastered BOOLEAN DEFAULT FALSE COMMENT '是否已掌握',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_question (user_id, question_id)
      )
    `);
    
    // 创建学习记录表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_study_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        study_date DATE NOT NULL,
        questions_count INT DEFAULT 0,
        correct_count INT DEFAULT 0,
        study_time INT DEFAULT 0 COMMENT '学习时长（秒）',
        categories JSON COMMENT '学习的分类',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_date (user_id, study_date)
      )
    `);
    
    console.log('✅ 数据库表创建成功!');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  testConnection,
  initDatabase
};