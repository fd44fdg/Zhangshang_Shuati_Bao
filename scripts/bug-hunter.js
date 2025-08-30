#!/usr/bin/env node

/**
 * Linus式Bug猎手
 * "Show me the code" - 找出所有垃圾代码
 */

const fs = require('fs');
const path = require('path');

class BugHunter {
  constructor() {
    this.bugs = [];
    this.warnings = [];
    this.scannedFiles = 0;
  }

  log(type, file, line, message, code = '') {
    const issue = {
      type,
      file: path.relative(process.cwd(), file),
      line,
      message,
      code: code.trim()
    };

    if (type === 'BUG') {
      this.bugs.push(issue);
      console.log(`🔴 BUG: ${issue.file}:${line} - ${message}`);
    } else {
      this.warnings.push(issue);
      console.log(`🟡 WARNING: ${issue.file}:${line} - ${message}`);
    }
  }

  scanFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    this.scannedFiles++;

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();

      // 检查已删除文件的引用
      if (trimmed.includes("require('../utils/catchAsync')") || 
          trimmed.includes("require('./utils/catchAsync')")) {
        this.log('BUG', filePath, lineNum, '引用已删除的catchAsync文件', line);
      }

      if (trimmed.includes("require('../utils/simpleORM')") || 
          trimmed.includes("require('./utils/simpleORM')")) {
        this.log('BUG', filePath, lineNum, '引用已删除的simpleORM文件', line);
      }

      // 检查硬编码的安全问题
      if (trimmed.includes('your-secret-key') || 
          trimmed.includes('your_secret_key') ||
          trimmed.includes('change-in-production')) {
        this.log('BUG', filePath, lineNum, '硬编码的密钥或密码', line);
      }

      // 检查SQL注入风险
      if (trimmed.includes('${') && 
          (trimmed.includes('SELECT') || trimmed.includes('INSERT') || 
           trimmed.includes('UPDATE') || trimmed.includes('DELETE'))) {
        this.log('BUG', filePath, lineNum, '潜在的SQL注入风险 - 字符串拼接SQL', line);
      }

      // 检查未处理的Promise
      if (trimmed.includes('await ') && !trimmed.includes('try') && 
          !trimmed.includes('catch') && !trimmed.includes('asyncHandler') &&
          !trimmed.includes('catchAsync')) {
        this.log('WARNING', filePath, lineNum, '未包装的async函数 - 可能导致未捕获异常', line);
      }

      // 检查console.log在生产代码中
      if (trimmed.includes('console.log') && !filePath.includes('test') && 
          !filePath.includes('script') && !filePath.includes('debug')) {
        this.log('WARNING', filePath, lineNum, '生产代码中的console.log', line);
      }

      // 检查TODO和FIXME
      if (trimmed.includes('TODO') || trimmed.includes('FIXME')) {
        this.log('WARNING', filePath, lineNum, '未完成的代码标记', line);
      }

      // 检查空的catch块
      if (trimmed.includes('catch') && lines[index + 1] && 
          lines[index + 1].trim() === '}') {
        this.log('BUG', filePath, lineNum, '空的catch块 - 错误被静默忽略', line);
      }

      // 检查魔法数字
      if (/\* 100/.test(trimmed) && trimmed.includes('statusCode')) {
        this.log('BUG', filePath, lineNum, '奇怪的状态码处理 - 为什么乘以100?', line);
      }

      // 检查未使用的变量声明
      if (trimmed.startsWith('const ') && trimmed.includes(' = require(') && 
          !content.includes(trimmed.split(' ')[1].replace(',', ''))) {
        this.log('WARNING', filePath, lineNum, '可能未使用的require导入', line);
      }

      // 检查端口配置不一致
      if (trimmed.includes('3000') || trimmed.includes('3001') || 
          trimmed.includes('3002') || trimmed.includes('8080') || 
          trimmed.includes('8081') || trimmed.includes('8082')) {
        if (trimmed.includes('localhost:') || trimmed.includes('PORT')) {
          this.log('WARNING', filePath, lineNum, '硬编码的端口号 - 检查配置一致性', line);
        }
      }
    });
  }

  scanDirectory(dirPath, extensions = ['.js', '.json']) {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // 跳过node_modules等目录
        if (!['node_modules', 'dist', 'build', 'coverage', '.git'].includes(entry.name)) {
          this.scanDirectory(fullPath, extensions);
        }
      } else if (extensions.includes(path.extname(entry.name))) {
        this.scanFile(fullPath);
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 Linus式Bug猎手报告');
    console.log('='.repeat(80));
    
    console.log(`📁 扫描文件: ${this.scannedFiles} 个`);
    console.log(`🔴 发现Bug: ${this.bugs.length} 个`);
    console.log(`🟡 警告: ${this.warnings.length} 个`);

    if (this.bugs.length > 0) {
      console.log('\n🚨 致命Bug (必须修复):');
      this.bugs.forEach((bug, index) => {
        console.log(`\n${index + 1}. ${bug.file}:${bug.line}`);
        console.log(`   问题: ${bug.message}`);
        console.log(`   代码: ${bug.code}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  警告 (建议修复):');
      this.warnings.slice(0, 10).forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.file}:${warning.line}`);
        console.log(`   问题: ${warning.message}`);
        console.log(`   代码: ${warning.code}`);
      });
      
      if (this.warnings.length > 10) {
        console.log(`\n... 还有 ${this.warnings.length - 10} 个警告未显示`);
      }
    }

    console.log('\n' + '='.repeat(80));
    
    if (this.bugs.length === 0) {
      console.log('🎉 没有发现致命Bug！');
    } else {
      console.log('🔧 请修复上述Bug后重新扫描');
    }
    
    console.log('='.repeat(80));
    
    return this.bugs.length === 0 ? 0 : 1;
  }

  hunt() {
    console.log('🔍 开始Bug猎杀...\n');

    // 扫描后端代码
    this.scanDirectory('backend', ['.js']);
    
    // 扫描前端代码
    this.scanDirectory('admin-panel/src', ['.js', '.vue']);
    this.scanDirectory('zhangshang-shuati-app/src', ['.js', '.vue']);
    
    // 扫描配置文件
    this.scanDirectory('.', ['.js', '.json']);
    this.scanDirectory('scripts', ['.js']);

    return this.generateReport();
  }
}

// 运行Bug猎手
if (require.main === module) {
  const hunter = new BugHunter();
  const exitCode = hunter.hunt();
  process.exit(exitCode);
}

module.exports = BugHunter;
