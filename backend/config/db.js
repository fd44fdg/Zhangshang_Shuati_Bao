/**
 * 统一数据库接口
 * 根据环境变量自动选择MySQL或SQLite数据库
 */

const config = require('./index');

// 根据配置选择数据库适配器
const useSqlite = process.env.USE_SQLITE === 'true';

let dbAdapter;

if (useSqlite) {
  console.log('🗄️ 使用SQLite数据库');
  dbAdapter = require('./database-adapter');
} else {
  console.log('🗄️ 使用MySQL数据库');
  dbAdapter = require('./database');
}

/**
 * 测试数据库连接
 */
async function testConnection() {
  return await dbAdapter.testConnection();
}

/**
 * 初始化数据库
 */
async function initDatabase() {
  return await dbAdapter.initDatabase();
}

/**
 * 执行SQL查询 - 返回多行结果
 * @param {string} sql SQL语句
 * @param {Array} params 参数
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  try {
    if (useSqlite) {
      return await dbAdapter.query(sql, params);
    } else {
      // MySQL格式：query返回[rows, fields]，我们只需要rows
      const [rows] = await dbAdapter.query(sql, params);
      return rows;
    }
  } catch (error) {
    console.error('数据库查询错误:', error.message);
    throw error;
  }
}

/**
 * 执行SQL查询 - 返回单行结果
 * @param {string} sql SQL语句
 * @param {Array} params 参数
 * @returns {Promise<Object|null>} 查询结果
 */
async function getOne(sql, params = []) {
  try {
    if (useSqlite) {
      return await dbAdapter.getOne(sql, params);
    } else {
      const [rows] = await dbAdapter.query(sql, params);
      return rows.length > 0 ? rows[0] : null;
    }
  } catch (error) {
    console.error('数据库查询错误:', error.message);
    throw error;
  }
}

/**
 * 插入数据
 * @param {string} table 表名
 * @param {Object} data 数据对象
 * @returns {Promise<Object>} 插入结果
 */
async function insert(table, data) {
  try {
    if (useSqlite) {
      return await dbAdapter.insert(table, data);
    } else {
      return await dbAdapter.insert(table, data);
    }
  } catch (error) {
    console.error('数据插入错误:', error.message);
    throw error;
  }
}

/**
 * 更新数据
 * @param {string} table 表名
 * @param {Object} data 数据对象
 * @param {Object} where 条件对象
 * @returns {Promise<Object>} 更新结果
 */
async function update(table, data, where) {
  try {
    if (useSqlite) {
      // SQLite适配器暂未实现update方法，使用原生SQL
      const dataKeys = Object.keys(data);
      const dataValues = Object.values(data);
      const whereKeys = Object.keys(where);
      const whereValues = Object.values(where);
      
      const setClause = dataKeys.map(key => `${key} = ?`).join(', ');
      const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
      
      const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
      const result = await dbAdapter.query(sql, [...dataValues, ...whereValues]);
      
      return { affectedRows: result.changes || 0 };
    } else {
      return await dbAdapter.update(table, data, where);
    }
  } catch (error) {
    console.error('数据更新错误:', error.message);
    throw error;
  }
}

/**
 * 删除数据
 * @param {string} table 表名
 * @param {Object} where 条件对象
 * @returns {Promise<Object>} 删除结果
 */
async function remove(table, where) {
  try {
    if (useSqlite) {
      // SQLite适配器暂未实现remove方法，使用原生SQL
      const whereKeys = Object.keys(where);
      const whereValues = Object.values(where);
      
      const whereClause = whereKeys.map(key => `${key} = ?`).join(' AND ');
      
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
      const result = await dbAdapter.query(sql, whereValues);
      
      return { affectedRows: result.changes || 0 };
    } else {
      return await dbAdapter.remove(table, where);
    }
  } catch (error) {
    console.error('数据删除错误:', error.message);
    throw error;
  }
}

/**
 * 开始事务（仅MySQL支持）
 * @returns {Promise<Object>} 连接对象
 */
async function beginTransaction() {
  if (useSqlite) {
    throw new Error('SQLite暂不支持事务操作');
  } else {
    // 避免直接导入database.js避免警告
    const mysql = require('mysql2/promise');
    const config = require('./index');
    
    // 使用简化的连接配置，避免无效选项
    const connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      port: config.database.port
    });
    
    await connection.beginTransaction();
    return connection;
  }
}

/**
 * 提交事务（仅MySQL支持）
 * @param {Object} connection 连接对象
 */
async function commitTransaction(connection) {
  if (useSqlite) {
    throw new Error('SQLite暂不支持事务操作');
  } else {
    await connection.commit();
    connection.release();
  }
}

/**
 * 回滚事务（仅MySQL支持）
 * @param {Object} connection 连接对象
 */
async function rollbackTransaction(connection) {
  if (useSqlite) {
    throw new Error('SQLite暂不支持事务操作');
  } else {
    await connection.rollback();
    connection.release();
  }
}

/**
 * 执行原生SQL（需要兼容性处理）
 * @param {string} sql SQL语句
 * @param {Array} params 参数
 * @returns {Promise<Array>} 执行结果
 */
async function execute(sql, params = []) {
  try {
    if (useSqlite) {
      // SQLite：直接返回查询结果
      return await dbAdapter.query(sql, params);
    } else {
      // MySQL：使用简化连接避免警告
      const mysql = require('mysql2/promise');
      const config = require('./index');
      
      const connection = await mysql.createConnection({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        database: config.database.name,
        port: config.database.port
      });
      
      const result = await connection.execute(sql, params);
      await connection.end();
      return result;
    }
  } catch (error) {
    console.error('SQL执行错误:', error.message);
    throw error;
  }
}

module.exports = {
  testConnection,
  initDatabase,
  query,
  getOne,
  insert,
  update,
  remove,
  execute,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  // 标识当前使用的数据库类型
  isUsingSqlite: useSqlite,
  isMysql: !useSqlite
};