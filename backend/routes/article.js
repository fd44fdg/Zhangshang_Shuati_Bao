
const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth').verifyToken;
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// --- Article Categories ---

router.get('/categories', asyncHandler(async (req, res) => {
    const [categories] = await db.query(`
        SELECT * FROM article_categories
        ORDER BY sort_order ASC, name ASC
    `);
    sendSuccess(res, categories);
}));

router.post('/categories', auth, asyncHandler(async (req, res) => {
    const { name, description, sort_order = 0 } = req.body;

    if (!name) {
        throw new ApiError(400, '分类名称不能为空');
    }

    const [result] = await db.query(`
        INSERT INTO article_categories (name, description, sort_order)
        VALUES (?, ?, ?)
    `, [name, description, sort_order]);

    sendSuccess(res, { id: result.insertId, name, description, sort_order }, '分类创建成功', 201);
}));

router.put('/categories/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { name, description, sort_order } = req.body;
    const result = await Category.update(id, { name, description, sort_order });
    if (!result) {
        return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: result });
});

router.delete('/categories/:id', auth, async (req, res) => {
    const { id } = req.params;
    const articleCount = await Article.count({ category_id: id });
    if (articleCount > 0) {
        return res.status(400).json({ success: false, message: 'Cannot delete category with associated articles' });
    }
    const deleted = await Category.destroy(id);
    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(204).send();
});

// --- Articles ---

router.get('/', async (req, res) => {
    const { page = 1, limit = 10, category_id } = req.query;
    const db = require('../config/db');
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    if (category_id) {
        whereClause += ' AND category_id = ?';
        params.push(category_id);
    }
    
    const [totalResult] = await db.query(`SELECT COUNT(*) as total FROM articles ${whereClause}`, params);
    const total = totalResult[0].total;
    
    const dataSql = `
        SELECT a.id, a.title, a.status, a.views, a.created_at, ac.name as category_name, u.username as author_name
        FROM articles a
        LEFT JOIN article_categories ac ON a.category_id = ac.id
        LEFT JOIN users u ON a.author_id = u.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
    `;
    const offset = (page - 1) * limit;
    const [articles] = await db.query(dataSql, [...params, parseInt(limit), parseInt(offset)]);
    res.status(200).json({ success: true, data: { items: articles, total } });
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    const article = await Article.findOne({
        where: { id },
        include: [
            {
                table: 'article_categories',
                foreignKey: 'category_id',
                primaryKey: 'id'
            },
            {
                table: 'users',
                foreignKey: 'author_id',
                primaryKey: 'id'
            }
        ]
    });
    
    if (!article) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }
    
    // Increment views
    await Article.update(id, { views: (article.views || 0) + 1 });
    
    res.status(200).json({ success: true, data: article });
});

router.post('/', auth, async (req, res) => {
    const { title, content, category_id, status = 'draft' } = req.body;
    const author_id = req.user.id;
    
    const result = await Article.create({ title, content, category_id, author_id, status });
    res.status(201).json({ success: true, data: result });
});

router.put('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const { title, content, category_id, status } = req.body;
    
    const result = await Article.update(id, { title, content, category_id, status });
    res.status(200).json({ success: true, data: result });
});

router.delete('/:id', auth, async (req, res) => {
    const { id } = req.params;
    const deleted = await Article.destroy(id);
    if (!deleted) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }
    res.status(204).send();
});

module.exports = router;
