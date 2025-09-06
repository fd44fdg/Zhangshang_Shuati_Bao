const express = require('express');
const { sendSuccess } = require('../utils/responseHandler');
const { asyncHandler } = require('../middleware/errorHandler');
const systemService = require('../services/systemService');

const router = express.Router();

/**
 * @route GET /system/settings
 * @description Get system settings
 * @access Public
 */
router.get('/settings', asyncHandler(async (req, res) => {
    const settings = await systemService.getSystemSettings();
    sendSuccess(res, settings);
}));

/**
 * @route GET /system/health-check
 * @description A more detailed health check
 * @access Public
 */
router.get('/health-check', asyncHandler(async (req, res) => {
    const { healthCheck, isHealthy } = await systemService.getHealthCheck();
    
    if (!isHealthy) {
        return res.status(503).json({
            code: 50300,
            message: 'Service Unavailable',
            data: healthCheck
        });
    }
    
    sendSuccess(res, healthCheck);
}));

/**
 * @route POST /system/client-error
 * @description Receive client-side unhandled errors for debugging
 * @access Internal / Dev
 */
router.post('/client-error', asyncHandler(async (req, res) => {
    const payload = req.body || {};
    // Use existent logger to capture client info
    const logger = require('../utils/logger');
    logger.error('Client-side error reported', {
        url: payload.url,
        message: payload.message,
        stack: payload.stack,
        userAgent: req.get('User-Agent'),
        extra: payload.extra || null,
        ts: Date.now()
    });

    // keep response minimal
    sendSuccess(res, { received: true });
}));

module.exports = router; 