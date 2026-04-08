# Go 后端面试题库

基于简历项目定制的交互式面试题库，适合用来做 Go 后端岗位面试准备、知识回顾和项目深挖复盘。

[English README](./README.md)
[更新记录](./CHANGELOG.md)

## 项目特点

- 19 个分类、132 道题，覆盖 Go 核心、MySQL、Redis、Kafka、Kubernetes、微服务治理等主题
- 支持卡片学习、列表检索和模拟面试三种模式
- 模拟结果页支持薄弱分类统计、下一轮建议和薄弱题回炉再练
- 支持分类、难度、未掌握、随机顺序、关键词搜索等组合筛选
- 学习进度保存在本地浏览器，并带有稳定题目 ID 与旧版进度迁移逻辑
- 零构建、零依赖，可直接部署到 GitHub Pages
- 仓库级校验会自动检查题库统计、SEO 元信息和站点关键配套文件

## 在线访问

- 仓库主页：[github.com/can4hou6joeng4/interview-prep](https://github.com/can4hou6joeng4/interview-prep)
- 站点地址：[can4hou6joeng4.github.io/interview-prep](https://can4hou6joeng4.github.io/interview-prep/)

## 本地运行

```bash
python3 -m http.server 4173
```

打开 [http://127.0.0.1:4173](http://127.0.0.1:4173) 即可预览。

## 仓库结构

```text
.
├── assets/
│   ├── app.js
│   ├── data.js
│   ├── favicon.svg
│   └── styles.css
├── content-sources/
│   ├── README.md
│   ├── interview-experience-map.md
│   ├── jd-questions.md
│   └── shoply-deep-dive.md
├── scripts/
│   └── validate-data.mjs
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── CHANGELOG.md
├── 404.html
├── LICENSE
├── README.md
├── README_zh.md
├── robots.txt
└── SECURITY.md
```

## 维护约定

- 题库数据维护在 `assets/data.js`
- 页面交互维护在 `assets/app.js`
- 素材源统一维护在 `content-sources/`
- 其中 `shoply-deep-dive.md` 是高质量项目深挖题源，`jd-questions.md` 是扩题 backlog
- 当前已并入六批高优题，覆盖 Shoply 项目深挖、gRPC、性能优化、手撕题、可观测性、CI/CD、DDD、K8s Operator、AWS、搜广推基础、AIGC 推理、测试工程、弱网优化、程序化广告、LangChain 基础，以及 RESTful 设计、缓存一致性、队列治理、SSE 流式输出、MongoDB 事务和首批真实面经高频题
- 发布工作流只上传站点实际需要的文件，避免把非站点素材一起公开
- 当前静态站点已补齐 `404.html`、`robots.txt`、`site.webmanifest`、`sitemap.xml` 等基础配套文件

## 提交前建议执行

```bash
./scripts/check-fast.sh
./scripts/check-full.sh
```

## 本地 Git Hook

建议在仓库根目录执行：

```bash
./scripts/setup-hooks.sh
```

这会自动配置：

- `pre-commit` → `./scripts/check-fast.sh`
- `pre-push` → `./scripts/check-full.sh`

这样做可以减少你每次手动跑校验命令的成本，但它不能替代 GitHub Pages 的远程发布。想让线上 Pages 更新，最终仍然需要一次推送触发 GitHub Actions。

## 社区文档

- [贡献指南](./CONTRIBUTING.md)
- [行为准则](./CODE_OF_CONDUCT.md)
- [安全策略](./SECURITY.md)

## 后续可继续扩展的方向

- 将题库数据进一步拆分成按主题维护的独立文件
- 增加按标签过滤、错题回顾、导出进度等功能
- 为题库内容建立半自动统计或生成脚本
