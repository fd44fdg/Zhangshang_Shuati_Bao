// A centralized in-memory database for the entire backend application.

const users = [
    {
        id: 1,
        username: 'admin',
        password: 'password123', // In a real app, this should be a hash
        role: 'admin',
        email: 'admin@example.com',
        avatar: '/default-avatar.svg',
        createdAt: new Date()
    },
    {
        id: 2,
        username: 'testuser',
        password: 'password123',
        role: 'user',
        email: 'testuser@example.com',
        avatar: '/default-avatar.svg',
        createdAt: new Date()
    }
];
let nextUserId = 3;

const articles = [
    { id: 1, title: 'Vue 3 Composition API 完全指南', summary: '从基础到实战，深入理解Vue 3的核心特性 Composition API...', content: '<p>Vue 3 引入了 Composition API 作为一种新的组织组件逻辑的方式...</p>', authorId: 1, categoryId: 1, status: 'published', tags: ['Vue', 'JavaScript'], views: 1024, cover: 'https://via.placeholder.com/300x200.png/4C8AF5/FFFFFF?text=Vue', createdAt: '2023-10-01T10:00:00Z', updatedAt: '2023-10-01T10:00:00Z' },
    { id: 2, title: 'Node.js 性能优化实战', summary: '探讨多种 Node.js 性能瓶颈及优化策略，让你的应用快如闪电。', content: '<p>Node.js 是一个基于 Chrome V8 引擎的 JavaScript 运行环境...</p>', authorId: 2, categoryId: 2, status: 'published', tags: ['Node.js', 'Performance'], views: 2450, cover: 'https://via.placeholder.com/300x200.png/4CAF50/FFFFFF?text=Node.js', createdAt: '2023-09-28T14:30:00Z', updatedAt: '2023-09-29T11:00:00Z' },
    { id: 3, title: '微前端架构的核心思想', summary: '将巨石应用拆分为更小、更易于管理的前端应用，微前端架构正成为趋势。', content: '<p>微前端是一种架构风格，其中多个独立交付的前端应用组合成一个更大的整体...</p>', authorId: 1, categoryId: 3, status: 'published', tags: ['Micro-frontend', 'Architecture'], views: 890, cover: 'https://via.placeholder.com/300x200.png/F5A623/FFFFFF?text=Arch', createdAt: '2023-09-25T09:00:00Z', updatedAt: '2023-09-25T09:00:00Z' },
];
let nextArticleId = 4;

const articleCategories = [
    { id: 1, name: '前端开发', slug: 'frontend', description: '关于前端开发的一切' },
    { id: 2, name: '后端开发', slug: 'backend', description: '关于后端开发的一切' },
    { id: 3, name: '技术视野', slug: 'vision', description: '更广阔的技术视野和趋势' },
];
let nextArticleCategoryId = 4;

const knowledgePoints = [];
let nextKnowledgePointId = 1;

const knowledgeCategories = [];
let nextKnowledgeCategoryId = 1;

const questions = [];
let nextQuestionId = 1;

const favorites = []; // { userId, questionId, createdAt }
const wrongQuestions = []; // { userId, questionId, wrongCount, lastWrongTime }

const articleComments = [
    { id: 1, articleId: 1, userId: 2, content: '写得太好了，Vue 3 的 Composition API 确实强大！', parentId: null, createdAt: '2023-10-02T11:00:00Z' },
    { id: 2, articleId: 1, userId: 1, content: '谢谢支持！', parentId: 1, createdAt: '2023-10-02T11:05:00Z' },
    { id: 3, articleId: 2, userId: 1, content: '关于 Node.js 性能，事件循环的理解是关键。', parentId: null, createdAt: '2023-09-29T15:00:00Z' },
];

const userArticleLikes = [
    { userId: 1, articleId: 2 },
    { userId: 2, articleId: 1 },
];

const userArticleFavorites = [
    { userId: 1, articleId: 3, createdAt: '2023-09-26T10:00:00Z' },
    { userId: 2, articleId: 1, createdAt: '2023-10-02T12:00:00Z' },
];

const db = {
    users,
    articles,
    articleCategories,
    knowledgePoints,
    knowledgeCategories,
    questions,
    favorites,
    wrongQuestions,
    articleComments,
    userArticleLikes,
    userArticleFavorites,
};

// Helper functions to interact with the database
const helpers = {
    getNextId: (collection) => {
        if (collection === db.users) return nextUserId++;
        if (collection === db.articles) return nextArticleId++;
        if (collection === db.articleCategories) return nextArticleCategoryId++;
        if (collection === db.knowledgePoints) return nextKnowledgePointId++;
        if (collection === db.knowledgeCategories) return nextKnowledgeCategoryId++;
        if (collection === db.questions) return nextQuestionId++;
        return null;
    }
}

module.exports = {
    db,
    helpers
}; 