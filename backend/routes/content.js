const express = require('express');
const db = require('../config/db');
const config = require('../config');
const { verifyToken: authMiddleware } = require('../middleware/auth');
const { sendSuccess } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');
const { asyncHandler } = require('../middleware/errorHandler');
const jwt = require('jsonwebtoken');

const router = express.Router();

// ===================================
// Article Category Management
// ===================================

router.get('/articles/categories', asyncHandler(async (req, res) => {
    const categories = await db.query(`
        SELECT c.*, COUNT(a.id) as articleCount 
        FROM article_categories c 
        LEFT JOIN articles a ON c.id = a.category_id 
        GROUP BY c.id
    `);
    sendSuccess(res, { items: categories, total: categories.length });
}));

router.post('/articles/categories', authMiddleware, asyncHandler(async (req, res) => {
    const { name, description, slug } = req.body;
    if (!name || !slug) throw new ApiError(400, '分类名称和slug不能为空');

    const [result] = await db.execute('INSERT INTO article_categories (name, description, slug) VALUES (?, ?, ?)', [name, description || '', slug]);
    const newCategory = await db.getOne('SELECT * FROM article_categories WHERE id = ?', [result.insertId || result.id]);
    sendSuccess(res, newCategory[0], '分类创建成功', 201);
}));

router.put('/articles/categories/:id', authMiddleware, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, slug } = req.body;
    if (!name && !description && !slug) throw new ApiError(400, '没有要更新的字段');

    // This is a simplified update. A more robust version would build the SET clause dynamically.
    await pool.execute('UPDATE article_categories SET name = ?, description = ?, slug = ? WHERE id = ?', [name, description, slug, id]);
    const [updatedCategory] = await pool.execute('SELECT * FROM article_categories WHERE id = ?', [id]);
    if (updatedCategory.length === 0) throw new ApiError(404, '分类不存在');
    sendSuccess(res, updatedCategory[0], '分类更新成功');
}));

router.delete('/articles/categories/:id', authMiddleware, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM article_categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new ApiError(404, '分类不存在');
    sendSuccess(res, null, '分类删除成功');
}));

// ===================================
// Article Management
// ===================================

router.get('/articles', asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, keyword, category, status, sort = 'latest' } = req.query;
    // Note: The logic for filtering and sorting would be more complex in a real app
    // and should be handled with dynamic SQL query building. This is a simplified version.
    const [articles] = await pool.execute('SELECT a.*, u.username as authorName, ac.name as categoryName FROM articles a JOIN users u ON a.author_id = u.id JOIN article_categories ac ON a.category_id = ac.id ORDER BY a.created_at DESC LIMIT ? OFFSET ?', [parseInt(limit), (page - 1) * limit]);
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM articles');
    
    sendSuccess(res, { items: articles, total });
}));

router.get('/articles/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    // 使用统一的JWT配置
    
    // Optional-auth: Check for a user token to determine like/favorite status
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            userId = decoded.id;
        } catch (e) {
            // Invalid token, proceed as a guest user
        }
    }

    // A single, more powerful query to get all required data
    const query = `
        SELECT 
            a.*, 
            u.username AS authorName, 
            ac.name AS categoryName,
            (SELECT COUNT(*) FROM article_comments WHERE article_id = a.id) AS commentCount,
            (SELECT COUNT(*) FROM user_article_likes WHERE article_id = a.id) AS likeCount,
            ${userId ? `(SELECT COUNT(*) FROM user_article_likes WHERE article_id = a.id AND user_id = ?) > 0` : 'false'} AS isLiked,
            ${userId ? `(SELECT COUNT(*) FROM user_article_favorites WHERE article_id = a.id AND user_id = ?) > 0` : 'false'} AS isFavorited
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN article_categories ac ON a.category_id = ac.id
        WHERE a.id = ?;
    `;
    const queryParams = userId ? [userId, userId, id] : [id];
    
    const [articles] = await pool.execute(query, queryParams);

    if (articles.length === 0) {
        throw new ApiError(404, '文章不存在');
    }
    
    const article = articles[0];
    // Convert boolean fields from 0/1 to true/false
    article.isLiked = !!article.isLiked;
    article.isFavorited = !!article.isFavorited;

    sendSuccess(res, article);
}));

router.post('/articles', authMiddleware, asyncHandler(async (req, res) => {
    const { title, content, categoryId, status = 'published', summary, cover, tags } = req.body;
    const authorId = req.user.id;
    if (!title || !content || !categoryId) throw new ApiError(400, '标题、内容和分类ID不能为空');

    const [result] = await pool.execute(
        'INSERT INTO articles (title, content, summary, cover, author_id, category_id, status, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, content, summary || '', cover || '', authorId, categoryId, status, JSON.stringify(tags || [])]
    );
    const [newArticle] = await pool.execute('SELECT * FROM articles WHERE id = ?', [result.insertId]);
    sendSuccess(res, newArticle[0], '文章创建成功', 201);
}));

// ===================================
// Article Interaction
// ===================================

router.get('/articles/:id/comments', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const [comments] = await pool.execute(`
        SELECT c.*, u.username, u.avatar 
        FROM article_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.article_id = ?
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
    `, [id, parseInt(limit), (page - 1) * limit]);

    const [[{ total }]] = await pool.execute('SELECT COUNT(*) as total FROM article_comments WHERE article_id = ?', [id]);
    
    sendSuccess(res, { items: comments, total });
}));

router.post('/articles/:id/comments', authMiddleware, asyncHandler(async (req, res) => {
    const articleId = req.params.id;
    const userId = req.user.id;
    const { content, parentId = null } = req.body;

    if (!content) throw new ApiError(400, '评论内容不能为空');
    
    const [[article]] = await pool.execute('SELECT id FROM articles WHERE id = ?', [articleId]);
    if (!article) throw new ApiError(404, '关联的文章不存在');

    const [result] = await pool.execute(
        'INSERT INTO article_comments (article_id, user_id, content, parent_id) VALUES (?, ?, ?, ?)',
        [articleId, userId, content, parentId]
    );
    
    const [newComments] = await pool.execute('SELECT c.*, u.username, u.avatar FROM article_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?', [result.insertId]);

    sendSuccess(res, newComments[0], '评论发布成功', 201);
}));

router.post('/articles/:id/like', authMiddleware, asyncHandler(async (req, res) => {
    const articleId = req.params.id;
    const userId = req.user.id;

    const [[like]] = await pool.execute('SELECT * FROM user_article_likes WHERE user_id = ? AND article_id = ?', [userId, articleId]);

    if (like) {
        await pool.execute('DELETE FROM user_article_likes WHERE user_id = ? AND article_id = ?', [userId, articleId]);
    } else {
        await pool.execute('INSERT INTO user_article_likes (user_id, article_id) VALUES (?, ?)', [userId, articleId]);
    }
    
    const liked = !like;
    const [[{ likeCount }]] = await pool.execute('SELECT COUNT(*) as likeCount FROM user_article_likes WHERE article_id = ?', [articleId]);
    
    sendSuccess(res, { liked, likeCount }, liked ? '点赞成功' : '已取消点赞');
}));

router.post('/articles/:id/favorite', authMiddleware, asyncHandler(async (req, res) => {
    const articleId = req.params.id;
    const userId = req.user.id;

    const [[favorite]] = await pool.execute('SELECT * FROM user_article_favorites WHERE user_id = ? AND article_id = ?', [userId, articleId]);

    if (favorite) {
        await pool.execute('DELETE FROM user_article_favorites WHERE user_id = ? AND article_id = ?', [userId, articleId]);
    } else {
        await pool.execute('INSERT INTO user_article_favorites (user_id, article_id) VALUES (?, ?)', [userId, articleId]);
    }
    
    const favorited = !favorite;
    sendSuccess(res, { favorited }, favorited ? '收藏成功' : '已取消收藏');
}));

module.exports = router;