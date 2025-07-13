const express = require('express');
const { db } = require('../database/mock-db');
const { sendSuccess } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

/**
 * @route GET /system/settings
 * @description Get system settings
 * @access Public
 */
router.get('/settings', catchAsync(async (req, res) => {
    const settings = db.settings;
    if (!settings) {
        throw new ApiError(404, 'Settings not found');
    }
    sendSuccess(res, settings);
}));

/**
 * @route GET /system/health-check
 * @description A more detailed health check
 * @access Public
 */
router.get('/health-check', catchAsync(async (req, res) => {
    const healthCheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        database: 'connected' // In a real app, you'd check db connection status
    };
    sendSuccess(res, healthCheck);
}));

module.exports = router; 