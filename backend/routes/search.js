const express = require('express');
const db = require('../config/db');
const { sendSuccess } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * @api {get} /search 全局搜索
 * @apiName GlobalSearch
 * @apiGroup Search
 * @apiVersion 1.0.0
 *
 * @apiParam {String} keyword 搜索关键词.
 * @apiParam {String} [type] 搜索类型 (all, knowledge, question, article). 默认为 'all'.
 * @apiParam {Number} [page=1] 页码.
 * @apiParam {Number} [limit=10] 每页数量.
 *
 * @apiSuccess {Object[]} results 搜索结果列表.
 * @apiSuccess {Number} total 结果总数.
 * @apiSuccess {Number} page 当前页码.
 * @apiSuccess {Number} limit 每页数量.
 * @apiSuccess {Boolean} hasMore 是否有更多结果.
 */
router.get('/', asyncHandler(async (req, res) => {
    const { keyword, type = 'all', page = 1, limit = 10 } = req.query;

    if (!keyword || !keyword.trim()) {
        return sendSuccess(res, { items: [], total: 0 });
    }

    const searchTerm = `%${keyword.trim()}%`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    let queryParts = [];
    let countParts = [];
    const params = [];

    if (type === 'all' || type === 'question') {
        queryParts.push(`(SELECT id, title, 'question' as type, created_at FROM questions WHERE title LIKE ?)`);
        countParts.push(`(SELECT COUNT(*) FROM questions WHERE title LIKE ?)`);
        params.push(searchTerm);
    }
    if (type === 'all' || type === 'article') {
        queryParts.push(`(SELECT id, title, 'article' as type, created_at FROM articles WHERE title LIKE ? OR content LIKE ?)`);
        countParts.push(`(SELECT COUNT(*) FROM articles WHERE title LIKE ? OR content LIKE ?)`);
        params.push(searchTerm, searchTerm);
    }
    if (type === 'all' || type === 'knowledge') {
        queryParts.push(`(SELECT id, name as title, 'knowledge' as type, created_at FROM knowledge_points WHERE name LIKE ?)`);
        countParts.push(`(SELECT COUNT(*) FROM knowledge_points WHERE name LIKE ?)`);
        params.push(searchTerm);
    }

    if (queryParts.length === 0) {
        return sendSuccess(res, { items: [], total: 0 });
    }

    const fullQuery = queryParts.join(' UNION ALL ') + ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    const countQuery = `SELECT (${countParts.join(' + ')}) as total`;

    const [results] = await db.query(fullQuery, [...params, limitNum, offset]);
    const [[{ total }]] = await db.query(countQuery, params);

    sendSuccess(res, { items: results, total });
}));

/**
 * @api {get} /search/hot-keywords 获取热门搜索词
 * @apiName GetHotKeywords
 * @apiGroup Search
 * @apiVersion 1.0.0
 *
 * @apiSuccess {String[]} keywords 热门关键词列表.
 */
router.get('/hot-keywords', (req, res) => {
    const keywords = ['Vue', 'React', 'JavaScript', 'CSS', 'Node.js', 'TypeScript', 'Webpack', '面试', '算法', '性能优化'];
    sendSuccess(res, keywords);
});

module.exports = router;