const knex = require('knex');
const knexfile = require('../knexfile');

const environment = process.env.NODE_ENV || 'development';
const useRealTestDb = (environment === 'test') && (process.env.USE_REAL_DB_FOR_TEST === 'true');
const cfgEnv = (environment === 'test' && process.env.USE_REAL_DB_FOR_TEST === 'true') ? 'development' : environment;
const config = knexfile[cfgEnv];

if (!config) {
  throw new Error(`Knex configuration for environment '${environment}' not found in knexfile.js`);
}

// In tests, stub knex to avoid loading native sqlite bindings unless explicitly using real DB for tests

let db;
if (process.env.NODE_ENV === 'test') {
  try {
    const knexEmitter = require('events');
  } catch (_) {}

  // Only initialize real Knex when tests explicitly request a real DB and the configured dialect is MySQL
  const isMysqlConfigured = config && (config.client && config.client.toString().includes('mysql') || config.dialect === 'mysql');
  if (useRealTestDb && isMysqlConfigured) {
    db = knex(config);
  } else {
    // Use mock DB for tests to avoid native bindings and speed up tests
    db = require('../tests/mocks/db');
  }
} else {
  db = knex(config);
}

// Add compatibility layer for old db.query() calls
db.query = async function(sql, params = []) {
  const result = await db.raw(sql, params);
  // MySQL returns results in format [rows, fields]
  // Knex raw query returns different formats based on database driver
  if (Array.isArray(result) && result.length >= 1) {
    return result;
  }
  // Handle MySQL driver - result is array with [rows, fields]
  if (result && Array.isArray(result[0])) {
    return result;
  }
  // Fallback for other formats
  return [result.rows || result || [], result.fields || []];
};

// Add compatibility for db.execute() calls
db.execute = async function(sql, params = []) {
  const result = await db.raw(sql, params);
  if (Array.isArray(result) && result.length >= 1) {
    return result;
  }
  if (result && Array.isArray(result[0])) {
    return result;
  }
  return [result.rows || result || [], result.fields || []];
};

// Add compatibility for db.getOne() calls
db.getOne = async function(sql, params = []) {
  const [rows] = await db.query(sql, params);
  return rows && rows.length > 0 ? rows[0] : null;
};

// Hook DB query timings (only when real knex is used)
try {
  const { incDbQuery } = require('../utils/metrics');
  if (db && db.client && db.client.on) {
    const pending = new Map();
    db.client.on('query', (query) => {
      pending.set(query.__knexQueryUid, Date.now());
    });
    db.client.on('query-response', (_resp, query) => {
      const start = pending.get(query.__knexQueryUid);
      if (start) {
        const dur = Date.now() - start;
        incDbQuery(dur);
        pending.delete(query.__knexQueryUid);
      }
    });
  }
} catch (_) {}

module.exports = db;
