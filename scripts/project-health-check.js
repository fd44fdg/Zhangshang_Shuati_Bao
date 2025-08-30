#!/usr/bin/env node

/**
 * 项目健康检查脚本
 * Linus式：简单、直接、有用
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class ProjectHealthChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'error': '❌',
      'warning': '⚠️ ',
      'success': '✅',
      'info': 'ℹ️ '
    }[type] || 'ℹ️ ';
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error') this.issues.push(message);
    else if (type === 'warning') this.warnings.push(message);
    else if (type === 'success') this.passed.push(message);
  }

  async checkFileExists(filePath, description, required = true) {
    const exists = fs.existsSync(filePath);
    if (exists) {
      this.log('success', `${description}: 存在`);
    } else {
      this.log(required ? 'error' : 'warning', `${description}: 缺失 (${filePath})`);
    }
    return exists;
  }

  async checkPortConsistency() {
    this.log('info', '检查端口配置一致性...');
    
    const configs = {
      'backend/config/index.js': null,
      'docker-compose.yml': null,
      'zhangshang-shuati-app/src/config/index.js': null
    };

    // 检查后端配置
    try {
      const backendConfig = fs.readFileSync('backend/config/index.js', 'utf8');
      const portMatch = backendConfig.match(/backend:\s*process\.env\.PORT\s*\|\|\s*(\d+)/);
      if (portMatch) {
        configs['backend/config/index.js'] = portMatch[1];
      }
    } catch (error) {
      this.log('error', '无法读取后端配置文件');
    }

    // 检查 Docker 配置
    try {
      const dockerConfig = fs.readFileSync('docker-compose.yml', 'utf8');
      const portMatch = dockerConfig.match(/"(\d+):3000"/);
      if (portMatch) {
        configs['docker-compose.yml'] = portMatch[1];
      }
    } catch (error) {
      this.log('error', '无法读取 Docker 配置文件');
    }

    // 检查前端配置
    try {
      const frontendConfig = fs.readFileSync('zhangshang-shuati-app/src/config/index.js', 'utf8');
      const portMatch = frontendConfig.match(/localhost:(\d+)\/api/);
      if (portMatch) {
        configs['zhangshang-shuati-app/src/config/index.js'] = portMatch[1];
      }
    } catch (error) {
      this.log('error', '无法读取前端配置文件');
    }

    // 检查一致性
    const ports = Object.values(configs).filter(p => p !== null);
    const uniquePorts = [...new Set(ports)];
    
    if (uniquePorts.length === 1) {
      this.log('success', `端口配置一致: ${uniquePorts[0]}`);
    } else {
      this.log('error', `端口配置不一致: ${JSON.stringify(configs)}`);
    }
  }

  async checkDatabaseMigrations() {
    this.log('info', '检查数据库迁移文件...');
    
    const migrationDir = 'backend/database/migrations';
    const seedDir = 'backend/database/seeds';
    
    if (!fs.existsSync(migrationDir)) {
      this.log('error', '缺少数据库迁移目录');
      return;
    }

    const migrations = fs.readdirSync(migrationDir).filter(f => f.endsWith('.js'));
    if (migrations.length === 0) {
      this.log('error', '没有数据库迁移文件');
    } else {
      this.log('success', `找到 ${migrations.length} 个迁移文件`);
    }

    if (!fs.existsSync(seedDir)) {
      this.log('warning', '缺少种子数据目录');
    } else {
      const seeds = fs.readdirSync(seedDir).filter(f => f.endsWith('.js'));
      this.log('success', `找到 ${seeds.length} 个种子文件`);
    }
  }

  async checkDependencies() {
    this.log('info', '检查依赖安装状态...');
    
    const modules = ['backend', 'admin-panel', 'zhangshang-shuati-app'];
    
    for (const module of modules) {
      const nodeModulesPath = path.join(module, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        this.log('success', `${module}: 依赖已安装`);
      } else {
        this.log('error', `${module}: 依赖未安装，请运行 npm install`);
      }
    }
  }

  async checkEnvironmentFiles() {
    this.log('info', '检查环境配置文件...');
    
    await this.checkFileExists('.env.example', '环境变量模板', true);
    await this.checkFileExists('.env', '环境变量配置', false);
    
    if (!fs.existsSync('.env')) {
      this.log('warning', '建议复制 .env.example 为 .env 并配置相应参数');
    }
  }

  async checkTestConfiguration() {
    this.log('info', '检查测试配置...');
    
    const testConfigs = [
      'backend/jest.config.js',
      'admin-panel/jest.config.js'
    ];

    for (const config of testConfigs) {
      await this.checkFileExists(config, `测试配置 (${config})`, false);
    }
  }

  async generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 项目健康检查报告');
    console.log('='.repeat(60));
    
    console.log(`\n✅ 通过检查: ${this.passed.length} 项`);
    console.log(`⚠️  警告: ${this.warnings.length} 项`);
    console.log(`❌ 错误: ${this.issues.length} 项`);

    if (this.issues.length > 0) {
      console.log('\n🚨 需要修复的问题:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  建议改进的地方:');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    
    if (this.issues.length === 0) {
      console.log('🎉 项目状态良好！');
      return 0;
    } else {
      console.log('🔧 请修复上述问题后重新检查');
      return 1;
    }
  }

  async run() {
    console.log('🔍 开始项目健康检查...\n');

    await this.checkEnvironmentFiles();
    await this.checkPortConsistency();
    await this.checkDatabaseMigrations();
    await this.checkDependencies();
    await this.checkTestConfiguration();

    return await this.generateReport();
  }
}

// 运行检查
if (require.main === module) {
  const checker = new ProjectHealthChecker();
  checker.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('💥 检查过程中发生错误:', error.message);
    process.exit(1);
  });
}

module.exports = ProjectHealthChecker;
