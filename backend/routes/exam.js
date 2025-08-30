
const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth').verifyToken;
const { asyncHandler } = require('../middleware/errorHandler');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// --- Admin-facing CRUD for Exam Definitions ---

// GET all exams
router.get('/', auth, asyncHandler(async (req, res) => {
    const [exams] = await db.query(`
        SELECT e.*, qc.name as category_name 
        FROM exams e
        LEFT JOIN question_categories qc ON e.category_id = qc.id
        ORDER BY e.created_at DESC
    `);
    res.status(200).json({ success: true, data: exams });
}));

// GET a single exam definition
router.get('/:id', auth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [[exam]] = await db.query('SELECT * FROM exams WHERE id = ?', [id]);
    if (!exam) {
        throw new ApiError(404, 'Exam not found');
    }
    res.status(200).json({ success: true, data: exam });
}));

// POST a new exam definition
router.post('/', auth, asyncHandler(async (req, res) => {
    const { title, description, duration, question_count, category_id } = req.body;
    if (!title || !duration || !question_count) {
        throw new ApiError(400, 'Title, duration, and question count are required');
    }

    const [result] = await db.query(
        'INSERT INTO exams (title, description, duration, question_count, category_id) VALUES (?, ?, ?, ?, ?)',
        [title, description, duration, question_count, category_id]
    );
    const [[newExam]] = await db.query('SELECT * FROM exams WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newExam });
}));

// PUT to update an exam definition
router.put('/:id', auth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, duration, question_count, category_id } = req.body;
    if (!title || !duration || !question_count) {
        throw new ApiError(400, 'Title, duration, and question count are required');
    }

    const [result] = await db.query(
        'UPDATE exams SET title = ?, description = ?, duration = ?, question_count = ?, category_id = ? WHERE id = ?',
        [title, description, duration, question_count, category_id, id]
    );

    if (result.affectedRows === 0) {
        throw new ApiError(404, 'Exam not found');
    }
    const [[updatedExam]] = await db.query('SELECT * FROM exams WHERE id = ?', [id]);
    res.status(200).json({ success: true, data: updatedExam });
}));

// DELETE an exam definition
router.delete('/:id', auth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    // ON DELETE CASCADE will handle attempts and answers
    const [result] = await db.query('DELETE FROM exams WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
        throw new ApiError(404, 'Exam not found');
    }
    res.status(204).send();
}));

// --- User-facing Exam Attempt Endpoints ---

// POST to start a new exam attempt
router.post('/:id/start', auth, asyncHandler(async (req, res) => {
    const examId = req.params.id;
    const userId = req.user.id;

    const pool = db.getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get exam details
        const [[exam]] = await connection.query('SELECT * FROM exams WHERE id = ?', [examId]);
        if (!exam) {
            throw new ApiError(404, 'Exam not found');
        }

        // 2. Create the exam attempt record
        const [attemptResult] = await connection.query(
            'INSERT INTO exam_attempts (user_id, exam_id, start_time, status) VALUES (?, ?, NOW(), ?)',
            [userId, examId, 'in-progress']
        );
        const attemptId = attemptResult.insertId;

        // 3. Select random questions for the attempt
        let questionQuery = 'SELECT id FROM questions';
        const queryParams = [];
        if (exam.category_id) {
            questionQuery += ' WHERE category_id = ?';
            queryParams.push(exam.category_id);
        }
        questionQuery += ' ORDER BY RAND() LIMIT ?';
        queryParams.push(exam.question_count);

        const [questions] = await connection.query(questionQuery, queryParams);
        if (questions.length < exam.question_count) {
            throw new ApiError(400, 'Not enough questions in the category to generate the exam.');
        }

        // 4. Store the questions for this attempt
        const attemptQuestionsValues = questions.map(q => [attemptId, q.id]);
        await connection.query('INSERT INTO exam_attempt_questions (attempt_id, question_id) VALUES ?', [attemptQuestionsValues]);
        
        // 5. Fetch full question details to return to the user
        const questionIds = questions.map(q => q.id);
        const [fullQuestions] = await connection.query(`
            SELECT q.*, a.id as answer_id, a.text as answer_text 
            FROM questions q 
            JOIN answers a ON q.id = a.question_id 
            WHERE q.id IN (?)
        `, [questionIds]);

        // Simple hydration for exam questions (don't need all details)
        const hydratedQuestions = questionIds.map(id => {
            const questionData = fullQuestions.find(q => q.id === id);
            return {
                id: questionData.id,
                title: questionData.title,
                content: questionData.content,
                type: questionData.type,
                answers: fullQuestions.filter(q => q.id === id).map(a => ({ id: a.answer_id, text: a.answer_text }))
            }
        });

        await connection.commit();

        res.status(200).json({ 
            success: true, 
            data: { 
                attempt_id: attemptId,
                exam_title: exam.title,
                duration: exam.duration,
                questions: hydratedQuestions
            }
        });

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

module.exports = router;

// POST to submit an exam attempt
router.post('/attempts/:attemptId/submit', auth, asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body; // Expected format: { "questionId": ["answerId1", "answerId2"], ... } 

    const pool = db.getPool();
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Validate the attempt
        const [[attempt]] = await connection.query(
            'SELECT * FROM exam_attempts WHERE id = ? AND user_id = ? AND status = \'in-progress\'',
            [attemptId, userId]
        );
        if (!attempt) {
            throw new ApiError(404, 'Valid exam attempt not found or already completed.');
        }

        // 2. Get all questions for this attempt
        const [attemptQuestions] = await connection.query('SELECT question_id FROM exam_attempt_questions WHERE attempt_id = ?', [attemptId]);
        const questionIds = attemptQuestions.map(q => q.question_id);

        // 3. Get all correct answers for these questions in one go
        const [correctAnswers] = await connection.query('SELECT question_id, id FROM answers WHERE question_id IN (?) AND is_correct = 1', [questionIds]);
        
        const correctAnswersMap = new Map();
        correctAnswers.forEach(row => {
            if (!correctAnswersMap.has(row.question_id)) {
                correctAnswersMap.set(row.question_id, []);
            }
            correctAnswersMap.get(row.question_id).push(String(row.id));
        });

        let correctCount = 0;
        const userAnswersToInsert = [];

        // 4. Grade the submission
        for (const questionId of questionIds) {
            const userAns = answers[questionId] ? answers[questionId].map(String).sort() : [];
            const correctAns = correctAnswersMap.get(parseInt(questionId)) ? correctAnswersMap.get(parseInt(questionId)).sort() : [];
            
            const isCorrect = JSON.stringify(userAns) === JSON.stringify(correctAns);

            if (isCorrect) {
                correctCount++;
            }
            userAnswersToInsert.push([attemptId, questionId, JSON.stringify(userAns), isCorrect]);
        }

        // 5. Insert all user answers
        if (userAnswersToInsert.length > 0) {
            await connection.query('INSERT INTO user_exam_answers (attempt_id, question_id, selected_answer_ids, is_correct) VALUES ?', [userAnswersToInsert]);
        }

        // 6. Calculate score and update the attempt record
        const finalScore = (correctCount / questionIds.length) * 100;
        await connection.query(
            'UPDATE exam_attempts SET end_time = NOW(), status = \'completed\', score = ? WHERE id = ?',
            [finalScore, attemptId]
        );

        await connection.commit();

        res.status(200).json({ 
            success: true, 
            message: 'Exam submitted successfully.', 
            data: { 
                attemptId,
                score: finalScore,
                correctCount,
                totalQuestions: questionIds.length
            }
        });

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

// GET the result of a specific exam attempt
router.get('/attempts/:attemptId/result', auth, asyncHandler(async (req, res) => {
    const { attemptId } = req.params;
    const userId = req.user.id;

    // 1. Get the attempt details
    const [[attempt]] = await db.query(
        'SELECT a.*, e.title as exam_title FROM exam_attempts a JOIN exams e ON a.exam_id = e.id WHERE a.id = ? AND a.user_id = ? AND a.status = \'completed\'',
        [attemptId, userId]
    );

    if (!attempt) {
        throw new ApiError(404, 'Completed exam attempt not found.');
    }

    // 2. Get the questions, user answers, and correct answers
    const [results] = await db.query(`
        SELECT 
            q.id as question_id, 
            q.title, 
            q.explanation,
            uea.selected_answer_ids, 
            uea.is_correct
        FROM exam_attempt_questions eaq
        JOIN questions q ON eaq.question_id = q.id
        LEFT JOIN user_exam_answers uea ON eaq.attempt_id = uea.attempt_id AND eaq.question_id = uea.question_id
        WHERE eaq.attempt_id = ?
    `, [attemptId]);

    // 3. Get all possible answers for the questions in the attempt
    const questionIds = results.map(r => r.question_id);
    const [allAnswers] = await db.query('SELECT id, question_id, text, is_correct FROM answers WHERE question_id IN (?)', [questionIds]);

    // 4. Hydrate the results with full answer details
    const hydratedResults = results.map(result => {
        const questionAnswers = allAnswers.filter(a => a.question_id === result.question_id);
        const userSelectedIds = JSON.parse(result.selected_answer_ids || '[]');
        return {
            ...result,
            selected_answer_ids: userSelectedIds,
            answers: questionAnswers.map(a => ({...a, is_correct: !!a.is_correct})),
        };
    });

    res.status(200).json({
        success: true,
        data: {
            attempt_details: attempt,
            results: hydratedResults
        }
    });
}));
