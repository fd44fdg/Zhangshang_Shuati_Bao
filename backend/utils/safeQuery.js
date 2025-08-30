/**
 * 安全的数据库查询工具
 * Linus式：简单、安全、无SQL注入风险
 */

const db = require('../config/db');

class SafeQuery {
  constructor(tableName) {
    this.tableName = tableName;
    this.validateTableName(tableName);
  }

  /**
   * 验证表名 - 防止SQL注入
   */
  validateTableName(tableName) {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }
  }

  /**
   * 安全的分页查询
   */
  async paginate(page = 1, limit = 10, where = {}, orderBy = 'id DESC') {
    const offset = (page - 1) * limit;
    
    // 构建WHERE条件
    const { whereClause, params } = this.buildWhereClause(where);
    
    // 验证排序字段
    const safeOrderBy = this.validateOrderBy(orderBy);
    
    // 查询总数
    const countQuery = `SELECT COUNT(*) as total FROM \`${this.tableName}\` ${whereClause}`;
    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;
    
    // 查询数据
    const dataQuery = `SELECT * FROM \`${this.tableName}\` ${whereClause} ORDER BY ${safeOrderBy} LIMIT ? OFFSET ?`;
    const [items] = await db.query(dataQuery, [...params, limit, offset]);
    
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 根据ID查询单条记录
   */
  async findById(id) {
    const query = `SELECT * FROM \`${this.tableName}\` WHERE id = ?`;
    const [items] = await db.query(query, [id]);
    return items[0] || null;
  }

  /**
   * 查询单条记录
   */
  async findOne(where = {}) {
    const { whereClause, params } = this.buildWhereClause(where);
    const query = `SELECT * FROM \`${this.tableName}\` ${whereClause} LIMIT 1`;
    const [items] = await db.query(query, params);
    return items[0] || null;
  }

  /**
   * 查询多条记录
   */
  async findMany(where = {}, orderBy = 'id DESC', limit = null) {
    const { whereClause, params } = this.buildWhereClause(where);
    const safeOrderBy = this.validateOrderBy(orderBy);
    
    let query = `SELECT * FROM \`${this.tableName}\` ${whereClause} ORDER BY ${safeOrderBy}`;
    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }
    
    const [items] = await db.query(query, params);
    return items;
  }

  /**
   * 创建记录
   */
  async create(data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    const fieldNames = fields.map(f => `\`${f}\``).join(', ');
    
    const query = `INSERT INTO \`${this.tableName}\` (${fieldNames}) VALUES (${placeholders})`;
    const [result] = await db.query(query, values);
    
    return {
      id: result.insertId,
      ...data
    };
  }

  /**
   * 更新记录
   */
  async update(id, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');
    
    const query = `UPDATE \`${this.tableName}\` SET ${setClause} WHERE id = ?`;
    const [result] = await db.query(query, [...values, id]);
    
    if (result.affectedRows === 0) {
      throw new Error(`Record with id ${id} not found`);
    }
    
    return await this.findById(id);
  }

  /**
   * 删除记录
   */
  async delete(id) {
    const query = `DELETE FROM \`${this.tableName}\` WHERE id = ?`;
    const [result] = await db.query(query, [id]);
    
    if (result.affectedRows === 0) {
      throw new Error(`Record with id ${id} not found`);
    }
    
    return { deleted: true, id };
  }

  /**
   * 构建WHERE子句
   */
  buildWhereClause(where) {
    if (!where || Object.keys(where).length === 0) {
      return { whereClause: '', params: [] };
    }

    const conditions = [];
    const params = [];

    for (const [field, value] of Object.entries(where)) {
      // 验证字段名
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
        throw new Error(`Invalid field name: ${field}`);
      }

      if (value === null) {
        conditions.push(`\`${field}\` IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => '?').join(', ');
        conditions.push(`\`${field}\` IN (${placeholders})`);
        params.push(...value);
      } else if (typeof value === 'object' && value.operator) {
        // 支持操作符：{ operator: 'LIKE', value: '%test%' }
        const operator = this.validateOperator(value.operator);
        conditions.push(`\`${field}\` ${operator} ?`);
        params.push(value.value);
      } else {
        conditions.push(`\`${field}\` = ?`);
        params.push(value);
      }
    }

    return {
      whereClause: `WHERE ${conditions.join(' AND ')}`,
      params
    };
  }

  /**
   * 验证排序字段
   */
  validateOrderBy(orderBy) {
    // 允许的排序格式：field ASC/DESC
    const pattern = /^[a-zA-Z_][a-zA-Z0-9_]*(\s+(ASC|DESC))?$/i;
    if (!pattern.test(orderBy)) {
      throw new Error(`Invalid ORDER BY clause: ${orderBy}`);
    }
    
    // 添加反引号保护字段名
    return orderBy.replace(/^([a-zA-Z_][a-zA-Z0-9_]*)/, '`$1`');
  }

  /**
   * 验证操作符
   */
  validateOperator(operator) {
    const allowedOperators = ['=', '!=', '<>', '>', '<', '>=', '<=', 'LIKE', 'NOT LIKE'];
    if (!allowedOperators.includes(operator.toUpperCase())) {
      throw new Error(`Invalid operator: ${operator}`);
    }
    return operator.toUpperCase();
  }

  /**
   * 执行原始查询（谨慎使用）
   */
  async rawQuery(query, params = []) {
    console.warn('⚠️  Using raw query. Make sure it\'s safe from SQL injection.');
    return await db.query(query, params);
  }
}

/**
 * 创建安全查询实例
 */
function createSafeQuery(tableName) {
  return new SafeQuery(tableName);
}

module.exports = {
  SafeQuery,
  createSafeQuery
};
