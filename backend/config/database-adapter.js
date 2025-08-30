const db = require('./db'); // 引入我们统一的 Knex 实例
const fs = require('fs');
const path = require('path');

async function testConnection() {
  try {
    await db.raw('SELECT 1');
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    // 如果是 SQLite 且数据库文件不存在，尝试创建目录
    if (error.code === 'SQLITE_CANTOPEN') {
      const dbPath = db.client.config.connection.filename;
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        console.log(`尝试创建数据库目录: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
        console.log('目录已创建，请重试服务器启动。');
      }
    }
    return false;
  }
}

async function initDatabase() {
  try {
    console.log('🚀 正在运行数据库迁移...');
    await db.migrate.latest();
    console.log('✅ 数据库迁移完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error.message);
    return false;
  }
}

module.exports = {
  testConnection,
  initDatabase,
};
