const express = require('express');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { sendSuccess } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

// --- Question Categories ---

router.get('/categories', catchAsync(async (req, res) => {
    const [categories] = await pool.execute(`
        SELECT c.*, COUNT(q.id) as questionCount
        FROM question_categories c
        LEFT JOIN questions q ON c.id = q.category_id
        GROUP BY c.id
    `);
    sendSuccess(res, { items: categories, total: categories.length });
}));

router.post('/categories', authMiddleware, catchAsync(async (req, res) => {
    const { name, description } = req.body;
    if (!name) throw new ApiError(400, '分类名称不能为空');

    const [result] = await pool.execute('INSERT INTO question_categories (name, description) VALUES (?, ?)', [name, description || '']);
    const [[newCategory]] = await pool.execute('SELECT * FROM question_categories WHERE id = ?', [result.insertId]);
    sendSuccess(res, newCategory, '分类创建成功', 201);
}));

router.put('/categories/:id', authMiddleware, catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;
    if (!name && !description) throw new ApiError(400, '没有提供要更新的字段');

    const [result] = await pool.execute('UPDATE question_categories SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    if (result.affectedRows === 0) throw new ApiError(404, '分类不存在');
    
    const [[updatedCategory]] = await pool.execute('SELECT * FROM question_categories WHERE id = ?', [id]);
    sendSuccess(res, updatedCategory, '分类更新成功');
}));

router.delete('/categories/:id', authMiddleware, catchAsync(async (req, res) => {
    const { id } = req.params;
    const [[{ count }]] = await pool.execute('SELECT COUNT(*) as count FROM questions WHERE category_id = ?', [id]);
    if (count > 0) throw new ApiError(400, '该分类下仍有题目，无法删除');

    const [result] = await pool.execute('DELETE FROM question_categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) throw new ApiError(404, '分类不存在');

    sendSuccess(res, null, '分类删除成功');
}));

// --- Questions ---

router.get('/', catchAsync(async (req, res) => {
    const { page = 1, limit = 10, category_id } = req.query;
    // Simplified query. A real implementation would have more filters.
    let query = 'SELECT * FROM questions';
    let countQuery = 'SELECT COUNT(*) as total FROM questions';
    const params = [];

    if (category_id) {
        query += ' WHERE category_id = ?';
        countQuery += ' WHERE category_id = ?';
        params.push(category_id);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * limit);

    const [questions] = await pool.execute(query, params);
    const [[{ total }]] = await pool.execute(countQuery, params.slice(0, params.length-2)); // remove limit/offset for count

    // Parse JSON fields
    questions.forEach(q => {
        q.options = JSON.parse(q.options);
        q.correct_answer = JSON.parse(q.correct_answer);
    });

    sendSuccess(res, { items: questions, total });
}));

router.get('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const [[question]] = await pool.execute('SELECT * FROM questions WHERE id = ?', [id]);
    if (!question) throw new ApiError(404, '题目不存在');
    
    question.options = JSON.parse(question.options);
    question.correct_answer = JSON.parse(question.correct_answer);
    
    sendSuccess(res, question);
}));

router.post('/', authMiddleware, catchAsync(async (req, res) => {
    const { title, content, category_id, type, options, correct_answer, difficulty, explanation } = req.body;
    if (!title || !category_id || !type || !options || !correct_answer) {
        throw new ApiError(400, '缺少必要的题目参数');
    }
    const [result] = await pool.execute(
        `INSERT INTO questions (title, content, category_id, type, options, correct_answer, difficulty, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [title, content || '', category_id, type, JSON.stringify(options), JSON.stringify(correct_answer), difficulty || 'medium', explanation || '']
    );
    const [[newQuestion]] = await pool.execute('SELECT * FROM questions WHERE id = ?', [result.insertId]);
    sendSuccess(res, newQuestion, '题目创建成功', 201);
}));

// PUT and DELETE for questions would follow a similar pattern.

module.exports = router;