#!/usr/bin/env node
// 将 assets/data.js 导出为 ios 端可直接打包的 questions.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const src = resolve(repoRoot, 'assets/data.js');
const dest = resolve(repoRoot, 'ios/InterviewPrep/Resources/questions.json');

const code = readFileSync(src, 'utf8');
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(code, ctx);

const data = ctx.window.INTERVIEW_DATA;
if (!Array.isArray(data)) {
  console.error('[export-ios-data] INTERVIEW_DATA 不是数组，请检查 assets/data.js');
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
writeFileSync(dest, JSON.stringify(data, null, 2), 'utf8');

const total = data.reduce((n, c) => n + (c.items?.length ?? 0), 0);
console.log(`[export-ios-data] 写入 ${dest}`);
console.log(`[export-ios-data] 分类 ${data.length} 个 / 题目 ${total} 道`);
