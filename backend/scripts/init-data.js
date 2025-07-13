const { pool } = require('../config/database');

// 示例题目数据
const sampleQuestions = [
  {
    title: 'JavaScript中var、let、const的区别',
    content: '以下关于JavaScript中var、let、const的说法，哪个是正确的？',
    type: 'single',
    options: JSON.stringify({
      A: 'var声明的变量有块级作用域',
      B: 'let声明的变量可以重复声明',
      C: 'const声明的变量必须初始化',
      D: 'let和const都没有暂时性死区'
    }),
    correct_answer: 'C',
    explanation: 'const声明的变量必须在声明时初始化，且不能重新赋值。var没有块级作用域，let不能重复声明，let和const都有暂时性死区。',
    difficulty: 'medium',
    category: 'JavaScript',
    tags: JSON.stringify(['变量声明', '作用域', '基础语法'])
  },
  {
    title: 'CSS盒模型',
    content: 'CSS盒模型由哪些部分组成？',
    type: 'multiple',
    options: JSON.stringify({
      A: 'content（内容）',
      B: 'padding（内边距）',
      C: 'border（边框）',
      D: 'margin（外边距）'
    }),
    correct_answer: 'ABCD',
    explanation: 'CSS盒模型由content、padding、border、margin四个部分组成。',
    difficulty: 'easy',
    category: 'CSS',
    tags: JSON.stringify(['盒模型', '布局', '基础概念'])
  },
  {
    title: 'HTTP状态码',
    content: 'HTTP状态码404表示什么？',
    type: 'single',
    options: JSON.stringify({
      A: '服务器内部错误',
      B: '请求成功',
      C: '资源未找到',
      D: '权限不足'
    }),
    correct_answer: 'C',
    explanation: 'HTTP状态码404表示请求的资源未找到。',
    difficulty: 'easy',
    category: 'HTTP',
    tags: JSON.stringify(['状态码', '网络协议'])
  },
  {
    title: 'React Hooks',
    content: 'useState Hook返回的数组包含什么？',
    type: 'single',
    options: JSON.stringify({
      A: '当前状态值和更新状态的函数',
      B: '初始状态值和当前状态值',
      C: '状态值和状态类型',
      D: '组件实例和状态值'
    }),
    correct_answer: 'A',
    explanation: 'useState Hook返回一个数组，包含当前状态值和更新状态的函数。',
    difficulty: 'medium',
    category: 'React',
    tags: JSON.stringify(['Hooks', '状态管理', 'React'])
  },
  {
    title: 'Node.js是单线程的',
    content: 'Node.js是完全单线程的。',
    type: 'judge',
    options: JSON.stringify({
      A: '正确',
      B: '错误'
    }),
    correct_answer: 'B',
    explanation: 'Node.js的主线程是单线程的，但它使用线程池来处理I/O操作，所以不是完全单线程的。',
    difficulty: 'medium',
    category: 'Node.js',
    tags: JSON.stringify(['线程模型', '异步编程'])
  },
  {
    title: 'SQL JOIN类型',
    content: '以下哪种JOIN会返回两个表中所有的记录？',
    type: 'single',
    options: JSON.stringify({
      A: 'INNER JOIN',
      B: 'LEFT JOIN',
      C: 'RIGHT JOIN',
      D: 'FULL OUTER JOIN'
    }),
    correct_answer: 'D',
    explanation: 'FULL OUTER JOIN会返回两个表中所有的记录，无论是否匹配。',
    difficulty: 'medium',
    category: 'SQL',
    tags: JSON.stringify(['JOIN', '数据库查询'])
  },
  {
    title: 'Git版本控制',
    content: 'git merge和git rebase的主要区别是什么？',
    type: 'single',
    options: JSON.stringify({
      A: 'merge会创建新的提交，rebase不会',
      B: 'merge保留分支历史，rebase重写提交历史',
      C: 'merge更快，rebase更慢',
      D: '没有区别'
    }),
    correct_answer: 'B',
    explanation: 'git merge会保留分支的历史记录，而git rebase会重写提交历史，使其看起来像线性开发。',
    difficulty: 'hard',
    category: 'Git',
    tags: JSON.stringify(['版本控制', '分支管理'])
  },
  {
    title: 'Vue.js生命周期',
    content: 'Vue组件的created和mounted钩子的区别是什么？',
    type: 'single',
    options: JSON.stringify({
      A: 'created在DOM挂载前，mounted在DOM挂载后',
      B: 'created在数据初始化前，mounted在数据初始化后',
      C: 'created用于服务端，mounted用于客户端',
      D: '没有区别'
    }),
    correct_answer: 'A',
    explanation: 'created钩子在组件实例创建完成后调用，此时DOM还未挂载；mounted钩子在DOM挂载完成后调用。',
    difficulty: 'medium',
    category: 'Vue.js',
    tags: JSON.stringify(['生命周期', '组件'])
  }
];

// 初始化示例数据
async function initSampleData() {
  try {
    console.log('🔄 开始初始化示例数据...');
    
    // 检查是否已有数据
    const [existingQuestions] = await pool.execute('SELECT COUNT(*) as count FROM questions');
    
    if (existingQuestions[0].count > 0) {
      console.log('📊 数据库中已有题目数据，跳过初始化');
      return;
    }
    
    // 插入示例题目
    for (const question of sampleQuestions) {
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
    }
    
    console.log(`✅ 成功插入 ${sampleQuestions.length} 道示例题目`);
    
  } catch (error) {
    console.error('❌ 初始化示例数据失败:', error.message);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initSampleData()
    .then(() => {
      console.log('🎉 示例数据初始化完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初始化失败:', error);
      process.exit(1);
    });
}

module.exports = {
  initSampleData
};