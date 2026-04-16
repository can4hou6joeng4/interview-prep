import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/data.js', import.meta.url), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const data = sandbox.window.INTERVIEW_DATA;
if (!Array.isArray(data) || data.length === 0) {
  throw new Error('题库数据为空，或 assets/data.js 没有正确暴露 window.INTERVIEW_DATA');
}

const validDiffs = new Set(['easy', 'medium', 'hard']);
const identitySet = new Set();
const idSet = new Set();
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const categorySlugSet = new Set();
let totalQuestions = 0;

data.forEach((category, categoryIndex) => {
  if (!category || typeof category !== 'object') {
    throw new Error(`分类 #${categoryIndex + 1} 不是合法对象`);
  }
  if (!category.cat || !category.icon || !category.color) {
    throw new Error(`分类 ${categoryIndex + 1} 缺少 cat/icon/color`);
  }
  if (!category.slug || typeof category.slug !== 'string') {
    throw new Error(`分类 ${categoryIndex + 1} (${category.cat}) 缺少 slug 字段`);
  }
  if (!SLUG_PATTERN.test(category.slug)) {
    throw new Error(
      `分类 "${category.cat}" 的 slug 不合法（仅允许 a-z 0-9 -）：${category.slug}`
    );
  }
  if (categorySlugSet.has(category.slug)) {
    throw new Error(`分类 slug 重复：${category.slug}`);
  }
  categorySlugSet.add(category.slug);
  if (!Array.isArray(category.items) || category.items.length === 0) {
    throw new Error(`分类 "${category.cat}" 没有题目`);
  }

  category.items.forEach((item, itemIndex) => {
    const where = `${category.cat}#${itemIndex + 1}`;
    if (!item.id || typeof item.id !== 'string') {
      throw new Error(`题目 ${where} 缺少稳定 id`);
    }
    if (!item.q || !item.a) {
      throw new Error(`题目 ${where} 缺少 q 或 a`);
    }
    if (!validDiffs.has(item.diff)) {
      throw new Error(`题目 ${where} 的 diff 不合法：${item.diff}`);
    }
    if (item.tags && !Array.isArray(item.tags)) {
      throw new Error(`题目 ${where} 的 tags 必须是数组`);
    }
    const identity = `${category.cat}::${item.q}`;
    if (identitySet.has(identity)) {
      throw new Error(`发现重复题目标题，会导致稳定进度键冲突：${identity}`);
    }
    if (idSet.has(item.id)) {
      throw new Error(`发现重复题目 id：${item.id}`);
    }
    idSet.add(item.id);
    identitySet.add(identity);
    totalQuestions += 1;
  });
});

console.log(`Validated ${data.length} categories and ${totalQuestions} questions.`);
