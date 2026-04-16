# iOS App 构建与签名

SwiftUI + iOS 17 原生工程。完整方案见 [`docs/ios-app-plan.md`](../docs/ios-app-plan.md)。

## 前置依赖

```bash
brew install xcodegen
```

Xcode 15+（iOS 17 SDK）必需。

## 快速开始

```bash
# 仓库根目录
node scripts/export-ios-data.mjs          # 导出题库
cd ios
./scripts/install-certs.sh                 # 一键导入证书 + 描述文件
xcodegen generate                          # 生成 xcodeproj
open InterviewPrep.xcodeproj
```

## 证书矩阵

本仓库配了两套 Configuration，对应本地 `~/Documents/files/cert/` 下的两张证书：

| Configuration | 用途 | 证书 | Bundle ID | 设备限制 | iCloud/Siri/Widget |
|---|---|---|---|---|---|
| `Debug` / `Release` | 日常开发真机调试 | 开发者证书（Natalie Neuman, Team R36U8N6X48） | `app.yellow4516.serval5183` | **仅 UDID `00008130-001219640A98001C`** | ✅ 全能力 |
| `ReleaseEnterprise` | 稳定自用分发（.ipa） | 企业证书（XL AXIATA, Team Q6SJUT5K5D） | `com.xl.MyXL.Giant-staging` | 任意设备 | ❌ 无 |

> ⚠️ 如果你当前 iPhone 的 UDID **不是** `00008130-001219640A98001C`，`Debug/Release` 配置无法真机运行，必须换用 `ReleaseEnterprise` 或找一台匹配的设备。

## 打包 .ipa

```bash
cd ios
./scripts/build-ipa.sh dev          # 开发者证书 → development ipa
./scripts/build-ipa.sh enterprise   # 企业证书   → enterprise ipa
```

产物：`ios/build/ipa/InterviewPrep.ipa`

## 安装到设备

1. **AltStore / Sideloadly**：拖入 .ipa 即可
2. **Apple Configurator 2**：连接设备 → 拖入 .ipa
3. **企业 OTA**：把 .ipa + manifest.plist 放 HTTPS 服务器，用 `itms-services://` 链接安装

## 题库更新

Web 端题库变动后：

```bash
node scripts/export-ios-data.mjs
```

然后重新 archive。

## 目录结构

```
ios/
├── project.yml                    # XcodeGen 配置（双 Configuration）
├── scripts/
│   ├── install-certs.sh           # 证书 & 描述文件一键导入
│   └── build-ipa.sh               # Archive + 导出 ipa
├── InterviewPrep/
│   ├── App/
│   ├── Features/
│   │   ├── Root/ Categories/ Questions/ Random/ Search/ Settings/
│   ├── Core/
│   │   ├── Models/                # Category / Question / UserProgress (SwiftData)
│   │   └── Services/              # QuestionStore / SpotlightIndexer
│   ├── Resources/questions.json
│   └── Info.plist
└── README.md
```

## 已实现能力（S1 + S2）

- ✅ 19 分类 / 203 题离线浏览
- ✅ 题目详情 WebView 渲染（HTML + 代码块 + 深色模式）
- ✅ SwiftData 持久化：掌握度（未学/学习中/已掌握）、收藏、最近查看
- ✅ 全文搜索（题目 + 答案）
- ✅ Spotlight 索引：系统搜索直达题目
- ✅ 随机一题

## 下个 Sprint（S3）预告

- Widget Extension（小/中号每日一题）
- Live Activity（今日刷题进度）
- Siri Shortcuts（"随机来一题"）
- TTS 通勤朗读
- iCloud Drive 导出用户状态（多设备手动同步）
