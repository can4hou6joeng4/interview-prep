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

## 2. 证书策略（已落地）

本地 `~/Documents/files/cert/` 下两张证书（密码均为 `1`），工程已在 `ios/project.yml` 配置双 Configuration：

| Configuration | 证书 | Team | Bundle ID | 设备 | 有效期 | iCloud/Siri/Widget |
|---|---|---|---|---|---|---|
| Debug / Release | 开发者证书（Natalie Neuman） | R36U8N6X48 | `app.yellow4516.serval5183` | 仅 UDID `00008130-001219640A98001C` | 2027-04-03 | ✅ 全能力（含 iCloud/Siri/HealthKit/NetworkExtension） |
| ReleaseEnterprise | 企业证书（XL AXIATA） | Q6SJUT5K5D | `com.xl.MyXL.Giant-staging` | 任意 | 2027-02-19 | ❌ 仅基础 Push |

**拉通策略**：
- 日常开发用 Dev 证书（iCloud 同步、Siri Shortcuts 等高级特性依赖它）
- 稳定分发用企业证书（任意设备可装）
- 证书导入、描述文件安装、打包 ipa 都已脚本化：`ios/scripts/install-certs.sh` + `ios/scripts/build-ipa.sh`

**风险对齐**：
- 若设备 UDID 与 `00008130-...` 不符，Dev 证书无法真机运行 → 降级走企业证书路径，iCloud 同步能力损失
- 两张证书均非用户本人购买，属可用性借用，吊销风险存在，需准备备用方案（如后续注册 $99 账号）

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

## 6. Sprint 拆分（4 个迭代）

### S1 — 骨架与数据闭环（已完成）
- [x] 新建 `feat/ios-app-scaffold` 分支
- [x] 数据导出脚本 `scripts/export-ios-data.mjs`
- [x] XcodeGen 工程骨架 `ios/project.yml` + SwiftUI 最小可运行 App
- [x] 分类列表 / 题目列表 / 题目详情（WebView 渲染答案）
- [x] `ios/README.md`：XcodeGen 生成、企业证书签名、安装步骤

### S2 — 用户状态与搜索（已完成）
- [x] SwiftData 模型：`UserProgress { questionId, status, favorited, lastViewedAt, note }`
- [x] 全文搜索（本地）：按标题 + 答案文本 contains
- [x] Spotlight 索引（`CoreSpotlight`）：系统搜索直达题目
- [x] 证书双配置（开发者 / 企业）+ 签名打包脚本

### S3 — iOS 独有能力（已完成）
- [x] TTS 通勤朗读（`AVSpeechSynthesizer` + `AVAudioSession` 后台播放）
- [x] Siri Shortcuts（`AppIntent` + `AppShortcutsProvider`）：随机来一题 / 开始今日复习
- [x] iCloud Key-Value Store 同步（`NSUbiquitousKeyValueStore` + 进度合并）
- [x] 深链路由（`DeepLink` + `DeepLinkTarget`）对接 Spotlight / Siri 唤起
- [~] Widget / Live Activity — **阻塞**：需注册新 App ID，待升级 $99 开发者账号

### S4 — 个人使用闭环（已完成）
- [x] 「我的」Tab：错题本（学习中）/ 收藏夹 / 最近查看
- [x] 题目笔记编辑（`NoteEditorSheet` + SwiftData `note` 字段 + iCloud 同步）
- [x] 题目列表按难度筛选（`DiffFilter` segmented picker）
- [x] 确认题库零 LaTeX → 砍掉 LaTeX 渲染需求

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
