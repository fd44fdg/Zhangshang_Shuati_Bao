const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyToken: authMiddleware } = require('../middleware/auth');
const bannerService = require('../services/bannerService');
const { sendSuccess } = require('../utils/responseHandler');

// Public route to get visible banners for the H5 app
router.get('/', asyncHandler(async (req, res) => {
    const banners = await bannerService.getVisibleBanners();
    sendSuccess(res, banners);
}));

// --- Admin Routes ---

// Simple placeholder for admin check. In a real app, this would be more robust.
const requireAdmin = (req, res, next) => {
    // Assuming the authMiddleware adds a user object with roles.
    // This is a placeholder and might need adjustment based on the actual auth implementation.
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
    }
};

// Get all banners for the admin panel
router.get('/admin', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
    const banners = await bannerService.getAllBanners();
    sendSuccess(res, banners);
}));

// Create a new banner
router.post('/admin', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
    const newBanner = await bannerService.createBanner(req.body);
    sendSuccess(res, newBanner, 'Banner created successfully', 201);
}));

// Update a banner
router.put('/admin/:id', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
    const updatedBanner = await bannerService.updateBanner(req.params.id, req.body);
    sendSuccess(res, updatedBanner, 'Banner updated successfully');
}));

// Delete a banner
router.delete('/admin/:id', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
    await bannerService.deleteBanner(req.params.id);
    sendSuccess(res, null, 'Banner deleted successfully');
}));


module.exports = router;
