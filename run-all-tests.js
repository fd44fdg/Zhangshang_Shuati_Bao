#!/usr/bin/env node
const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, Object.assign({ encoding: 'utf8', shell: false }, opts));
  return {
    status: res.status,
    stdout: res.stdout ? res.stdout.toString() : '',
    stderr: res.stderr ? res.stderr.toString() : ''
  };
}

async function main() {
  // Default behaviour: run backend tests (safe and available in this repo)
  const root = path.resolve(__dirname);

  // Use the package-level script which runs `cd backend && npm test`
  const cmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const args = ['run', 'test:backend', '--silent'];

  console.log('Running: ' + [cmd].concat(args).join(' '));
  const res = run(cmd, args, { cwd: root, env: process.env });

  // Print captured output so CI / MCP can see test logs
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);

  // Exit with the same status code as the executed test to signal failure
  process.exit(res.status || 0);
}

main();
