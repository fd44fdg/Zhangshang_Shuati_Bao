const mysql = require('mysql2/promise')
const config = require('./index').database
const path = require('path')

// If sqlite is configured, export a lightweight pool-like shim to avoid breaking tests
if (config && (config.client === 'sqlite' || config.dialect === 'sqlite')) {
  // Create a minimal shim that throws if used for real MySQL operations
  module.exports = {
    pool: {
      getConnection: async () => {
        throw new Error('SQLite configured - real MySQL pool is not available')
      },
      end: async () => {}
    }
  }
} else {
  const poolConfig = {
    host: config.host || 'localhost',
    port: config.port || 3306,
    user: config.user || config.username || 'root',
    password: config.password || '',
    database: config.name || config.database || 'shuati_db',
    waitForConnections: true,
    connectionLimit: (config.pool && config.pool.max) || 10,
    queueLimit: 0
  }

  const pool = mysql.createPool(poolConfig)

  module.exports = { pool }
}
