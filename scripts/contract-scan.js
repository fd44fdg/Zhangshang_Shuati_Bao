#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir) {
  return fs.readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    return st.isDirectory() ? walk(p) : [p];
  });
}

const routesDir = path.join(__dirname, '..', 'backend', 'routes');
const files = walk(routesDir).filter(f => f.endsWith('.js'));

const offenders = [];
const reJson = /res\s*\.\s*json\s*\(/;
const reLegacyCode = /code\s*:\s*20000/;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  if (reJson.test(src)) offenders.push({ file: f, reason: 'use of res.json in routes' });
  if (reLegacyCode.test(src)) offenders.push({ file: f, reason: 'legacy code:20000 found' });
}

if (offenders.length) {
  console.error('Contract scan failed:');
  for (const o of offenders) {
    console.error(` - ${path.relative(process.cwd(), o.file)}: ${o.reason}`);
  }
  process.exit(1);
} else {
  console.log('Contract scan passed.');
}
