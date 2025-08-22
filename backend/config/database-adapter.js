const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/local.db');
let db = null;

async function getDb() {
  if (!db) {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
  }
  return db;
}

async function testConnection() {
  try {
    const db = await getDb();
    await db.get('SELECT 1');
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

async function initDatabase() {
  try {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = await getDb();

    const tables = [
      `CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL CHECK (type IN ('question', 'article')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS system_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          app_name TEXT DEFAULT '掌上刷题宝',
          app_version TEXT DEFAULT '1.0.0',
          maintenance_mode BOOLEAN DEFAULT FALSE,
          registration_enabled BOOLEAN DEFAULT TRUE,
          max_login_attempts INTEGER DEFAULT 5,
          session_timeout INTEGER DEFAULT 3600,
          config TEXT DEFAULT '{}',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          password TEXT,
          password_hash TEXT,
          avatar TEXT,
          avatar_url TEXT,
          openid TEXT UNIQUE,
          nickname TEXT,
          gender TEXT,
          birthday DATE,
          bio TEXT,
          learning_goal TEXT,
          level INTEGER DEFAULT 1,
          points INTEGER DEFAULT 0,
          role TEXT DEFAULT 'user',
          status INTEGER DEFAULT 1,
          continuous_check_in_days INTEGER DEFAULT 0,
          last_check_in_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS user_checkins (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          checkin_date DATE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE(user_id, checkin_date)
      )`,
      `CREATE TABLE IF NOT EXISTS user_stats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          correct_rate REAL DEFAULT 0.0,
          continuous_days INTEGER DEFAULT 0,
          total_questions INTEGER DEFAULT 0,
          correct_questions INTEGER DEFAULT 0,
          rank_position INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS user_answers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          user_answer TEXT,
          is_correct BOOLEAN,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS user_study_records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          is_correct BOOLEAN,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS user_favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
          UNIQUE(user_id, question_id)
      )`,
      `CREATE TABLE IF NOT EXISTS user_wrong_questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          question_id INTEGER NOT NULL,
          wrong_count INTEGER DEFAULT 1,
          last_wrong_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_mastered BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
          UNIQUE(user_id, question_id)
      )`,
      `CREATE TABLE IF NOT EXISTS question_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('single', 'multiple', 'single_choice', 'multiple_choice', 'fill_blank', 'essay')),
          difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
          category_id INTEGER,
          options TEXT, -- JSON string
          correct_answer TEXT,
          explanation TEXT,
          view_count INTEGER DEFAULT 0,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES question_categories(id) ON DELETE SET NULL,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )`,
      `CREATE TABLE IF NOT EXISTS article_categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          slug TEXT UNIQUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          summary TEXT,
          category_id INTEGER,
          author TEXT,
          cover_image TEXT,
          view_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE SET NULL
      )`
    ];

    for (const table of tables) {
      await db.exec(table);
    }

    console.log('✅ 数据库初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    return false;
  }
}

async function query(sql, params = []) {
  try {
    const db = await getDb();
    const rows = await db.all(sql, params);
    return rows;
  } catch (error) {
    console.error('查询执行失败:', error.message);
    throw error;
  }
}

async function getOne(sql, params = []) {
  try {
    const db = await getDb();
    const row = await db.get(sql, params);
    return row;
  } catch (error) {
    console.error('查询执行失败:', error.message);
    throw error;
  }
}

async function insert(table, data) {
    const db = await getDb();
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(',');
    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
    const result = await db.run(sql, values);
    return { id: result.lastID };
}


async function closeConnection() {
  if (db) {
    await db.close();
    db = null;
    console.log('数据库连接已关闭');
  }
}

module.exports = {
  testConnection,
  initDatabase,
  query,
  getOne,
  insert,
  closeConnection
};
