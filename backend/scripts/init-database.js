#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * Linus式简单直接的数据库设置
 */

const path = require('path');
const fs = require('fs');

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const config = require('../config');
const { testConnection, initDatabase } = require('../config/database-adapter');

async function main() {
  console.log('🚀 开始初始化数据库...');
  console.log(`📊 数据库类型: ${config.database.dialect}`);
  
  try {
    // 1. 测试数据库连接
    console.log('\n1️⃣ 测试数据库连接...');
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ 数据库连接失败，请检查配置');
      process.exit(1);
    }

    // 2. 运行数据库迁移
    console.log('\n2️⃣ 运行数据库迁移...');
    const migrated = await initDatabase();
    if (!migrated) {
      console.error('❌ 数据库迁移失败');
      process.exit(1);
    }

    // 3. 运行种子数据（如果需要）
    if (process.argv.includes('--seed')) {
      console.log('\n3️⃣ 插入种子数据...');
      const knex = require('../config/db');
      
      try {
        await knex.seed.run();
        console.log('✅ 种子数据插入完成');
      } catch (error) {
        console.error('❌ 种子数据插入失败:', error.message);
        process.exit(1);
      }
    }

    console.log('\n🎉 数据库初始化完成！');
    console.log('\n📝 下一步：');
    console.log('   - 启动后端服务: npm run dev');
    console.log('   - 访问API文档: http://localhost:3000/api/v1');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  } finally {
    // 关闭数据库连接
    const knex = require('../config/db');
    await knex.destroy();
  }
}

// 显示帮助信息
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
数据库初始化脚本

用法:
  node scripts/init-database.js [选项]

选项:
  --seed    同时插入种子数据
  --help    显示此帮助信息

示例:
  node scripts/init-database.js           # 只运行迁移
  node scripts/init-database.js --seed    # 运行迁移并插入种子数据
`);
  process.exit(0);
}

// 运行主函数
main().catch(error => {
  console.error('💥 未捕获的错误:', error);
  process.exit(1);
});
