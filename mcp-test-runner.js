#!/usr/bin/env node
const { exec } = require("child_process");

// 可以换成你自己想跑的测试命令
const cmd = "npm test --silent";

exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
  const result = {
    success: !err,
    output: stdout.trim(),
    error: stderr.trim()
  };

  // MCP 期望看到合法 JSON
  process.stdout.write(JSON.stringify(result));
});
