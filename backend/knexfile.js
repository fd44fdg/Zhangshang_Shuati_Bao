// knexfile.js
require('dotenv').config({ path: './.env' });
const path = require('path');

// 读取现有配置，避免重复定义
const config = require('./config');

const BASE_PATH = path.join(__dirname, 'database');

module.exports = {
  development: {
    client: config.database.dialect,
    connection: config.database.dialect === 'sqlite' 
      ? { filename: config.database.storage }
      : {
        host: config.database.host,
        port: config.database.port,
        user: config.database.user,
        password: config.database.password,
        database: config.database.name,
      },
    migrations: {
      directory: path.join(BASE_PATH, 'migrations'),
    },
    seeds: {
      directory: path.join(BASE_PATH, 'seeds'),
    },
    useNullAsDefault: config.database.dialect === 'sqlite',
  },

  // 你可以为 testing 和 production 添加类似配置
  // 例如，testing 环境可以连接到一个专用的测试数据库
  testing: {
    // ... 类似配置
  },

  production: {
    // ... 类似配置
  }
};
