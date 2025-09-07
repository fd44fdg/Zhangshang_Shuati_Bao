#!/usr/bin/env node
/*
 * 轻量仓库卫生检查：重复配置 & 禁止文件
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const issues = [];

function isTracked(p){
  try { execSync(`git ls-files --error-unmatch "${p}" > NUL 2>&1`); return true; } catch { return false; }
}

// 1. 重复 pages.json
const dupPages = path.join(root, 'zhangshang-shuati-app', 'src', 'pages.json');
if (fs.existsSync(dupPages)) {
  issues.push('[重复配置] 存在 src/pages.json，应删除，仅保留根 zhangshang-shuati-app/pages.json');
}

// 2. 调试页面模式
const debugPages = [
  'zhangshang-shuati-app/src/pages/home/home-min.vue',
  'zhangshang-shuati-app/src/pages/simple-test/simple-test.vue'
];
debugPages.forEach(fp=>{ if (isTracked(fp)) issues.push('[调试残留] ' + fp); });

// 3. 禁止跟踪的文件类型
const bannedGlobs = [ '*.exe', '*.db', '*.sqlite' ];
// 简单扫描 git tracked 列表
const tracked = execSync('git ls-files', {encoding:'utf8'}).split(/\r?\n/).filter(Boolean);
tracked.forEach(f=>{
  if (bannedGlobs.some(g=>{
    if (g.startsWith('*')) return f.endsWith(g.slice(1));
    return false;
  })) {
    issues.push('[禁止跟踪] ' + f);
  }
});

if (issues.length){
  console.error('\n[Preflight 检查未通过]\n' + issues.map(i=>' - '+i).join('\n'));
  console.error('\n请按 docs/REPO_HYGIENE.md 规范清理后再继续。');
  process.exit(2);
} else {
  console.log('Preflight OK：无重复 pages.json / 无调试残留 / 无禁止文件');
}
