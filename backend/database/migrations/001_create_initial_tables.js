/**
 * 初始数据库表结构迁移
 * 创建掌上刷题宝的核心表结构
 */

exports.up = function(knex) {
  return knex.schema
    // 1. 用户表
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('username', 50).notNullable().unique();
      table.string('email', 100).unique();
      table.string('password_hash', 255).notNullable();
      table.string('nickname', 50);
      table.string('avatar_url', 255);
      table.enum('role', ['user', 'admin']).defaultTo('user');
      table.enum('status', ['active', 'inactive', 'banned']).defaultTo('active');
      table.string('wechat_openid', 100).unique();
      table.integer('total_score').defaultTo(0);
      table.integer('study_days').defaultTo(0);
      table.timestamp('last_login_at');
      table.timestamps(true, true);
      
      // 索引
      table.index(['username']);
      table.index(['email']);
      table.index(['wechat_openid']);
      table.index(['status']);
    })
    
    // 2. 题目分类表
    .createTable('question_categories', function(table) {
      table.increments('id').primary();
      table.string('name', 100).notNullable();
      table.text('description');
      table.integer('sort_order').defaultTo(0);
      table.enum('status', ['active', 'inactive']).defaultTo('active');
      table.timestamps(true, true);
      
      table.index(['status', 'sort_order']);
    })
    
    // 3. 题目表
    .createTable('questions', function(table) {
      table.increments('id').primary();
      table.string('title', 255).notNullable();
      table.text('content').notNullable();
      table.enum('type', ['single', 'multiple', 'essay', 'true_false']).notNullable();
      table.enum('difficulty', ['easy', 'medium', 'hard']).defaultTo('medium');
      table.string('subject', 100);
      table.json('options'); // 选择题选项
      table.json('correct_answer'); // 正确答案
      table.text('explanation'); // 解析
      table.integer('category_id').unsigned();
      table.json('tags'); // 标签数组
      table.json('knowledge_points'); // 知识点数组
      table.integer('score').defaultTo(1);
      table.enum('status', ['active', 'inactive', 'draft']).defaultTo('active');
      table.integer('view_count').defaultTo(0);
      table.integer('answer_count').defaultTo(0);
      table.integer('correct_count').defaultTo(0);
      table.timestamps(true, true);
      
      // 外键和索引
      table.foreign('category_id').references('id').inTable('question_categories');
      table.index(['type']);
      table.index(['difficulty']);
      table.index(['subject']);
      table.index(['category_id']);
      table.index(['status']);
    })
    
    // 4. 用户答题记录表
    .createTable('user_answers', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('question_id').unsigned().notNullable();
      table.json('user_answer'); // 用户答案
      table.boolean('is_correct').notNullable();
      table.integer('time_spent'); // 答题用时(秒)
      table.timestamp('answered_at').defaultTo(knex.fn.now());
      
      // 外键和索引
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('question_id').references('id').inTable('questions').onDelete('CASCADE');
      table.index(['user_id']);
      table.index(['question_id']);
      table.index(['is_correct']);
      table.index(['answered_at']);
    })
    
    // 5. 用户收藏表
    .createTable('user_favorites', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('question_id').unsigned().notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // 外键和索引
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('question_id').references('id').inTable('questions').onDelete('CASCADE');
      table.unique(['user_id', 'question_id']);
      table.index(['user_id']);
    })
    
    // 6. 错题本表
    .createTable('user_wrong_questions', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('question_id').unsigned().notNullable();
      table.integer('wrong_count').defaultTo(1);
      table.timestamp('last_wrong_time').defaultTo(knex.fn.now());
      table.boolean('is_mastered').defaultTo(false);
      table.timestamp('mastered_at');
      
      // 外键和索引
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('question_id').references('id').inTable('questions').onDelete('CASCADE');
      table.unique(['user_id', 'question_id']);
      table.index(['user_id', 'is_mastered']);
    })
    
    // 7. 学习记录表
    .createTable('user_study_records', function(table) {
      table.increments('id').primary();
      table.integer('user_id').unsigned().notNullable();
      table.integer('question_id').unsigned().notNullable();
      table.boolean('is_correct').notNullable();
      table.integer('time_spent'); // 答题用时(秒)
      table.timestamp('study_date').defaultTo(knex.fn.now());
      
      // 外键和索引
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('question_id').references('id').inTable('questions').onDelete('CASCADE');
      table.index(['user_id', 'study_date']);
      table.index(['study_date']);
    })
    
    // 8. 系统设置表
    .createTable('system_settings', function(table) {
      table.increments('id').primary();
      table.string('key', 100).notNullable().unique();
      table.text('value');
      table.string('description', 255);
      table.enum('type', ['string', 'number', 'boolean', 'json']).defaultTo('string');
      table.timestamps(true, true);
      
      table.index(['key']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('system_settings')
    .dropTableIfExists('user_study_records')
    .dropTableIfExists('user_wrong_questions')
    .dropTableIfExists('user_favorites')
    .dropTableIfExists('user_answers')
    .dropTableIfExists('questions')
    .dropTableIfExists('question_categories')
    .dropTableIfExists('users');
};
