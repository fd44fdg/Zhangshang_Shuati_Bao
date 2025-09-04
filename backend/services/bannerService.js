const db = require('../config/db');
const ApiError = require('../utils/ApiError');

const bannerService = {
    async getVisibleBanners() {
        const [banners] = await db.query(
            'SELECT id, title, image_url, link_url FROM banners WHERE is_visible = ? ORDER BY sort_order ASC, created_at DESC',
            [true]
        );
        return banners;
    },

    async getAllBanners() {
        const [banners] = await db.query('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC');
        return banners;
    },

    async createBanner(bannerData) {
        const { title, image_url, link_url = null, sort_order = 0, is_visible = true } = bannerData;
        if (!title || !image_url) {
            throw new ApiError(400, 'Title and image URL are required');
        }
        const [result] = await db.query(
            'INSERT INTO banners (title, image_url, link_url, sort_order, is_visible) VALUES (?, ?, ?, ?, ?)',
            [title, image_url, link_url, sort_order, is_visible]
        );
        return { id: result.insertId, ...bannerData };
    },

    async updateBanner(id, bannerData) {
        const { title, image_url, link_url, sort_order, is_visible } = bannerData;
        const [result] = await db.query(
            'UPDATE banners SET title = ?, image_url = ?, link_url = ?, sort_order = ?, is_visible = ? WHERE id = ?',
            [title, image_url, link_url, sort_order, is_visible, id]
        );
        if (result.affectedRows === 0) {
            throw new ApiError(404, 'Banner not found');
        }
        return { id, ...bannerData };
    },

    async deleteBanner(id) {
        const [result] = await db.query('DELETE FROM banners WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            throw new ApiError(404, 'Banner not found');
        }
        return true;
    }
};

module.exports = bannerService;
