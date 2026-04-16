# iOS App 构建与签名

本目录是面经刷题 App 的 iOS 原生工程（SwiftUI + iOS 17）。详细方案见 [`docs/ios-app-plan.md`](../docs/ios-app-plan.md)。

## 前置依赖

```bash
brew install xcodegen
# 或 mint install yonaskolb/xcodegen
```

需要 Xcode 15+（iOS 17 SDK）。

## 首次生成工程

```bash
# 仓库根目录下
node scripts/export-ios-data.mjs   # 1. 从 assets/data.js 导出题库到 Resources/questions.json
cd ios
xcodegen generate                  # 2. 由 project.yml 生成 InterviewPrep.xcodeproj
open InterviewPrep.xcodeproj       # 3. 打开 Xcode 真机运行
```

`.xcodeproj` 不入仓，每次跑 `xcodegen` 重新生成即可。

## 题库更新

Web 端题库变动后，在仓库根目录跑：

```bash
node scripts/export-ios-data.mjs
```

然后重新构建 App（Xcode 会自动包含最新 `questions.json`）。

## 签名方案

### A. 个人自签（开发调试，7 天过期）

1. Xcode → 工程 `InterviewPrep` → Signing & Capabilities
2. 勾选 Automatically manage signing
3. Team 选自己的 Apple ID（Personal Team）
4. Bundle Identifier 可改为 `com.<你的名字>.interviewprep` 以避免冲突

### B. 企业证书（自用稳定，1 年有效）

1. 准备好企业证书 `.p12` + 对应的 provisioning profile
2. Xcode → Signing 切 Manual
3. Provisioning Profile 选企业 profile；Team 选企业 Team
4. Archive → Distribute App → Enterprise → 导出 `.ipa`
5. 通过 AltStore / Sideloadly / 自建 OTA 页面 安装到设备

> ⚠️ 企业证书仅供自用，不得对外分发。

## 目录结构

```
ios/
├── project.yml                    # XcodeGen 配置
├── InterviewPrep/
│   ├── App/                       # 入口 @main
│   ├── Features/                  # 页面
│   │   ├── Root/
│   │   ├── Categories/
│   │   ├── Questions/
│   │   ├── Random/
│   │   └── Settings/
│   ├── Core/
│   │   ├── Models/                # Category / Question
│   │   └── Services/              # QuestionStore
│   ├── Resources/
│   │   └── questions.json         # 由脚本生成（入仓，方便离线构建）
│   └── Info.plist
└── README.md
```

## 下个 Sprint（S2）预告

- SwiftData 接入用户状态（掌握度 / 收藏 / 笔记）
- Spotlight 索引 + 全文搜索
- Widget Extension（每日一题）
