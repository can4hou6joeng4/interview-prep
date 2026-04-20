import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import vm from 'node:vm';
import { buildQuestionSlug } from './slug.mjs';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const SITE_BASE = 'https://can4hou6joeng4.github.io/interview-prep';
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

function resolveDataLastmod() {
  const dataPath = path.join(ROOT, 'assets/data.js');
  try {
    const iso = execSync(`git log -1 --format=%cI -- "${dataPath}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    if (iso) return iso.slice(0, 10);
  } catch {}
  try {
    const stat = statSync(dataPath);
    return stat.mtime.toISOString().slice(0, 10);
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

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

  const lastmod = resolveDataLastmod();
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
