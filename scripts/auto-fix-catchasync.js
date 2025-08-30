#!/usr/bin/env node

/**
 * 自动修复catchAsync引用
 * Linus式：自动化解决重复性问题
 */

const fs = require('fs');
const path = require('path');

class CatchAsyncFixer {
  constructor() {
    this.fixedFiles = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const prefix = {
      'info': 'ℹ️ ',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️ '
    }[type] || 'ℹ️ ';
    
    console.log(`${prefix} ${message}`);
  }

  fixFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return false;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let newContent = content;

      // 1. 替换catchAsync函数调用
      const catchAsyncPattern = /catchAsync\(/g;
      if (catchAsyncPattern.test(content)) {
        newContent = newContent.replace(catchAsyncPattern, 'asyncHandler(');
        modified = true;
        this.log(`修复 ${filePath} 中的catchAsync函数调用`);
      }

      // 2. 替换require引用
      const requirePattern = /const\s+catchAsync\s*=\s*require\(['"`]\.\.\/utils\/catchAsync['"`]\);?/g;
      if (requirePattern.test(newContent)) {
        // 检查是否已经有asyncHandler的引用
        if (!newContent.includes('asyncHandler')) {
          newContent = newContent.replace(
            requirePattern,
            "const { asyncHandler } = require('../middleware/errorHandler');"
          );
        } else {
          // 如果已经有asyncHandler引用，直接删除catchAsync引用
          newContent = newContent.replace(requirePattern, '');
        }
        modified = true;
        this.log(`修复 ${filePath} 中的catchAsync引用`);
      }

      // 3. 清理多余的空行
      newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        this.fixedFiles.push(filePath);
        this.log(`已修复: ${path.relative(process.cwd(), filePath)}`, 'success');
        return true;
      }

      return false;
    } catch (error) {
      this.errors.push({ file: filePath, error: error.message });
      this.log(`修复失败 ${filePath}: ${error.message}`, 'error');
      return false;
    }
  }

  scanDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // 跳过node_modules等目录
        if (!['node_modules', 'dist', 'build', 'coverage', '.git'].includes(entry.name)) {
          this.scanDirectory(fullPath);
        }
      } else if (entry.name.endsWith('.js')) {
        this.fixFile(fullPath);
      }
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 CatchAsync自动修复报告');
    console.log('='.repeat(60));
    
    console.log(`✅ 修复文件数: ${this.fixedFiles.length}`);
    console.log(`❌ 修复失败数: ${this.errors.length}`);

    if (this.fixedFiles.length > 0) {
      console.log('\n📝 已修复的文件:');
      this.fixedFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${path.relative(process.cwd(), file)}`);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ 修复失败的文件:');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${path.relative(process.cwd(), error.file)}: ${error.error}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length === 0) {
      console.log('🎉 所有文件修复完成！');
    } else {
      console.log('⚠️  部分文件修复失败，请手动检查');
    }
    
    console.log('='.repeat(60));
  }

  run() {
    console.log('🔧 开始自动修复catchAsync引用...\n');

    // 扫描后端路由文件
    this.scanDirectory('backend/routes');
    
    // 扫描其他后端文件
    this.scanDirectory('backend/middleware');
    this.scanDirectory('backend/utils');
    this.scanDirectory('backend/controllers');

    this.generateReport();
    
    return this.errors.length === 0 ? 0 : 1;
  }
}

// 运行自动修复
if (require.main === module) {
  const fixer = new CatchAsyncFixer();
  const exitCode = fixer.run();
  process.exit(exitCode);
}

module.exports = CatchAsyncFixer;
