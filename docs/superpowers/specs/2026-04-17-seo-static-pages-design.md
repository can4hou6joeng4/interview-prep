# SEO 静态题目页与分类页 — Design Doc

- 创建日期：2026-04-17
- 关联需求：打开长尾 SEO 流量通道，让每道题和每个分类能被搜索引擎独立索引
- 关联分支（规划）：`feat/seo-static-pages`
- 状态：Draft（待用户最终审阅）

## 1. 背景与动机

现状：站点由 `index.html` / `study.html` / `mock.html` 三个入口页组成，全部 203 道题的内容都隐藏在 SPA 的 JS 状态里，`sitemap.xml` 只暴露上述 3 个 URL。搜索引擎（包括 Googlebot）理论上可以跑 JS，但权重打折，且 Bing/DuckDuckGo/百度对 SPA 的抓取能力远弱于静态页。

对于面试题类仓库，长尾搜索是增长飞轮（典型 query：`goroutine gmp 面试题`、`kafka 消息可靠性 面试题`、`redis 缓存穿透`）。站点当前把这部分流量通道基本关闭了。

## 2. 目标与非目标

### 目标

- 把 203 道题和 19 个分类做成可被独立索引的静态 HTML 页
- 保持「零构建」承诺：不引入运行时依赖；构建脚本纯 Node ESM，与现有 `validate-data.mjs` / `validate-site.mjs` 同构
- 全流程闭环：新增题 → 跑脚本 → 生成物入库 → CI 校验生成物与源数据一致
- 与现有 Neo-Brutalism 视觉风格一致（复用 `assets/styles.css`）

### 非目标

- 不做 SSR / 框架化；题目详情页是纯静态 HTML
- 不做进度状态显示；独立页是「阅读态」，练习交互继续走 SPA
- 不做学习路径页和标签页（边际收益低，后续单独立项）
- 不做「从独立页跳 SPA 精确定位到某道题」的深链（`app.js` 当前不支持 `?id=` 参数，扩展它会把范围从 SEO 拉到 SPA 改造，本 spec 不处理）

## 3. URL 与文件布局

```
interview-prep/
├── q/                          # 新增：题目详情页目录（生成物）
│   ├── goroutine-gmp-q1rk0k.html
│   ├── go-channel-1uwipet.html
│   └── …                       # 约 203 个文件
├── c/                          # 新增：分类聚合页目录（生成物）
│   ├── go-core.html
│   ├── mysql.html
│   └── …                       # 约 19 个文件
├── sitemap.xml                 # 改写：自动包含 3 + 19 + 203 = 225 条
├── scripts/
│   ├── build-pages.mjs         # 新增：生成 q/ c/ 并重写 sitemap.xml
│   ├── slug.mjs                # 新增：slug 生成纯函数
│   └── validate-pages.mjs      # 新增：校验生成物与 data.js 一致
```

URL 协议：
- 题目页：`https://can4hou6joeng4.github.io/interview-prep/q/{slug}.html`
- 分类页：`https://can4hou6joeng4.github.io/interview-prep/c/{cat-slug}.html`
- 带 `.html` 后缀，与现有 `study.html` / `mock.html` 风格对齐；避免「每目录一个 `index.html`」导致的文件数翻倍

生成物入库：GitHub Pages 不跑构建，生成的 `q/` `c/` 和重写后的 `sitemap.xml` 必须 commit，与 `assets/social-preview.png` 等工程生成物一致。

## 4. slug 生成策略

零依赖、纯函数、可单测。

### 题目 slug

规则：
1. 从题目 `q` 字段中正则匹配所有 `[A-Za-z][A-Za-z0-9+#.]*` 英文 token
2. 驼峰拆分（`GoroutineGMP` → `goroutine gmp`），小写，连字符拼接
3. 取前 6 个 token，总长度 ≤ 80 字符
4. 末尾拼 `-{id.slice(-6)}` 作为唯一性兜底
5. 如果题目纯中文没有任何英文 token，slug 回落为 `{id}`（即 `q-xxxxxx`），不再拼后缀

示例：

| 题目 `q` | id | slug |
|---|---|---|
| `Goroutine 的调度模型 GMP 是什么？` | `q-q1rk0k` | `goroutine-gmp-q1rk0k` |
| `Go 中 Channel 的底层结构是什么？` | `q-1uwipet` | `go-channel-1uwipet` |
| `什么是分布式事务？` | `q-abcdef` | `q-abcdef` |

### 分类 slug

在 `assets/data.js` 每个分类顶层加一个 `slug` 字段，手写（19 个，质量可控）。

示例：

| 分类 `cat` | `slug` |
|---|---|
| Go 语言核心 | `go-core` |
| MySQL 数据库 | `mysql` |
| Redis 缓存与队列 | `redis` |
| 项目场景深挖 | `project-deep-dive` |
| … | … |

校验：`validate-data.mjs` 新增一条规则——分类必须包含非空 `slug`；所有 `slug` 全局唯一且符合 `[a-z0-9-]+` 模式。

## 5. 页面模板

### 5.1 题目详情页 `q/{slug}.html`

**`<head>` 元数据**

| 字段 | 规则 |
|---|---|
| `<title>` | `{item.q} - Go 后端面试题库` |
| `<meta name="description">` | 从 `item.a`（HTML）去标签后抽纯文本，塌缩连续空白为单空格；若长度 > 160 字符，截断后补 `…`；若答案为空或抽出长度为 0，回落为 `{category.cat}｜{item.q}` |
| `<link rel="canonical">` | `https://can4hou6joeng4.github.io/interview-prep/q/{slug}.html` |
| `<meta property="og:title">` | `{item.q}` |
| `<meta property="og:description">` | 同 description |
| `<meta property="og:type">` | `article` |
| `<meta property="og:url">` | 同 canonical |
| `<meta property="og:image">` | 继承 `index.html` 的 `assets/social-preview.png` 绝对 URL |
| `<meta name="twitter:card">` | `summary_large_image` |
| `<link rel="stylesheet" href="../assets/styles.css">` | 复用 Neo-Brutalism 样式 |

**`<body>` 结构**

```
<main class="detail">
  <nav class="breadcrumb">
    <a href="../index.html">首页</a> ›
    <a href="../c/{cat-slug}.html">{category.cat}</a> ›
    <span>{item.q}</span>
  </nav>

  <article class="question">
    <h1>{item.q}</h1>
    <p class="meta">
      <span class="badge badge-{diff}">{difficulty label}</span>
      {for tag in item.tags: <span class="badge badge-tag">{tag}</span>}
    </p>

    <section class="answer">
      {item.a 原样嵌入 — 已是 HTML}
    </section>
  </article>

  <aside class="related">
    <h2>本分类其他题目</h2>
    <ul>
      {同分类里按原数组顺序取该题之后的 5 道题；不足 5 道则从数组开头补齐（跳过自身）}
    </ul>
  </aside>

  <nav class="cta">
    <a href="../c/{cat-slug}.html">浏览本分类全部 {N} 题</a>
    <a href="../study.html?mode=card&cat={catIndex}">进入 SPA 学习本分类</a>
  </nav>

  <footer class="ft">
    <a href="../index.html">返回首页</a> ·
    <a href="https://github.com/can4hou6joeng4/interview-prep">GitHub 源码</a> ·
    <a href="../index.html#updates">查看更新</a>
  </footer>
</main>
```

说明：
- 「进入 SPA 学习本分类」使用 `?cat={catIndex}`——`app.js` 已支持该参数（见 `assets/app.js:295`）
- 不做 `?id=` 深链（`app.js` 当前不支持；扩展它不在本 spec 范围）
- 答案 HTML 原样嵌入不转义（`item.a` 已是信任源，由作者维护）

### 5.2 分类聚合页 `c/{cat-slug}.html`

**`<head>` 元数据**

| 字段 | 规则 |
|---|---|
| `<title>` | `{category.cat} 面试题汇总（{N} 题） - Go 后端面试题库` |
| `<meta name="description">` | `覆盖 {category.cat} 的 {N} 道面试题，包括 easy {X} / medium {Y} / hard {Z}。` |
| `<link rel="canonical">` | `https://can4hou6joeng4.github.io/interview-prep/c/{cat-slug}.html` |
| `<meta property="og:type">` | `website` |
| 其余同题目页 | |

**`<body>` 结构**

```
<main class="category">
  <nav class="breadcrumb">
    <a href="../index.html">首页</a> ›
    <span>{category.cat}</span>
  </nav>

  <header>
    <h1>{category.cat}</h1>
    <p class="summary">{N} 题 · easy {X} · medium {Y} · hard {Z}</p>
  </header>

  <section class="list">
    <h2>easy · {X} 题</h2>
    <ol>{easy 题目链接}</ol>
    <h2>medium · {Y} 题</h2>
    <ol>{medium 题目链接}</ol>
    <h2>hard · {Z} 题</h2>
    <ol>{hard 题目链接}</ol>
  </section>

  <nav class="cta">
    <a href="../study.html?mode=card&cat={catIndex}">在 SPA 中学习本分类</a>
    <a href="../index.html">返回首页看全部分类</a>
  </nav>

  <footer class="ft">同题目页脚</footer>
</main>
```

## 6. 构建脚本 `scripts/build-pages.mjs`

### 数据流

```
assets/data.js
      │  (vm sandbox 读取，与 validate-*.mjs 同法)
      ▼
normalize()
      │  输出 [{cat, catSlug, catIndex, items:[{q, a, diff, tags, id, slug}]}]
      ▼
┌─────┴───────────────────────────┐
▼                                 ▼
renderQuestionPages()   renderCategoryPages()
│                                 │
▼                                 ▼
q/*.html                        c/*.html
                │
                ▼
         renderSitemap()
                │
                ▼
           sitemap.xml
```

### 关键函数（纯函数，全部在同一个文件里，便于审阅）

| 函数 | 签名 | 说明 |
|---|---|---|
| `loadData()` | `() -> rawData` | 沿用 `validate-site.mjs` 的 vm sandbox 读法 |
| `normalize(data)` | `(raw) -> normalized` | 计算每题 slug、每分类 catIndex，预聚合计数 |
| `renderHead({ title, description, canonicalPath, ogType })` | `(opts) -> string` | 共享 head 片段 |
| `renderQuestionPage(item, category, related)` | `(args) -> string` | 题目页完整 HTML |
| `renderCategoryPage(category, groupedItems)` | `(args) -> string` | 分类页完整 HTML |
| `renderSitemap(urls, lastmod)` | `(args) -> string` | sitemap.xml |
| `writeFileIfChanged(path, content)` | `(path, content) -> bool` | 只在内容变更时写入，避免 mtime 抖动 |

### 运行

```bash
node scripts/build-pages.mjs              # 生成全部
node scripts/build-pages.mjs --dry-run    # 只打印，不写文件
node scripts/build-pages.mjs --verbose    # 列出每个生成的路径
```

`--dry-run` 和 `--verbose` 通过 `process.argv` 简单解析，不引第三方 CLI 库。

## 7. sitemap 策略

`build-pages.mjs` 负责全量重写 `sitemap.xml`：

- 3 个核心页：`/`、`/study.html`、`/mock.html`
- 19 个 `c/{cat-slug}.html`
- 203 个 `q/{slug}.html`

所有 URL 的 `<lastmod>` 统一为脚本运行当天日期（简化策略，避免精细化 mtime 追踪带来的复杂度）。

单文件 sitemap 足够：225 条 × ~150 字节 ≈ 34 KB，远低于 50 MB / 50 000 URL 上限。

## 8. 校验 `scripts/validate-pages.mjs`

校验项：

1. `q/` 目录下 `.html` 文件数 === data.js 题目总数
2. `c/` 目录下 `.html` 文件数 === data.js 分类总数
3. 所有生成文件名（slug）全局唯一
4. 每个生成的 HTML 都包含：`<title>`、`<link rel="canonical">`、`<meta property="og:title">`、`<h1>`
5. `sitemap.xml` 的 `<loc>` 数量 === 3 + 分类数 + 题目数
6. `sitemap.xml` 里每个 `q/` 和 `c/` URL 都对应磁盘上实际存在的文件

运行：`node scripts/validate-pages.mjs`，失败抛异常+非零退出码。

## 9. 与现有基础设施的集成

### pre-commit (`scripts/check-fast.sh`)

追加：

```sh
node --check scripts/build-pages.mjs
node --check scripts/slug.mjs
node --check scripts/validate-pages.mjs
node scripts/validate-pages.mjs
```

`validate-pages.mjs` 只校验文件数量与元数据，毫秒级，不跑 build。

### pre-push (`scripts/check-full.sh`)

已递归调用 fast；不再额外追加（避免在本地 push 时跑 build，build 只在 CI 里强制）。

### CI (`.github/workflows/validate.yml`)

在现有 `validate-data` / `validate-site` 步骤之后追加：

```yaml
- name: Ensure build-pages output matches committed files
  run: |
    node scripts/build-pages.mjs
    git diff --exit-code q/ c/ sitemap.xml
```

闭环：如果贡献者改了 `data.js` 却没跑 `build-pages.mjs`，CI 的 `git diff --exit-code` 会失败，强制要求必须本地 build 并 commit 生成物后才能合入。

### `validate-data.mjs` 新增规则

- 分类必须含非空 `slug` 字段
- 所有 `slug` 全局唯一，匹配 `^[a-z0-9-]+$`

## 10. 错误处理

| 错误类型 | 表现 | 处理 |
|---|---|---|
| slug 冲突（理论不会发生） | `build-pages.mjs` throw，非零退出 | CI 失败，提示 slug 冲突的两道题 |
| 分类缺 `slug` 字段 | `validate-data.mjs` throw | pre-commit 失败，提示补字段 |
| 生成物与仓库不一致 | CI 的 `git diff --exit-code` 失败 | 提示贡献者本地跑 `node scripts/build-pages.mjs` |
| `data.js` eval 失败 | 沿用 `validate-site.mjs` 的 error（vm sandbox） | 同现有体验 |
| HTML 抽 description 时答案为空 | description 回落为 `category.cat` + item.q 拼接 | 容错 |

## 11. 样式补丁

`assets/styles.css` 需要新增几类元素的样式（否则详情页会没有布局）：

- `.detail` / `.category` 主容器
- `.breadcrumb`
- `.badge-easy` / `.badge-medium` / `.badge-hard` / `.badge-tag`
- `.answer`（答案区，复用 `item.a` 内部已有的 `.key-point` / `.project-link`）
- `.related`、`.cta` 导航按钮

样式量不大（< 100 行），与现有 Neo-Brutalism token 对齐（粗黑边、平移阴影、糖果饱和色）。

## 12. 里程碑

| 阶段 | 产出 | 可独立交付 |
|---|---|---|
| M1 | `data.js` 19 个分类回填 `slug` + `validate-data.mjs` 新增 slug 校验 | ✅ 独立 PR |
| M2 | `scripts/slug.mjs` + `scripts/_slug.test.mjs`（轻量 assert） | ✅ 独立 PR |
| M3 | `scripts/build-pages.mjs` + 首次生成 `q/` `c/` `sitemap.xml` 入库 + 样式补丁 | ✅ 独立 PR |
| M4 | `scripts/validate-pages.mjs` + 接入 hooks + CI diff 闭环 | ✅ 独立 PR |
| M5 | `README.md` / `README_zh.md` 更新 + `CHANGELOG.md` 记录 2026-04-17 | ✅ 独立 PR |

## 13. 验收标准

- [ ] `node scripts/build-pages.mjs` 成功生成 203 个题目页 + 19 个分类页
- [ ] 重写后的 `sitemap.xml` 包含 225 个 `<url>`
- [ ] `node scripts/validate-pages.mjs` 通过
- [ ] CI 的 `git diff --exit-code` 在本地 build 后为空
- [ ] 任选 3 道题的独立页在浏览器打开，显示题目、答案、相关题、CTA，视觉风格与 SPA 一致
- [ ] 任选 3 个分类页打开，显示题目列表和难度统计
- [ ] `README.md` 顶部 stats 无需改动（categories 和 questions 数量没变）
- [ ] `CHANGELOG.md` 2026-04-17 条目记录本次变更
- [ ] GitHub Pages 部署后，Google Search Console 提交新 sitemap，等待抓取（时间外，非本 spec 验收项）

## 14. 后续增强（不在本 spec 范围）

- SPA 支持 `?id={id}` 深链，让独立页的「去练习这一题」精确定位
- 学习路径独立页（`p/{path-slug}.html`）
- 标签独立页（`t/{tag}.html`）
- 把答案里的代码块加语法高亮（需引入 prism 或 hljs，破坏零依赖）
- 结构化数据 JSON-LD（QAPage / FAQPage schema），让 Google 能展示富摘要
