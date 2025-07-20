-- 创建数据库
CREATE DATABASE IF NOT EXISTS zhangshang_shuati CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zhangshang_shuati;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nickname VARCHAR(50),
  phone VARCHAR(20),
  avatar VARCHAR(255) DEFAULT '/static/default-avatar.svg',
  gender ENUM('male', 'female', 'other') DEFAULT 'other',
  birthday DATE,
  bio TEXT,
  learning_goal TEXT,
  role ENUM('user', 'admin') DEFAULT 'user',
  status TINYINT DEFAULT 1 COMMENT '0:禁用 1:启用',
  level INT DEFAULT 1,
  points INT DEFAULT 0,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 用户统计表
CREATE TABLE IF NOT EXISTS user_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  correct_rate DECIMAL(5,2) DEFAULT 0.00,
  continuous_days INT DEFAULT 0,
  total_questions INT DEFAULT 0,
  correct_questions INT DEFAULT 0,
  rank_position INT DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 题目分类表
CREATE TABLE IF NOT EXISTS question_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  parent_id INT,
  icon VARCHAR(255),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES question_categories(id) ON DELETE SET NULL
);

-- 题目表
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('single', 'multiple', 'boolean', 'fill', 'essay') NOT NULL,
  options JSON,
  answer TEXT NOT NULL,
  explanation TEXT,
  difficulty TINYINT DEFAULT 2 COMMENT '1:简单 2:中等 3:困难 4:专家',
  category_id INT,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES question_categories(id) ON DELETE SET NULL
);

-- 用户答题记录表
CREATE TABLE IF NOT EXISTS user_answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answer_time INT DEFAULT 0 COMMENT '答题用时(秒)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 用户收藏表
CREATE TABLE IF NOT EXISTS user_favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_question (user_id, question_id)
);

-- 错题记录表
CREATE TABLE IF NOT EXISTS user_wrong_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  wrong_count INT DEFAULT 1,
  last_wrong_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_mastered BOOLEAN DEFAULT FALSE COMMENT '是否已掌握',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_question (user_id, question_id)
);

-- 学习记录表
CREATE TABLE IF NOT EXISTS user_study_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  study_date DATE NOT NULL,
  questions_count INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  study_time INT DEFAULT 0 COMMENT '学习时长（秒）',
  categories JSON COMMENT '学习的分类',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_date (user_id, study_date)
);

-- 用户签到表
CREATE TABLE IF NOT EXISTS user_checkins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  checkin_date DATE NOT NULL,
  points_earned INT DEFAULT 5 COMMENT '签到获得的积分',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_checkin (user_id, checkin_date)
);

-- 考试记录表
CREATE TABLE IF NOT EXISTS user_exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  exam_title VARCHAR(100),
  score INT NOT NULL,
  total_questions INT NOT NULL,
  correct_count INT NOT NULL,
  duration INT COMMENT '考试用时(秒)',
  is_passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 考试题目关联表
CREATE TABLE IF NOT EXISTS exam_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  question_id INT NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN,
  FOREIGN KEY (exam_id) REFERENCES user_exams(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

-- 文章分类表
CREATE TABLE IF NOT EXISTS article_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 文章表
CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  cover VARCHAR(255),
  author VARCHAR(50),
  category_id INT,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '0:草稿 1:已发布',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES article_categories(id) ON DELETE SET NULL
);

-- 文章评论表
CREATE TABLE IF NOT EXISTS article_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  parent_id INT,
  like_count INT DEFAULT 0,
  status TINYINT DEFAULT 1 COMMENT '0:待审核 1:已发布',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES article_comments(id) ON DELETE SET NULL
);

-- 插入默认管理员账号
INSERT INTO users (username, email, password, nickname, role, status)
VALUES ('admin', 'admin@example.com', '$2a$10$JQOfG5Tqnf97SqGEYT1TBuFiZ2jNuT6gvxhDft6D6UQjwGTKVqxCS', '管理员', 'admin', 1);

-- 插入默认分类
INSERT INTO question_categories (name, description, sort_order)
VALUES 
('JavaScript', 'JavaScript编程语言相关题目', 1),
('HTML', 'HTML标记语言相关题目', 2),
('CSS', 'CSS样式表相关题目', 3),
('React', 'React框架相关题目', 4),
('Node.js', 'Node.js服务端JavaScript相关题目', 5);

-- 插入文章分类
INSERT INTO article_categories (name, description, sort_order)
VALUES 
('技术教程', '各类编程技术教程', 1),
('面试指南', '求职面试相关内容', 2),
('学习方法', '提高学习效率的方法', 3); 