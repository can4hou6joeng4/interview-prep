# 推荐岗位面试题补充（基于 JD 分析）

> 生成时间：2026-04-03
> 数据来源：BOSS 直聘推荐岗位 JD 分析
> 用途：在新会话中整理到 interview-prep 网站

---

## 一、JD 技术要求汇总

| 技术点 | 网易 | 腾讯(微信读书) | 微派 | 欢聚 | 舜飞 | 智品 | 道云 | 覆盖率 |
|--------|------|--------------|------|------|------|------|------|--------|
| Golang | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| MySQL | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| Redis | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| Kafka/消息队列 | ✅ | ✅ | ✅ | | | ✅ | ✅ | 5/7 |
| MongoDB | ✅ | | | | ✅ | | ✅ | 3/7 |
| 分布式架构 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 高并发/高性能 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 7/7 |
| 数据结构与算法 | ✅ | ✅ | ✅ | | | | ✅ | 4/7 |
| Linux | ✅ | | ✅ | | ✅ | | | 3/7 |
| Docker/K8s | ✅ | | ✅ | | ✅ | | ✅ | 4/7 |
| Python | ✅ | ✅ | ✅ | ✅ | | ✅ | ✅ | 6/7 |
| gRPC/微服务 | | | ✅ | ✅ | | | ✅ | 3/7 |
| 时序数据库 | ✅ | | | | | | | 1/7 |
| AI/LLM应用 | ✅ | ✅(算法工程) | ✅(AI工具) | | | | ✅(LangChain) | 4/7 |
| 程序化广告 | | | | | ✅ | | | 1/7 |
| 网络协议(TCP/WebSocket) | | | ✅ | | | | | 1/7 |
| ElasticSearch | | | | | | | ✅ | 1/7 |
| 性能优化(pprof/火焰图) | | | ✅ | | ✅ | ✅ | ✅ | 4/7 |
| 服务治理(限流熔断) | | ✅ | ✅ | | | | | 2/7 |
| CI/CD DevOps | ✅ | | | | | | ✅ | 2/7 |

---

## 二、现有题库已覆盖的技术点

Go核心、MySQL、Redis、Kafka、计算机网络、K8s、MongoDB、高并发高可用、微服务治理、Linux、设计模式、支付系统、搜索引擎、安全防护、WebSocket、Docker

---

## 三、需要新增的面试题（按 JD 缺口分析）

### 3.1 gRPC 与 Protobuf（欢聚、微派、道云要求）

- **gRPC 的四种通信模式是什么？（Unary / Server Stream / Client Stream / Bidirectional Stream）**
  - 类型：基础
  - 关联岗位：欢聚集团、道云
  - 答案要点：Unary 一问一答；Server Stream 服务端推流（如实时价格推送）；Client Stream 客户端推流（如文件上传）；Bidirectional 双向流（如聊天）

- **Protobuf 的编码原理？为什么比 JSON 快？**
  - 类型：基础
  - 答案要点：Varint 变长编码 + Tag-Length-Value 格式；二进制序列化（vs JSON 文本）；无字段名（用编号替代）；体积约 JSON 的 1/3，速度快 3-10 倍

- **gRPC 的拦截器 (Interceptor) 怎么用？和 HTTP 中间件有什么类似？**
  - 类型：进阶
  - 关联岗位：微派（服务治理）
  - 答案要点：UnaryInterceptor / StreamInterceptor；链式调用；常用于认证、日志、限流、链路追踪

- **gRPC 的负载均衡方案？客户端负载 vs 代理负载？**
  - 类型：进阶
  - 答案要点：客户端 LB（grpc-go 内置 round_robin/pick_first）；代理 LB（Envoy/Nginx）；Name Resolver + Balancer 架构

### 3.2 性能优化实战（微派、舜飞、智品强调）

- **Go 程序的性能分析工具链有哪些？pprof / trace / benchmark 分别解决什么问题？**
  - 类型：进阶
  - 关联岗位：微派（明确要求 pprof/火焰图）
  - 答案要点：`pprof` CPU/内存/goroutine/block profiling；`trace` 可视化 goroutine 调度、GC、系统调用时间线；`benchmark` 函数级性能基准测试（`go test -bench`）

- **Go 中减少锁竞争的方案？无锁设计思路？**
  - 类型：深入
  - 关联岗位：微派（"锁竞争定位、减锁/无锁设计"）
  - 答案要点：分片锁（sharded mutex）；atomic 原子操作；channel 替代 mutex；sync.Map（读多写少）；Copy-on-Write 模式；lock-free queue（CAS 实现）

- **Redis 热点 Key 和大 Key 怎么治理？**
  - 类型：进阶
  - 关联岗位：微派（"热点与大 Key 治理"）
  - 答案要点：热点 Key — 本地缓存兜底 / key 分散（加后缀）/ 读写分离；大 Key — `MEMORY USAGE` 检测 / 拆分为多个小 Key / 异步删除（UNLINK）/ Hash 分片

- **MySQL 慢查询定位和优化的完整流程？**
  - 类型：进阶
  - 关联岗位：微派（"治理慢查询"）、道云（"优化SQL查询"）
  - 答案要点：开启 slow_query_log → pt-query-digest 分析 → EXPLAIN 执行计划 → 索引优化 / 查询重写 / 分表 → 验证效果

- **线上接口响应变慢，排查思路是什么？**
  - 类型：深入（场景题）
  - 关联岗位：多岗位
  - 答案要点：看监控（P99/P95） → 看日志 → pprof CPU/goroutine → trace 看调度 → 慢查询日志 → Redis slow log → 网络抓包 → 分层定位（网关→应用→缓存→DB）

### 3.3 弱网与网络协议优化（微派明确要求）

- **TCP 的拥塞控制算法？慢启动、拥塞避免、快重传、快恢复？**
  - 类型：进阶
  - 关联岗位：微派（"拥塞控制、背压"）
  - 答案要点：慢启动（cwnd 指数增长）→ 拥塞避免（cwnd 线性增长）→ 快重传（3 个重复 ACK 触发重传）→ 快恢复（cwnd 减半而非置 1）

- **弱网场景下的优化策略？超时重试、断线重连、背压？**
  - 类型：深入（场景题）
  - 关联岗位：微派（明确要求 "弱网优化意识"）
  - 答案要点：指数退避重试 + jitter；心跳探活 + 断线重连（WebSocket）；请求幂等保证；客户端本地队列 + 批量上传；服务端背压（channel 满时丢弃/限流）；TCP KeepAlive 调优

- **HTTP/2 的 Stream 多路复用在 gRPC 中如何体现？**
  - 类型：进阶
  - 关联岗位：微派（要求了解 HTTP/2、QUIC/HTTP/3）
  - 答案要点：gRPC 基于 HTTP/2，一个 TCP 连接上并行多个 RPC 调用（每个是一个 Stream）；帧（Frame）交错传输；HPACK 头部压缩减少带宽

### 3.4 AI 应用与 LLM 工程（网易、腾讯、微派、道云要求）

- **LangChain 的核心概念？Chain / Agent / Tool / Memory 分别是什么？**
  - 类型：基础
  - 关联岗位：道云（LangChain 工程师）
  - 答案要点：Chain 串联 LLM 调用链；Agent 根据输入动态选择 Tool 执行；Tool 外部能力（搜索/计算/API）；Memory 对话历史管理（Buffer/Summary/Vector）

- **如何设计一个 AI Agent 的后端架构？任务编排、上下文管理、错误处理？**
  - 类型：深入（场景题）
  - 关联岗位：道云、网易（AI 应用）
  - 答案要点：任务队列（Asynq/Celery）+ LLM API 调用 + 工具执行 + 上下文窗口管理（Token 裁剪/摘要）+ 结构化输出（JSON Schema）+ 重试与 fallback + 流式输出（SSE/WebSocket）
  - 简历关联：你有 AI Agent 后端落地经验

- **Prompt Engineering 的基本技巧？Few-shot / Chain-of-Thought / ReAct？**
  - 类型：基础
  - 关联岗位：道云、网易
  - 答案要点：Zero-shot（直接指令）；Few-shot（提供示例）；CoT（引导推理过程）；ReAct（Reasoning + Acting，Agent 常用）；System Prompt 设计原则

- **LLM 应用中的 RAG (Retrieval-Augmented Generation) 架构？**
  - 类型：进阶
  - 关联岗位：道云
  - 答案要点：文档分块 → Embedding → 向量数据库存储 → 用户 Query Embedding → 相似度检索 → 拼接 Context → LLM 生成答案；常见向量库：Milvus/Weaviate/Pinecone/pgvector

### 3.5 程序化广告系统（舜飞科技要求）

- **程序化广告的 RTB（实时竞价）流程？DSP/SSP/ADX 的角色？**
  - 类型：基础
  - 关联岗位：舜飞科技（程序化广告、ADX、SSP）
  - 答案要点：用户访问页面 → SSP（供给方平台）发出广告请求 → ADX（广告交易平台）向多个 DSP（需求方平台）发起竞价 → DSP 返回出价 → ADX 选最高出价 → 返回广告素材 → 用户看到广告。全流程需在 100ms 内完成

- **高并发广告系统的技术挑战？QPS 要求和延迟要求？**
  - 类型：进阶（场景题）
  - 关联岗位：舜飞科技（高并发、性能优化）
  - 答案要点：QPS 通常 10万+；延迟 <100ms；Go 天然适合（goroutine 高并发）；预计算 + 内存缓存（频控/预算）；异步日志（不阻塞主链路）；数据库写入批量异步化

### 3.6 跨境电商场景题（欢聚集团要求）

- **跨境电商独立站的核心技术挑战有哪些？**
  - 类型：进阶（场景题）
  - 关联岗位：欢聚集团（跨境电商独立站）
  - 答案要点：多币种支付（与你项目高度匹配）；多语言国际化；时区处理；跨境物流追踪；合规（GDPR/税收）；CDN 全球加速；反欺诈风控
  - 简历关联：你的 Shoply 项目覆盖了多币种、多支付网关、国际化等所有核心点

### 3.7 服务可观测性（微派、道云要求）

- **可观测性三支柱是什么？Metrics / Logs / Traces 的区别？**
  - 类型：基础
  - 关联岗位：微派（"观测性建设"）、道云（"监控"）
  - 答案要点：Metrics — 数值指标（Prometheus + Grafana）；Logs — 事件记录（ELK / Loki）；Traces — 请求链路（Jaeger / OpenTelemetry）；三者结合才能快速定位问题

- **SLO/SLI/SLA 是什么？如何定义和监控？**
  - 类型：进阶
  - 关联岗位：微派（"SLO"）
  - 答案要点：SLI（指标，如 P99 延迟、可用性百分比）；SLO（目标，如 99.9% 可用性）；SLA（协议，对外承诺）；Error Budget = 1 - SLO，用于权衡功能迭代速度与稳定性

- **Prometheus + Grafana 监控体系怎么搭建？Go 程序如何暴露指标？**
  - 类型：进阶
  - 关联岗位：微派、道云
  - 答案要点：引入 `prometheus/client_golang`；暴露 `/metrics` 端点；自定义 Counter/Gauge/Histogram/Summary；Grafana 配置 Dashboard + 告警规则

### 3.8 CI/CD 与 DevOps（网易、道云要求）

- **Go 项目的 CI/CD 流程一般怎么设计？**
  - 类型：基础
  - 关联岗位：网易（DevOps）、道云（CI/CD 流程建设）
  - 答案要点：代码推送 → lint (golangci-lint) → 单元测试 (go test) → 构建 (go build) → Docker 镜像 → 推送镜像仓库 → K8s 滚动更新；常用工具：GitHub Actions / GitLab CI / Jenkins

- **灰度发布/金丝雀发布怎么实现？**
  - 类型：进阶
  - 关联岗位：微派（"灰度/回滚"）
  - 答案要点：K8s 层面 — 两个 Deployment 不同版本，通过 Service/Ingress 按比例分流；Istio — VirtualService 权重路由；应用层 — Feature Flag + 用户 ID 哈希分桶；监控指标异常自动回滚

### 3.9 算法与数据结构手撕补充（腾讯、网易、微派要求）

- **实现一个 Go 版本的跳表 (Skip List)，理解 Redis ZSet 底层**
  - 类型：深入
  - 答案要点：多层链表，每层跳跃不同步长；查找/插入/删除均为 O(log n)；Redis ZSet 在 128+ 元素时使用 skiplist

- **实现 Top K 问题（海量数据中找前 K 大的元素）**
  - 类型：进阶
  - 关联岗位：腾讯、网易（算法功底）
  - 答案要点：小顶堆（min heap）维护 K 个元素；遍历数据，大于堆顶则替换；时间 O(n log k)，空间 O(k)

- **实现一个简单的布隆过滤器 (Bloom Filter)**
  - 类型：进阶
  - 答案要点：位数组 + 多个哈希函数；判断元素"可能存在"或"一定不存在"；用于缓存穿透防护、URL 去重

- **用 Go 实现生产者-消费者模型（channel + select）**
  - 类型：基础
  - 答案要点：buffered channel 做队列；多 producer goroutine 写入；多 consumer goroutine 读取；select + context 优雅退出

---

## 四、题目统计

| 分类 | 新增题数 | 当前题库是否已有 |
|------|---------|----------------|
| gRPC 与 Protobuf | 4 | ❌ 全新 |
| 性能优化实战 | 5 | 部分有(pprof)，需细化 |
| 弱网与网络协议 | 3 | 部分有(TCP)，需补充 |
| AI/LLM 工程 | 4 | ❌ 全新 |
| 程序化广告 | 2 | ❌ 全新 |
| 跨境电商场景 | 1 | 部分有(支付)，需补充 |
| 服务可观测性 | 3 | ❌ 全新 |
| CI/CD 与 DevOps | 2 | ❌ 全新 |
| 算法手撕补充 | 4 | 部分有，需补充 |
| **合计** | **28** | |

---

## 五、优先级建议

### P0 — 几乎每个岗位都会问
1. Go 性能优化（pprof/火焰图/锁竞争）
2. Redis 热点/大 Key 治理
3. MySQL 慢查询优化
4. 分布式架构设计（高并发/高可用）

### P1 — 大厂重点（网易/腾讯）
5. 算法手撕（Top K / 跳表 / 布隆过滤器）
6. 服务可观测性（Prometheus/SLO）
7. 服务治理（限流熔断灰度）

### P2 — 特定岗位方向
8. AI/LLM 工程（道云/网易）
9. gRPC（欢聚/微派/道云）
10. 程序化广告（舜飞）
11. 弱网优化（微派）
