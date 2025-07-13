#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 测试配置
const config = {
  projects: {
    backend: {
      name: '后端API',
      path: './backend',
      testCommand: 'npm test',
      coverageCommand: 'npm run test:coverage',
      startCommand: 'npm start',
      port: 3000,
      healthCheck: 'http://localhost:3000/api/health'
    },
    adminPanel: {
      name: '管理后台',
      path: './admin-panel',
      testCommand: 'npm run test:unit',
      e2eCommand: 'npm run test:e2e:headless',
      startCommand: 'npm run serve',
      port: 8080,
      healthCheck: 'http://localhost:8080'
    },
    mobileApp: {
      name: '移动端应用',
      path: './zhangshang-shuati-app',
      testCommand: 'npm run test:unit',
      startCommand: 'npm run dev',
      port: 8081,
      healthCheck: 'http://localhost:8081'
    }
  },
  integration: {
    name: '集成测试',
    script: './integration-tests.js'
  },
  timeout: 300000, // 5分钟超时
  retries: 3
};

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 日志函数
const log = (message, color = 'reset') => {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
};

const logSection = (title) => {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
};

// 工具函数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runCommand = (command, cwd, options = {}) => {
  return new Promise((resolve, reject) => {
    const { timeout = config.timeout, silent = false } = options;
    
    if (!silent) {
      log(`执行命令: ${command} (在 ${cwd})`, 'cyan');
    }
    
    const child = spawn(command, [], {
      shell: true,
      cwd,
      stdio: silent ? 'pipe' : 'inherit'
    });
    
    let output = '';
    if (silent) {
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      child.stderr.on('data', (data) => {
        output += data.toString();
      });
    }
    
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`命令执行超时: ${command}`));
    }, timeout);
    
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ code, output });
      } else {
        reject(new Error(`命令执行失败: ${command}, 退出码: ${code}`));
      }
    });
    
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
};

const checkHealth = async (url, maxRetries = 10) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return true;
      }
    } catch (error) {
      // 忽略错误，继续重试
    }
    await sleep(2000);
  }
  return false;
};

const installDependencies = async (projectPath, projectName) => {
  log(`安装 ${projectName} 依赖...`, 'yellow');
  
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log(`跳过 ${projectName}: package.json 不存在`, 'yellow');
    return false;
  }
  
  try {
    await runCommand('npm install', projectPath, { timeout: 180000 });
    log(`${projectName} 依赖安装完成`, 'green');
    return true;
  } catch (error) {
    log(`${projectName} 依赖安装失败: ${error.message}`, 'red');
    return false;
  }
};

const runUnitTests = async (project, projectConfig) => {
  log(`运行 ${projectConfig.name} 单元测试...`, 'blue');
  
  try {
    await runCommand(projectConfig.testCommand, projectConfig.path);
    log(`${projectConfig.name} 单元测试通过`, 'green');
    return { success: true, type: 'unit' };
  } catch (error) {
    log(`${projectConfig.name} 单元测试失败: ${error.message}`, 'red');
    return { success: false, type: 'unit', error: error.message };
  }
};

const runCoverageTests = async (project, projectConfig) => {
  if (!projectConfig.coverageCommand) {
    return { success: true, type: 'coverage', skipped: true };
  }
  
  log(`运行 ${projectConfig.name} 覆盖率测试...`, 'blue');
  
  try {
    await runCommand(projectConfig.coverageCommand, projectConfig.path);
    log(`${projectConfig.name} 覆盖率测试完成`, 'green');
    return { success: true, type: 'coverage' };
  } catch (error) {
    log(`${projectConfig.name} 覆盖率测试失败: ${error.message}`, 'red');
    return { success: false, type: 'coverage', error: error.message };
  }
};

const runE2ETests = async (project, projectConfig) => {
  if (!projectConfig.e2eCommand) {
    return { success: true, type: 'e2e', skipped: true };
  }
  
  log(`运行 ${projectConfig.name} E2E测试...`, 'blue');
  
  try {
    await runCommand(projectConfig.e2eCommand, projectConfig.path);
    log(`${projectConfig.name} E2E测试通过`, 'green');
    return { success: true, type: 'e2e' };
  } catch (error) {
    log(`${projectConfig.name} E2E测试失败: ${error.message}`, 'red');
    return { success: false, type: 'e2e', error: error.message };
  }
};

const startService = async (project, projectConfig) => {
  log(`启动 ${projectConfig.name} 服务...`, 'yellow');
  
  const child = spawn(projectConfig.startCommand, [], {
    shell: true,
    cwd: projectConfig.path,
    stdio: 'pipe',
    detached: true
  });
  
  // 等待服务启动
  await sleep(5000);
  
  // 健康检查
  if (projectConfig.healthCheck) {
    const isHealthy = await checkHealth(projectConfig.healthCheck);
    if (isHealthy) {
      log(`${projectConfig.name} 服务启动成功`, 'green');
      return { success: true, process: child };
    } else {
      log(`${projectConfig.name} 服务健康检查失败`, 'red');
      child.kill();
      return { success: false };
    }
  }
  
  return { success: true, process: child };
};

const runIntegrationTests = async () => {
  log('运行集成测试...', 'blue');
  
  try {
    await runCommand(`node ${config.integration.script}`, '.');
    log('集成测试通过', 'green');
    return { success: true, type: 'integration' };
  } catch (error) {
    log(`集成测试失败: ${error.message}`, 'red');
    return { success: false, type: 'integration', error: error.message };
  }
};

const generateTestReport = (results) => {
  logSection('测试报告');
  
  const summary = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };
  
  Object.entries(results).forEach(([project, projectResults]) => {
    log(`\n${project}:`, 'bright');
    
    projectResults.forEach(result => {
      summary.total++;
      
      if (result.skipped) {
        summary.skipped++;
        log(`  ${result.type}: 跳过`, 'yellow');
      } else if (result.success) {
        summary.passed++;
        log(`  ${result.type}: 通过`, 'green');
      } else {
        summary.failed++;
        log(`  ${result.type}: 失败 - ${result.error}`, 'red');
      }
    });
  });
  
  log('\n总结:', 'bright');
  log(`总测试数: ${summary.total}`);
  log(`通过: ${summary.passed}`, 'green');
  log(`失败: ${summary.failed}`, summary.failed > 0 ? 'red' : 'green');
  log(`跳过: ${summary.skipped}`, 'yellow');
  log(`成功率: ${((summary.passed / (summary.total - summary.skipped)) * 100).toFixed(2)}%`);
  
  return summary;
};

const cleanupProcesses = (processes) => {
  log('清理进程...', 'yellow');
  processes.forEach(process => {
    if (process && !process.killed) {
      process.kill();
    }
  });
};

// 主测试函数
const runAllTests = async () => {
  logSection('开始全面测试');
  
  const results = {};
  const runningProcesses = [];
  
  try {
    // 1. 安装依赖
    logSection('安装项目依赖');
    for (const [project, projectConfig] of Object.entries(config.projects)) {
      const installed = await installDependencies(projectConfig.path, projectConfig.name);
      if (!installed) {
        log(`跳过 ${projectConfig.name} 的后续测试`, 'yellow');
        continue;
      }
    }
    
    // 2. 运行单元测试
    logSection('运行单元测试');
    for (const [project, projectConfig] of Object.entries(config.projects)) {
      if (!results[projectConfig.name]) {
        results[projectConfig.name] = [];
      }
      
      const result = await runUnitTests(project, projectConfig);
      results[projectConfig.name].push(result);
    }
    
    // 3. 运行覆盖率测试
    logSection('运行覆盖率测试');
    for (const [project, projectConfig] of Object.entries(config.projects)) {
      const result = await runCoverageTests(project, projectConfig);
      results[projectConfig.name].push(result);
    }
    
    // 4. 启动服务进行集成测试
    logSection('启动服务');
    for (const [project, projectConfig] of Object.entries(config.projects)) {
      const serviceResult = await startService(project, projectConfig);
      if (serviceResult.success && serviceResult.process) {
        runningProcesses.push(serviceResult.process);
      }
    }
    
    // 5. 运行E2E测试
    logSection('运行E2E测试');
    for (const [project, projectConfig] of Object.entries(config.projects)) {
      const result = await runE2ETests(project, projectConfig);
      results[projectConfig.name].push(result);
    }
    
    // 6. 运行集成测试
    logSection('运行集成测试');
    const integrationResult = await runIntegrationTests();
    results[config.integration.name] = [integrationResult];
    
    // 7. 生成测试报告
    const summary = generateTestReport(results);
    
    // 8. 保存测试报告到文件
    const reportPath = path.join(__dirname, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary,
      results
    }, null, 2));
    
    log(`\n测试报告已保存到: ${reportPath}`, 'cyan');
    
    // 9. 退出状态
    if (summary.failed > 0) {
      log('\n测试失败！', 'red');
      process.exit(1);
    } else {
      log('\n所有测试通过！', 'green');
      process.exit(0);
    }
    
  } catch (error) {
    log(`测试执行异常: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    cleanupProcesses(runningProcesses);
  }
};

// 命令行参数处理
const args = process.argv.slice(2);
const options = {
  unit: args.includes('--unit'),
  integration: args.includes('--integration'),
  e2e: args.includes('--e2e'),
  coverage: args.includes('--coverage'),
  help: args.includes('--help') || args.includes('-h')
};

if (options.help) {
  console.log(`
使用方法: node run-all-tests.js [选项]

选项:
  --unit        只运行单元测试
  --integration 只运行集成测试
  --e2e         只运行E2E测试
  --coverage    只运行覆盖率测试
  --help, -h    显示帮助信息

示例:
  node run-all-tests.js              # 运行所有测试
  node run-all-tests.js --unit       # 只运行单元测试
  node run-all-tests.js --integration # 只运行集成测试
`);
  process.exit(0);
}

// 根据参数运行特定测试
if (Object.values(options).some(Boolean)) {
  // 运行特定类型的测试
  log('运行特定类型的测试...', 'cyan');
  // 这里可以添加特定测试类型的逻辑
} else {
  // 运行所有测试
  runAllTests();
}

// 处理进程退出
process.on('SIGINT', () => {
  log('\n收到中断信号，正在清理...', 'yellow');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n收到终止信号，正在清理...', 'yellow');
  process.exit(1);
});