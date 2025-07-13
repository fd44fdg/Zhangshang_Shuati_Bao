const express = require('express');
const { pool } = require('../config/database');

// 扩展题目数据
const expandedQuestions = [
  {
    title: 'JavaScript闭包概念',
    content: '以下关于JavaScript闭包的说法，哪个是正确的？',
    type: 'single',
    options: JSON.stringify({
      A: '闭包只能在函数内部使用',
      B: '闭包可以访问外部函数的变量',
      C: '闭包会导致内存泄漏',
      D: '闭包只存在于ES6中'
    }),
    correct_answer: 'B',
    explanation: '闭包是指内部函数可以访问外部函数作用域中的变量，即使外部函数已经执行完毕。',
    difficulty: 'medium',
    category: 'JavaScript',
    tags: JSON.stringify(['闭包', '作用域', '函数'])
  },
  {
    title: 'CSS Flexbox布局',
    content: 'flex-direction属性的默认值是什么？',
    type: 'single',
    options: JSON.stringify({
      A: 'column',
      B: 'row',
      C: 'row-reverse',
      D: 'column-reverse'
    }),
    correct_answer: 'B',
    explanation: 'flex-direction属性的默认值是row，表示主轴为水平方向，起点在左端。',
    difficulty: 'easy',
    category: 'CSS',
    tags: JSON.stringify(['Flexbox', '布局', 'CSS3'])
  },
  {
    title: 'HTTP请求方法',
    content: '以下哪些HTTP方法是幂等的？',
    type: 'multiple',
    options: JSON.stringify({
      A: 'GET',
      B: 'POST',
      C: 'PUT',
      D: 'DELETE'
    }),
    correct_answer: 'ACD',
    explanation: 'GET、PUT、DELETE是幂等的，多次执行相同的请求会产生相同的结果。POST不是幂等的。',
    difficulty: 'medium',
    category: 'HTTP',
    tags: JSON.stringify(['HTTP方法', '幂等性', 'RESTful'])
  },
  {
    title: 'React组件状态',
    content: '在React函数组件中，如何更新状态？',
    type: 'single',
    options: JSON.stringify({
      A: '直接修改state变量',
      B: '使用setState函数',
      C: '使用useState返回的setter函数',
      D: '使用this.setState'
    }),
    correct_answer: 'C',
    explanation: '在React函数组件中，使用useState Hook返回的setter函数来更新状态。',
    difficulty: 'easy',
    category: 'React',
    tags: JSON.stringify(['useState', '状态管理', '函数组件'])
  },
  {
    title: 'Node.js事件循环',
    content: 'Node.js事件循环的正确执行顺序是什么？',
    type: 'single',
    options: JSON.stringify({
      A: 'timers → I/O callbacks → idle → poll → check → close callbacks',
      B: 'poll → timers → I/O callbacks → check → idle → close callbacks',
      C: 'I/O callbacks → timers → poll → check → idle → close callbacks',
      D: 'check → poll → timers → I/O callbacks → idle → close callbacks'
    }),
    correct_answer: 'A',
    explanation: 'Node.js事件循环的执行顺序是：timers → pending callbacks → idle/prepare → poll → check → close callbacks。',
    difficulty: 'hard',
    category: 'Node.js',
    tags: JSON.stringify(['事件循环', '异步编程', '性能优化'])
  },
  {
    title: 'MySQL索引类型',
    content: '以下哪种索引类型查询速度最快？',
    type: 'single',
    options: JSON.stringify({
      A: '普通索引',
      B: '唯一索引',
      C: '主键索引',
      D: '复合索引'
    }),
    correct_answer: 'C',
    explanation: '主键索引是聚簇索引，数据和索引存储在一起，查询速度最快。',
    difficulty: 'medium',
    category: 'MySQL',
    tags: JSON.stringify(['索引', '数据库优化', '查询性能'])
  },
  {
    title: 'Vue.js响应式原理',
    content: 'Vue 2.x的响应式原理基于什么技术？',
    type: 'single',
    options: JSON.stringify({
      A: 'Proxy',
      B: 'Object.defineProperty',
      C: 'MutationObserver',
      D: 'WeakMap'
    }),
    correct_answer: 'B',
    explanation: 'Vue 2.x使用Object.defineProperty来实现响应式，Vue 3.x改用Proxy。',
    difficulty: 'medium',
    category: 'Vue.js',
    tags: JSON.stringify(['响应式', '数据绑定', '原理'])
  },
  {
    title: 'Webpack打包优化',
    content: '以下哪些是Webpack打包优化的有效方法？',
    type: 'multiple',
    options: JSON.stringify({
      A: '代码分割（Code Splitting）',
      B: '懒加载（Lazy Loading）',
      C: '压缩代码',
      D: '使用CDN'
    }),
    correct_answer: 'ABCD',
    explanation: '代码分割、懒加载、压缩代码和使用CDN都是有效的Webpack打包优化方法。',
    difficulty: 'medium',
    category: 'Webpack',
    tags: JSON.stringify(['打包优化', '性能优化', '构建工具'])
  },
  {
    title: 'TypeScript类型系统',
    content: 'TypeScript中interface和type的主要区别是什么？',
    type: 'single',
    options: JSON.stringify({
      A: 'interface只能定义对象类型，type可以定义任何类型',
      B: 'type只能定义对象类型，interface可以定义任何类型',
      C: '没有区别，完全相同',
      D: 'interface性能更好'
    }),
    correct_answer: 'A',
    explanation: 'interface主要用于定义对象类型且支持声明合并，type可以定义任何类型包括联合类型、交叉类型等。',
    difficulty: 'medium',
    category: 'TypeScript',
    tags: JSON.stringify(['类型系统', 'interface', 'type'])
  },
  {
    title: 'Redis数据结构',
    content: 'Redis支持哪些数据结构？',
    type: 'multiple',
    options: JSON.stringify({
      A: 'String（字符串）',
      B: 'Hash（哈希）',
      C: 'List（列表）',
      D: 'Set（集合）'
    }),
    correct_answer: 'ABCD',
    explanation: 'Redis支持String、Hash、List、Set、Sorted Set等多种数据结构。',
    difficulty: 'easy',
    category: 'Redis',
    tags: JSON.stringify(['数据结构', '缓存', 'NoSQL'])
  },
  {
    title: 'ES6新特性',
    content: 'ES6中的箭头函数与普通函数的区别包括哪些？',
    type: 'multiple',
    options: JSON.stringify({
      A: '箭头函数没有自己的this',
      B: '箭头函数不能作为构造函数',
      C: '箭头函数没有arguments对象',
      D: '箭头函数不能使用yield'
    }),
    correct_answer: 'ABCD',
    explanation: '箭头函数没有自己的this、不能作为构造函数、没有arguments对象、不能使用yield关键字。',
    difficulty: 'medium',
    category: 'JavaScript',
    tags: JSON.stringify(['ES6', '箭头函数', '函数特性'])
  },
  {
    title: 'CSS Grid布局',
    content: 'CSS Grid布局中，grid-template-areas属性的作用是什么？',
    type: 'single',
    options: JSON.stringify({
      A: '定义网格线的名称',
      B: '定义网格区域的名称和位置',
      C: '定义网格项目的大小',
      D: '定义网格容器的大小'
    }),
    correct_answer: 'B',
    explanation: 'grid-template-areas属性用于定义网格区域的名称和位置，使布局更加直观。',
    difficulty: 'medium',
    category: 'CSS',
    tags: JSON.stringify(['Grid布局', 'CSS3', '网格系统'])
  },
  {
    title: 'Docker容器化',
    content: 'Docker镜像和容器的关系是什么？',
    type: 'single',
    options: JSON.stringify({
      A: '镜像是容器的实例',
      B: '容器是镜像的实例',
      C: '镜像和容器是同一个概念',
      D: '镜像包含容器'
    }),
    correct_answer: 'B',
    explanation: '容器是镜像的运行实例，镜像是静态的模板，容器是动态的运行环境。',
    difficulty: 'easy',
    category: 'Docker',
    tags: JSON.stringify(['容器化', 'DevOps', '部署'])
  },
  {
    title: 'MongoDB查询',
    content: 'MongoDB中如何查询数组字段包含特定值的文档？',
    type: 'single',
    options: JSON.stringify({
      A: 'db.collection.find({array: value})',
      B: 'db.collection.find({array: {$in: [value]}})',
      C: 'db.collection.find({array: {$contains: value}})',
      D: 'db.collection.find({array: {$elemMatch: value}})'  
    }),
    correct_answer: 'A',
    explanation: '在MongoDB中，直接使用{array: value}就可以查询数组字段包含特定值的文档。',
    difficulty: 'medium',
    category: 'MongoDB',
    tags: JSON.stringify(['数组查询', 'NoSQL', '数据库'])
  },
  {
    title: 'Web安全',
    content: '以下哪些是常见的Web安全威胁？',
    type: 'multiple',
    options: JSON.stringify({
      A: 'XSS（跨站脚本攻击）',
      B: 'CSRF（跨站请求伪造）',
      C: 'SQL注入',
      D: 'DDoS攻击'
    }),
    correct_answer: 'ABCD',
    explanation: 'XSS、CSRF、SQL注入、DDoS攻击都是常见的Web安全威胁，需要采取相应的防护措施。',
    difficulty: 'medium',
    category: 'Web安全',
    tags: JSON.stringify(['安全威胁', '网络安全', '防护措施'])
  }
];

// 添加扩展题目数据
async function addExpandedQuestions() {
  try {
    console.log('🔄 开始添加扩展题目数据...');
    
    let addedCount = 0;
    
    for (const question of expandedQuestions) {
      // 检查题目是否已存在
      const [existing] = await pool.execute(
        'SELECT id FROM questions WHERE title = ?',
        [question.title]
      );
      
      if (existing.length === 0) {
        await pool.execute(
          `INSERT INTO questions (title, content, type, options, correct_answer, explanation, difficulty, category, tags) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            question.title,
            question.content,
            question.type,
            question.options,
            question.correct_answer,
            question.explanation,
            question.difficulty,
            question.category,
            question.tags
          ]
        );
        addedCount++;
      }
    }
    
    console.log(`✅ 成功添加 ${addedCount} 道新题目`);
    
    // 显示当前题目总数
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM questions');
    console.log(`📊 当前题库总共有 ${countResult[0].total} 道题目`);
    
  } catch (error) {
    console.error('❌ 添加扩展题目失败:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addExpandedQuestions()
    .then(() => {
      console.log('🎉 扩展题目数据添加完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 添加失败:', error);
      process.exit(1);
    });
}

module.exports = {
  addExpandedQuestions
};