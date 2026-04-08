# Content Sources

这个目录存放题库站点的人工整理素材，不直接作为前端运行时数据读取。

## 文件角色

- `shoply-deep-dive.md`
  - 角色：高质量项目深挖题源
  - 特征：围绕 Shoply/UUFind 等简历项目，按主题组织完整问答
  - 适合用途：抽取为正式题库、补充项目标签与场景题

- `jd-questions.md`
  - 角色：扩题 backlog 与优先级规划
  - 特征：按岗位 JD 缺口整理待补面试题、覆盖率和优先级
  - 适合用途：下一轮题库扩容时按优先级批量并入

- `interview-experience-map.md`
  - 角色：真实面经到题库的映射稿
  - 特征：区分“当前题库已覆盖”“适合正式并入”“只适合专项素材池”的题目
  - 适合用途：把散落在外部面经文件中的题目先做结构化整理，再决定是否正式入库

## 当前约定

- 站点运行时题库仍维护在 `assets/data.js`
- 本目录作为内容规划与人工整理源，不进入 GitHub Pages 发布产物
- 如果某份素材已经完全并入站点，可以在文件顶部标注并入日期，避免重复维护

## 当前同步状态

- `shoply-deep-dive.md`
  - 已并入首批项目深挖题，重点覆盖混合架构、结算 Pipeline、Capability、统一商品标识

- `jd-questions.md`
  - 已并入四批高优先级缺口题，重点覆盖 gRPC、性能分析、慢查询治理、Top K、Bloom Filter、可观测性、CI/CD、DDD、K8s Operator、AWS、搜广推基础、AIGC 推理、测试工程、弱网优化、程序化广告和 LangChain 基础

- `interview-experience-map.md`
  - 新增于 2026-04-08，用来整理真实面经与当前 Go 后端题库的适配边界
  - 其中第一批高频 Go 后端题已并入正式题库
