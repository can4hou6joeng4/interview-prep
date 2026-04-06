# Shoply 项目面试深挖题库

> 本文档针对简历中每个技术亮点，整理面试官可能深挖的问题及参考答案。
> 答案基于实际代码实现，确保经得住追问。

---

## 一、Go + PHP 双引擎 RPC 架构

### Q1: 为什么选择 Go + PHP 混合架构而不是纯 Go？

**答**：这是一个务实的架构决策。Go 擅长处理高并发 HTTP 请求、WebSocket 长连接、任务调度等性能敏感场景；PHP 生态在电商插件、动态业务逻辑、模板渲染方面更灵活成熟。系统采用 Go 作为高性能网关层，PHP 作为灵活业务逻辑层，通过 RPC 桥接。这样既能利用 Go 的性能优势扛住流量，又能利用 PHP 的灵活性快速迭代插件系统（20+ 个 app-* 插件）。

### Q2: Go 和 PHP 之间的 RPC 通信是怎么实现的？

**答**：使用 Go 原生的 `net/rpc` 包。在 `go-fast/init/rpc/rpc.go` 中注册了一个包含 25+ 个服务的 RPC 结构体（Product/Article/ES/Firewall/User/Credit/Notification 等），每个服务对应一个独立文件。PHP 端通过 TCP 连接调用这些服务。选择 `net/rpc` 而非 gRPC 是因为：内部通信不需要跨网络，`net/rpc` 更轻量，且 PHP 端对接更简单。

### Q3: plugin_mode 和 static_mode 是什么？

**答**：这是框架的两种运行模式，通过 Go 的 build tags 实现编译期切换：
- `plugin_mode`（`//go:build plugin`）：使用 Go 原生 Plugin（`.so` 文件）动态加载模板引擎、ORM 扩展、验证码等模块，开发期修改插件无需重编译主进程。
- `static_mode`：生产环境使用静态编译，将所有模块编译到单一二进制文件中，部署更简单、性能更好。

### Q4: 如果 RPC 调用失败了怎么处理？

**答**：RPC 层每个服务方法内部都有错误处理和日志记录。对于关键链路（如支付回调触发的 RPC），采用重试 + 日志告警机制。对于非关键链路（如 ES 数据同步），采用异步消息队列解耦，失败后由 Worker 重试。框架层面支持优雅关机，确保 RPC 服务退出前完成进行中的请求。

---

## 二、Checkout 结算计算引擎（Pipeline 模式）

### Q5: 为什么把结算计算拆成 Pipeline？直接在一个方法里算不行吗？

**答**：跨境电商的结算涉及多种优惠叠加（满减 → 优惠券 → 外部折扣）、运费（多方案多国家）、税费（价内税/价外税）、多币种转换，逻辑极其复杂。Pipeline 拆分的好处：
1. **职责单一**：每个 calc 模块只关心自己的计算逻辑，易于测试和维护
2. **顺序可控**：优惠扣减必须在运费之前（运费基于折后金额判断免邮），税费必须在优惠之后（计税基数依赖折后金额），顺序不可错
3. **可组合**：如果某个店铺没有开启税费功能，applyTax 直接跳过，不影响其他步骤

### Q6: 八步计算管道的执行顺序是什么？为什么是这个顺序？

**答**：
1. `prepareBaseItems` — 基础数据转换、库存/状态预校验、计算商品原价
2. `applyPromotions` — 满减活动扣减
3. `applyCoupons` — 优惠券扣减
4. `applyExternalDiscounts` — 外部折扣（分销联盟等）
5. `applyShipping` — 运费计算（基于折后金额判断免邮门槛）
6. `applyTax` — 税费计算（基于折后金额计税）
7. `summarize` — 最终金额汇总、精度补偿、积分抵扣、改价容错
8. `applyCurrency` — 多币种汇率转换

顺序的核心约束：优惠必须先算（因为运费门槛基于折后金额），税费在运费之后（有些场景运费也需要计税），汇率转换最后执行（所有金额都确定后一次性转换）。

### Q7: 金额分摊算法是怎么实现的？如何保证精度？

**答**：通过 `applyGenericAllocation` 通用分摊函数实现。核心逻辑：
1. 计算每个商品的权重（通常是商品金额占总金额的比例）
2. 按权重比例分配总优惠/税费金额：`单项分摊 = (当前权重 × 总金额) / 总权重`
3. 所有金额使用 `shopspring/decimal` 库（不用 float），保证精度
4. **残差修正**：由于 Round(2) 会产生尾差，最后将累计分摊与原始金额的差值补偿给第一个商品，确保 `分摊总和 == 原始金额`，一分不差
5. **兜底处理**：如果所有商品权重为零（比如全部免费），自动切换为按数量均分

### Q8: 运费计算支持哪些模式？

**答**：两种模式：
1. **内部表配置报价（Table Rate）**：商家在后台配置首重+续重或阶梯计费规则，系统根据商品总重量/数量/金额计算
2. **外部应用报价（Application）**：通过 API 对接第三方物流商（如快递鸟），传入地址和商品信息获取实时运费

地址匹配采用两级降级策略：先精准匹配省份（StateId），再兜底匹配国家（CountryId）。多个运费方案并行计算后，用户指定优先，否则自动选中最低价方案。

### Q9: 税费的价内税和价外税有什么区别？代码里怎么处理的？

**答**：
- **价内税（VAT，欧洲常见）**：商品标价已含税。公式：`Tax = Price - Price/(1+Rate)`。商品 TotalPayPrice 不变，但需要拆出税额。
- **价外税（Sales Tax，美国常见）**：商品标价不含税。公式：`Tax = Price × Rate`。税费额外叠加到 TotalPayPrice 上。

代码中通过 `taxConfig.TaxInclusive` 配置项区分。还支持 `IsTaxBeforeDiscount`（先计税还是先折扣）：
- `true`：基于商品原价计税（先税后折）
- `false`：基于折后金额计税（先折后税，默认）

税率匹配按 省份 → 国家 → 店铺默认 三级降级。

### Q10: summarize 里的金额公式是什么？

**答**：
```
SubtotalPrice   = 商品原价总和
DiscountPrice   = CouponPrice + PromotionPrice + ExternalDiscountPrice
TotalPrice      = SubtotalPrice - DiscountPrice + ShippingPrice + TaxPrice（价外税）
                = SubtotalPrice - DiscountPrice + ShippingPrice（价内税，税已含在原价中）
PayPrice        = TotalPrice - CreditPrice + AdjustmentPrice
```

其中 AdjustmentPrice 是商家手动改价，代码中做了容错：如果改价导致 PayPrice 为负数，直接报错拦截。

---

## 三、多币种双轨金额体系

### Q11: 什么是"双轨金额"？为什么需要？

**答**：跨境电商场景下，商家的基础币种（如 USD）和买家的结算币种（如 EUR）不同。系统中每个金额字段都有对应的 Settle 字段：
- `SubtotalPrice` / `SettleSubtotalPrice`
- `TotalPrice` / `SettleTotalPrice`
- `PayPrice` / `SettlePayPrice`
- `ShippingPrice` / `SettleShippingPrice`
- 商品行级：`SalesPrice` / `SettleSalesPrice`

所有计算在基础币种下完成，最后通过 `applyCurrency` 一次性转换到结算币种。这样保证基础币种金额的精确性（财务对账用），同时给买家展示本地货币金额。

### Q12: 为什么用 decimal 而不是 float？

**答**：float 有精度丢失问题（如 0.1 + 0.2 != 0.3）。金融场景下一分钱的误差都不能接受。`shopspring/decimal` 底层用大整数实现精确小数运算，所有金额计算和比较都通过 decimal 方法完成，最终 `.Round(2)` 输出两位小数。

---

## 四、SaaS 套餐能力控制系统（Capability）

### Q13: Capability 系统的设计思路是什么？

**答**：核心是 **Plan + Quota + Feature** 三层模型：
- **Plan（套餐）**：Free / Pro / Enterprise，定义在配置中，运行时通过 `planCatalogSource()` 加载（支持默认配置 + 自定义配置合并）
- **Quota（配额）**：每个套餐定义 ProductMax / CustomDomainMax / ThemeInstallMax / EmployeeMax 的上限值，-1 表示无限制
- **Feature（功能开关）**：RecoveryEnabled 等布尔开关

运行时通过 `Assert*` 方法拦截校验：加载当前店铺套餐快照（`loadStorePlan`），查询资源实际用量，判断 `used + incoming <= limit`。超限时写日志并返回错误。

### Q14: 为什么用 Assert 模式而不是中间件统一拦截？

**答**：因为不同资源的校验时机不同——商品配额在创建商品时检查，域名配额在绑定域名时检查，召回功能在触发召回任务时检查。统一中间件无法知道当前请求涉及哪种资源操作。Assert 方法嵌入具体业务代码中，调用点明确，且每个 Assert 方法都带 `source` 参数方便日志追踪是哪个入口触发的。

### Q15: 套餐降级后超限的资源怎么处理？

**答**：系统采用"**存量不删、增量拦截**"策略。降级后已有的商品/域名/模板不会被自动删除（避免数据丢失），但新增操作会被 Assert 拦截。前端通过 `Current()` 接口获取实时配额信息（已用/剩余/上限），展示升级引导。

---

## 五、Go 层 SSR + 主题引擎

### Q16: 为什么用 Go 做 SSR 而不是 Node.js？

**答**：对于 SaaS 多租户场景，每个店铺可能使用不同的主题模板。Go 做 SSR 的优势：
1. **性能**：Go 的并发模型天然适合高并发 SSR，不需要 Node.js 的 cluster 管理
2. **部署简单**：单一 Go 二进制包含所有能力，不需要额外维护 Node.js 进程
3. **资源消耗低**：SaaS 场景下多个租户共享进程，Go 的内存占用远低于 Node.js

SSR 中间件会根据主题的 `Runtime` 配置智能切换：`ThemeRuntimeStatic` 走静态文件直出，否则走 Go 模板引擎渲染。

### Q17: 主题系统的核心模块有哪些？

**答**：
- `theme.go`（1071 行）：主题 CRUD、主题文件扫描、截图缓存
- `theme_components.go`：组件注册与渲染（可视化编辑器的组件库）
- `theme_nodes.go`：节点树管理（页面由组件节点树构成，支持拖拽编辑）
- `theme_diy.go`：DIY 自定义页面（商家自由搭建页面）
- `theme_cache.go`：主题渲染结果缓存，避免重复编译
- `theme_template.go`：模板编译与渲染

主题文件存储在文件系统中（`ThemesDir`），每个主题是一个独立目录，包含 JSON 配置和模板文件。

---

## 六、WAF 防火墙 + 访客风险分析

### Q18: 自建 WAF 比 Cloudflare 有什么优势？

**答**：不是替代 Cloudflare，而是在应用层做更细粒度的防护。Cloudflare 做的是网络层防护（DDoS、Bot），我们的 WAF 做的是业务层防护：
1. **针对电商场景定制**：识别刷单行为、薅羊毛、恶意爬虫
2. **访客画像**：基于 IP+UA+时间窗口生成全局指纹，追踪访客行为轨迹
3. **与业务深度集成**：风险评分直接影响验证码弹出、订单风控

### Q19: 访客冷热分表怎么做的？

**答**：访客数据量大且有明显的时间衰减特征。设计：
- **热表**：存储近期（如 7 天）活跃访客数据，查询频率高
- **冷表**：归档历史访客数据，查询频率低
- **迁移机制**：定时任务按日期条件将热表数据迁移到冷表
- **指纹去重**：同一 IP+UA+时间窗口 内只记录一条访客数据，避免重复
- **GORM Sharding**：按 `store_id` 分片，每个租户的访客数据在独立分片中

### Q20: 异步批处理怎么保证主链路性能？

**答**：访客中间件采集到的数据不直接写库，而是投入内存队列（channel），由后台 Worker 批量消费写入。主链路只做指纹计算和入队操作（纳秒级），不阻塞 HTTP 响应。

---

## 七、积分系统（Builder 模式）

### Q21: 为什么用 Builder 模式？

**答**：积分变更涉及多个参数（credits/points/ruleCode/ruleId/userId/remark），不同业务场景需要传入的参数组合不同。Builder 模式的好处：
1. **可读性**：`NewCredit(db).WithCredits(10).WithPoints(50).WithRuleCode("order_complete").WithUserId(uid).Do()`，语义清晰
2. **灵活性**：只传需要的参数，不需要构造一个大 struct
3. **校验内聚**：`Do()` 方法内部统一校验必填参数

### Q22: 怎么保证积分操作的原子性？

**答**：`Do()` 方法内部使用 `db.Transaction`，在事务中：
1. `SELECT FOR UPDATE` 锁定用户行（防止并发操作导致余额不一致）
2. 计算新余额并校验是否为负（积分/信用分不能透支）
3. `UPDATE` 用户余额
4. `INSERT` 积分流水日志

整个过程在同一个事务中，失败自动回滚。行锁保证并发安全。

---

## 八、Event/Listener 事件驱动架构

### Q23: 事件系统的设计是什么样的？

**答**：采用观察者模式。`app/event/` 目录定义事件类型（product/article/auth/comment/category 等），`app/listener/` 目录定义对应的监听器。框架初始化时通过 `init/listener/listener.go` 注册所有监听关系。

业务代码触发事件后，对应的 Listener 异步执行副作用逻辑。比如：
- Product 事件 → ES 数据同步
- Auth 事件 → visitorId 透传，游客订单归户
- Comment 事件 → 通知推送

### Q24: 事件是同步还是异步执行的？

**答**：取决于场景。关键链路（如 Auth 事件透传 visitorId）是同步的，确保数据一致性。非关键链路（如 ES 数据同步）通过 Asynq 任务队列异步执行，不阻塞主请求。

---

## 九、多租户 SaaS 数据隔离

### Q25: 为什么用 store_id 逻辑隔离而不是物理隔离（每租户一个库）？

**答**：物理隔离在租户数量少的时候可行，但 SaaS 平台可能有成千上万个店铺。每个店铺一个数据库的话：
1. 连接池爆炸：MySQL 默认最大连接数有限
2. 运维复杂：schema 变更需要逐库执行
3. 成本高：每个库都有开销

逻辑隔离通过 `store_id` 字段过滤，所有租户共享数据库实例，但通过 GORM 中间件自动注入 `WHERE store_id = ?`，业务代码无感知。同时对高流量表（统计表、访客表）使用 Sharding 分片，减轻单表压力。

### Q26: 自定义 GORM Sharding 插件和官方的有什么区别？

**答**：官方 `gorm.io/sharding` 在实际使用中遇到了一些问题（Schema 注册导致的空指针等），所以自定义了 Sharding 插件。核心差异：
1. 分片策略完全基于 `store_id`，规则更简单直接
2. 兼容了框架自身的 AutoMigrate 流程
3. 对 `store_id = 0` 的全局表（如系统配置表）自动跳过分片逻辑

---

## 十、Redis PubSub 优雅关机

### Q27: 优雅关机为什么需要特别处理 PubSub？

**答**：Redis PubSub 订阅是长驻 goroutine，通过 `channel` 持续监听消息。如果进程直接退出，正在处理中的消息可能丢失。优雅关机机制：
1. 启动时注册 `context.Context` 和 `cancel` 函数
2. 每个订阅 goroutine 启动时 `PubSubAdd()`（WaitGroup.Add）
3. 退出信号到达时调用 `cancel()`，所有 goroutine 通过 `select { case <-ctx.Done() }` 感知到退出
4. 主进程 `PubSubWait()` 等待所有 goroutine 退出，设置超时保护防止卡死

---

## 十一、游客订单归户

### Q28: 游客订单归户的完整链路是什么？

**答**：
1. 游客浏览时生成 `visitorId`（前端生成，Cookie 持久化）
2. 游客下单时，订单和购物车记录绑定 `visitorId`（userId 为空）
3. 游客登录/注册时，Auth 事件通过 Event/Listener 触发归户逻辑
4. 归户逻辑：根据 `visitorId` 查出所有无主订单和购物车，UPDATE 绑定当前 `userId`
5. 清除 `visitorId` 关联，避免重复归户

### Q29: 怎么解决购物车串单问题？

**答**：串单是指游客 A 和游客 B 在同一设备上先后操作，导致购物车混淆。解决方案：
- 购物车勾选状态绑定 `visitorId`，而不是 session
- 登录后只归户当前 `visitorId` 对应的数据
- 归户完成后清除旧的 `visitorId` 绑定关系

---

## 十二、营销召回系统

### Q30: 三条召回任务链是怎么设计的？

**答**：基于 Asynq（Redis-backed）异步任务队列实现：
1. **购物车召回**：用户加购后未结账，10 分钟后触发邮件提醒
2. **结账页召回**：用户进入结账页但未支付，分步提醒（10min → 1h → 24h）
3. **订单召回**：用户下单未支付，触发支付提醒

定时任务每 10 分钟扫描符合条件的记录，创建 Asynq 任务投入队列。Worker 消费任务后调用邮件服务发送召回邮件。每个召回链路独立，互不影响。

---

## 十三、UUFind 商品身份体系

### Q31: 跨平台商品统一标识是怎么设计的？

**答**：不同渠道（1688、淘宝）的商品 ID 体系不同。设计 `UufindProduct` 作为平台内统一商品标识，通过 `UufindProductAgentLink` 关联到各渠道的原始商品。`UufindGoodsFeed` 作为商品动态数据流，支撑聚合展示。

映射逻辑：`alibaba` → `1688` 渠道兼容，URL 解析自动识别渠道来源。

### Q32: 代理链接模板引擎怎么工作的？

**答**：不同代理商有不同的链接格式模板（包含佣金参数、追踪码等）。模板引擎根据渠道和代理商配置，自动将商品原始链接转换为带有佣金追踪的代理链接。支持变量替换、多渠道适配，商家无需手动拼接链接。

---

## 通用高频问题

### Q33: 这个系统的 QPS 大概是多少？怎么做的性能优化？

**答**：具体 QPS 取决于租户规模。性能优化手段：
1. Go Fiber 框架本身基于 fasthttp，单机吞吐量高
2. 多级缓存：Redis 缓存 + 请求级缓存（同一请求内汇率只查一次）+ 主题缓存
3. 冷热分表：大数据量表按时间归档
4. Sharding 分片：按 store_id 分散压力
5. 异步解耦：访客采集、ES 同步、邮件发送全部异步
6. 连接池动态调整：根据 CPU 核心数和内存计算最优连接池参数

### Q34: 你在这个项目中遇到的最大技术挑战是什么？

**建议回答方向**（根据你实际经历选择）：
- **支付链路的复杂性**：四种支付网关 × 多种接入模式 × 3DS 验证 × 多币种 × 快捷支付会话复用，任何一个环节出错都会导致掉单
- **金额精度问题**：跨境场景下多次汇率转换的精度累积误差，通过 decimal + 残差补偿解决
- **游客归户的边界问题**：串单、重复归户、并发归户等边界 case

### Q35: 如果让你重新设计这个系统，你会改什么？

**建议回答方向**：
- 运费计算模块中的 `matchShippingArea` 全量查询 ShippingArea 可以优化为按 CountryId 索引查询
- 积分系统可以考虑引入分布式锁替代行锁，提高并发性能
- 事件系统可以考虑引入事件总线（如 NATS），统一管理事件的发布/订阅

---

## 十四、WAF 防火墙深挖（代码级细节）

### Q36: WAF 的风险评分模型是怎么设计的？

**答**：采用**累加评分制**，初始 Score = 0，各检测模块独立加/减分，最终按阈值决策：
- Score < 50：正常放行
- 50 ≤ Score < 80：弹出验证码（CAPTCHA）
- Score ≥ 80：直接拉黑
- Score ≥ 100：短路返回（跳过后续检测节省资源）

**加分项**：
- 代理头检测（Via/X-Forwarded-For 多层跳板/隐蔽代理头）：+20~+40
- ASN 识别（DigitalOcean/Vultr/OVH/Hetzner 等云服务商）：高危 ASN 直接高分
- 频率限制（10 秒内超过阈值）：softLimit +60，hardLimit 直接 200
- 无 Cookie 连续访问（阶梯式：3 次 +15，5 次 +50，10 次 +80）
- HTTP/1.0 协议降级：+20

**减分项（信用加分）**：
- 来源是主流搜索引擎（Google/Bing/Baidu等）：直接放行，Score = 0
- 有本站 Referer + Cookie：-40（极大概率真人）
- 有本站 Referer 无 Cookie：-10

### Q37: 频率限制怎么做的？为什么是动态阈值？

**答**：使用 Redis INCR + EXPIRE 实现滑动窗口计数。关键设计是**动态阈值**：
- 正常请求：softLimit = 60/10s，hardLimit = 120/10s
- 如果前序检测 Score ≥ 30（已有嫌疑）：收紧到 softLimit = 10/10s，hardLimit = 30/10s

这样对正常用户宽松（每秒 6 次浏览绰绰有余），对可疑请求收紧（每秒 1 次就触发验证码）。visitor hash 基于 IP + UA + Accept-Language 三要素生成 MD5，同一设备同一浏览器只有一个计数器。

### Q38: 连续无 Cookie 检测的设计考量是什么？

**答**：区分爬虫和真人的一个核心信号——真人浏览器会执行 JS 并自动携带 Cookie，而简单爬虫不会。设计：
1. **只检测主文档请求**（`Sec-Fetch-Dest: document` 或 Accept 包含 `text/html`），过滤掉图片/CSS 等资源请求，减少误判
2. **带 Cookie 立即重置计数器**（Redis DEL），给真人"自我证明"的机会
3. **阶梯式加分**：3 次 → 弱信号（+15），5 次 → 预警（+50），10 次 → 致命（+80）
4. **30 分钟过期**：应对慢速爬虫（每分钟一次也能累积到阈值）

---

## 十五、Checkout/Payment 事件钩子系统

### Q39: CheckoutService 和 PaymentService 的 Before/After 事件钩子是怎么工作的？

**答**：每个核心 Service（Checkout/Payment/Order/Product）都内置了 CRUD 生命周期事件：
```go
type CheckoutService struct {
    CreateBeforeEvents []event.CheckoutCreateBefore
    CreateAfterEvents  []event.CheckoutCreateAfter
    UpdateBeforeEvents []event.CheckoutUpdateBefore
    UpdateAfterEvents  []event.CheckoutUpdateAfter
    // ...
}
```

通过 `AddCreateBeforeEvents()` 方法注册监听器（线程安全，sync.Mutex 保护）。业务流程中，Create 方法会在实际创建前遍历执行所有 BeforeEvents，创建后遍历执行所有 AfterEvents。

**好处**：插件系统（PHP 层 app-*）可以通过注册事件钩子扩展核心逻辑，而不需要修改核心代码。比如：
- 分销联盟插件在 `CheckoutCreateAfter` 中记录佣金
- 营销插件在 `OrderCreateAfter` 中触发召回任务
- 邮件插件在 `PaymentUpdateAfter` 中发送支付成功通知

### Q40: 为什么用 sync.Mutex 而不是 sync.RWMutex？

**答**：事件注册（AddEvents）只在服务启动时发生一次，运行时不会动态添加。Mutex 保护的是初始化阶段的并发安全。运行时遍历事件列表是只读操作，此时 slice 已经固定，不需要加锁。用 Mutex 而不是 RWMutex 是因为写操作（注册）本身极少发生，RWMutex 的额外开销没有意义。

---

## 十六、Go 基础功力题（结合项目代码）

### Q41: Fiber 和 net/http 的区别是什么？为什么选 Fiber？

**答**：Fiber 底层基于 `fasthttp` 而非 `net/http`。核心区别：
- **零内存分配**：fasthttp 复用 request/response 对象，减少 GC 压力
- **性能**：benchmark 下 Fiber 的 QPS 通常是 net/http 的 3-5 倍
- **API 设计**：Express.js 风格，上手快，中间件链路清晰

选择 Fiber v3 的原因：SaaS 平台多租户共享进程，高并发场景下零内存分配的优势更明显。

### Q42: 项目中用到了哪些 Go 并发原语？

**答**：
- `sync.Mutex`：事件钩子注册、主题截图缓存（`screenshotCache sync.Map`）
- `sync.Map`：Localizer 国际化映射（并发安全的语言包缓存）
- `sync.WaitGroup`：Redis PubSub 优雅关机、errgroup 并发初始化
- `context.Context`：PubSub 订阅生命周期管理、请求超时控制
- `channel`：访客数据异步批处理队列
- `errgroup`：19 步初始化中独立模块并行初始化

### Q43: GORM 的 SELECT FOR UPDATE 在什么场景下使用？有什么风险？

**答**：在积分系统的 `CreditService.Do()` 中使用。场景：并发积分变更时防止余额不一致（两个请求同时读到旧余额，各自加减后覆盖写入）。

风险：
1. **死锁**：如果多个事务以不同顺序锁定多行。项目中只锁单用户行，不存在此问题
2. **性能**：行锁会阻塞其他事务。但积分变更频率远低于商品查询，瓶颈不在这里
3. **锁等待超时**：高并发下可能排队。可以通过 `innodb_lock_wait_timeout` 配置，或改用分布式锁

### Q44: decimal 和 float64 在实际使用中的性能差距有多大？

**答**：decimal 运算比 float64 慢约 10-50 倍（因为是大整数运算）。但在交易结算场景中：
1. 单次请求只计算几十个商品行的金额，总计算量很小（微秒级）
2. 金额精度错误的代价远大于性能损失（一分钱的差异可能导致对账失败、用户投诉）
3. 只在关键路径（calc 管道）使用 decimal，非金融字段仍用 float64

### Q45: 你在项目中踩过的最印象深刻的坑是什么？

**建议回答方向**（选一个你真正经历过的）：

**PayPal capture 兜底问题**：PayPal Express 支付存在一种 edge case——用户完成支付后，PayPal 的 Webhook 延迟到达，前端已经跳转到感谢页但后端还没有 capture 成功。解决方案：感谢页加载时主动查询 PayPal 交易状态，如果 capture 未完成则同步触发 capture，作为 Webhook 的兜底机制。

**游客购物车串单**：两个游客在同一台公用设备上先后加购商品，由于 visitorId 绑定在 Cookie 中，切换用户时未清除 Cookie 导致购物车数据串联。修复：登录后只归户当前 session 对应的 visitorId 数据，并清除旧绑定关系。

**GORM Sharding 空指针**：官方 `gorm.io/sharding` 插件在 AutoMigrate 时触发 Schema 注册，对 `store_id = 0` 的全局表（如配置表）产生空指针。解决：自定义 Sharding 插件，增加全局表白名单跳过逻辑。

---

## 十七、系统设计思维题

### Q46: 如果让你设计一个电商 SaaS 的多租户方案，你会怎么做？

**答**：根据 Shoply 的实践，推荐**逻辑隔离 + 选择性物理隔离**：

**基础方案（逻辑隔离）**：
- 所有租户共享数据库实例，通过 `store_id` 字段隔离
- GORM 中间件自动注入 `WHERE store_id = ?`，业务代码无感知
- 优点：运维简单、成本低、schema 变更一次搞定

**高流量表优化（Sharding）**：
- 对统计表、访客表等大数据量表按 `store_id` 分片
- 自定义 GORM Sharding 插件，全局表自动跳过

**大客户方案（物理隔离）**：
- Enterprise 套餐客户可以独享数据库实例
- 通过 `store_id → db_connection` 映射实现动态切换
- SaaS 配置中心管理连接池分配

### Q47: 如果系统的 QPS 增长 10 倍，你会从哪些角度优化？

**答**：
1. **缓存层**：热点商品/配置数据 Redis 缓存 → 本地内存缓存（减少 Redis 网络开销）
2. **数据库**：读写分离（主写从读）、Sharding 扩展到更多表
3. **计算层**：Checkout 计算结果缓存（同一购物车内容不变则复用计算结果）
4. **异步化**：更多非关键操作下沉到消息队列（日志写入、统计更新）
5. **服务拆分**：将 go-fast（框架）和 go-shoply（业务）进一步拆分为独立进程，按模块独立扩容
6. **CDN + 静态化**：主题模板编译结果缓存到 CDN，减少 SSR 计算压力

### Q48: 支付系统最重要的设计原则是什么？

**答**：**幂等性 + 最终一致性 + 完整审计**。

1. **幂等**：同一笔 Checkout ID 只能支付一次，Webhook 重复通知不会重复扣款
2. **最终一致性**：支付结果以支付网关为准，本地状态通过 Webhook 回调 + 主动查询双保险对齐
3. **审计**：PaymentTrade 记录每一笔交易尝试，OrderLog 记录状态流转，任何金额变动可追溯
4. **快照机制**：Checkout 创建时冻结商品价格/地址/优惠信息，支付过程中不受后台改价影响
5. **兜底机制**：Express 快捷支付的 capture 兜底、Webhook 超时主动查询

---

## 十八、行为面试题（STAR 法）

### Q49: 描述一次你独立解决复杂技术问题的经历

**建议用 UUFind 项目**：

- **Situation**：UUFind 平台需要聚合 1688/淘宝多个渠道的商品数据，各平台 ID 体系和数据结构不同，且需要实时解析外部 URL 获取商品信息
- **Task**：我独立负责设计整个平台的数据模型和后端业务逻辑
- **Action**：设计了 UufindProduct 统一商品标识模型，通过 AgentLink 关联各渠道原始商品；构建了 ExternalGoodsService 实现 URL 实时解析落库，原站优先查询策略确保数据最新；引入请求级汇率缓存优化性能
- **Result**：平台上线后稳定运行，210+ commits 覆盖全部后端模块，商品列表接口响应时间显著下降

### Q50: 你如何与团队成员协作？

**答**：以 Shoply 项目为例，团队中架构师（coller）负责框架整体设计和基础设施搭建，我负责在框架基础上实现具体的业务模块（RPC 服务治理、支付链路、结算引擎等）。协作方式：
1. 框架层提供清晰的接口约定（Event/Listener、RPC 服务注册）
2. 业务层通过注册机制扩展，不修改框架核心代码
3. PHP 插件层通过 RPC 调用 Go 层能力
4. 前端（manay 等）通过 API 文档对接

这种分层协作模式让每个人专注自己的领域，接口清晰、职责明确。
