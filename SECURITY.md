# Security Policy

## Supported Scope

仓库现在同时维护一个静态 GitHub Pages 站点和一个原生 iOS 学习 App。整体不包含服务端，但以下方向的安全反馈都欢迎：

### GitHub Pages 站点

- GitHub Actions 配置、密钥或环境变量泄露风险
- 发布到 Pages 的产物里包含不应公开的文件
- 浏览器端脚本存在明显注入风险
- `localStorage` 等本地持久化数据处理存在意外暴露问题

### iOS App

- SwiftData 本地存储、iCloud 键值同步中可能被第三方利用的越权访问
- 通过「导出学习进度 JSON」「重置学习进度」等入口产生的文件或数据泄露
- App Intents、Spotlight 深链路径在未授权场景下被调用的风险
- 第三方 SDK 或系统 API 使用方式上与 App Store 政策冲突的问题

## Reporting

- 普通内容错误、题目错漏、样式异常：请直接提交 Issue。
- 涉及安全、隐私或敏感信息的问题：不要公开提交 Issue，请通过 GitHub 私下联系仓库维护者。

## Response Expectations

- 会优先确认是否能稳定复现。
- 确认问题后会在下一次发布中修复，并在 CHANGELOG 中作必要的公开说明。
- 对本地学习数据的任何破坏性改动（例如重置）会在 UI 上给出二次确认，不会静默执行。
