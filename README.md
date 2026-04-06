# Go 后端面试题库

基于简历项目定制的交互式面试题库，适合用来做 Go 后端岗位面试准备、知识回顾和项目深挖复盘。

## 项目特点

- 18 个分类、86 道题，覆盖 Go 核心、MySQL、Redis、Kafka、Kubernetes、微服务治理等主题
- 支持卡片学习和列表检索两种模式
- 支持分类、难度、未掌握、随机顺序、关键词搜索等组合筛选
- 学习进度保存在本地浏览器，并带有稳定题目 ID 与旧版进度迁移逻辑
- 零构建、零依赖，可直接部署到 GitHub Pages

## 在线部署

仓库内置 GitHub Pages 工作流，`main` 分支更新后会自动发布静态站点产物。

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
│   ├── jd-questions.md
│   └── shoply-deep-dive.md
├── scripts/
│   └── validate-data.mjs
├── .github/
│   ├── ISSUE_TEMPLATE/
│   └── workflows/
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
├── index.html
└── README.md
```

## 维护约定

- 题库数据维护在 `assets/data.js`
- 页面交互维护在 `assets/app.js`
- 素材源统一维护在 `content-sources/`
- 其中 `shoply-deep-dive.md` 是高质量项目深挖题源，`jd-questions.md` 是扩题 backlog
- 当前已并入首批 Shoply 项目深挖题，以及 JD 高优先级的 gRPC、性能优化和手撕题
- 发布工作流只上传站点实际需要的文件，避免把非站点素材一起公开
- 提交前建议执行：

```bash
node --check assets/app.js
node --check assets/data.js
node scripts/validate-data.mjs
```

## 后续可继续扩展的方向

- 将题库数据进一步拆分成按主题维护的独立文件
- 增加按标签过滤、错题回顾、导出进度等功能
- 为题库内容建立半自动统计或生成脚本
