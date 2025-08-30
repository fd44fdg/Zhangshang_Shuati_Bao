#!/usr/bin/env node

/**
 * 快速启动脚本
 * Linus式：一个命令搞定所有事情
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class QuickStarter {
  constructor() {
    this.processes = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      'info': 'ℹ️ ',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️ '
    }[type] || 'ℹ️ ';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async checkPrerequisites() {
    this.log('检查前置条件...');

    // 检查 Node.js
    try {
      const { stdout } = await execAsync('node --version');
      this.log(`Node.js 版本: ${stdout.trim()}`, 'success');
    } catch (error) {
      this.log('Node.js 未安装或不在 PATH 中', 'error');
      return false;
    }

    // 检查环境变量文件
    if (!fs.existsSync('.env')) {
      this.log('创建默认环境变量文件...', 'warning');
      if (fs.existsSync('.env.example')) {
        fs.copyFileSync('.env.example', '.env');
        this.log('已从 .env.example 创建 .env 文件', 'success');
      } else {
        this.log('缺少 .env.example 文件', 'error');
        return false;
      }
    }

    return true;
  }

  async initializeDatabase() {
    this.log('初始化数据库...');
    
    try {
      const { stdout, stderr } = await execAsync('npm run db:init:seed', {
        cwd: 'backend'
      });
      
      if (stderr && !stderr.includes('warning')) {
        this.log(`数据库初始化警告: ${stderr}`, 'warning');
      }
      
      this.log('数据库初始化完成', 'success');
      return true;
    } catch (error) {
      this.log(`数据库初始化失败: ${error.message}`, 'error');
      return false;
    }
  }

  spawnService(name, command, cwd, port) {
    this.log(`启动 ${name}...`);
    
    const child = spawn('npm', ['run', command], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    child.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[${name}] ${output}`);
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output && !output.includes('warning')) {
        console.log(`[${name}] ${output}`);
      }
    });

    child.on('close', (code) => {
      if (code !== 0) {
        this.log(`${name} 进程退出，代码: ${code}`, 'error');
      }
    });

    this.processes.push({ name, child, port });
    return child;
  }

  async waitForService(name, url, maxAttempts = 30) {
    this.log(`等待 ${name} 启动...`);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const { stdout } = await execAsync(`curl -s -o /dev/null -w "%{http_code}" ${url}`, {
          timeout: 2000
        });
        
        if (stdout.trim() === '200' || stdout.trim() === '404') {
          this.log(`${name} 已启动`, 'success');
          return true;
        }
      } catch (error) {
        // 服务还未启动，继续等待
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.log(`${name} 启动超时`, 'warning');
    return false;
  }

  async startServices() {
    this.log('启动所有服务...');

    // 启动后端
    this.spawnService('Backend', 'dev', 'backend', 3000);
    await this.waitForService('Backend', 'http://localhost:3000');

    // 启动管理后台
    this.spawnService('Admin Panel', 'serve', 'admin-panel', 8080);
    
    // 启动移动端
    this.spawnService('Mobile App', 'dev:h5', 'zhangshang-shuati-app', 8083);

    // 等待前端服务启动
    await this.waitForService('Admin Panel', 'http://localhost:8080');
    await this.waitForService('Mobile App', 'http://localhost:8083');
  }

  showServiceInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 掌上刷题宝 - 开发环境已启动');
    console.log('='.repeat(60));
    console.log('📱 移动端 H5:     http://localhost:8083');
    console.log('🖥️  管理后台:      http://localhost:8080');
    console.log('🔧 后端 API:      http://localhost:3000/api/v1');
    console.log('📊 API 健康检查:   http://localhost:3000/health');
    console.log('='.repeat(60));
    console.log('💡 提示:');
    console.log('   - 按 Ctrl+C 停止所有服务');
    console.log('   - 查看日志: 各服务的输出会显示在此终端');
    console.log('   - 数据库: 使用 SQLite，文件位于 backend/database/local.db');
    console.log('='.repeat(60));
  }

  setupGracefulShutdown() {
    const shutdown = () => {
      this.log('正在停止所有服务...');
      
      this.processes.forEach(({ name, child }) => {
        this.log(`停止 ${name}...`);
        child.kill('SIGTERM');
      });

      setTimeout(() => {
        this.log('强制退出...');
        process.exit(0);
      }, 5000);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  async run() {
    console.log('🚀 掌上刷题宝快速启动脚本\n');

    try {
      // 1. 检查前置条件
      const prereqsOk = await this.checkPrerequisites();
      if (!prereqsOk) {
        this.log('前置条件检查失败', 'error');
        process.exit(1);
      }

      // 2. 初始化数据库
      const dbOk = await this.initializeDatabase();
      if (!dbOk) {
        this.log('数据库初始化失败，但继续启动服务...', 'warning');
      }

      // 3. 启动服务
      await this.startServices();

      // 4. 显示服务信息
      this.showServiceInfo();

      // 5. 设置优雅关闭
      this.setupGracefulShutdown();

      // 保持进程运行
      await new Promise(() => {});

    } catch (error) {
      this.log(`启动失败: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// 运行快速启动
if (require.main === module) {
  const starter = new QuickStarter();
  starter.run();
}

module.exports = QuickStarter;
