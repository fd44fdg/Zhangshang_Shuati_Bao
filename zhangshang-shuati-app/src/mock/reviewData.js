export const mockKnowledgeCategories = [
    {
        id: 1,
        title: "JavaScript基础",
        description: "变量、函数、作用域等基础概念",
        progress: 85,
        completed: 17,
        total: 20,
        icon: "practice"
    },
    {
        id: 2,
        title: "Vue.js框架",
        description: "组件、响应式、生命周期等",
        progress: 60,
        completed: 12,
        total: 20,
        icon: "exam"
    },
    {
        id: 3,
        title: "CSS布局",
        description: "Flexbox、Grid、定位等布局技术",
        progress: 40,
        completed: 8,
        total: 20,
        icon: "settings"
    },
    {
        id: 4,
        title: "HTTP协议",
        description: "请求响应、状态码、缓存等",
        progress: 75,
        completed: 15,
        total: 20,
        icon: "search"
    },
    {
        id: 5,
        title: "Node.js后端",
        description: "Express、中间件、数据库等",
        progress: 30,
        completed: 6,
        total: 20,
        icon: "favorite"
    },
    {
        id: 6,
        title: "数据结构算法",
        description: "数组、链表、排序、查找等",
        progress: 55,
        completed: 11,
        total: 20,
        icon: "profile"
    }
];

export const mockRecentStudy = [
    {
        id: 1,
        title: "JavaScript闭包",
        lastStudy: "2小时前",
        progress: 80,
        icon: "practice"
    },
    {
        id: 2,
        title: "Vue组件通信",
        lastStudy: "昨天",
        progress: 65,
        icon: "exam"
    },
    {
        id: 3,
        title: "CSS Grid布局",
        lastStudy: "2天前",
        progress: 45,
        icon: "settings"
    }
];

export const mockProgress = {
    totalStudied: 45,
    totalKnowledge: 120,
};
