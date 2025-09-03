// Lightweight in-process metrics aggregator (no external deps)
// Focus: HTTP request timing and DB query timing

const MAX_SAMPLES = 1000;

const httpStats = {
  total: 0,
  errors: 0,
  sum: 0,
  routes: new Map(), // key: METHOD path, value: { total, errors, sum, samples: [] }
};

const dbStats = {
  total: 0,
  sum: 0,
  samples: [],
};

function boundedPush(arr, v, cap = MAX_SAMPLES) {
  arr.push(v);
  if (arr.length > cap) arr.shift();
}

function recordRequest(method, routeKey, statusCode, durationMs) {
  httpStats.total += 1;
  httpStats.sum += durationMs;
  if (statusCode >= 400) httpStats.errors += 1;
  const key = `${method.toUpperCase()} ${routeKey}`;
  let s = httpStats.routes.get(key);
  if (!s) {
    s = { total: 0, errors: 0, sum: 0, samples: [] };
    httpStats.routes.set(key, s);
  }
  s.total += 1;
  s.sum += durationMs;
  if (statusCode >= 400) s.errors += 1;
  boundedPush(s.samples, durationMs);
}

function incDbQuery(durationMs) {
  dbStats.total += 1;
  dbStats.sum += durationMs;
  boundedPush(dbStats.samples, durationMs);
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  const idx = Math.min(a.length - 1, Math.max(0, Math.floor((p / 100) * a.length) - 1));
  return a[idx];
}

function getHttpStats() {
  const avg = httpStats.total ? Math.round(httpStats.sum / httpStats.total) : 0;
  const perRoute = {};
  for (const [k, v] of httpStats.routes.entries()) {
    perRoute[k] = {
      total: v.total,
      errors: v.errors,
      avg: v.total ? Math.round(v.sum / v.total) : 0,
      p95: percentile(v.samples, 95),
    };
  }
  return {
    total: httpStats.total,
    errors: httpStats.errors,
    avg,
    routes: perRoute,
  };
}

function getDbStats() {
  const avg = dbStats.total ? Math.round(dbStats.sum / dbStats.total) : 0;
  return {
    total: dbStats.total,
    avg,
    p95: percentile(dbStats.samples, 95),
  };
}

module.exports = {
  recordRequest,
  incDbQuery,
  getHttpStats,
  getDbStats,
};
