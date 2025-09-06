const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import configuration and utilities
const config = require('./config');
const logger = require('./utils/logger');
const ApiError = require('./utils/ApiError');
const { sendSuccess, sendError } = require('./utils/responseHandler');

// Import production middleware
const { validate, schemas, rateLimits, securityHeaders } = require('./middleware/validation');
const { monitoring, healthCheckMiddleware, metricsMiddleware, requestTracker } = require('./middleware/monitoring');
const { globalErrorHandler } = require('./middleware/errorHandler');

// Import database
const { testConnection, initDatabase } = require('./config/database-adapter');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const questionRoutes = require('./routes/question');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const studyRoutes = require('./routes/study');
const knowledgeRoutes = require('./routes/knowledge');
const systemRoutes = require('./routes/system');
const searchRoutes = require('./routes/search');
let checkinRoutes = null;
if (process.env.NODE_ENV !== 'test') {
  checkinRoutes = require('./routes/checkin');
}
const statsRoutes = require('./routes/stats');
const articleRoutes = require('./routes/article');
const examRoutes = require('./routes/exam');
const bannerRoutes = require('./routes/banner');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = config.ports.backend;
// (Re-added) API prefix (was accidentally removed causing ReferenceError)
const apiPrefix = `${config.api.prefix}/${config.api.version}`;

// ============ 分层诊断配置 ============
// 通过 DIAG_LAYER 控制初始化到哪个层级，便于二分定位同步阻塞
// 未设置 => 全部执行
const L = parseInt(process.env.DIAG_LAYER || '999', 10);
function enable(layer, fn) { if (L >= layer) fn(); }
if (process.env.DIAG_LAYER) {
  console.log(`[DIAG] DIAG_LAYER=${L}`);
  // 事件循环活性探针：若输出明显停顿则表示主线程被阻塞
  setInterval(()=>process.stdout.write('•'),1000).unref();
}

// Instrument app.listen to help debug test server startup during e2e tests
// This logs when supertest or other code calls app.listen()
const _originalListen = app.listen.bind(app);
app.listen = (...args) => {
  console.log('[E2E-DEBUG] app.listen called with args:', args && args.length ? args : 'no-args');
  return _originalListen(...args);
};

// ========================================
// Production Security Middleware
// ========================================

// Layer 0: 基础 + 快速健康 (无 DB)
enable(0, () => {
  app.use(cookieParser());
  app.get(`${apiPrefix}/health`, (req,res)=>res.json({status:'ok',fast:true,ts:Date.now()}));
  app.get(`${apiPrefix}/ping`, (req,res)=>res.json({pong:true,ts:Date.now()}));
});

// Layer 1: 安全 & CORS
enable(1, () => {
  app.use(securityHeaders);
  if (process.env.NODE_ENV === 'production') app.set('trust proxy',1);
  app.use(cors({
    origin:(origin,cb)=>{ if(!origin) return cb(null,true); if(config.cors.origins.includes(origin)) return cb(null,true); logger.security('CORS violation attempt',{origin,allowed:config.cors.origins}); cb(new Error('Not allowed by CORS')); },
    credentials:config.cors.credentials,
    methods:config.cors.methods,
    allowedHeaders:config.cors.allowedHeaders,
    maxAge:config.cors.maxAge
  }));
});

// ========================================
// Monitoring and Logging
// ========================================

enable(2, () => {
  app.use((req,res,next)=>{ const start=Date.now(); console.log('[REQ]',req.method,req.originalUrl); res.on('finish',()=>console.log('[RES]',req.method,req.originalUrl,res.statusCode,(Date.now()-start)+'ms')); next(); });
  app.use(requestTracker);
  // 旧综合健康 -> /health/full，避免覆盖快速健康
  app.use((req,res,next)=>{ if(req.path==='/health/full') return healthCheckMiddleware(req,res,next); next(); });
  app.get('/healthz',(req,res)=>res.json({status:'ok',z:true,ts:Date.now()}));
  if (process.env.NODE_ENV !== 'production') app.use(metricsMiddleware);
});

// ========================================
// Rate Limiting
// ========================================

enable(3, () => {
  if (process.env.NODE_ENV !== 'test') {
    app.use(rateLimits.api);
    app.use('/api/v1/auth/login', rateLimits.auth);
    app.use('/api/v1/auth/register', rateLimits.auth);
    app.use('/api/v1/search', rateLimits.search);
  }
});

// ========================================
// Request Parsing
// ========================================

// Body parsing with size limits
enable(4, () => {
  app.use(bodyParser.json({ 
    limit: config.upload.maxSize,
    verify: (req, res, buf) => { if (buf.length === 0) logger.warn('Empty request body received', { path: req.path }); }
  }));
  app.use(bodyParser.urlencoded({ extended: true, limit: config.upload.maxSize, parameterLimit: 100 }));
});

// ========================================
// Static File Serving
// ========================================

// Secure static file serving
enable(5, () => {
  app.use('/static', express.static('public', {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
    etag: true,
    lastModified: true,
    setHeaders: (res) => { res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Frame-Options','DENY'); }
  }));
  app.use('/static/uploads', express.static(path.join(__dirname,'public/uploads'), { maxAge: process.env.NODE_ENV==='production' ? '1h':'0', etag:true }));
});

// ========================================
// API Routes with Validation
// ========================================

// apiPrefix defined above

enable(6, () => {
  app.use(`${apiPrefix}/auth`, authRoutes);
});

enable(7, () => {
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/questions`, questionRoutes);
  app.use(`${apiPrefix}/study`, studyRoutes);
  app.use(`${apiPrefix}/admin`, adminRoutes);
  app.use(`${apiPrefix}/admin/content`, contentRoutes);
  app.use(`${apiPrefix}/knowledge`, knowledgeRoutes);
  app.use(`${apiPrefix}/system`, systemRoutes);
  app.use(`${apiPrefix}/search`, searchRoutes);
  app.use(`${apiPrefix}/stats`, statsRoutes);
  if (checkinRoutes) app.use(`${apiPrefix}`, checkinRoutes);
  app.use(`${apiPrefix}/articles`, articleRoutes);
  app.use(`${apiPrefix}/exams`, examRoutes);
  app.use(`${apiPrefix}/banners`, bannerRoutes);
  app.use(`${apiPrefix}/upload`, uploadRoutes);
});

// ========================================
// Root Endpoint
// ========================================

app.get('/', (req, res) => {
  const response = {
    name: '掌上刷题宝 API 服务器',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    status: 'running',
    timestamp: new Date().toISOString()
  };

  // Don't expose internal URLs in production
  if (process.env.NODE_ENV !== 'production') {
    response.docs = `${apiPrefix}/docs`;
    response.health = '/health';
    response.metrics = '/metrics';
  }

  sendSuccess(res, response);
});

// ========================================
// Error Handling
// ========================================

enable(8, () => {
  app.use('*', (req, res, next) => {
    logger.warn('404 Not Found', { path: req.originalUrl, method: req.method, ip: req.ip, userAgent: req.get('User-Agent') });
    next(new ApiError(404, '接口不存在'));
  });
  app.use(globalErrorHandler);
});

// ========================================
// Server Startup and Shutdown
// ========================================

async function startServer() {
  try {
    logger.info('Starting server initialization...');

    // Validate environment configuration
    if (process.env.NODE_ENV === 'production') {
      logger.info('Production environment detected - validating configuration');
      
      if (config.cors.origins.length === 0) {
        throw new Error('CORS_ORIGINS must be set in production');
      }
      
      logger.info('Production configuration validated');
    }

    // Initialize database
    logger.info('Initializing database connection...');
    await initDatabase();
    logger.info('Database initialized successfully');

    // Setup graceful shutdown
    monitoring.setupGracefulShutdown();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        pid: process.pid
      });

      console.log(`🚀 服务器已启动`);
      console.log(`📍 地址: http://localhost:${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || 'development'}`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 健康检查: http://localhost:${PORT}/health`);
        console.log(`📊 监控指标: http://localhost:${PORT}/metrics`);
      }
    });

    // Configure server for production
    if (process.env.NODE_ENV === 'production') {
      server.keepAliveTimeout = 65000;
      server.headersTimeout = 66000;
    }

    return server;

  } catch (error) {
    logger.error('Server startup failed', { error: error.message, stack: error.stack });
    console.error('❌ 服务器启动失败:', error.message);
    process.exit(1);
  }
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(error => {
    logger.error('Unhandled server startup error', { error: error.message });
    process.exit(1);
  });
}

module.exports = app;