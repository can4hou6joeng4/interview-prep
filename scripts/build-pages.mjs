import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { buildQuestionSlug } from './slug.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SITE_BASE = 'https://can4hou6joeng4.github.io/interview-prep';
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

function loadData() {
  const source = readFileSync(path.join(ROOT, 'assets/data.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  const data = sandbox.window.INTERVIEW_DATA;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Failed to load INTERVIEW_DATA from assets/data.js');
  }
  return data;
}

function normalize(rawData) {
  return rawData.map((category, catIndex) => ({
    cat: category.cat,
    catSlug: category.slug,
    catIndex,
    items: category.items.map((item) => ({
      q: item.q,
      a: item.a,
      diff: item.diff,
      tags: item.tags || [],
      id: item.id,
      slug: buildQuestionSlug(item.q, item.id),
    })),
  }));
}

function assertSlugUnique(categories) {
  const seen = new Map();
  for (const cat of categories) {
    for (const item of cat.items) {
      if (seen.has(item.slug)) {
        const prev = seen.get(item.slug);
        throw new Error(
          `Question slug collision: "${item.slug}"\n  - ${prev}\n  - ${cat.cat} / ${item.q}`
        );
      }
      seen.set(item.slug, `${cat.cat} / ${item.q}`);
    }
  }
  const catSeen = new Map();
  for (const cat of categories) {
    if (catSeen.has(cat.catSlug)) {
      throw new Error(`Category slug collision: "${cat.catSlug}"`);
    }
    catSeen.set(cat.catSlug, cat.cat);
  }
}

function main() {
  const raw = loadData();
  const categories = normalize(raw);
  assertSlugUnique(categories);

  const qCount = categories.reduce((s, c) => s + c.items.length, 0);
  console.log(`Loaded ${categories.length} categories, ${qCount} questions; all slugs unique.`);

  if (VERBOSE) {
    for (const c of categories) {
      console.log(`  [${c.catSlug}] ${c.cat} — ${c.items.length} items`);
      for (const item of c.items.slice(0, 2)) {
        console.log(`      ${item.slug}  (${item.id})`);
      }
    }
  }
}

main();
