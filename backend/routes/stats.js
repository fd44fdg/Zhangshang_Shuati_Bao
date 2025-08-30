
const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/auth').verifyToken;
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSuccess } = require('../utils/responseHandler');
const ApiError = require('../utils/ApiError');

const router = express.Router();

// 获取用户统计摘要
router.get('/summary', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户基本信息
        const user = await User.findById(userId);
        
        // 获取用户的答题统计
        const [stats] = await require('../config/db').query(`
            SELECT 
                COUNT(*) as total_questions,
                SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_questions,
                COUNT(DISTINCT DATE(created_at)) as study_days,
                MAX(created_at) as last_study_date
            FROM user_exam_answers 
            WHERE user_id = ?
        `, [userId]);
        
        // 获取今日答题数
        const [todayStats] = await require('../config/db').query(`
            SELECT COUNT(*) as today_count
            FROM user_exam_answers 
            WHERE user_id = ? AND DATE(created_at) = CURDATE()
        `, [userId]);
        
        const userStats = stats[0] || {};
        const todayStatsData = todayStats[0] || {};
        
        // 计算正确率
        const accuracy = userStats.total_questions > 0 
            ? (userStats.correct_questions / userStats.total_questions) * 100 
            : 0;
        
        // 计算连续学习天数
        const continuousStudyDays = await calculateContinuousStudyDays(userId);
        
        res.status(200).json({
            success: true,
            data: {
                todayCount: todayStatsData.today_count || 0,
                totalCount: userStats.total_questions || 0,
                accuracy: Math.round(accuracy),
                totalQuestions: userStats.total_questions || 0,
                correctQuestions: userStats.correct_questions || 0,
                studyDays: userStats.study_days || 0,
                continuousStudyDays: continuousStudyDays || 0,
                dailyTarget: 20
            }
        });
    } catch (error) {
        console.error('获取用户统计失败:', error);
        res.status(500).json({
            success: false,
            message: '获取用户统计失败'
        });
    }
});

// 获取知识点进度
router.get('/knowledge-progress', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户的知识点学习进度
        const [progress] = await require('../config/db').query(`
            SELECT 
                kc.id,
                kc.name as title,
                kc.description,
                COUNT(DISTINCT q.id) as total_count,
                COUNT(DISTINCT uea.question_id) as completed_count,
                ROUND(COUNT(DISTINCT uea.question_id) * 100.0 / COUNT(DISTINCT q.id), 0) as progress
            FROM knowledge_categories kc
            LEFT JOIN questions q ON kc.id = q.category_id
            LEFT JOIN user_exam_answers uea ON q.id = uea.question_id AND uea.user_id = ?
            GROUP BY kc.id, kc.name, kc.description
            HAVING total_count > 0
            ORDER BY progress DESC
            LIMIT 5
        `, [userId]);
        
        const formattedProgress = progress.map(item => ({
            id: item.id,
            title: item.title,
            progress: item.progress || 0,
            completedCount: item.completed_count || 0,
            totalCount: item.total_count || 0
        }));
        
        res.status(200).json({
            success: true,
            data: formattedProgress
        });
    } catch (error) {
        console.error('获取知识点进度失败:', error);
        res.status(500).json({
            success: false,
            message: '获取知识点进度失败'
        });
    }
});

// 获取最近错题
router.get('/recent-mistakes', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 获取用户最近的错题记录
        const [mistakes] = await require('../config/db').query(`
            SELECT 
                q.id,
                q.title,
                q.type,
                uea.created_at as mistake_date
            FROM user_exam_answers uea
            JOIN questions q ON uea.question_id = q.id
            WHERE uea.user_id = ? AND uea.is_correct = 0
            ORDER BY uea.created_at DESC
            LIMIT 10
        `, [userId]);
        
        const formattedMistakes = mistakes.map(item => ({
            id: item.id,
            title: item.title,
            type: getQuestionTypeText(item.type),
            mistakeDate: item.mistake_date
        }));
        
        res.status(200).json({
            success: true,
            data: formattedMistakes
        });
    } catch (error) {
        console.error('获取最近错题失败:', error);
        res.status(500).json({
            success: false,
            message: '获取最近错题失败'
        });
    }
});

// 计算连续学习天数的辅助函数
async function calculateContinuousStudyDays(userId) {
    const [studyDates] = await require('../config/db').query(`
        SELECT DISTINCT DATE(created_at) as study_date
        FROM user_exam_answers 
        WHERE user_id = ? 
        ORDER BY study_date DESC
        LIMIT 30
    `, [userId]);
    
    if (studyDates.length === 0) return 0;
    
    let continuousDays = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 检查今天是否有学习记录
    const hasTodayStudy = studyDates.some(date => {
        const studyDate = new Date(date.study_date);
        studyDate.setHours(0, 0, 0, 0);
        return studyDate.getTime() === today.getTime();
    });
    
    if (!hasTodayStudy) return 0;
    
    // 计算连续天数
    for (let i = 1; i < studyDates.length; i++) {
        const currentDate = new Date(studyDates[i-1].study_date);
        const previousDate = new Date(studyDates[i].study_date);
        
        const diffTime = Math.abs(currentDate - previousDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            continuousDays++;
        } else {
            break;
        }
    }
    
    return continuousDays;
}

// 获取题目类型文本
function getQuestionTypeText(type) {
    const typeMap = {
        'single': '单选题',
        'multiple': '多选题',
        'judge': '判断题',
        'fill': '填空题'
    };
    return typeMap[type] || '未知题型';
}

module.exports = router;
