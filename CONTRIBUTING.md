# Contributing Guide

这个仓库是一个零构建的静态 GitHub Pages 项目，目标是保持题库内容更新简单、发布稳定、协作成本低。

## 本地预览

1. 在仓库根目录启动静态服务：

   ```bash
   python3 -m http.server 4173
   ```

2. 浏览器访问 `http://127.0.0.1:4173`。

## 提交前检查

1. 校验浏览器脚本语法：

   ```bash
   node --check assets/app.js
   node --check assets/data.js
   ```

2. 校验题库数据结构与题目唯一性：

   ```bash
   node scripts/validate-data.mjs
   ```

## 内容维护约定

- 题库内容集中放在 `assets/data.js`。
- 素材来源集中放在 `content-sources/`，不要再把规划稿和运行时数据混放在仓库根目录。
- 每道题的稳定进度键依赖“分类 + 题目标题”生成。
- 如果只是优化答案内容，尽量不要改题目标题。
- 如果必须改题目标题，视为新题，旧进度会自然失效。
- 如果新增题目，优先沿用现有分类、难度和标签格式。

## 页面结构

- `index.html`：页面入口和 SEO 元信息。
- `assets/styles.css`：视觉样式。
- `assets/app.js`：交互、筛选、进度迁移与持久化。
- `assets/data.js`：题库数据。
- `content-sources/`：题库素材源与扩题规划。
- `scripts/validate-data.mjs`：仓库内置校验脚本。

## Pull Request 建议

- 描述清楚本次改动影响的是内容、交互还是仓库配置。
- 如果改了题库结构，附上本地验证结果。
- 如果改了 GitHub Actions，说明触发条件和预期产物。
