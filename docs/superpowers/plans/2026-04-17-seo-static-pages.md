# SEO 静态题目页与分类聚合页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 203 道题和 19 个分类落成可独立索引的静态 HTML 页，打开 SEO 长尾流量通道，全流程靠零依赖 Node ESM 脚本闭环。

**Architecture:** 新增三个纯 Node ESM 脚本（`slug.mjs` / `build-pages.mjs` / `validate-pages.mjs`），读 `assets/data.js` 生成 `q/*.html` + `c/*.html` + 重写 `sitemap.xml`，生成物入库，CI 用 `git diff --exit-code` 强制闭环。零运行时依赖，与现有 `validate-*.mjs` 同构。

**Tech Stack:** Node.js（仅内置 `fs` / `path` / `vm` / `assert` 模块），shell hooks，GitHub Actions。

**关联 Spec:** `docs/superpowers/specs/2026-04-17-seo-static-pages-design.md`

**Spec 勘误（在 plan 里采用正确版本）:** Spec §4 的 slug 末尾后缀 `-{id.slice(-6)}` 存在理论冲突风险（后 6 位 id 碰撞），plan 采用**完整 id** 作为后缀：`{slug}-{id}`。举例：`goroutine-gmp-q-q1rk0k`。多 2 字符换取绝对无冲突。

---

## File Structure

| 路径 | 动作 | 责任 |
|---|---|---|
| `assets/data.js` | Modify | 每个分类顶层新增 `slug` 字段（19 处） |
| `scripts/validate-data.mjs` | Modify | 新增分类 `slug` 必填 + 格式 + 唯一性校验 |
| `scripts/slug.mjs` | Create | 纯函数：从题目文本生成 URL slug |
| `scripts/_slug.test.mjs` | Create | `slug.mjs` 的 `node:assert` 单测 |
| `scripts/build-pages.mjs` | Create | 读 data.js → 生成 `q/*.html`、`c/*.html`、重写 `sitemap.xml` |
| `scripts/validate-pages.mjs` | Create | 校验生成物与 data.js 数量/元数据一致 |
| `assets/styles.css` | Modify | 追加 `.detail` / `.category` / `.breadcrumb` / `.badge-*` / `.related` / `.cta` 样式 |
| `q/` | Create（生成物） | 203 个题目详情 HTML |
| `c/` | Create（生成物） | 19 个分类聚合 HTML |
| `sitemap.xml` | Modify（生成物） | 从 3 条扩到 225 条 URL |
| `scripts/check-fast.sh` | Modify | 追加 `validate-pages` 与 slug 单测的 `node --check` + run |
| `.github/workflows/validate.yml` | Modify | 追加 build-pages 跑完后 `git diff --exit-code` 闭环 |
| `README.md` | Modify | Repository Structure + Highlights + 新增章节 |
| `README_zh.md` | Modify | 同步英文 README 的改动 |
| `CHANGELOG.md` | Modify | 新增 `2026-04-17` 条目 |

---

## 分类 slug 映射表（Task 1 直接照抄）

| 分类名 `cat` | `slug` |
|---|---|
| Go 语言核心 | `go-core` |
| MySQL 数据库 | `mysql` |
| Redis 缓存与队列 | `redis` |
| 设计模式与架构 | `architecture` |
| 支付与交易系统 | `payment` |
| 搜索引擎 | `search` |
| 安全防护 | `security` |
| WebSocket 与实时通信 | `websocket` |
| Docker 与部署 | `docker` |
| 项目场景深挖 | `project` |
| 高频手撕代码 | `coding` |
| 测试与工程质量 | `testing` |
| Kafka 消息队列 | `kafka` |
| 计算机网络 | `network` |
| Kubernetes 深入 | `kubernetes` |
| MongoDB | `mongodb` |
| 高并发与高可用 | `concurrency` |
| 微服务治理 | `microservices` |
| Linux 基础 | `linux` |

---

## Task 1: 回填 19 个分类的 slug 字段

**Files:**
- Modify: `assets/data.js`（第 3 / 191 / 266 / 349 / 472 / 580 / 641 / 691 / 743 / 811 / 1250 / 1315 / 1358 / 1424 / 1497 / 1562 / 1617 / 1745 / 1872 行的分类对象）

- [ ] **Step 1: 定位分类对象在 data.js 中的锚点**

Run: `grep -n '^    "cat":' assets/data.js`
Expected: 输出 19 行，行号与上面 File Structure 中列出的一致。

- [ ] **Step 2: 为每个分类对象新增 `slug` 字段**

对于每一个分类对象（形如）：

```javascript
  {
    "cat": "Go 语言核心",
    "icon": "🔷",
    "color": "#6c8cff",
    "items": [
```

在 `"color"` 之后、`"items"` 之前插入一行 `"slug"`，变成：

```javascript
  {
    "cat": "Go 语言核心",
    "icon": "🔷",
    "color": "#6c8cff",
    "slug": "go-core",
    "items": [
```

按上面的分类 slug 映射表处理全部 19 个分类（注意保留两格或四格缩进，按文件既有风格对齐）。

- [ ] **Step 3: 运行现有 validate-data.mjs 确保没有破坏已有校验**

Run: `node scripts/validate-data.mjs`
Expected: `Validated 19 categories and 203 questions.`

- [ ] **Step 4: 人工确认新增的 slug 都在 data.js 里**

Run: `grep -c '^    "slug":' assets/data.js`
Expected: `19`

- [ ] **Step 5: Commit**

```bash
git add assets/data.js
git commit -m "feat: 为题库分类回填 slug 字段"
```

---

## Task 2: validate-data.mjs 新增分类 slug 校验（TDD）

**Files:**
- Modify: `scripts/validate-data.mjs`

- [ ] **Step 1: 写失败测试（临时破坏一个 slug 字段观察）**

手动编辑 `assets/data.js` 把第一个分类的 slug 从 `"go-core"` 改成 `"Go Core"`（含大写和空格，应该被校验拒绝）。

Run: `node scripts/validate-data.mjs`
Expected: 输出仍是成功（因为校验规则还没加），**这是问题**，证明需要新增校验。

- [ ] **Step 2: 还原 data.js**

手动把 slug 改回 `"go-core"`。

Run: `node scripts/validate-data.mjs`
Expected: `Validated 19 categories and 203 questions.`

- [ ] **Step 3: 在 validate-data.mjs 里新增 slug 校验**

打开 `scripts/validate-data.mjs`，在文件顶部常量附近、`data.forEach(...)` 之前新增：

```javascript
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const categorySlugSet = new Set();
```

然后在分类 `forEach` 回调里、`if (!category.cat || !category.icon || !category.color)` 这一段的 `throw` 之后、`if (!Array.isArray(category.items)...)` 之前，插入：

```javascript
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
```

- [ ] **Step 4: 再次跑失败测试**

手动把第一个分类的 slug 改成 `"Go Core"`。

Run: `node scripts/validate-data.mjs`
Expected: 进程非零退出，stderr 含 `分类 "Go 语言核心" 的 slug 不合法`。

- [ ] **Step 5: 还原并确认通过**

手动把 slug 改回 `"go-core"`。

Run: `node scripts/validate-data.mjs`
Expected: `Validated 19 categories and 203 questions.`

- [ ] **Step 6: Commit**

```bash
git add scripts/validate-data.mjs
git commit -m "feat: 校验分类 slug 字段的必填格式与唯一性"
```

---

## Task 3: 实现 slug 纯函数及其单测（TDD）

**Files:**
- Create: `scripts/slug.mjs`
- Create: `scripts/_slug.test.mjs`

- [ ] **Step 1: 先写测试文件（红）**

`scripts/_slug.test.mjs`：

```javascript
import assert from 'node:assert/strict';
import { slugify, buildQuestionSlug } from './slug.mjs';

// Case 1: 中英混排只提取英文 token
assert.equal(slugify('Goroutine 的调度模型 GMP 是什么？'), 'goroutine-gmp');

// Case 2: 驼峰拆分
assert.equal(slugify('GoroutineGMP'), 'goroutine-gmp');

// Case 3: 连续大写 + 小写串（GMPGoroutine 拆为 gmp goroutine）
assert.equal(slugify('GMPGoroutine'), 'gmp-goroutine');

// Case 4: 仅取前 6 个 token
assert.equal(slugify('A B C D E F G H I J'), 'a-b-c-d-e-f');

// Case 5: 全中文回落为空
assert.equal(slugify('什么是分布式事务？'), '');

// Case 6: 特殊符号被丢弃（C++ → c）
assert.equal(slugify('C++ 的 std::vector 扩容策略'), 'c-std-vector');

// Case 7: buildQuestionSlug 拼接完整 id 兜底
assert.equal(
  buildQuestionSlug('Goroutine 的调度模型 GMP', 'q-q1rk0k'),
  'goroutine-gmp-q-q1rk0k'
);

// Case 8: 全中文题目 buildQuestionSlug 回落为 id
assert.equal(buildQuestionSlug('什么是分布式事务', 'q-abcdef'), 'q-abcdef');

// Case 9: 长度截断保留完整 token，不以连字符结尾
const long = 'Redis caching strategy for distributed microservices architecture deployment pipeline scaling system';
const out = slugify(long);
assert.ok(out.length <= 80, `slug too long: ${out.length}`);
assert.ok(!out.endsWith('-'), `slug ends with dash: ${out}`);

console.log('All slug tests passed.');
```

- [ ] **Step 2: 运行测试，看到它失败（模块不存在）**

Run: `node scripts/_slug.test.mjs`
Expected: 退出码非零，stderr 含 `Cannot find module` 或 `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现 slug.mjs 使所有测试通过（绿）**

`scripts/slug.mjs`：

```javascript
const TOKEN_PATTERN = /[A-Za-z][A-Za-z0-9]*/g;
const CAMEL_SPLIT_PATTERN = /([a-z0-9])([A-Z])|([A-Z]+)([A-Z][a-z])/g;
const MAX_TOKENS = 6;
const MAX_LENGTH = 80;

function splitCamelCase(token) {
  return token.replace(CAMEL_SPLIT_PATTERN, (_, a1, a2, b1, b2) => {
    const left = a1 ?? b1 ?? '';
    const right = a2 ?? b2 ?? '';
    return `${left} ${right}`;
  });
}

function joinWithinLimit(tokens, maxLen) {
  let result = '';
  for (const token of tokens) {
    const candidate = result ? `${result}-${token}` : token;
    if (candidate.length > maxLen) break;
    result = candidate;
  }
  return result;
}

export function slugify(text) {
  const matches = String(text).match(TOKEN_PATTERN) || [];
  const tokens = matches
    .flatMap((token) => splitCamelCase(token).split(/\s+/))
    .map((t) => t.toLowerCase())
    .filter(Boolean)
    .slice(0, MAX_TOKENS);
  return joinWithinLimit(tokens, MAX_LENGTH);
}

export function buildQuestionSlug(question, id) {
  const head = slugify(question);
  if (!head) return id;
  return `${head}-${id}`;
}
```

- [ ] **Step 4: 运行测试，确认全部通过**

Run: `node scripts/_slug.test.mjs`
Expected: `All slug tests passed.`

- [ ] **Step 5: Commit**

```bash
git add scripts/slug.mjs scripts/_slug.test.mjs
git commit -m "feat: 新增 slug 纯函数与单元测试"
```

---

## Task 4: build-pages.mjs 骨架（load + normalize + 冲突检测）

**Files:**
- Create: `scripts/build-pages.mjs`

- [ ] **Step 1: 创建脚本骨架，只负责 load/normalize 并打印结果**

`scripts/build-pages.mjs`：

```javascript
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
```

- [ ] **Step 2: 语法检查**

Run: `node --check scripts/build-pages.mjs`
Expected: 静默成功（无输出）。

- [ ] **Step 3: 运行骨架脚本 dry-run**

Run: `node scripts/build-pages.mjs --dry-run --verbose`
Expected: 类似输出：

```
Loaded 19 categories, 203 questions; all slugs unique.
  [go-core] Go 语言核心 — 13 items
      goroutine-gmp-q-q1rk0k  (q-q1rk0k)
      go-channel-q-1uwipet  (q-1uwipet)
  [mysql] MySQL 数据库 — N items
  ...
```

- [ ] **Step 4: Commit**

```bash
git add scripts/build-pages.mjs
git commit -m "feat: 新增题目页构建脚本的数据加载骨架"
```

---

## Task 5: build-pages.mjs 补完渲染函数（head / 题目页 / 分类页 / sitemap）

**Files:**
- Modify: `scripts/build-pages.mjs`

- [ ] **Step 1: 在 `main()` 之前、`assertSlugUnique` 之后新增辅助与渲染函数**

把下面这段追加到 `scripts/build-pages.mjs`（在 `function main()` 上方）：

```javascript
function stripHtmlToText(html, maxLen = 160) {
  const text = String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}

function escapeAttr(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function renderHead({ title, description, canonicalPath, ogType }) {
  const url = `${SITE_BASE}${canonicalPath}`;
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="description" content="${escapeAttr(description)}">
<meta name="theme-color" content="#fffdf7">
<meta name="color-scheme" content="light">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="Go 后端面试题库">
<meta property="og:locale" content="zh_CN">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE_BASE}/assets/social-preview.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeAttr(title)}">
<meta name="twitter:description" content="${escapeAttr(description)}">
<meta name="twitter:image" content="${SITE_BASE}/assets/social-preview.png">
<title>${escapeText(title)}</title>
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../assets/styles.css">
</head>`;
}

const DIFF_LABEL = { easy: '简单', medium: '中等', hard: '困难' };

function pickRelated(category, currentId, count = 5) {
  const idx = category.items.findIndex((x) => x.id === currentId);
  const after = category.items.slice(idx + 1);
  const before = category.items.slice(0, idx);
  return [...after, ...before].slice(0, count);
}

function renderQuestionPage(item, category, related) {
  const title = `${item.q} - Go 后端面试题库`;
  const descriptionRaw = stripHtmlToText(item.a);
  const description = descriptionRaw || `${category.cat}｜${item.q}`;
  const head = renderHead({
    title,
    description,
    canonicalPath: `/q/${item.slug}.html`,
    ogType: 'article',
  });
  const tagBadges = (item.tags || [])
    .map((tag) => `<span class="badge badge-tag">${escapeText(tag)}</span>`)
    .join('');
  const relatedList = related
    .map((r) => `      <li><a href="./${r.slug}.html">${escapeText(r.q)}</a></li>`)
    .join('\n');
  return `${head}
<body>
<main class="detail">
  <nav class="breadcrumb">
    <a href="../index.html">首页</a> ›
    <a href="../c/${category.catSlug}.html">${escapeText(category.cat)}</a> ›
    <span>${escapeText(item.q)}</span>
  </nav>

  <article class="question">
    <h1>${escapeText(item.q)}</h1>
    <p class="meta">
      <span class="badge badge-${item.diff}">${DIFF_LABEL[item.diff]}</span>
      ${tagBadges}
    </p>
    <section class="answer">
${item.a}
    </section>
  </article>

  <aside class="related">
    <h2>本分类其他题目</h2>
    <ul>
${relatedList}
    </ul>
  </aside>

  <nav class="cta">
    <a class="cta-btn" href="../c/${category.catSlug}.html">浏览本分类全部 ${category.items.length} 题</a>
    <a class="cta-btn" href="../study.html?mode=card&amp;cat=${category.catIndex}">进入 SPA 学习本分类</a>
  </nav>

  <footer class="ft">
    <a href="../index.html">返回首页</a> ·
    <a href="https://github.com/can4hou6joeng4/interview-prep">GitHub 源码</a> ·
    <a href="../index.html#updates">查看更新</a>
  </footer>
</main>
</body>
</html>
`;
}

function renderCategoryPage(category) {
  const buckets = { easy: [], medium: [], hard: [] };
  for (const item of category.items) buckets[item.diff].push(item);
  const counts = {
    easy: buckets.easy.length,
    medium: buckets.medium.length,
    hard: buckets.hard.length,
  };
  const total = category.items.length;
  const title = `${category.cat} 面试题汇总（${total} 题） - Go 后端面试题库`;
  const description = `覆盖 ${category.cat} 的 ${total} 道面试题，包括 easy ${counts.easy} / medium ${counts.medium} / hard ${counts.hard}。`;
  const head = renderHead({
    title,
    description,
    canonicalPath: `/c/${category.catSlug}.html`,
    ogType: 'website',
  });
  const renderBucket = (label, items) => {
    if (items.length === 0) return '';
    const list = items
      .map((i) => `      <li><a href="../q/${i.slug}.html">${escapeText(i.q)}</a></li>`)
      .join('\n');
    return `    <h2>${label} · ${items.length} 题</h2>
    <ol class="cat-list">
${list}
    </ol>`;
  };
  return `${head}
<body>
<main class="category">
  <nav class="breadcrumb">
    <a href="../index.html">首页</a> ›
    <span>${escapeText(category.cat)}</span>
  </nav>

  <header class="cat-header">
    <h1>${escapeText(category.cat)}</h1>
    <p class="summary">${total} 题 · easy ${counts.easy} · medium ${counts.medium} · hard ${counts.hard}</p>
  </header>

  <section class="list">
${renderBucket('easy', buckets.easy)}
${renderBucket('medium', buckets.medium)}
${renderBucket('hard', buckets.hard)}
  </section>

  <nav class="cta">
    <a class="cta-btn" href="../study.html?mode=card&amp;cat=${category.catIndex}">在 SPA 中学习本分类</a>
    <a class="cta-btn" href="../index.html">返回首页</a>
  </nav>

  <footer class="ft">
    <a href="../index.html">返回首页</a> ·
    <a href="https://github.com/can4hou6joeng4/interview-prep">GitHub 源码</a>
  </footer>
</main>
</body>
</html>
`;
}

function renderSitemap(urls, lastmod) {
  const body = urls
    .map((u) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function writeFileIfChanged(filePath, content) {
  if (existsSync(filePath)) {
    const existing = readFileSync(filePath, 'utf8');
    if (existing === content) return false;
  }
  writeFileSync(filePath, content);
  return true;
}

function cleanStaleFiles(dirPath, validFilenames) {
  if (!existsSync(dirPath)) return;
  const actual = readdirSync(dirPath).filter((f) => f.endsWith('.html'));
  for (const file of actual) {
    if (!validFilenames.has(file)) {
      unlinkSync(path.join(dirPath, file));
      if (VERBOSE) console.log(`  cleaned stale: ${path.join(dirPath, file)}`);
    }
  }
}
```

- [ ] **Step 2: 替换现有 `main()` 为完整版本（接入所有渲染与写盘）**

找到 `scripts/build-pages.mjs` 中已有的 `function main()` 整个函数（包括 `main();` 调用），**整体替换为**：

```javascript
function main() {
  const raw = loadData();
  const categories = normalize(raw);
  assertSlugUnique(categories);

  const qDir = path.join(ROOT, 'q');
  const cDir = path.join(ROOT, 'c');
  if (!DRY_RUN) {
    mkdirSync(qDir, { recursive: true });
    mkdirSync(cDir, { recursive: true });
  }

  const qFilenames = new Set();
  const cFilenames = new Set();
  let writeCount = 0;

  for (const category of categories) {
    for (const item of category.items) {
      const filename = `${item.slug}.html`;
      qFilenames.add(filename);
      const related = pickRelated(category, item.id, 5);
      const html = renderQuestionPage(item, category, related);
      const filePath = path.join(qDir, filename);
      if (DRY_RUN) {
        if (VERBOSE) console.log(`would write ${filePath}`);
      } else if (writeFileIfChanged(filePath, html)) {
        writeCount++;
        if (VERBOSE) console.log(`wrote ${filePath}`);
      }
    }

    const catFilename = `${category.catSlug}.html`;
    cFilenames.add(catFilename);
    const catHtml = renderCategoryPage(category);
    const catPath = path.join(cDir, catFilename);
    if (DRY_RUN) {
      if (VERBOSE) console.log(`would write ${catPath}`);
    } else if (writeFileIfChanged(catPath, catHtml)) {
      writeCount++;
      if (VERBOSE) console.log(`wrote ${catPath}`);
    }
  }

  if (!DRY_RUN) {
    cleanStaleFiles(qDir, qFilenames);
    cleanStaleFiles(cDir, cFilenames);
  }

  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = [
    `${SITE_BASE}/`,
    `${SITE_BASE}/study.html`,
    `${SITE_BASE}/mock.html`,
  ];
  for (const category of categories) {
    urls.push(`${SITE_BASE}/c/${category.catSlug}.html`);
  }
  for (const category of categories) {
    for (const item of category.items) {
      urls.push(`${SITE_BASE}/q/${item.slug}.html`);
    }
  }
  const sitemap = renderSitemap(urls, lastmod);
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  if (DRY_RUN) {
    if (VERBOSE) console.log(`would write ${sitemapPath}`);
  } else if (writeFileIfChanged(sitemapPath, sitemap)) {
    writeCount++;
    if (VERBOSE) console.log(`wrote ${sitemapPath}`);
  }

  const totalQ = categories.reduce((s, c) => s + c.items.length, 0);
  console.log(
    `Built ${totalQ} question pages, ${categories.length} category pages; ${writeCount} files changed.`
  );
}

main();
```

- [ ] **Step 3: 语法检查**

Run: `node --check scripts/build-pages.mjs`
Expected: 静默成功。

- [ ] **Step 4: 先跑 dry-run 确保没有异常**

Run: `node scripts/build-pages.mjs --dry-run`
Expected: 输出 `Built 203 question pages, 19 category pages; 0 files changed.`

- [ ] **Step 5: Commit（暂不生成 q/ c/，下个 task 做首次生成）**

```bash
git add scripts/build-pages.mjs
git commit -m "feat: 补完题目页与分类页的 HTML 渲染逻辑"
```

---

## Task 6: 首次全量 build 并提交生成物

**Files:**
- Create（生成物）: `q/*.html`（203 个）
- Create（生成物）: `c/*.html`（19 个）
- Modify（生成物）: `sitemap.xml`（从 3 条扩到 225 条）

- [ ] **Step 1: 运行真实 build**

Run: `node scripts/build-pages.mjs --verbose 2>&1 | tail -30`
Expected: 末尾出现 `Built 203 question pages, 19 category pages; 223 files changed.`（前 222 页 + sitemap）。

- [ ] **Step 2: 目录数量核对**

Run: `ls q/ | wc -l`
Expected: `203`

Run: `ls c/ | wc -l`
Expected: `19`

- [ ] **Step 3: sitemap 条目数核对**

Run: `grep -c '<loc>' sitemap.xml`
Expected: `225`

- [ ] **Step 4: 随机抽查 3 个生成页面，确认关键元素齐**

Run: `grep -c '<link rel="canonical"' q/*.html | head -3`
Expected: 前三行每行都是 `:1`（每个文件恰好一个 canonical）。

Run: `grep -l '<h1>' q/*.html | wc -l`
Expected: `203`

- [ ] **Step 5: 用浏览器打开 1 个题目页和 1 个分类页人工核查**

Run: `python3 -m http.server 4173 &` 然后在浏览器打开：
- `http://127.0.0.1:4173/q/goroutine-gmp-q-q1rk0k.html`（或任一 q/ 文件）
- `http://127.0.0.1:4173/c/go-core.html`

Expected: 能看到题目、答案、相关题列表、CTA 按钮；视觉**还比较粗糙**（没补样式），但元素布局和链接是正确的；点击相关题链接能跳到另一个题目页。

记得 `kill %1` 关闭 http server。

- [ ] **Step 6: Commit 生成物**

```bash
git add q/ c/ sitemap.xml
git commit -m "feat: 首次生成题目独立页与分类聚合页"
```

---

## Task 7: 补齐 Neo-Brutalism 样式

**Files:**
- Modify: `assets/styles.css`（追加到文件末尾）

- [ ] **Step 1: 查阅 styles.css 既有的设计 token（颜色、边框、阴影）**

Run: `grep -n '^:root\|^--\|border:\|box-shadow' assets/styles.css | head -40`

观察现有 CSS 里已经定义的色值变量（如 `--ink`, `--accent-*`, `--surface` 等）和 Neo-Brutalism 的粗边/阴影约定。**在新增样式时优先复用现有变量，不要硬编码颜色。**

- [ ] **Step 2: 在 `assets/styles.css` 末尾追加新增样式**

```css

/* ============================================================
 * SEO 独立页（题目详情 / 分类聚合）样式
 * ========================================================= */

.detail,
.category {
  max-width: 920px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

.breadcrumb {
  font-size: 14px;
  margin-bottom: 24px;
  color: #444;
}
.breadcrumb a {
  color: #111;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 2px solid #111;
}
.breadcrumb a:hover {
  background: #fff35a;
}

.detail .question h1,
.category .cat-header h1 {
  font-size: 32px;
  line-height: 1.25;
  margin: 0 0 16px;
}

.detail .meta,
.category .summary {
  margin: 0 0 28px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border: 2px solid #111;
  box-shadow: 3px 3px 0 #111;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.02em;
  background: #fff;
}
.badge-easy   { background: #b5f5c9; }
.badge-medium { background: #ffe58a; }
.badge-hard   { background: #ffb3b3; }
.badge-tag    { background: #d8e8ff; }

.detail .answer {
  background: #fff;
  border: 3px solid #111;
  box-shadow: 6px 6px 0 #111;
  padding: 24px 28px;
  margin: 0 0 32px;
}
.detail .answer h4 {
  margin-top: 20px;
  margin-bottom: 8px;
  font-size: 16px;
}
.detail .answer h4:first-child { margin-top: 0; }
.detail .answer ul,
.detail .answer ol {
  padding-left: 22px;
}
.detail .answer pre {
  overflow-x: auto;
  background: #f5f2e8;
  border: 2px solid #111;
  padding: 12px 14px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
}
.detail .answer code {
  font-family: 'JetBrains Mono', monospace;
}
.detail .answer .key-point {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fff35a;
  border: 2px solid #111;
  font-size: 14px;
}
.detail .answer .project-link {
  margin-top: 16px;
  padding: 12px 16px;
  background: #d8e8ff;
  border: 2px solid #111;
  font-size: 14px;
}

.detail .related {
  margin-top: 40px;
  padding: 20px 24px;
  border: 3px solid #111;
  box-shadow: 6px 6px 0 #111;
  background: #fffbe8;
}
.detail .related h2 {
  margin: 0 0 12px;
  font-size: 18px;
}
.detail .related ul {
  margin: 0;
  padding-left: 20px;
}
.detail .related a {
  color: #111;
  text-decoration: none;
  border-bottom: 2px solid #111;
}
.detail .related a:hover {
  background: #fff35a;
}

.category .list h2 {
  margin: 32px 0 12px;
  font-size: 20px;
}
.cat-list {
  padding-left: 24px;
  line-height: 1.8;
}
.cat-list a {
  color: #111;
  text-decoration: none;
  border-bottom: 2px solid #111;
}
.cat-list a:hover {
  background: #fff35a;
}

.cta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 40px 0 24px;
}
.cta-btn {
  display: inline-block;
  padding: 12px 20px;
  border: 3px solid #111;
  box-shadow: 4px 4px 0 #111;
  background: #fff;
  color: #111;
  font-weight: 700;
  text-decoration: none;
  transition: transform 80ms ease, box-shadow 80ms ease;
}
.cta-btn:hover {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0 #111;
  background: #fff35a;
}

.detail .ft,
.category .ft {
  margin-top: 40px;
  font-size: 13px;
  color: #555;
}
.detail .ft a,
.category .ft a {
  color: #111;
  font-weight: 600;
}
```

- [ ] **Step 3: 重新 build（样式变了，HTML 没变，应该 0 files changed）**

Run: `node scripts/build-pages.mjs`
Expected: `Built 203 question pages, 19 category pages; 0 files changed.`
（说明样式改动不影响生成物——样式是 `assets/styles.css` 另一个文件。）

- [ ] **Step 4: 浏览器验证样式**

Run: `python3 -m http.server 4173 &`
浏览器打开两个页面检查：
- 随意一个 `q/*.html`：题目、难度 badge、答案区、相关题、CTA 按钮都应用了 Neo-Brutalism 风格（粗边 + 平移阴影 + 糖果色）
- 随意一个 `c/*.html`：分类标题、难度分组列表、CTA 按钮样式到位

`kill %1` 关闭服务。

- [ ] **Step 5: Commit**

```bash
git add assets/styles.css
git commit -m "style: 补齐题目页与分类页的 Neo-Brutalism 样式"
```

---

## Task 8: validate-pages.mjs 生成物校验（TDD）

**Files:**
- Create: `scripts/validate-pages.mjs`

- [ ] **Step 1: 写失败测试（手动删除一个 q 文件观察）**

Run: `ls q/ | head -1`
记下第一个文件名，例如 `goroutine-gmp-q-q1rk0k.html`。

Run: `mv q/<第一个文件名> /tmp/stash.html`
（这一步用真实文件名替换）

此时仓库里 q/ 目录少一个文件，但校验脚本还没写；下一步先实现脚本。

- [ ] **Step 2: 实现 validate-pages.mjs**

`scripts/validate-pages.mjs`：

```javascript
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SITE_BASE = 'https://can4hou6joeng4.github.io/interview-prep';

function loadData() {
  const source = readFileSync(path.join(ROOT, 'assets/data.js'), 'utf8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox);
  return sandbox.window.INTERVIEW_DATA;
}

function assertOrThrow(ok, msg) {
  if (!ok) throw new Error(msg);
}

function main() {
  const data = loadData();
  const catCount = data.length;
  const qCount = data.reduce((s, c) => s + c.items.length, 0);

  const qDir = path.join(ROOT, 'q');
  const cDir = path.join(ROOT, 'c');
  assertOrThrow(existsSync(qDir), 'Missing q/ directory — run `node scripts/build-pages.mjs`');
  assertOrThrow(existsSync(cDir), 'Missing c/ directory — run `node scripts/build-pages.mjs`');

  const qFiles = readdirSync(qDir).filter((f) => f.endsWith('.html'));
  const cFiles = readdirSync(cDir).filter((f) => f.endsWith('.html'));
  assertOrThrow(
    qFiles.length === qCount,
    `q/ has ${qFiles.length} .html files, expected ${qCount} — run build-pages`
  );
  assertOrThrow(
    cFiles.length === catCount,
    `c/ has ${cFiles.length} .html files, expected ${catCount} — run build-pages`
  );

  const qFilenameSet = new Set(qFiles);
  assertOrThrow(qFilenameSet.size === qFiles.length, 'q/ contains duplicate filenames');
  const cFilenameSet = new Set(cFiles);
  assertOrThrow(cFilenameSet.size === cFiles.length, 'c/ contains duplicate filenames');

  const requiredSnippets = [
    '<title>',
    '<link rel="canonical"',
    '<meta property="og:title"',
    '<h1>',
  ];
  const allFiles = [
    ...qFiles.map((f) => path.join(qDir, f)),
    ...cFiles.map((f) => path.join(cDir, f)),
  ];
  for (const file of allFiles) {
    const html = readFileSync(file, 'utf8');
    for (const snippet of requiredSnippets) {
      assertOrThrow(
        html.includes(snippet),
        `${path.relative(ROOT, file)} missing required snippet: ${snippet}`
      );
    }
  }

  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  assertOrThrow(existsSync(sitemapPath), 'Missing sitemap.xml');
  const sitemap = readFileSync(sitemapPath, 'utf8');
  const locMatches = sitemap.match(/<loc>/g) || [];
  const expectedLocCount = 3 + catCount + qCount;
  assertOrThrow(
    locMatches.length === expectedLocCount,
    `sitemap.xml has ${locMatches.length} <loc> entries, expected ${expectedLocCount}`
  );

  const qPattern = new RegExp(
    `<loc>${SITE_BASE.replace(/\//g, '\\/')}\\/q\\/([^<]+)<\\/loc>`,
    'g'
  );
  const cPattern = new RegExp(
    `<loc>${SITE_BASE.replace(/\//g, '\\/')}\\/c\\/([^<]+)<\\/loc>`,
    'g'
  );
  let m;
  while ((m = qPattern.exec(sitemap)) !== null) {
    assertOrThrow(qFilenameSet.has(m[1]), `sitemap references missing q/ file: ${m[1]}`);
  }
  while ((m = cPattern.exec(sitemap)) !== null) {
    assertOrThrow(cFilenameSet.has(m[1]), `sitemap references missing c/ file: ${m[1]}`);
  }

  console.log(
    `Validated ${qCount} question pages, ${catCount} category pages, ${expectedLocCount} sitemap URLs.`
  );
}

main();
```

- [ ] **Step 3: 运行 validate-pages（此时 q/ 少 1 个文件，应失败）**

Run: `node scripts/validate-pages.mjs`
Expected: 非零退出码，stderr 类似：
`Error: q/ has 202 .html files, expected 203 — run build-pages`

- [ ] **Step 4: 还原文件，重跑校验**

Run: `mv /tmp/stash.html q/<原文件名>`

Run: `node scripts/validate-pages.mjs`
Expected: `Validated 203 question pages, 19 category pages, 225 sitemap URLs.`

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-pages.mjs
git commit -m "feat: 校验题目页与分类页生成物与数据源一致"
```

---

## Task 9: 接入 pre-commit hook

**Files:**
- Modify: `scripts/check-fast.sh`

- [ ] **Step 1: 查看当前 check-fast.sh**

Run: `cat scripts/check-fast.sh`
Expected: 看到 4 行现有内容（node --check + validate-data）。

- [ ] **Step 2: 在 `node scripts/validate-data.mjs` 之前新增 `node --check`、之后新增 `node scripts/_slug.test.mjs` 与 `node scripts/validate-pages.mjs`**

把 `scripts/check-fast.sh` 整文件替换为：

```sh
#!/bin/sh
set -eu

node --check assets/app.js
node --check assets/data.js
[ -f scripts/jd-coverage.mjs ] && node --check scripts/jd-coverage.mjs
node --check scripts/slug.mjs
node --check scripts/build-pages.mjs
node --check scripts/validate-pages.mjs
node scripts/validate-data.mjs
node scripts/_slug.test.mjs
node scripts/validate-pages.mjs
```

- [ ] **Step 3: 运行 check-fast 全量**

Run: `./scripts/check-fast.sh`
Expected: 依次输出各步骤，最后看到 `Validated 203 question pages, 19 category pages, 225 sitemap URLs.`，退出码 0。

- [ ] **Step 4: 运行 check-full 确保 pre-push 仍通过**

Run: `./scripts/check-full.sh`
Expected: 比 check-fast 多一个 `Validated repository metadata, share assets, and README summaries for 19 categories and 203 questions.`，整体成功。

- [ ] **Step 5: Commit**

```bash
git add scripts/check-fast.sh
git commit -m "ci: pre-commit 追加 slug 测试与生成物校验"
```

---

## Task 10: CI 闭环 — build-pages diff 校验

**Files:**
- Modify: `.github/workflows/validate.yml`

- [ ] **Step 1: 查看现有 validate.yml**

Run: `cat .github/workflows/validate.yml`

找到其中执行 `node scripts/validate-site.mjs` 那一步（若是 `name:` 形式的步骤，记下它的 name）。

- [ ] **Step 2: 在 validate-site 步骤之后追加两个新步骤**

打开 `.github/workflows/validate.yml`，在 `validate-site.mjs` 那一步之后（同层级缩进），插入：

```yaml
      - name: Validate pages output matches data
        run: node scripts/validate-pages.mjs

      - name: Ensure build-pages output is in sync
        run: |
          node scripts/build-pages.mjs
          git diff --exit-code q/ c/ sitemap.xml
```

> 注意：如果 validate.yml 里的步骤缩进用了 2 空格或 4 空格，照抄既有风格。

- [ ] **Step 3: 本地模拟 CI 的 diff 校验**

Run: `node scripts/build-pages.mjs && git diff --exit-code q/ c/ sitemap.xml && echo "CLEAN"`
Expected: 输出 `Built 203 question pages, ...` 然后 `CLEAN`，退出码 0。

- [ ] **Step 4: 模拟未跑 build 的场景（手动改 data.js 里一个 item 的 `q` 字段然后只 commit data.js 不跑 build）**

手动临时把某个题目的 `q` 从 `"Goroutine 的调度模型 GMP 是什么？G、M、P 各代表什么？"` 改成 `"Goroutine 调度 GMP 核心概念"`（随便改一下）。

**不跑** `build-pages`，直接跑：
Run: `node scripts/build-pages.mjs && git diff --stat q/ c/ sitemap.xml`
Expected: 看到 `q/goroutine-gmp-q-q1rk0k.html` 等多个文件有改动——说明 CI 的 `git diff --exit-code` 会在这种状态下失败，正是期望的闭环。

- [ ] **Step 5: 还原 data.js 并重新 build**

Run: `git checkout assets/data.js && node scripts/build-pages.mjs`
Expected: build-pages 输出 `0 files changed.`

Run: `git status`
Expected: 工作区干净（或只剩 validate.yml 这个将要提交的改动）。

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/validate.yml
git commit -m "ci: 校验题目页生成物与数据源保持一致"
```

---

## Task 11: README 双语更新

**Files:**
- Modify: `README.md`
- Modify: `README_zh.md`

- [ ] **Step 1: 更新 `README.md` 的 Highlights 列表**

在 `README.md` 的 `## Highlights` section 最末尾追加一项：

```markdown
- Every question and category now has a dedicated static page (`q/*.html`, `c/*.html`) for long-tail search indexing
```

- [ ] **Step 2: 更新 `README.md` 的 Repository Structure 代码块**

把现有的 `.` 目录树扩展，加入 `q/` 和 `c/`，大致如下（在 `assets/` 之后、`scripts/` 之前）：

```text
├── q/                        # 203 static question pages (generated)
├── c/                        # 19 static category pages (generated)
├── assets/
│   ├── app.js
│   ├── data.js
│   ├── favicon.svg
│   └── styles.css
├── scripts/
│   ├── build-pages.mjs
│   ├── check-fast.sh
│   ├── check-full.sh
│   ├── slug.mjs
│   ├── validate-data.mjs
│   ├── validate-pages.mjs
│   └── validate-site.mjs
```

- [ ] **Step 3: 在 `README.md` 的 Validation section 之后插入一节「Static Page Build」**

在 `## Validation` 和 `## JD Coverage Audit` 之间插入：

```markdown
## Static Page Build

Every time `assets/data.js` changes, regenerate the static question/category pages and sitemap:

\`\`\`bash
node scripts/build-pages.mjs              # regenerate q/ c/ sitemap.xml
node scripts/build-pages.mjs --dry-run    # preview without writing
\`\`\`

Generated files under `q/` and `c/` are checked into git because GitHub Pages does not run build steps. CI will fail if the committed output drifts from `data.js`.
```

> 实际写入时不要转义反引号；这里只是 markdown-inside-markdown 的展示。

- [ ] **Step 4: 同步更新 `README_zh.md`**

在 `README_zh.md` 的 Highlights（或等价 section）末尾追加：

```markdown
- 每道题和每个分类都有独立的静态页面（`q/*.html`、`c/*.html`），供长尾搜索索引
```

Repository Structure 章节同步加入 `q/` 和 `c/`；新增「## 静态页构建」一节（内容与英文版对等）。

- [ ] **Step 5: 运行 validate-site 检查 README stats 没破（本 task 不改 203 / 19 数字）**

Run: `node scripts/validate-site.mjs`
Expected: `Validated repository metadata, share assets, and README summaries for 19 categories and 203 questions.`

- [ ] **Step 6: Commit**

```bash
git add README.md README_zh.md
git commit -m "docs: 补充题目独立页与分类聚合页的使用说明"
```

---

## Task 12: CHANGELOG 记录

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: 查看 CHANGELOG 现有最新日期**

Run: `head -10 CHANGELOG.md`
Expected: 看到最上面是 `2026-04-13` 的条目。

- [ ] **Step 2: 在 `## 2026-04-13` 之前插入 2026-04-17 新条目**

编辑 `CHANGELOG.md`，在 `本文件记录…` 那段下面、`## 2026-04-13` 之前，插入：

```markdown
## 2026-04-17

### Added

- 新增题目独立页（`q/*.html`，共 203 页）与分类聚合页（`c/*.html`，共 19 页），全部静态生成，支持搜索引擎独立索引。
- 新增 `scripts/slug.mjs`、`scripts/build-pages.mjs`、`scripts/validate-pages.mjs` 三个零依赖脚本，覆盖 slug 生成、页面构建、生成物校验。
- `sitemap.xml` 从 3 条 URL 扩充到 225 条，覆盖首页、学习页、模拟面试页、19 个分类页和 203 个题目页。

### Changed

- `assets/data.js` 每个分类新增 `slug` 字段；`scripts/validate-data.mjs` 新增 slug 必填、格式与唯一性校验。
- `scripts/check-fast.sh` 追加 slug 单测与生成物校验，pre-commit 阶段自动拦截回归。
- GitHub Actions 在现有校验之后追加 `build-pages` 同步性检查，CI 会拒绝「data.js 改了但生成物没重跑」的提交。
- `assets/styles.css` 补齐独立页所需的 Neo-Brutalism 样式（面包屑、徽章、答案区、相关题、CTA 按钮）。

```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: 记录题目独立页与 CI 闭环的 2026-04-17 变更"
```

---

## Task 13: 终态验证 & 分支收尾

**Files:** 无（只做验证）

- [ ] **Step 1: 全量校验链路**

Run: `./scripts/check-full.sh`
Expected: 全部通过，最后输出 `Validated repository metadata, share assets, and README summaries for 19 categories and 203 questions.`

- [ ] **Step 2: 生成物与 data.js 一致性自测**

Run: `node scripts/build-pages.mjs && git diff --stat q/ c/ sitemap.xml`
Expected: `Built 203 question pages, 19 category pages; 0 files changed.`，git diff 无输出。

- [ ] **Step 3: 浏览器冒烟测试**

Run: `python3 -m http.server 4173 &`

手动访问 3 条 URL：
- `http://127.0.0.1:4173/q/goroutine-gmp-q-q1rk0k.html`
- `http://127.0.0.1:4173/c/go-core.html`
- `http://127.0.0.1:4173/`（首页，确保未被 break）

检查项：
- 题目页看到完整答案、相关题链接能跳转
- 分类页难度分组齐全、链接有效
- 首页未被影响
- 浏览器 devtools 看 `view-source:<url>` 确认每个静态页都有完整 `<title>`、`<link rel="canonical">`、`<meta property="og:*">`

`kill %1` 关掉服务。

- [ ] **Step 4: Git 历史检视**

Run: `git log --oneline main..HEAD`（如果不在 feature 分支，用 `git log --oneline -n 13`）

Expected: 按 Task 1~12 的顺序看到 12 次 commit（Task 13 没有 commit），信息形如：

```
<hash> docs: 记录题目独立页与 CI 闭环的 2026-04-17 变更
<hash> docs: 补充题目独立页与分类聚合页的使用说明
<hash> ci: 校验题目页生成物与数据源保持一致
<hash> ci: pre-commit 追加 slug 测试与生成物校验
<hash> feat: 校验题目页与分类页生成物与数据源一致
<hash> style: 补齐题目页与分类页的 Neo-Brutalism 样式
<hash> feat: 首次生成题目独立页与分类聚合页
<hash> feat: 补完题目页与分类页的 HTML 渲染逻辑
<hash> feat: 新增题目页构建脚本的数据加载骨架
<hash> feat: 新增 slug 纯函数与单元测试
<hash> feat: 校验分类 slug 字段的必填格式与唯一性
<hash> feat: 为题库分类回填 slug 字段
```

- [ ] **Step 5: 提醒用户部署后的手工动作（非本 plan 范围，但要列出来）**

验收前请提醒用户：部署成功后，到 Google Search Console 重新提交新 `sitemap.xml`，以触发新页面的抓取。该动作超出本 plan 范围，不在 commit 流程中。

---

## Self-Review 结果（plan 写完后的审查）

**1. Spec coverage 检查**

| Spec 章节 | 覆盖 Task |
|---|---|
| §2 目标/非目标 | 全部 task（目标通过 Task 6/8/10 达成；非目标通过「只做 `?cat=` 不做 `?id=`」在 Task 5 的模板中体现） |
| §3 URL 与文件布局 | Task 1（slug 字段）/ Task 5（渲染模板）/ Task 6（首次生成） |
| §4 slug 生成策略 | Task 3（纯函数 + 测试）/ Task 1（分类 slug 回填）/ prelude 中的勘误（改用完整 id） |
| §5 页面模板 | Task 5（renderQuestionPage + renderCategoryPage） |
| §6 构建脚本 | Task 4（骨架）+ Task 5（渲染）+ Task 6（首次跑） |
| §7 sitemap | Task 5（renderSitemap）+ Task 6（首次输出 225 条） |
| §8 校验脚本 | Task 8 |
| §9 与基础设施集成 | Task 9（pre-commit）+ Task 10（CI diff） |
| §10 错误处理 | Task 3（slug 冲突假想 case 不测，但 Task 4 `assertSlugUnique` 实现） / Task 2（slug 必填） / Task 10（CI diff 闭环） |
| §11 样式补丁 | Task 7 |
| §12 里程碑 | Task 1~12 对应 M1~M5，颗粒更细 |
| §13 验收标准 | Task 13 |

**2. Placeholder scan**：已扫一遍，没有 TBD / TODO / 「类似 Task N」/ 「适当的错误处理」等占位。每个 step 都有完整代码或具体命令+期望输出。

**3. Type consistency**：
- `slugify(text)` / `buildQuestionSlug(question, id)` 在 Task 3 定义，Task 4 的 `normalize` 里使用 `buildQuestionSlug(item.q, item.id)` ✅
- `renderHead / renderQuestionPage / renderCategoryPage / renderSitemap / writeFileIfChanged / cleanStaleFiles / pickRelated / stripHtmlToText / escapeAttr / escapeText` 在 Task 5 全部定义并在 `main()` 使用 ✅
- `SITE_BASE` 常量在 Task 4 定义、Task 5 和 Task 8（validate-pages）都用同一 URL ✅
- `DIFF_LABEL` 在 Task 5 定义并仅在 `renderQuestionPage` 使用 ✅

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-17-seo-static-pages.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration, protects main context from 203-file build output noise.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
