# iOS App 方案设计（个人自用版）

> 顶层设计：将本仓库题库从 Web 形态扩展为原生 iOS App，复用现有 Markdown + 分类数据，叠加 iOS 独有能力（Widget / Live Activity / Spotlight / Shortcuts / TTS）。本文件为落地抓手，所有后续 PR 必须与本计划对齐。

## 1. 目标与非目标

### 目标
- 个人自用，**不上架 App Store**。
- 离线可用：题库随 App 打包，无需网络即可刷题。
- iOS 特性闭环：Widget、锁屏 Live Activity、通勤朗读（TTS）、Spotlight 搜索、Siri Shortcuts。
- 与 Web 端数据同源：`assets/data.js` → 脚本导出 → App bundle。

### 非目标
- 不支持多人协作、不做账号系统。
- 不购买 $99 开发者账号，因此：
  - 放弃 CloudKit（container 需付费账号）。
  - 跨设备同步降级为「iCloud Drive 文档方式」或纯本地 SwiftData。
- 不做 Android / HarmonyOS 版本。

## 2. 证书策略

| 用途 | 证书 | 有效期 | 限制 |
|---|---|---|---|
| 日常开发调试 | 个人自签（Free Apple ID） | 7 天 | 最多 3 个 App ID / 设备 |
| 稳定自用安装 | **企业签名证书** | 1 年 | 不得对外分发；Widget/Live Activity 需在 entitlements 显式声明 |

企业证书签名产物为 `.ipa`，通过 AltStore / Sideloadly / 企业 MDM 安装到个人设备。

## 3. 架构（三层）

```
┌──────────────────────────────────────────┐
│ Presentation (SwiftUI)                   │
│  - QuestionList / QuestionDetail         │
│  - CategoryGrid / Search / Settings      │
│  - WidgetKit Extension                   │
│  - Live Activity (ActivityKit)           │
├──────────────────────────────────────────┤
│ Domain                                   │
│  - Models: Category / Question / Progress│
│  - Services: ProgressService / TTSService│
│  - SpotlightIndexer / ShortcutsProvider  │
├──────────────────────────────────────────┤
│ Data                                     │
│  - BundleDataSource (questions.json)     │
│  - SwiftData (user state, local only)    │
│  - iCloud Drive export/import (optional) │
└──────────────────────────────────────────┘
```

## 4. 数据管道

Web 端 `assets/data.js` 是单一事实来源（SSOT）。新增构建脚本 `scripts/export-ios-data.mjs`：

```
assets/data.js  ──(node)──▶  ios/InterviewPrep/Resources/questions.json
```

- 每次题库更新 → 本地跑 `npm run build:ios-data` → App 工程重新打包。
- JSON schema 与 Web 保持一致：`[{cat, icon, color, slug, items:[{q, a(HTML), diff, tags, id}]}]`。
- App 端渲染答案：直接用 `WKWebView` 或 `AttributedString` 解析 HTML（一期先 WebView，零转换成本）。

## 5. 目录结构

```
ios/
├── project.yml                 # XcodeGen 配置（不入仓 .xcodeproj）
├── InterviewPrep/
│   ├── App/                    # @main + AppDelegate
│   ├── Features/
│   │   ├── Categories/
│   │   ├── Questions/
│   │   ├── Search/
│   │   └── Settings/
│   ├── Core/
│   │   ├── Models/
│   │   ├── Services/
│   │   └── Persistence/
│   └── Resources/
│       ├── questions.json      # 由脚本生成
│       └── Assets.xcassets
├── InterviewPrepWidget/        # Widget Extension
└── README.md                   # 构建/签名说明
```

## 6. Sprint 拆分（3 个迭代 × 约 8 个 PR）

### S1 — 骨架与数据闭环（当前 PR 起点）
- [x] 新建 `feat/ios-app-scaffold` 分支
- [x] 数据导出脚本 `scripts/export-ios-data.mjs`
- [x] XcodeGen 工程骨架 `ios/project.yml` + SwiftUI 最小可运行 App
- [x] 分类列表 / 题目列表 / 题目详情（WebView 渲染答案）
- [ ] `ios/README.md`：XcodeGen 生成、企业证书签名、安装步骤

### S2 — 用户状态与搜索
- [ ] SwiftData 模型：`UserProgress { questionId, status, favorited, lastViewedAt, note }`
- [ ] 全文搜索（本地）：按标题 + 答案文本倒排
- [ ] Spotlight 索引（`CoreSpotlight`）：系统搜索直达题目

### S3 — iOS 独有能力
- [ ] Widget（小/中/大三种）：每日一题、分类进度、最近错题
- [ ] Live Activity：今日刷题进度
- [ ] Siri Shortcuts：「随机来一题」「开始今日复习」
- [ ] TTS（`AVSpeechSynthesizer`）：通勤朗读模式，支持锁屏控制
- [ ] iCloud Drive 导出：`UserProgress` 序列化为 JSON 落到 `~/Library/Mobile Documents/`，多设备手动导入

## 7. 风险与对齐

| 风险 | 缓解 |
|---|---|
| 题库中含 LaTeX 公式 | 一期用 WebView + KaTeX；二期评估 iosMath |
| Widget / Live Activity 对免费账号支持 | 经验证 Xcode 自动签名 + 企业证书均可启用，但需显式声明 entitlements |
| SwiftData 在 iOS 17 以下不可用 | App 最低版本锁 iOS 17.0 |
| 企业证书被吊销 | 不分发、不做 enterprise distribution 违规行为 |

## 8. 合入节奏

- 每个 Sprint 对应 1 个父 PR，内部以原子 commit 串联；或拆多个 PR 合并。
- 本地构建验证：`cd ios && xcodegen generate && xcodebuild -scheme InterviewPrep build`。
- 提交信息遵循中文规范（`feat: 新增 iOS 工程骨架`）。
