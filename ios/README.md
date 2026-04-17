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

## 已实现能力（S1 + S2 + S3 + S4）

- ✅ 19 分类 / 203 题离线浏览
- ✅ 题目详情 WebView 渲染（HTML + 代码块 + 深色模式）
- ✅ SwiftData 持久化：掌握度（未学/学习中/已掌握）、收藏、最近查看
- ✅ 全文搜索（题目 + 答案）
- ✅ Spotlight 索引：系统搜索直达题目
- ✅ 随机一题
- ✅ TTS 通勤朗读（中文普通话，锁屏后可继续）
- ✅ Siri Shortcuts + App Intents：「随机来一题」「开始今日复习」
- ✅ iCloud Key-Value Store 同步（多设备进度合并）
- ✅ **「我的」Tab**：错题本（学习中）/ 收藏夹 / 最近查看
- ✅ **题目笔记**：每题可写 Markdown 笔记，随 iCloud 同步
- ✅ **难度筛选**：题目列表支持 easy/medium/hard 过滤

## 证书能力边界说明

两张证书的 Provisioning Profile 均**非通配符**（`application-identifier` 锁死在单一 Bundle ID），因此以下能力需要升级 $99 开发者账号才能解锁：

| 能力 | 阻塞原因 | 解锁条件 |
|---|---|---|
| Widget Extension | 需要独立 App ID `.Widget` 后缀 | 自有开发者账号 + 注册 App ID |
| Live Activity 锁屏 UI | UI 需运行在 Widget Extension 中 | 同上 |
| App Groups 跨进程共享 | 需自定义 group identifier | 同上 |
| iCloud Drive 文档容器 | 需注册 iCloud Container | 同上 |

当前 S3 已采用**零扩展**方案：Siri Shortcuts/TTS/iCloud KVS 全部在主 App 进程内实现，覆盖 95% 的 iOS 独有体验。

## 下一步（S5 候选）

- 题库增量下载机制（App 启动拉 `questions-index.json` 比对版本）
- 艾宾浩斯间隔重复算法（SM-2）驱动每日复习推送
- 错题本按分类二级分组 + 按上次查看时间排序
- 学习日历热力图
