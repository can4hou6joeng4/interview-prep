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
