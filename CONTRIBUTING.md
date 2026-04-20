# Contributing Guide

这个仓库当前同时维护两条产品形态：

- GitHub Pages 静态站点
- 原生 iOS 学习 App

目标是让题库内容更新简单、发布稳定、协作成本低，同时逐步把仓库打磨成一个更成熟的开源项目。

## 本地预览

1. 在仓库根目录启动静态服务：

   ```bash
   python3 -m http.server 4173
   ```

2. 浏览器访问 `http://127.0.0.1:4173`。

## 提交前检查

1. 校验浏览器脚本语法：

   ```bash
   ./scripts/check-fast.sh
   ```

2. 校验题库数据结构与题目唯一性：

   ```bash
   ./scripts/check-fast.sh
   ```

3. 校验 README 统计、站点元信息与关键静态文件：

   ```bash
   ./scripts/check-full.sh
   ```

4. 如果本次改动涉及 iOS：

   ```bash
   cd ios
   xcodebuild -project InterviewPrep.xcodeproj -scheme InterviewPrep -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 17' build
   ```

## 本地 Hook

建议在首次克隆仓库后执行：

```bash
./scripts/setup-hooks.sh
```

说明：

- `pre-commit` 会跑快速校验
- `pre-push` 会跑完整校验
- hook 只能帮你减少手动检查，不会替代 GitHub Pages 的远程发布流程

## Git 开发规范

- 默认以功能分支开发，不直接在 `main` 上做改动
- 合并策略以 squash merge 为主，保持主分支历史清晰
- 本仓库要求提交信息使用：

  ```text
  type: 中文描述
  ```

  示例：

  ```text
  feat: 强化首页分类专题层级
  fix: 修复复习队列空态回退逻辑
  docs: 同步主题配色说明
  chore: 优化社区协作模板
  ```

- 描述里不要加入 issue 编号、文件名、变量名或英文标识符，保持短、清楚、可读

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
- `ios/InterviewPrep/`：原生 iOS App 源码。
- `content-sources/`：题库素材源与扩题规划。
- `scripts/validate-data.mjs`：仓库内置校验脚本。

## GitHub 协作建议

- 提交 issue 时优先按模板选择影响范围：`site` / `ios` / `question-bank` / `maintenance`
- PR 里请勾选真实跑过的验证项，不要勾选“应该没问题”
- 如果改动跨越站点和 iOS 两端，建议在 Summary 里拆成两部分说明
- 如果改动涉及题库内容，请说明是否同步更新了 `q/`、`c/` 和 `sitemap.xml`

## Pull Request 建议

- 描述清楚本次改动影响的是内容、交互还是仓库配置。
- 如果改了题库结构，附上本地验证结果。
- 如果改了 GitHub Actions，说明触发条件和预期产物。
- 默认英文入口文档维护在 `README.md`，中文文档维护在 `README_zh.md`。
