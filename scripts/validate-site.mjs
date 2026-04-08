import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const rootDir = path.resolve(new URL('..', import.meta.url).pathname);

const requiredFiles = [
  'index.html',
  '404.html',
  'robots.txt',
  'site.webmanifest',
  'sitemap.xml',
  'assets/app.js',
  'assets/data.js',
  'assets/favicon.svg',
  'assets/social-preview.png',
  'README.md',
  'README_zh.md',
  'CHANGELOG.md',
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!existsSync(fullPath)) {
    throw new Error(`Missing required repository file: ${relPath}`);
  }
  if (statSync(fullPath).size === 0) {
    throw new Error(`Required repository file is empty: ${relPath}`);
  }
}

const datasetSource = readFileSync(path.join(rootDir, 'assets/data.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(datasetSource, sandbox);
const data = sandbox.window.INTERVIEW_DATA;

if (!Array.isArray(data) || data.length === 0) {
  throw new Error('Failed to load question dataset from assets/data.js');
}

const categoryCount = data.length;
const questionCount = data.reduce((sum, category) => sum + category.items.length, 0);

const readmeEn = readFileSync(path.join(rootDir, 'README.md'), 'utf8');
const readmeZh = readFileSync(path.join(rootDir, 'README_zh.md'), 'utf8');

const readmeEnMatch = readmeEn.match(/- (\d+) categories and (\d+) questions\b/);
if (!readmeEnMatch) {
  throw new Error('README.md is missing the top-level categories/questions summary');
}
if (Number(readmeEnMatch[1]) !== categoryCount || Number(readmeEnMatch[2]) !== questionCount) {
  throw new Error(
    `README.md summary is out of sync: expected ${categoryCount} categories and ${questionCount} questions`
  );
}

const readmeZhMatch = readmeZh.match(/- (\d+) 个分类、(\d+) 道题/);
if (!readmeZhMatch) {
  throw new Error('README_zh.md is missing the top-level categories/questions summary');
}
if (Number(readmeZhMatch[1]) !== categoryCount || Number(readmeZhMatch[2]) !== questionCount) {
  throw new Error(
    `README_zh.md summary is out of sync: expected ${categoryCount} 个分类、${questionCount} 道题`
  );
}

const indexHtml = readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const requiredSnippets = [
  '<html lang="zh-CN">',
  '<link rel="canonical" href="https://can4hou6joeng4.github.io/interview-prep/">',
  '<meta property="og:title" content="Go 后端面试题库">',
  '<meta property="og:description" content="Go 后端面试题库：卡片学习、列表检索、进度持久化。">',
  '<meta property="og:type" content="website">',
  '<meta property="og:url" content="https://can4hou6joeng4.github.io/interview-prep/">',
  '<meta property="og:image" content="https://can4hou6joeng4.github.io/interview-prep/assets/social-preview.png">',
  '<meta name="twitter:card" content="summary_large_image">',
  '<meta name="twitter:image" content="https://can4hou6joeng4.github.io/interview-prep/assets/social-preview.png">',
  '<link rel="manifest" href="site.webmanifest">',
];

for (const snippet of requiredSnippets) {
  if (!indexHtml.includes(snippet)) {
    throw new Error(`index.html is missing required SEO/share metadata: ${snippet}`);
  }
}

const manifest = JSON.parse(readFileSync(path.join(rootDir, 'site.webmanifest'), 'utf8'));
if (manifest.start_url !== '/interview-prep/') {
  throw new Error(`site.webmanifest start_url must be /interview-prep/, got ${manifest.start_url}`);
}
if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  throw new Error('site.webmanifest must define at least one icon');
}

const sitemap = readFileSync(path.join(rootDir, 'sitemap.xml'), 'utf8');
if (!sitemap.includes('<loc>https://can4hou6joeng4.github.io/interview-prep/</loc>')) {
  throw new Error('sitemap.xml is missing the production site URL');
}

const robots = readFileSync(path.join(rootDir, 'robots.txt'), 'utf8');
if (!robots.includes('Sitemap: https://can4hou6joeng4.github.io/interview-prep/sitemap.xml')) {
  throw new Error('robots.txt should reference the production sitemap URL');
}

console.log(
  `Validated repository metadata, share assets, and README summaries for ${categoryCount} categories and ${questionCount} questions.`
);
