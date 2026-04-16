window.INTERVIEW_DATA = [
  {
    "cat": "Go 语言核心",
    "icon": "🔷",
    "color": "#6c8cff",
    "items": [
      {
        "q": "Goroutine 的调度模型 GMP 是什么？G、M、P 各代表什么？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>核心概念</h4>\n<ul>\n<li><b>G (Goroutine)</b>：用户态轻量级线程，初始栈 2KB（可动态增长到 1GB），包含执行栈、状态、任务函数等信息</li>\n<li><b>M (Machine)</b>：操作系统线程，由 OS 管理调度，Go 运行时最多创建 10000 个 M</li>\n<li><b>P (Processor)</b>：逻辑处理器，数量默认等于 <code>GOMAXPROCS</code>（通常为 CPU 核心数），持有本地运行队列（最多 256 个 G）</li>\n</ul>\n<h4>调度流程</h4>\n<ul>\n<li>每个 P 维护一个本地队列，新创建的 G 优先放入当前 P 的本地队列</li>\n<li>M 必须绑定一个 P 才能执行 G，M 从绑定的 P 的本地队列取 G 执行</li>\n<li>本地队列为空时，M 会尝试从全局队列或其他 P 的队列<b>窃取 (work stealing)</b> G</li>\n<li>当 G 发生系统调用阻塞时，M 会与 P 解绑，P 转移给空闲 M 或新建 M 继续执行其他 G</li>\n</ul>\n<div class=\"key-point\">面试加分：提到 work stealing 机制、hand off 机制（阻塞时 P 与 M 解绑）、抢占式调度（Go 1.14 基于信号的异步抢占）</div>",
        "id": "q-q1rk0k"
      },
      {
        "q": "Go 中 Channel 的底层结构是什么？有缓冲和无缓冲 Channel 的区别？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>底层结构 (runtime.hchan)</h4>\n<pre><code>type hchan struct {\n    qcount   uint      // 当前队列中的元素数量\n    dataqsiz uint      // 环形缓冲区大小（即 cap）\n    buf      unsafe.Pointer // 环形缓冲区指针\n    elemsize uint16    // 元素大小\n    closed   uint32    // 是否关闭\n    sendx    uint      // 发送索引\n    recvx    uint      // 接收索引\n    recvq    waitq     // 等待接收的 goroutine 队列\n    sendq    waitq     // 等待发送的 goroutine 队列\n    lock     mutex     // 互斥锁\n}</code></pre>\n<h4>无缓冲 vs 有缓冲</h4>\n<ul>\n<li><b>无缓冲</b> (<code>make(chan T)</code>)：发送和接收必须同时就绪，否则阻塞。本质是同步通信</li>\n<li><b>有缓冲</b> (<code>make(chan T, n)</code>)：缓冲区未满时发送不阻塞，缓冲区为空时接收阻塞。本质是异步通信</li>\n</ul>\n<h4>关键行为</h4>\n<ul>\n<li>向 nil channel 发送/接收会永久阻塞</li>\n<li>向已关闭的 channel 发送会 panic</li>\n<li>从已关闭的 channel 接收会返回零值（可通过 <code>v, ok := <-ch</code> 判断）</li>\n</ul>",
        "id": "q-1uwipet"
      },
      {
        "q": "Go 的 interface 底层是如何实现的？空接口和非空接口有什么区别？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>两种底层结构</h4>\n<p><b>空接口</b> <code>interface{}</code> 对应 <code>runtime.eface</code>：</p>\n<pre><code>type eface struct {\n    _type *_type         // 指向类型元数据\n    data  unsafe.Pointer // 指向实际数据\n}</code></pre>\n<p><b>非空接口</b>对应 <code>runtime.iface</code>：</p>\n<pre><code>type iface struct {\n    tab  *itab           // 类型信息 + 方法表\n    data unsafe.Pointer  // 指向实际数据\n}</code></pre>\n<h4>itab 结构</h4>\n<pre><code>type itab struct {\n    inter *interfacetype // 接口类型\n    _type *_type         // 实际类型\n    hash  uint32         // 类型哈希，用于快速判断\n    fun   [1]uintptr     // 方法表（变长数组）\n}</code></pre>\n<h4>关键点</h4>\n<ul>\n<li>itab 会被缓存到全局的 <code>itabTable</code> 哈希表中，同一对 (接口类型, 实际类型) 只计算一次</li>\n<li>接口赋值时，如果值类型小于等于指针大小，直接存在 data 字段；否则堆上分配后存指针</li>\n<li>类型断言 <code>v.(T)</code> 的本质是比较 itab 中的 <code>_type</code> 是否匹配</li>\n</ul>\n<div class=\"key-point\">面试陷阱：<code>var p *int = nil; var i interface{} = p</code> 此时 <code>i != nil</code>，因为 iface 的 tab 不为 nil（存了 *int 的类型信息）</div>",
        "id": "q-1v8drm9"
      },
      {
        "q": "Go 的 reflect 包的核心原理？你在 go-cache 中如何用 reflect 实现 Redis Hash 与 Struct 的自动映射？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>reflect 核心</h4>\n<ul>\n<li><code>reflect.TypeOf(x)</code> → 返回 <code>reflect.Type</code>，描述类型信息（字段名、tag、方法等）</li>\n<li><code>reflect.ValueOf(x)</code> → 返回 <code>reflect.Value</code>，持有值的可操作副本</li>\n<li>三大定律：(1) 接口值 → 反射对象 (2) 反射对象 → 接口值 (3) 要修改反射对象，值必须可设置（Elem()）</li>\n</ul>\n<h4>go-cache 中的实现思路</h4>\n<pre><code>// SetValue: Go Struct → Redis Hash\nfunc SetValue(key string, obj interface{}) {\n    v := reflect.ValueOf(obj)\n    t := v.Type()\n    fields := make(map[string]interface{})\n    for i := 0; i < t.NumField(); i++ {\n        field := t.Field(i)\n        tag := field.Tag.Get(\"redis\") // 读取 redis tag\n        if tag == \"\" || tag == \"-\" { continue }\n        fields[tag] = v.Field(i).Interface()\n    }\n    // redis.HSet(key, fields)\n}\n\n// ScanValue: Redis Hash → Go Struct\nfunc ScanValue(key string, dest interface{}) {\n    v := reflect.ValueOf(dest).Elem() // 必须传指针\n    t := v.Type()\n    data := redis.HGetAll(key)\n    for i := 0; i < t.NumField(); i++ {\n        tag := t.Field(i).Tag.Get(\"redis\")\n        if val, ok := data[tag]; ok {\n            // 根据 field.Kind() 做类型转换后 Set\n            v.Field(i).Set(convertedValue)\n        }\n    }\n}</code></pre>\n<div class=\"project-link\">简历关联：go-cache 基于适配器模式实现统一缓存接口，利用 reflect 库实现 Redis Hash 与 Go Struct 自动映射</div>\n<div class=\"key-point\">注意性能：reflect 操作比直接访问慢约 50-100 倍。生产中可通过缓存 TypeOf 结果、代码生成（go generate）等方式优化</div>",
        "id": "q-1dumk95"
      },
      {
        "q": "Go 的 defer 执行顺序是什么？defer 与 panic/recover 的配合机制？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>执行规则</h4>\n<ul>\n<li><b>LIFO（后进先出）</b>：多个 defer 按栈顺序逆序执行</li>\n<li>defer 的参数在 <b>注册时求值</b>，而非执行时</li>\n<li>defer 在 <code>return</code> 之后、函数真正返回之前执行（可修改命名返回值）</li>\n</ul>\n<h4>panic/recover 机制</h4>\n<pre><code>func safeCall() (err error) {\n    defer func() {\n        if r := recover(); r != nil {\n            err = fmt.Errorf(\"panic recovered: %v\", r)\n            // 记录堆栈: debug.Stack()\n        }\n    }()\n    riskyOperation()\n    return nil\n}</code></pre>\n<ul>\n<li><code>panic</code> 触发后，当前函数停止执行，按 LIFO 执行已注册的 defer</li>\n<li><code>recover</code> 只能在 defer 函数中生效，捕获 panic 值并恢复正常流程</li>\n<li>recover 后函数返回零值（除非使用命名返回值在 defer 中赋值）</li>\n</ul>\n<div class=\"key-point\">经典陷阱：<code>defer f.Close()</code> 如果 f 为 nil 会 panic。应先判断 err 再 defer</div>",
        "id": "q-yws6gn"
      },
      {
        "q": "Go 的 GC 机制是怎样的？三色标记法的流程？STW 何时发生？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>三色标记法</h4>\n<ul>\n<li><b>白色</b>：未被访问的对象（GC 结束后被回收）</li>\n<li><b>灰色</b>：已被访问但其引用的对象尚未全部扫描</li>\n<li><b>黑色</b>：已被访问且其引用的对象全部扫描完毕</li>\n</ul>\n<h4>流程</h4>\n<ol>\n<li><b>Mark Setup (STW)</b>：开启写屏障，极短暂（通常 < 100μs）</li>\n<li><b>Marking（并发）</b>：从根对象出发，遍历引用图。GC goroutine 与用户 goroutine 并发执行</li>\n<li><b>Mark Termination (STW)</b>：关闭写屏障，完成最终标记，极短暂</li>\n<li><b>Sweeping（并发）</b>：回收白色对象的内存</li>\n</ol>\n<h4>写屏障 (Write Barrier)</h4>\n<p>Go 1.8+ 使用<b>混合写屏障</b>（插入 + 删除），确保并发标记阶段不会遗漏存活对象，大幅减少 STW 时间</p>\n<div class=\"key-point\">GC 触发条件：(1) 堆内存增长到上次 GC 后的 2 倍（GOGC=100）(2) 2 分钟未触发 GC (3) 手动 runtime.GC()</div>",
        "id": "q-11rk16a"
      },
      {
        "q": "Go 中 sync.Map 和普通 map+mutex 的区别？各自适用场景？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>普通 map + sync.Mutex / sync.RWMutex</h4>\n<ul>\n<li>读写都需要加锁，RWMutex 允许并发读</li>\n<li>适合读写比例均衡、需要遍历、需要精确控制锁粒度的场景</li>\n</ul>\n<h4>sync.Map</h4>\n<ul>\n<li>内部维护两个 map：<code>read</code>（只读，无锁访问）和 <code>dirty</code>（写入时加锁）</li>\n<li>读操作优先查 read map（无锁 CAS），miss 时穿透到 dirty</li>\n<li>当 miss 次数达到 dirty 长度时，dirty 提升为新的 read</li>\n</ul>\n<h4>适用场景</h4>\n<ul>\n<li><b>sync.Map 适合</b>：读多写少、key 集合相对稳定（如缓存、配置）</li>\n<li><b>map+mutex 适合</b>：写多读少、需要遍历或批量操作、需要泛型类型安全</li>\n</ul>\n<div class=\"project-link\">简历关联：你的国际化系统中「并发安全的 Localizer Map」很可能用到了 sync.Map 或 RWMutex + map 的方案</div>\n<div class=\"key-point\">面试追问：如果被问到 sync.Map 的 dirty 提升机制，能说出 miss 次数达到 dirty 长度时触发提升，就是加分项。</div>",
        "id": "q-1cw0vwp"
      },
      {
        "q": "errgroup 的实现原理？你的框架中如何用它管理 18 步初始化链的并发与错误传播？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>errgroup 原理</h4>\n<pre><code>type Group struct {\n    cancel  func()          // 关联 context 的 cancel\n    wg      sync.WaitGroup\n    errOnce sync.Once       // 只记录第一个错误\n    err     error\n}\n// Go() 启动 goroutine, Wait() 等待所有完成并返回第一个错误</code></pre>\n<h4>框架初始化链设计</h4>\n<pre><code>func (app *App) Bootstrap() error {\n    // 阶段一：串行有序初始化（有依赖关系）\n    steps := []func() error{\n        app.initConfig,    // 1. conf\n        app.initDB,        // 2. db（依赖 conf）\n        app.initRedis,     // 3. redis（依赖 conf）\n        app.initCache,     // 4. cache（依赖 redis）\n    }\n    for _, step := range steps {\n        if err := step(); err != nil { return err }\n    }\n\n    // 阶段二：并行初始化（无依赖关系）\n    g, ctx := errgroup.WithContext(app.ctx)\n    g.Go(func() error { return app.initRPC(ctx) })\n    g.Go(func() error { return app.initJob(ctx) })\n    g.Go(func() error { return app.initWorker(ctx) })\n    g.Go(func() error { return app.initListener(ctx) })\n    return g.Wait() // 任一失败，ctx 取消，其他收到信号\n}</code></pre>\n<h4>优雅关机配合</h4>\n<pre><code>// 10 秒超时保护\nctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)\ndefer cancel()\n// 并行关闭各组件\ng, ctx := errgroup.WithContext(ctx)\ng.Go(func() error { return app.server.ShutdownWithContext(ctx) })\ng.Go(func() error { return app.db.Close() })\ng.Go(func() error { return app.rdb.Close() })\nreturn g.Wait()</code></pre>\n<div class=\"project-link\">简历关联：go-fast 框架 18 步有序初始化链 + errgroup 并发管理 + 10 秒超时优雅关机</div>\n<div class=\"key-point\">面试时能画出「串行有依赖 → 并行无依赖」的两阶段图，再加上 errgroup 的 ctx cancel 传播，就是完整回答。</div>",
        "id": "q-7hw7o6"
      },
      {
        "q": "Go Plugin (.so) 热加载的原理、限制和你的实践？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>原理</h4>\n<pre><code>// 编译插件\n// go build -buildmode=plugin -o myplugin.so myplugin.go\n\np, _ := plugin.Open(\"myplugin.so\")\nsym, _ := p.Lookup(\"NewEngine\")  // 查找导出符号\nfactory := sym.(func() TemplateEngine)\nengine := factory()</code></pre>\n<h4>核心限制</h4>\n<ul>\n<li>仅支持 Linux 和 macOS，不支持 Windows</li>\n<li>主程序和插件必须使用<b>完全相同的 Go 版本</b>编译</li>\n<li>共享依赖的包路径和版本必须一致</li>\n<li>插件一旦加载<b>无法卸载</b>（内存中永驻）</li>\n<li>不支持泛型导出（Go 1.18+）</li>\n</ul>\n<h4>你的实践方案</h4>\n<ul>\n<li>定义统一接口（如 <code>TemplateEngine</code>、<code>ORMExtension</code>、<code>CaptchaProvider</code>）</li>\n<li>插件实现接口并导出工厂函数</li>\n<li>主进程通过 <code>plugin.Open</code> + <code>Lookup</code> + 类型断言加载</li>\n<li>适用场景：模板引擎切换、ORM 扩展、验证码提供商动态替换</li>\n</ul>\n<div class=\"key-point\">面试追问：如果面试官问 \"为什么不用 RPC 微服务替代？\"——Plugin 是进程内调用零延迟，适合同进程功能扩展；微服务适合独立部署的业务拆分</div>",
        "id": "q-1f99wc9"
      },
      {
        "q": "Go 里的 WaitGroup 是怎么工作的？常见误用有哪些？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>它本质上做什么</h4>\n<p><code>sync.WaitGroup</code> 用来等待一组 goroutine 全部结束。内部维护一个计数器：每启动一个任务就 <code>Add(1)</code>，任务结束时 <code>Done()</code>，主协程调用 <code>Wait()</code> 阻塞直到计数归零。</p>\n<pre><code>var wg sync.WaitGroup\nfor _, job := range jobs {\n    wg.Add(1)\n    go func(j Job) {\n        defer wg.Done()\n        process(j)\n    }(job)\n}\nwg.Wait()</code></pre>\n<h4>常见误用</h4>\n<ul>\n<li><b><code>Add</code> 放到 goroutine 里</b>：主协程可能先执行到 <code>Wait()</code>，导致提前返回</li>\n<li><b>少调或漏调 <code>Done()</code></b>：计数永远不归零，程序卡死</li>\n<li><b>多调 <code>Done()</code></b>：计数变负数会直接 panic</li>\n<li><b>复制 WaitGroup</b>：官方明确不允许 copy，多个副本会让状态错乱</li>\n<li><b>把它当取消机制</b>：WaitGroup 只能等结束，不能通知 goroutine 提前退出；要配合 <code>context</code> 或 channel</li>\n</ul>\n<div class=\"key-point\">面试里最好补一句：WaitGroup 只解决“等待完成”，不解决“错误收集”和“取消传播”；这也是很多场景下要上 <code>errgroup</code> 的原因。</div>",
        "id": "q-16gf8u3"
      },
      {
        "q": "select 同时多个 case 就绪时会怎么选？for-select 循环有哪些坑？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>多个 case 同时满足会怎样</h4>\n<p>Go 的 <code>select</code> 会在所有已就绪的 case 中做<b>伪随机</b>选择，不保证顺序，也不是永远选第一个。</p>\n<pre><code>select {\ncase v := <-ch1:\n    handle1(v)\ncase v := <-ch2:\n    handle2(v)\ndefault:\n    idle()\n}</code></pre>\n<h4>for-select 常见坑</h4>\n<ul>\n<li><b>default 导致忙等</b>：如果循环里有 <code>default</code>，又没有 sleep / 阻塞操作，就会空转占满 CPU</li>\n<li><b>读到关闭 channel 后不退出</b>：必须用 <code>v, ok := <-ch</code> 判断，否则可能一直消费零值</li>\n<li><b>没有退出条件</b>：只写 <code>for { select { ... } }</code> 但不监听 <code>ctx.Done()</code>，goroutine 很容易泄漏</li>\n<li><b>把 select 当公平调度器</b>：它只是在已就绪 case 中随机选，不保证强公平</li>\n</ul>\n<h4>更稳妥的写法</h4>\n<pre><code>for {\n    select {\n    case msg, ok := <-queue:\n        if !ok {\n            return\n        }\n        handle(msg)\n    case <-ctx.Done():\n        return\n    }\n}</code></pre>\n<div class=\"key-point\">真实面试里如果被追问“select 会不会一直循环”，关键不是答“会/不会”，而是说清：有没有 <code>default</code>、有没有阻塞点、有没有退出条件。</div>",
        "id": "q-m0larr"
      },
      {
        "q": "sync.Map 里存的是引用类型时，为什么并发修改字段仍然可能不安全？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>一个常见误区</h4>\n<p><code>sync.Map</code> 只保证“Map 本身的读写操作”并发安全，比如 <code>Load</code>、<code>Store</code>、<code>Delete</code>。如果里面存的是指针、slice、map 这类引用类型，你把值取出来再改内部字段，已经绕过了 <code>sync.Map</code> 的保护范围。</p>\n<pre><code>type User struct {\n    Name  string\n    Score int\n}\n\nvar m sync.Map\nm.Store(\"u1\", &User{Name: \"A\", Score: 1})\n\n// 两个 goroutine 同时做这个操作，Score++ 仍然可能有竞态\nu, _ := m.Load(\"u1\")\nu.(*User).Score++</code></pre>\n<h4>为什么不安全</h4>\n<ul>\n<li><code>sync.Map</code> 只保护 key 到 value 的引用关系</li>\n<li>value 内部字段怎么改，它并不会自动加锁</li>\n<li>像 <code>Score++</code> 这种复合操作，本身就不是原子操作</li>\n</ul>\n<h4>怎么做更稳妥</h4>\n<ul>\n<li><b>值对象不可变</b>：修改时构造新副本，再用 <code>Store</code> 原子替换</li>\n<li><b>value 内部自己加锁</b>：例如结构体里放 <code>sync.Mutex</code></li>\n<li><b>简单字段用 atomic</b>：计数器、状态位可以用原子操作</li>\n<li><b>单 goroutine 拥有状态</b>：通过 channel 串行修改</li>\n</ul>\n<div class=\"key-point\">这题特别能区分层次：知道 <code>sync.Map</code> 只是起点，真正加分的是你能说清“Map 并发安全”不等于“值对象并发安全”。</div>",
        "id": "q-1arld6w"
      },
      {
        "q": "为什么 Go 里要用 goroutine，而不是线程？",
        "diff": "easy",
        "tags": [
          "scene"
        ],
        "a": "<h4>核心原因</h4>\n<ul>\n<li><b>更轻量</b>：goroutine 初始栈很小，创建和销毁成本低，适合海量并发</li>\n<li><b>调度更灵活</b>：goroutine 由 Go runtime 在用户态调度，切换成本通常比线程更低</li>\n<li><b>通信模型更友好</b>：Go 鼓励用 channel、context 和共享内存最小化的方式组织并发</li>\n</ul>\n<h4>和线程的区别</h4>\n<ul>\n<li>线程由 OS 直接调度，资源占用和上下文切换成本更高</li>\n<li>goroutine 不是替代线程“凭空执行”，而是复用底层线程，由 GMP 模型统一调度</li>\n<li>所以答案不是“线程没用”，而是 Go 用 goroutine 提供了更适合服务端并发的抽象层</li>\n</ul>\n<h4>怎么答得更像做过项目</h4>\n<p>可以补一句：真正的收益不只是“能开很多协程”，而是能把网络请求、批量任务、异步消费这些高并发场景写得更自然；但 goroutine 也不能无限开，否则会把内存和下游一起拖垮。</p>\n<div class=\"key-point\">这题常被答成“goroutine 比线程快”。更好的答法是：它更轻量、调度更灵活、工程抽象更适合高并发服务。</div>",
        "id": "q-1cuk3uh"
      },
      {
        "q": "Go 服务里的网络框架怎么选？原生 net/http、fasthttp、gnet 各自适合什么场景？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>先别把“网络框架”理解成谁 benchmark 更高</h4>\n<p>网络框架选型先看业务边界：你的协议形态、生态依赖、团队维护成本和观测能力，往往比单机 QPS 更重要。</p>\n<h4>三类常见选择</h4>\n<ul>\n<li><b><code>net/http</code></b>：Go 标准库，生态最完整，和中间件、监控、pprof、反向代理配合自然，适合绝大多数 HTTP API 和内部服务</li>\n<li><b><code>fasthttp</code></b>：更激进地减少分配和对象开销，适合对延迟非常敏感、接口模型相对简单的场景，但和标准库 <code>http.Handler</code> 生态不完全兼容</li>\n<li><b><code>gnet</code></b>：事件驱动模型，更贴近底层网络编程，适合自定义协议、长连接网关、代理层、接入层，不是拿来直接替代所有 Web 服务的</li>\n</ul>\n<h4>怎么做选型判断</h4>\n<ul>\n<li><b>普通业务 API</b>：优先 <code>net/http</code>，够稳、够通用、维护成本最低</li>\n<li><b>高吞吐 HTTP 网关</b>：如果确认瓶颈就在 HTTP 栈和对象分配，可以评估 <code>fasthttp</code></li>\n<li><b>连接型或自定义协议服务</b>：如长连接接入层、代理、IM 网关，才更值得看 <code>gnet</code> 一类事件驱动网络框架</li>\n</ul>\n<div class=\"key-point\">面试里高质量回答不是说某个网络框架“最快”，而是你能说明：协议形态、生态兼容、可观测性和团队维护成本，决定了框架选型。</div>",
        "id": "q-sut1qe"
      },
      {
        "q": "GMP 调度中，网络 I/O 阻塞、系统调用阻塞、锁竞争阻塞分别走什么路径？netpoller 和 hand off 各自怎么工作？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>三种阻塞，三条路径</h4>\n<p>这是 GMP 面试追问的深水区。很多人能说出 G/M/P 的概念，但一追到\"阻塞时调度器怎么处理\"就断了。核心区别在于：阻塞发生在用户态还是内核态，决定了 P 要不要解绑 M。</p>\n<h4>场景一：网络 I/O（conn.Read 等）</h4>\n<ul>\n<li>Go 把所有网络操作封装成<b>非阻塞模式</b>，底层走 <b>netpoller</b>（Linux 用 epoll，macOS 用 kqueue）</li>\n<li>G 发起读操作 → 数据未就绪 → G 被标记为等待，放入 netpoller 的等待队列</li>\n<li>G 与 M、P <b>解绑</b>，P 立即取下一个 G 继续执行</li>\n<li>当数据到达，netpoller 唤醒 G，放回某个 P 的本地队列</li>\n<li><b>结果</b>：没有系统调用阻塞，没有线程切换，最高效</li>\n</ul>\n<h4>场景二：阻塞系统调用（文件 I/O、CGO 等）</h4>\n<ul>\n<li>无法用非阻塞模式，G 会真正阻塞在内核态</li>\n<li>当前 M（设为 M1）带着 G 进入内核等待，G 状态变为 <code>_Gsyscall</code></li>\n<li>P 与 M1 <b>解绑</b>，P 去找另一个空闲 M（M2）；没有空闲 M 则新建一个</li>\n<li>P 绑定 M2 继续调度其他 G</li>\n<li>系统调用完成后，G 被唤醒，尝试重新获取一个 P：有空闲 P 则绑定继续；没有则放入全局队列</li>\n<li>这就是 <b>hand off 机制</b>：P 不等慢系统调用，立即转移给其他 M</li>\n</ul>\n<h4>场景三：用户态阻塞（mutex.Lock 竞争失败、channel 阻塞）</h4>\n<ul>\n<li>不涉及内核，G 被挂到锁或 channel 的等待队列，状态变为 <code>_Gwaiting</code></li>\n<li>G 与 M、P 解绑，P 取下一个 G 执行</li>\n<li>当锁释放或 channel 可读写，G 被唤醒，放回 P 的本地队列</li>\n</ul>\n<div class=\"key-point\">面试话术：网络 I/O 走 netpoller 不阻塞线程；系统调用走 hand off，P 立即换 M；mutex/channel 是用户态挂起。三种场景 P 都不会闲着，这就是 Go 高并发的底层逻辑。</div>",
        "id": "q-wfdrom"
      },
      {
        "q": "Go 的逃逸分析是什么？哪些情况会导致变量从栈逃逸到堆？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>为什么要关心逃逸分析</h4>\n<p>Go 编译器会自动决定变量分配在栈还是堆。栈分配随函数返回自动释放，不需要 GC；堆分配需要 GC 回收，开销更大。逃逸分析就是编译器判断\"这个变量的生命周期是否超出当前函数\"的过程。</p>\n<h4>常见逃逸场景</h4>\n<ul>\n<li><b>返回局部变量的指针</b>：<code>func f() *int { x := 1; return &x }</code>，x 必须逃逸到堆</li>\n<li><b>闭包引用外部变量</b>：闭包捕获的变量生命周期被延长</li>\n<li><b>interface{} 参数</b>：<code>fmt.Println(x)</code> 中 x 会被装箱逃逸</li>\n<li><b>动态大小的 slice/map</b>：<code>make([]int, n)</code>，n 是变量时编译期无法确定大小</li>\n<li><b>大对象</b>：超出栈帧大小限制的对象</li>\n<li><b>发送指针到 channel</b>：编译器无法确定接收方的生命周期</li>\n</ul>\n<h4>怎么检查</h4>\n<pre><code>go build -gcflags=\"-m\" main.go\n# 输出哪些变量 \"escapes to heap\"</code></pre>\n<h4>工程意义</h4>\n<ul>\n<li>减少逃逸 → 减少堆分配 → 减少 GC 压力 → 降低延迟</li>\n<li>高频调用的函数里，尽量避免返回指针、减少 interface{} 传参、预分配 slice</li>\n<li>配合 <code>sync.Pool</code> 复用对象，进一步降低分配开销</li>\n</ul>\n<div class=\"key-point\">面试加分：能说出\"用 <code>-gcflags='-m'</code> 检查逃逸\"并举一个实际优化案例（如把返回指针改为值返回），就比只背概念强很多。</div>",
        "id": "q-u7zuhe"
      },
      {
        "q": "Goroutine 泄漏的常见场景有哪些？怎么排查和预防？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>什么是 Goroutine 泄漏</h4>\n<p>goroutine 启动后因为某种原因永远无法退出，持续占用内存和调度资源。累积下去会导致内存持续增长，最终 OOM。</p>\n<h4>五种典型泄漏场景</h4>\n<ul>\n<li><b>无缓冲 channel 读写未配对</b>：发送端没有接收者，或接收端没有发送者，goroutine 永久阻塞</li>\n<li><b>锁未释放</b>：<code>mu.Lock()</code> 后没有 <code>Unlock()</code>（panic 导致跳过 defer），等待该锁的所有 goroutine 永久阻塞</li>\n<li><b>WaitGroup 计数错误</b>：<code>Add(1)</code> 但 <code>Done()</code> 少调一次，<code>Wait()</code> 永远不返回</li>\n<li><b>网络 I/O 无超时</b>：<code>conn.Read</code> 对方不响应，goroutine 永久阻塞在 netpoller</li>\n<li><b>for-select 无退出条件</b>：循环里没有监听 <code>ctx.Done()</code>，goroutine 无法被通知停止</li>\n</ul>\n<h4>排查方法</h4>\n<ul>\n<li><code>runtime.NumGoroutine()</code> 暴露为监控指标，观察是否持续增长</li>\n<li><code>pprof goroutine</code> profile：<code>go tool pprof http://localhost:6060/debug/pprof/goroutine</code></li>\n<li>查看阻塞位置的栈信息，定位到具体代码行</li>\n</ul>\n<h4>预防套路</h4>\n<ul>\n<li>所有阻塞操作加超时：<code>context.WithTimeout</code>、<code>time.After</code></li>\n<li>用 <code>defer</code> 保证 Unlock / Done / Close</li>\n<li>for-select 循环里必须有 <code>case <-ctx.Done(): return</code></li>\n<li>启动 goroutine 时想清楚\"它什么时候退出\"</li>\n</ul>\n<div class=\"key-point\">面试时最好补一句：线上监控 goroutine 数量是发现泄漏的第一道防线，pprof 是定位具体代码的工具。</div>",
        "id": "q-ha99tv"
      },
      {
        "q": "从 Java 转 Go 的动机是什么？两种语言在后端开发中各自的优势和局限？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>为什么要转</h4>\n<p>这个问题面试官一定会问，因为你的简历有明确的 Java→Go 迁移轨迹。回答要诚恳且有技术判断，不能只说\"Go 更火\"。</p>\n<h4>Go 相比 Java 的优势</h4>\n<ul>\n<li><b>并发模型更轻量</b>：goroutine 初始栈 2KB，Java 线程默认 1MB。同样的机器 Go 能轻松跑几十万 goroutine，Java 线程池通常几百到几千</li>\n<li><b>编译部署简单</b>：Go 编译成单一静态二进制，不需要 JVM，Docker 镜像可以做到几十 MB；Java 需要打包 JAR + JVM 环境，镜像动辄几百 MB</li>\n<li><b>启动速度快</b>：Go 服务毫秒级启动，适合 K8s 弹性扩缩容；Java 有 JVM 预热、类加载开销，冷启动慢</li>\n<li><b>内存占用低</b>：没有 JVM 的堆外开销，适合多实例微服务部署</li>\n<li><b>语法简洁</b>：没有继承、没有泛型滥用（Go 1.18 后有限泛型），代码风格统一（gofmt 强制格式化）</li>\n</ul>\n<h4>Java 相比 Go 的优势</h4>\n<ul>\n<li><b>生态更成熟</b>：Spring 全家桶、Hibernate、各种中间件客户端，企业级方案经过数十年验证</li>\n<li><b>OOP 表达力更强</b>：继承、接口默认方法、注解处理器、AOP 切面，适合大型复杂业务建模</li>\n<li><b>JVM 调优空间大</b>：G1/ZGC 等 GC 算法可精细调优，Go 的 GC 调优手段相对有限</li>\n<li><b>IDE 支持更好</b>：重构、代码导航、调试体验 Java 生态领先</li>\n<li><b>泛型和类型系统更完整</b>：Java 泛型虽然有擦除问题，但表达力远超 Go 的有限泛型</li>\n</ul>\n<h4>你的实际转型经历怎么讲</h4>\n<p>结合简历：在佑安做仓储系统用 Spring Boot + MyBatis-Plus + Activiti7，后来转到快勤做跨境电商 SaaS 用 Go + Fiber + GORM。转型动机：跨境电商 SaaS 需要高并发、多租户、轻量部署，Go 的并发模型和部署优势更匹配这种场景。</p>\n<div class=\"project-link\">简历关联：佑安土木（Java/Spring Boot）→ 快勤技术（Go/Fiber），有从 Java 到 Go 的技术栈迁移实践</div>\n<div class=\"key-point\">不要贬低 Java 来抬高 Go，面试官可能就是 Java 背景。正确的表达是\"根据业务场景选择更合适的工具\"。</div>",
        "id": "q-3jsw8b"
      },
      {
        "q": "Go 和 Java 在并发模型上有什么本质区别？goroutine vs 线程池，channel vs synchronized？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>并发原语对比</h4>\n<table>\n<tr><th>维度</th><th>Java</th><th>Go</th></tr>\n<tr><td>基本并发单元</td><td>Thread（OS 线程），或 Virtual Thread（Java 21+）</td><td>goroutine（用户态轻量级线程）</td></tr>\n<tr><td>创建开销</td><td>线程 ~1MB 栈，创建涉及内核态</td><td>goroutine ~2KB 栈，纯用户态创建</td></tr>\n<tr><td>并发数量级</td><td>线程池通常几百~几千</td><td>goroutine 轻松几十万</td></tr>\n<tr><td>通信方式</td><td>共享内存 + 锁（synchronized/ReentrantLock）</td><td>优先 channel 通信，也支持 sync.Mutex</td></tr>\n<tr><td>并发安全集合</td><td>ConcurrentHashMap / CopyOnWriteArrayList</td><td>sync.Map / 普通 map + mutex</td></tr>\n<tr><td>异步编程</td><td>CompletableFuture / Reactor</td><td>goroutine + channel 天然异步</td></tr>\n</table>\n<h4>核心理念差异</h4>\n<ul>\n<li><b>Java</b>：共享内存 + 锁保护 → 需要小心死锁、竞态条件，代码复杂度随并发量上升</li>\n<li><b>Go</b>：\"Don't communicate by sharing memory, share memory by communicating\" → channel 传递数据所有权，减少锁的使用</li>\n</ul>\n<h4>Java 21 Virtual Thread 的影响</h4>\n<p>Java 21 引入虚拟线程，概念上接近 goroutine——轻量、大量创建、用户态调度。但 Go 的 channel + select 多路复用在语言层面集成更深，而 Java 虚拟线程仍然依赖传统的 synchronized/Lock 做同步。</p>\n<h4>实际项目中的体感</h4>\n<p>在 Java 项目中做并发通常靠线程池 + Future + 加锁；在 Go 项目中同样的功能用 goroutine + channel + errgroup 更简洁直观。比如框架的 18 步初始化链，用 errgroup 几行代码就能实现\"串行有依赖 + 并行无依赖\"的两阶段模型。</p>\n<div class=\"key-point\">如果被追问\"Java Virtual Thread 出来后 Go 的并发优势还在吗\"——答：虚拟线程缩小了差距，但 Go 的 channel/select 语言级集成、GMP 调度成熟度、以及整体部署轻量性仍是优势。</div>",
        "id": "q-dbi34y"
      },
      {
        "q": "Go 和 Java 的错误处理有什么区别？为什么 Go 选择 error 返回值而不是 try-catch？",
        "diff": "easy",
        "tags": [
          "scene"
        ],
        "a": "<h4>两种错误处理模型</h4>\n<ul>\n<li><b>Java</b>：异常机制（try-catch-finally），分 Checked Exception 和 Unchecked Exception。错误沿调用栈向上抛出，可以在任意层捕获</li>\n<li><b>Go</b>：函数返回值（<code>value, error</code>），错误作为普通返回值显式处理。<code>panic/recover</code> 只用于真正不可恢复的异常</li>\n</ul>\n<h4>Go 为什么这样设计</h4>\n<ul>\n<li><b>显式优于隐式</b>：每个可能出错的调用点都要求你写 <code>if err != nil</code>，逼你思考这个错误该怎么处理</li>\n<li><b>避免异常滥用</b>：Java 中经常看到用异常做流程控制（如 NumberFormatException），性能差且语义不清</li>\n<li><b>更可预测的控制流</b>：函数签名就能看出会不会出错，不像 Java 可能在任何地方抛出 RuntimeException</li>\n</ul>\n<h4>Go 错误处理的痛点</h4>\n<ul>\n<li><code>if err != nil</code> 写得太多，代码啰嗦——这是社区最常见的抱怨</li>\n<li>缺少堆栈信息，需要 <code>fmt.Errorf(\"xxx: %w\", err)</code> 手动包装或用 <code>pkg/errors</code></li>\n<li>没有 finally 对应物，靠 <code>defer</code> 来做资源清理</li>\n</ul>\n<h4>Go 1.13+ 的改进</h4>\n<pre><code>// 错误包装\nreturn fmt.Errorf(\"query user failed: %w\", err)\n// 错误断言\nif errors.Is(err, sql.ErrNoRows) { ... }\n// 错误类型提取\nvar myErr *MyError\nif errors.As(err, &myErr) { ... }</code></pre>\n<div class=\"key-point\">面试时可以对比着说：Java 的异常更方便但容易被滥用，Go 的 error 更显式但写起来啰嗦。各有取舍，不是谁绝对更好。</div>",
        "id": "q-ueisf2"
      },
      {
        "q": "Go 和 Java 在内存管理和 GC 上有什么区别？对线上服务有什么影响？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>内存模型对比</h4>\n<table>\n<tr><th>维度</th><th>Java</th><th>Go</th></tr>\n<tr><td>内存区域</td><td>堆 + 栈 + 方法区 + 元空间，JVM 统一管理</td><td>堆 + 栈，编译器通过逃逸分析决定分配位置</td></tr>\n<tr><td>GC 算法</td><td>多种可选：G1（默认）、ZGC、Shenandoah</td><td>并发三色标记清除 + 混合写屏障</td></tr>\n<tr><td>GC 调优</td><td>丰富：堆大小、新生代比例、GC 线程数、停顿目标等几十个参数</td><td>简单：GOGC（控制堆增长比例）、GOMEMLIMIT（Go 1.19+）</td></tr>\n<tr><td>STW 停顿</td><td>G1 目标 <200ms，ZGC 目标 <1ms</td><td>通常 <1ms（Mark Setup + Mark Termination）</td></tr>\n<tr><td>逃逸分析</td><td>JIT 编译器做标量替换和栈上分配</td><td>编译期逃逸分析，<code>-gcflags=\"-m\"</code> 可查看</td></tr>\n</table>\n<h4>对线上服务的影响</h4>\n<ul>\n<li><b>Java</b>：需要预留 JVM 堆外内存，容器内存限制要设得比 -Xmx 大；GC 调优是性能优化的重要环节，调得好可以跑得很快，调不好容易 Full GC 导致停顿</li>\n<li><b>Go</b>：内存占用更可预测，GC 几乎不需要调（默认 GOGC=100 就够用）；但如果分配过多短命对象，GC 频率高，可以用 sync.Pool 缓解</li>\n</ul>\n<h4>从 Java 转 Go 的体感</h4>\n<p>Java 服务动辄几百 MB 内存起步（JVM 本身的开销），Go 服务几十 MB 就能跑。在多租户 SaaS 场景下，Go 的低内存占用意味着同一台机器能跑更多实例，基础设施成本更低。</p>\n<div class=\"key-point\">面试追问\"Go 的 GC 够用吗\"——答：对 99% 的后端服务足够了，STW 在亚毫秒级。只有少数极低延迟场景（如量化交易）才需要考虑更精细的 GC 控制，那种场景可能 Rust/C++ 更合适。</div>",
        "id": "q-5cwrb2"
      }
    ]
  },
  {
    "cat": "MySQL 数据库",
    "icon": "🗄️",
    "color": "#f59e0b",
    "items": [
      {
        "q": "InnoDB 的索引结构是什么？为什么用 B+ 树而不是 B 树或哈希？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>B+ 树特点</h4>\n<ul>\n<li>所有数据存储在<b>叶子节点</b>，非叶子节点只存索引键值</li>\n<li>叶子节点之间通过<b>双向链表</b>连接，天然支持范围查询</li>\n<li>树的高度通常 3-4 层，亿级数据也只需 3-4 次 IO</li>\n</ul>\n<h4>为什么不用 B 树</h4>\n<ul>\n<li>B 树的非叶子节点也存数据，导致每个节点能容纳的 key 更少，树更高，IO 次数更多</li>\n<li>B 树不支持高效的范围扫描（需要中序遍历回溯）</li>\n</ul>\n<h4>为什么不用 Hash</h4>\n<ul>\n<li>Hash 不支持范围查询（<code>WHERE age > 18</code>）</li>\n<li>不支持排序</li>\n<li>不支持最左前缀匹配</li>\n<li>存在哈希冲突</li>\n</ul>\n<h4>聚簇索引 vs 非聚簇索引</h4>\n<ul>\n<li><b>聚簇索引</b>（主键）：叶子节点存储完整行数据</li>\n<li><b>非聚簇索引</b>（二级索引）：叶子节点存储主键值，需要<b>回表</b>查询完整数据</li>\n</ul>",
        "id": "q-wxlgi4"
      },
      {
        "q": "你简历中提到「新增数据库索引优化查询性能」，能具体说说索引优化的方法论吗？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>索引优化方法论</h4>\n<ol>\n<li><b>EXPLAIN 分析</b>：看 type（ALL→index→range→ref→const）、rows、Extra（Using filesort/Using temporary 需优化）</li>\n<li><b>覆盖索引</b>：让查询所需字段全在索引中，避免回表。如 <code>INDEX(store_id, status, created_at)</code> 覆盖 <code>SELECT status, created_at WHERE store_id = ?</code></li>\n<li><b>最左前缀</b>：联合索引 <code>(a, b, c)</code> 能命中 <code>a</code>、<code>a,b</code>、<code>a,b,c</code> 的查询</li>\n<li><b>索引下推 (ICP)</b>：MySQL 5.6+ 在存储引擎层过滤索引条件，减少回表次数</li>\n</ol>\n<h4>UUFind 商品列表的实际优化</h4>\n<pre><code>-- 优化前：全表扫描\nSELECT * FROM products WHERE store_id = 123 ORDER BY created_at DESC;\n\n-- 优化后：联合索引\nALTER TABLE products ADD INDEX idx_store_created (store_id, created_at DESC);\n\n-- 统计查询拆分：避免 COUNT 与业务查询混合\n-- 原：SELECT *, (SELECT COUNT(*) ...) FROM products ...\n-- 改：独立统计查询 + 请求级汇率缓存避免重复计算</code></pre>\n<div class=\"project-link\">简历关联：UUFind 平台 — 新增数据库索引、重构统计查询逻辑、引入请求级汇率缓存，显著降低高频接口响应时间</div>\n<div class=\"key-point\">高分回答不是背索引类型，而是说清你在哪张表、哪个查询上加了什么索引、查询时间从多少降到多少。</div>",
        "id": "q-sqoeth"
      },
      {
        "q": "MySQL 事务的 ACID 如何保证？redo log 和 undo log 分别起什么作用？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>ACID 保证机制</h4>\n<ul>\n<li><b>A (原子性)</b>：<code>undo log</code> — 记录反向操作，回滚时逆向执行</li>\n<li><b>C (一致性)</b>：由 A + I + D 共同保证</li>\n<li><b>I (隔离性)</b>：锁 + <code>MVCC</code></li>\n<li><b>D (持久性)</b>：<code>redo log</code> — WAL (Write-Ahead Logging)，先写日志再写磁盘</li>\n</ul>\n<h4>redo log (重做日志)</h4>\n<ul>\n<li>InnoDB 引擎层日志，物理日志（记录数据页的修改）</li>\n<li>循环写入（固定大小文件组），write pos 和 checkpoint 追赶</li>\n<li>保证 crash-safe：事务提交时先写 redo log（顺序 IO），数据页后续异步刷盘</li>\n</ul>\n<h4>undo log (回滚日志)</h4>\n<ul>\n<li>逻辑日志（记录反向 SQL），存储在系统表空间或独立 undo 表空间</li>\n<li>用途：(1) 事务回滚 (2) MVCC 多版本读（通过版本链回溯历史版本）</li>\n</ul>\n<h4>binlog vs redo log</h4>\n<ul>\n<li><code>binlog</code>：Server 层，逻辑日志，追加写入，用于主从复制和数据恢复</li>\n<li><code>redo log</code>：InnoDB 引擎层，物理日志，循环写入，用于崩溃恢复</li>\n<li>两阶段提交 (2PC)：先写 redo log (prepare) → 写 binlog → 写 redo log (commit)，保证数据一致性</li>\n</ul>\n<div class=\"key-point\">面试里最容易被追问的是 redo log 和 binlog 的两阶段提交，能说清 prepare → commit 就是加分点。</div>",
        "id": "q-m41whe"
      },
      {
        "q": "多租户 SaaS 分表方案是怎么设计的？GORM 分表插件如何实现？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>多租户隔离方案对比</h4>\n<ul>\n<li><b>独立数据库</b>：隔离性最强，成本最高，适合大客户</li>\n<li><b>共享数据库 + 独立 Schema</b>：中等隔离，运维复杂度中等</li>\n<li><b>共享数据库 + 共享表 + StoreId 区分</b>：成本最低，需要严格的数据隔离逻辑 ← 你的方案</li>\n</ul>\n<h4>你的实现方案</h4>\n<pre><code>// 动态切换数据库连接\nfunc GetDBByStoreId(storeId uint) *gorm.DB {\n    connKey := fmt.Sprintf(\"store_%d\", storeId)\n    if db, ok := dbPool.Load(connKey); ok {\n        return db.(*gorm.DB)\n    }\n    // 根据 storeId 路由到对应数据源\n    dsn := getStoreDSN(storeId)\n    db := initDB(dsn)\n    dbPool.Store(connKey, db)\n    return db\n}\n\n// GORM 分表：按租户 ID 分片\n// statistics_1, statistics_2, visitors_1, visitors_2 ...\nfunc (s *Statistics) TableName() string {\n    return fmt.Sprintf(\"statistics_%d\", s.StoreId % shardCount)\n}\n\n// 连接池动态计算\nmaxConns := runtime.NumCPU() * 2 + 1  // 基于 CPU 核心数\nmaxIdle := maxConns / 2\n// 根据可用内存进一步调整</code></pre>\n<div class=\"project-link\">简历关联：通过 StoreId 动态切换数据库连接，集成 GORM 分表插件支持按租户 ID 分片，连接池参数根据 CPU 核心数和内存动态计算</div>",
        "id": "q-fe9pel"
      },
      {
        "q": "MySQL 的锁机制？什么情况下行锁会升级为表锁？如何避免死锁？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>锁类型</h4>\n<ul>\n<li><b>全局锁</b>：<code>FLUSH TABLES WITH READ LOCK</code>（全库备份）</li>\n<li><b>表锁</b>：表级共享/排他锁、MDL 锁（DDL 时自动加）、意向锁</li>\n<li><b>行锁</b>（InnoDB 特有）：记录锁 (Record Lock)、间隙锁 (Gap Lock)、临键锁 (Next-Key Lock)</li>\n</ul>\n<h4>行锁升级为表锁的情况</h4>\n<ul>\n<li>WHERE 条件<b>没有命中索引</b>，InnoDB 退化为全表扫描 → 锁住所有扫描到的行（近似表锁）</li>\n<li>索引失效（如对索引列进行函数操作、隐式类型转换）</li>\n</ul>\n<h4>死锁预防</h4>\n<ul>\n<li>按<b>固定顺序</b>访问表和行（如按主键 ASC 顺序更新）</li>\n<li>事务尽量短小，减少持锁时间</li>\n<li>使用合理的索引，避免全表扫描</li>\n<li><code>innodb_deadlock_detect = ON</code>（默认开启），自动检测并回滚代价最小的事务</li>\n</ul>",
        "id": "q-1gxiy1s"
      },
      {
        "q": "InnoDB 和 MyISAM 在 count(*) 上为什么表现不同？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>核心差异</h4>\n<ul>\n<li><b>MyISAM</b> 会维护整张表的精确行数，所以在没有过滤条件时执行 <code>count(*)</code>，通常可以直接返回元数据里的结果</li>\n<li><b>InnoDB</b> 因为要支持事务和 MVCC，表的“当前可见行数”会因事务视图而不同，没法像 MyISAM 一样只靠一个全局行数回答</li>\n</ul>\n<h4>为什么 InnoDB 不能偷懒</h4>\n<ul>\n<li>不同事务看到的数据版本可能不同</li>\n<li>未提交数据、回滚数据、快照读都会影响“你现在能看到多少行”</li>\n<li>所以 InnoDB 往往需要扫描索引来统计，而不是直接读一个全局计数器</li>\n</ul>\n<h4>工程上怎么优化</h4>\n<ul>\n<li>如果只是后台统计展示，不要每次都现查 <code>count(*)</code>，可以做异步聚合或缓存</li>\n<li>有过滤条件时尽量让查询走覆盖索引，降低扫描成本</li>\n<li>超大表分页和计数拆开做，别把列表查询和总数统计绑死在同一条 SQL 上</li>\n</ul>\n<div class=\"key-point\">这题别只背“一个快一个慢”。真正的关键是：InnoDB 为了事务一致性，放弃了 MyISAM 那种简单粗暴的全局行数统计。</div>",
        "id": "q-qa08h2"
      },
      {
        "q": "InnoDB 可重复读级别下如何防幻读？MVCC 快照读和 Next-Key Lock 当前读分别起什么作用？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>先区分两个概念</h4>\n<ul>\n<li><b>不可重复读</b>：同一行数据被其他事务 UPDATE，两次读结果不同</li>\n<li><b>幻读</b>：同一条件查询，第二次多出或少了几行（其他事务 INSERT/DELETE）</li>\n</ul>\n<h4>快照读 vs 当前读</h4>\n<ul>\n<li><b>快照读</b>（普通 SELECT）：通过 <b>MVCC</b>（ReadView + undo log 版本链）读取事务开始时的快照。其他事务新插入的行对当前事务不可见，天然避免幻读</li>\n<li><b>当前读</b>（SELECT ... FOR UPDATE / INSERT / UPDATE / DELETE）：读取最新已提交数据，通过 <b>Next-Key Lock</b>（记录锁 + 间隙锁）锁住查询范围，阻止其他事务在范围内插入新行</li>\n</ul>\n<h4>Next-Key Lock 怎么防幻读</h4>\n<pre><code>-- 事务 A\nSELECT * FROM orders WHERE amount > 100 FOR UPDATE;\n-- 锁住 amount > 100 的所有已有记录（Record Lock）\n-- 同时锁住 (100, +∞) 的间隙（Gap Lock）\n-- 事务 B 想 INSERT amount=150 → 被间隙锁阻塞</code></pre>\n<h4>一个常见误区</h4>\n<p>\"可重复读不能防幻读，只有串行化才行\"——这在 SQL 标准里是对的，但 <b>InnoDB 的可重复读通过 MVCC + Next-Key Lock 在绝大多数场景下已经解决了幻读</b>。只有极少数边界场景（如同一事务内先快照读再当前读）可能看到不一致。</p>\n<div class=\"key-point\">面试时最好说清：快照读靠 MVCC 天然防幻读，当前读靠 Next-Key Lock 锁范围防幻读。两种机制配合，而不是只有一种。</div>",
        "id": "q-usbl7u"
      },
      {
        "q": "分表之后，跨分片的范围查询和分页怎么做？有哪些常见方案和取舍？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>为什么分表后查询变难</h4>\n<p>单表时 <code>ORDER BY created_at DESC LIMIT 10 OFFSET 100</code> 很简单。分表后数据散落在多个物理表中，无法直接跨表排序和分页。</p>\n<h4>常见方案</h4>\n<ul>\n<li><b>方案一：归并排序法</b>\n  <ul>\n  <li>每个分片执行相同查询（带排序），应用层对多个结果集做归并排序，取前 N 条</li>\n  <li>问题：深分页时每个分片都要取 offset+limit 条数据，内存和性能随页码线性增长</li>\n  </ul>\n</li>\n<li><b>方案二：禁止跳页 + 游标分页</b>\n  <ul>\n  <li>不允许直接跳到第 100 页，只支持\"下一页\"</li>\n  <li>用上一页最后一条的排序字段值做游标：<code>WHERE created_at < ? ORDER BY created_at DESC LIMIT 10</code></li>\n  <li>每个分片只需返回 limit 条数据，内存开销恒定</li>\n  <li>这是<b>生产中最推荐的方案</b></li>\n  </ul>\n</li>\n<li><b>方案三：二次查询法</b>\n  <ul>\n  <li>第一轮：每个分片查 <code>LIMIT offset/N, limit</code>（N 是分片数），收集边界值</li>\n  <li>第二轮：根据全局排序范围精确查询各分片</li>\n  <li>适合数据分布均匀的场景</li>\n  </ul>\n</li>\n<li><b>方案四：异构索引表</b>\n  <ul>\n  <li>维护一张全局排序索引表（只存 ID + 排序字段），用它做分页定位，再回源分片取完整数据</li>\n  <li>适合查询维度固定、写入频率可控的场景</li>\n  </ul>\n</li>\n</ul>\n<h4>你的项目实践</h4>\n<p>Shoply 按 store_id 分片，大多数查询天然带 store_id 条件，所以路由到单个分片后就是单表查询，不涉及跨分片。只有后台运营统计类查询需要跨分片，这类场景用异步聚合 + 缓存解决，不做实时跨分片分页。</p>\n<div class=\"project-link\">简历关联：自定义 GORM Sharding 按租户 ID 分片，大部分查询路由到单分片避免跨片问题</div>\n<div class=\"key-point\">面试最佳回答：先说\"我的分片策略让大多数查询不需要跨分片\"，再展开\"如果确实需要跨分片，生产上推荐游标分页\"。</div>",
        "id": "q-yq4cwq"
      }
    ]
  },
  {
    "cat": "Redis 缓存与队列",
    "icon": "🔴",
    "color": "#ef4444",
    "items": [
      {
        "q": "Redis 的五种基础数据类型及底层编码？什么时候会发生编码转换？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>数据类型 → 编码</h4>\n<ul>\n<li><b>String</b>：int（纯整数）/ embstr（≤44字节）/ raw（>44字节）</li>\n<li><b>List</b>：listpack（Redis 7.0+，元素少且小）/ quicklist</li>\n<li><b>Hash</b>：listpack（field 数 ≤ 128 且 value ≤ 64B）/ hashtable</li>\n<li><b>Set</b>：intset（全整数且 ≤ 512 个）/ hashtable</li>\n<li><b>ZSet</b>：listpack（≤ 128 个元素且 ≤ 64B）/ skiplist + hashtable</li>\n</ul>\n<h4>编码转换触发</h4>\n<p>当元素数量或大小超过阈值时<b>自动且不可逆</b>地从紧凑编码转为通用编码。阈值可通过配置调整：</p>\n<pre><code>hash-max-listpack-entries 128\nhash-max-listpack-value 64\nzset-max-listpack-entries 128\nzset-max-listpack-value 64</code></pre>",
        "id": "q-1d6l2fz"
      },
      {
        "q": "Redis 持久化 RDB 和 AOF 的区别？混合持久化是什么？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>RDB (快照)</h4>\n<ul>\n<li>某个时间点的全量数据快照（二进制文件）</li>\n<li>通过 <code>fork()</code> 子进程 + COW (Copy-on-Write) 生成</li>\n<li>优：恢复速度快、文件紧凑 | 劣：可能丢失最后一次快照后的数据</li>\n</ul>\n<h4>AOF (追加日志)</h4>\n<ul>\n<li>记录每个写命令（文本格式），支持 always / everysec / no 三种刷盘策略</li>\n<li>AOF 重写 (bgrewriteaof) 压缩日志体积</li>\n<li>优：数据更安全（everysec 最多丢 1 秒）| 劣：文件大、恢复慢</li>\n</ul>\n<h4>混合持久化 (Redis 4.0+)</h4>\n<ul>\n<li>AOF 重写时，前半段写 RDB 格式（快速全量），后半段追加 AOF 命令（增量）</li>\n<li>兼具 RDB 的快速恢复和 AOF 的数据安全性</li>\n<li>开启：<code>aof-use-rdb-preamble yes</code></li>\n</ul>",
        "id": "q-1glhos9"
      },
      {
        "q": "缓存穿透、缓存击穿、缓存雪崩分别是什么？怎么解决？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>缓存穿透</h4>\n<p>查询一个<b>不存在</b>的数据，缓存和 DB 都没有，每次请求都打到 DB</p>\n<ul>\n<li>解决：(1) 缓存空值/空对象（设较短 TTL） (2) <b>布隆过滤器</b>前置拦截</li>\n</ul>\n<h4>缓存击穿</h4>\n<p><b>热点 key 过期</b>的瞬间，大量并发请求同时打到 DB</p>\n<ul>\n<li>解决：(1) <b>singleflight</b> 合并并发请求，只有一个去查 DB (2) 互斥锁（Redis SETNX）(3) 热点 key 永不过期 + 异步更新</li>\n</ul>\n<h4>缓存雪崩</h4>\n<p>大量 key <b>同时过期</b>或 Redis 宕机，请求全部打到 DB</p>\n<ul>\n<li>解决：(1) 过期时间加<b>随机偏移</b> (2) Redis 集群高可用 (3) 本地缓存兜底 (4) 限流降级</li>\n</ul>\n<div class=\"project-link\">简历关联：你的 go-cache 适配器支持 Redis/Badger/File 三后端，可实现多级缓存兜底策略</div>\n<div class=\"key-point\">三者的核心区别：穿透是数据不存在，击穿是热点过期，雪崩是大面积失效。面试时先一句话概括再展开。</div>",
        "id": "q-6ie2jz"
      },
      {
        "q": "Asynq 的实现原理？你如何用它实现营销召回系统的三条异步任务链？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>Asynq 架构</h4>\n<ul>\n<li>基于 Redis 的分布式任务队列（类似 Sidekiq/Celery）</li>\n<li>核心数据结构：<code>asynq:{queue}:pending</code> (List)、<code>asynq:{queue}:active</code> (Set)、<code>asynq:{queue}:scheduled</code> (ZSet，按执行时间排序)</li>\n<li>Scheduler 定时将到期任务从 scheduled → pending，Worker 从 pending 取任务执行</li>\n<li>支持重试（指数退避）、唯一任务（去重）、超时控制、优先级队列</li>\n</ul>\n<h4>营销召回系统设计</h4>\n<pre><code>// 三条召回链\nconst (\n    TaskCartRecall     = \"recall:cart\"      // 购物车召回\n    TaskCheckoutRecall = \"recall:checkout\"  // 结账页召回\n    TaskOrderRecall    = \"recall:order\"     // 订单召回\n)\n\n// 10 分钟定时扫描 + 分步邮件\nfunc HandleCartRecall(ctx context.Context, t *asynq.Task) error {\n    // 1. 查询 10 分钟内有购物车但未下单的用户\n    // 2. 第一封邮件：温馨提醒\n    // 3. 注册延时任务：24 小时后发第二封（含优惠券）\n    task := asynq.NewTask(TaskCartRecallStep2, payload,\n        asynq.ProcessIn(24 * time.Hour),\n        asynq.Unique(24 * time.Hour), // 去重\n    )\n    return client.Enqueue(task)\n}\n\n// 定时调度\nscheduler.Register(\"*/10 * * * *\", // 每 10 分钟\n    asynq.NewTask(TaskCartRecall, nil))</code></pre>\n<div class=\"project-link\">简历关联：基于 Asynq (Redis-backed) 实现购物车召回、结账页召回、订单召回三条异步任务链，10 分钟级定时扫描配合分步邮件提醒</div>\n<div class=\"key-point\">能说出 Asynq 底层就是 Redis List + ZSET 实现延迟和重试，比背 API 更有说服力。</div>",
        "id": "q-18vz82y"
      },
      {
        "q": "Redis 分布式锁怎么实现？有什么陷阱？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>基本实现</h4>\n<pre><code>// 加锁：SET key value NX EX seconds\nok := redis.SetNX(ctx, lockKey, uniqueValue, 10*time.Second)\n\n// 解锁：Lua 脚本保证原子性（判断 + 删除）\nconst unlockScript = `\nif redis.call(\"get\", KEYS[1]) == ARGV[1] then\n    return redis.call(\"del\", KEYS[1])\nelse\n    return 0\nend`</code></pre>\n<h4>核心陷阱</h4>\n<ul>\n<li><b>锁过期但业务未完成</b>：A 持锁超时 → 锁自动释放 → B 获得锁 → A 完成后误删 B 的锁。解决：uniqueValue（UUID）+ Lua 原子判删</li>\n<li><b>主从切换丢锁</b>：master 加锁后未同步到 slave 就挂了，slave 提升为 master 后锁丢失。解决：<b>RedLock</b>（多节点过半数加锁）</li>\n<li><b>锁续期</b>：业务耗时不确定时需要看门狗机制（如 Redisson），定期续期</li>\n</ul>\n<div class=\"key-point\">面试必答陷阱：锁的过期时间必须大于业务执行时间，否则锁自动释放后别人拿到锁，两个进程同时操作。</div>",
        "id": "q-x046rc"
      },
      {
        "q": "缓存和数据库双写时，如何保证一致性？延迟双删为什么不是银弹？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>最常见方案：Cache Aside</h4>\n<ul>\n<li><b>读</b>：先查缓存，miss 再查数据库，然后回填缓存</li>\n<li><b>写</b>：先更新数据库，提交成功后删除缓存，而不是先更新缓存</li>\n</ul>\n<pre><code>// 推荐写路径\nfunc UpdateUser(ctx context.Context, id int64, patch UserPatch) error {\n    if err := db.WithTx(ctx, func(tx *sql.Tx) error {\n        return repo.UpdateUser(tx, id, patch)\n    }); err != nil {\n        return err\n    }\n    return cache.Del(ctx, fmt.Sprintf(\"user:%d\", id))\n}</code></pre>\n<h4>为什么不是“更新 DB + 更新缓存”</h4>\n<ul>\n<li>两个写操作跨系统，天然不是一个事务，任何一步失败都会留下脏数据</li>\n<li>并发场景下还会出现旧值回写覆盖新值的问题</li>\n</ul>\n<h4>延迟双删为什么不是银弹</h4>\n<ul>\n<li>做法：更新 DB 后立即删一次缓存，等待几十到几百毫秒后再删一次</li>\n<li>它只能降低“并发读把旧值重新写回缓存”的概率，不能严格保证一致</li>\n<li>读延迟、主从复制延迟、消息堆积都可能让“第二次删除”仍然踩不准时机</li>\n</ul>\n<h4>更稳妥的工程做法</h4>\n<ul>\n<li>以数据库为准，写后删缓存</li>\n<li>给缓存设置 TTL，避免脏数据无限期存在</li>\n<li>用 Binlog/CDC 或 MQ 做异步修复和批量失效</li>\n<li>对极高一致性场景，考虑版本号、读写穿透或直接放弃缓存</li>\n</ul>\n<div class=\"key-point\">面试里不要把“延迟双删”答成标准答案，重点是说明：它只是 best effort，真正核心是以 DB 为准 + 删除缓存 + 异步修复。</div>",
        "id": "q-1l47aze"
      },
      {
        "q": "Redis 宕机时，缓存层怎么降级？哪些数据可能丢，业务该怎么兜底？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>先分清 Redis 在系统里的角色</h4>\n<ul>\n<li><b>纯缓存</b>：目标是保护数据库和降低延迟，挂了之后系统应该降级而不是整体崩掉</li>\n<li><b>状态 / 锁 / 队列</b>：它已经不只是缓存，一旦挂掉会影响登录态、分布式锁、延时任务等能力</li>\n</ul>\n<h4>可能丢什么</h4>\n<ul>\n<li><b>缓存数据</b>：理论上可接受，应该能从数据库或其他源重建</li>\n<li><b>AOF / RDB 窗口内的数据</b>：如果 Redis 故障且持久化策略不够强，最近一段写入可能丢失</li>\n<li><b>依赖 Redis 承载业务语义的数据</b>：例如队列、会话、锁状态，一旦没兜底就会放大事故影响</li>\n</ul>\n<h4>常见降级手段</h4>\n<ul>\n<li><b>本地缓存兜底</b>：给热点数据一层进程内缓存，避免所有流量直冲数据库</li>\n<li><b>限流和熔断</b>：防止 Redis 故障后 DB 被瞬时流量打穿</li>\n<li><b>读写分级</b>：优先保证下单、查询等核心链路，非核心推荐、统计、排行榜先降级</li>\n<li><b>高可用架构</b>：主从、Sentinel、Cluster 降低单点故障概率</li>\n</ul>\n<h4>工程原则</h4>\n<ul>\n<li>不要把“能重建的缓存”设计成唯一数据源</li>\n<li>真正重要的数据必须先落库，再考虑缓存</li>\n<li>如果 Redis 同时承担缓存和 MQ/锁，面试里要主动指出：这会显著放大故障半径</li>\n</ul>\n<div class=\"key-point\">这题想听的不是“等 Redis 恢复”，而是你有没有降级思维：先保住核心链路，再逐步恢复性能层能力。</div>",
        "id": "q-sheogy"
      },
      {
        "q": "秒杀场景用 Redis Lua 脚本防超卖怎么做？redis.call、脚本阻塞、Cluster 限制、EVALSHA 缓存分别要注意什么？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>为什么需要 Lua 脚本</h4>\n<p>应用代码里\"先 GET 库存再 DECR 扣减\"不是原子操作，高并发下两个请求同时读到库存为 1，都去扣减，库存变成 -1。Lua 脚本在 Redis 内部单线程执行，保证\"查\"和\"扣\"连续完成，不会被其他命令插入。</p>\n<h4>防超卖脚本示例</h4>\n<pre><code>-- KEYS[1] = stock:1001, ARGV[1] = 购买数量\nlocal stock = tonumber(redis.call('GET', KEYS[1]) or \"0\")\nif stock >= tonumber(ARGV[1]) then\n    return redis.call('DECRBY', KEYS[1], ARGV[1])\nelse\n    return -1  -- 库存不足\nend</code></pre>\n<h4>四个必须注意的点</h4>\n<ul>\n<li><b>redis.call vs redis.pcall</b>：<code>redis.call</code> 遇到错误直接抛异常并停止脚本；<code>redis.pcall</code> 会捕获错误继续执行。防超卖必须用 <code>redis.call</code>——如果 GET 就出错了，后面 DECR 不能继续，否则数据就乱了</li>\n<li><b>阻塞风险</b>：Lua 脚本执行期间独占 Redis 主线程，其他客户端请求全部排队。脚本里不能有复杂循环或操作大 Key，执行时间必须控制在毫秒级</li>\n<li><b>Cluster Hash Tag</b>：Redis Cluster 模式下，Lua 脚本操作的所有 Key 必须在同一个哈希槽。跨槽操作直接报错。用 <code>{product}:stock</code> 和 <code>{product}:info</code> 这种 Hash Tag 强制落同一节点</li>\n<li><b>EVAL vs EVALSHA</b>：每次 <code>EVAL</code> 传完整脚本浪费带宽。线上先用 <code>SCRIPT LOAD</code> 缓存脚本拿到 SHA1，后续用 <code>EVALSHA</code> 执行。Redis 重启后缓存丢失，客户端要处理 <code>NOSCRIPT</code> 错误并 fallback 到 <code>EVAL</code></li>\n</ul>\n<h4>扣减成功后的流程</h4>\n<p>Lua 返回剩余库存（成功）或 -1（失败）。业务拿到成功后才发 MQ 消息异步创建订单，而不是先写 DB 再扣 Redis。</p>\n<div class=\"key-point\">面试追问\"Lua 脚本有什么坑\"时，答出阻塞风险 + Cluster Hash Tag + EVALSHA 缓存这三点，就和只说\"保证原子性\"的候选人拉开差距了。</div>",
        "id": "q-dwhlc8"
      },
      {
        "q": "Redis PubSub 的优雅关机怎么实现？为什么需要特别处理订阅 goroutine？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>问题</h4>\n<p>PubSub 订阅是<b>长驻 goroutine</b>，进程直接退出会丢消息。</p>\n<h4>优雅关机机制</h4>\n<ol>\n<li>启动时注册 <code>context.Context</code> + <code>cancel</code> 函数</li>\n<li>每个订阅 goroutine 启动时 <code>PubSubAdd()</code>（WaitGroup.Add）</li>\n<li>退出信号 → <code>cancel()</code> → goroutine 通过 <code>select { case <-ctx.Done() }</code> 退出</li>\n<li>主进程 <code>PubSubWait()</code> 等待所有 goroutine，超时保护兜底</li>\n</ol>\n<pre><code>go func() {\n    defer PubSubDone()\n    pubsub := client.Subscribe(ctx, chanNames...)\n    defer pubsub.Close()\n    for {\n        select {\n        case <-ctx.Done(): return\n        case msg := <-ch: handle(msg)\n        }\n    }\n}()</code></pre>\n<div class=\"key-point\">经典组合：Context（生命周期） + WaitGroup（等待退出） + 超时保护（兜底）</div>",
        "id": "q-redis-pubsub-shutdown"
      }
    ]
  },
  {
    "cat": "设计模式与架构",
    "icon": "🏗️",
    "color": "#a78bfa",
    "items": [
      {
        "q": "常见的设计模式有哪几大类？Go 里最常用的是哪些？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>三大分类</h4>\n<ul>\n<li><b>创建型</b>：关注对象的创建方式，如工厂模式、单例模式、建造者模式</li>\n<li><b>结构型</b>：关注类和对象的组合，如适配器模式、装饰器模式、代理模式、门面模式</li>\n<li><b>行为型</b>：关注对象之间的通信，如策略模式、观察者模式、责任链模式</li>\n</ul>\n<h4>Go 里最常见的几个</h4>\n<ul>\n<li><b>工厂模式</b>：用 <code>NewXxx()</code> 函数代替构造函数，Go 的标准做法</li>\n<li><b>策略模式</b>：定义 interface，不同实现可以运行时替换</li>\n<li><b>适配器模式</b>：把不兼容的接口转成统一接口，常见于对接多个第三方</li>\n<li><b>观察者/发布订阅</b>：事件驱动架构中常用</li>\n</ul>\n<div class=\"key-point\">Go 没有继承和泛型重载，所以设计模式的实现通常比 Java 简洁得多——interface + struct 组合就能覆盖大部分场景。</div>",
        "id": "q-dp1bas"
      },
      {
        "q": "你在项目中用了适配器模式、策略模式、门面模式，分别解决什么问题？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>适配器模式 (Adapter) — go-cache</h4>\n<p>问题：Redis / Badger / File 三种缓存后端接口不一致</p>\n<pre><code>type CacheAdapter interface {\n    Get(key string) ([]byte, error)\n    Set(key string, val []byte, ttl time.Duration) error\n    Del(key string) error\n}\n// RedisAdapter, BadgerAdapter, FileAdapter 分别实现\n// 上层代码只依赖 CacheAdapter 接口，切换后端零改动</code></pre>\n\n<h4>策略模式 (Strategy) — go-storage</h4>\n<p>问题：Local 存储和阿里云 OSS 的上传逻辑不同</p>\n<pre><code>type StorageDriver interface {\n    ChunkInit(filename string, size int64) (uploadId string, err error)\n    ChunkPart(uploadId string, partNum int, reader io.ReadSeeker) error\n    ChunkComplete(uploadId string) (url string, err error)\n}\n// LocalDriver 写本地磁盘，OSSDriver 调用阿里云 SDK\n// 通过配置选择具体 Driver</code></pre>\n\n<h4>门面模式 (Facade) — go-storage</h4>\n<p>问题：分片上传涉及多步骤操作（Init→Part→Complete），调用方不需要关心细节</p>\n<pre><code>type Storage struct { driver StorageDriver }\nfunc (s *Storage) Upload(file io.Reader, size int64) (string, error) {\n    // 门面：封装 Init → 分片读取 → Part → Complete 全流程\n    // 调用方只需要一行 storage.Upload(file, size)\n}</code></pre>\n<div class=\"key-point\">面试回答模板：先说问题（为什么需要这个模式）→ 再说方案（接口设计）→ 最后说效果（解耦/扩展性）</div>",
        "id": "q-159zveo"
      },
      {
        "q": "你设计的 Before/After 事件钩子系统是什么架构？和观察者模式有什么关系？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>架构设计</h4>\n<pre><code>// 事件定义\ntype EventType string\nconst (\n    BeforeOrderCreate  EventType = \"order.before_create\"\n    AfterOrderCreate   EventType = \"order.after_create\"\n    BeforePaymentPay   EventType = \"payment.before_pay\"\n    AfterPaymentPay    EventType = \"payment.after_pay\"\n    // ... 覆盖 Order/Checkout/Payment/Product CRUD\n)\n\n// 监听器接口\ntype EventListener interface {\n    Handle(ctx context.Context, event Event) error\n}\n\n// 事件总线（观察者模式的中介）\ntype EventBus struct {\n    mu        sync.RWMutex\n    listeners map[EventType][]EventListener\n}\n\nfunc (eb *EventBus) On(eventType EventType, listener EventListener) {\n    eb.mu.Lock()\n    defer eb.mu.Unlock()\n    eb.listeners[eventType] = append(eb.listeners[eventType], listener)\n}\n\nfunc (eb *EventBus) Emit(ctx context.Context, eventType EventType, payload interface{}) error {\n    eb.mu.RLock()\n    ls := eb.listeners[eventType]\n    eb.mu.RUnlock()\n    for _, l := range ls {\n        if err := l.Handle(ctx, Event{Type: eventType, Data: payload}); err != nil {\n            return err // Before 事件失败可中断流程\n        }\n    }\n    return nil\n}</code></pre>\n<h4>使用示例</h4>\n<pre><code>// 注册监听器 — 核心代码零侵入\neventBus.On(AfterOrderCreate, &InventoryDeducter{})\neventBus.On(AfterOrderCreate, &OrderNotifier{})\neventBus.On(BeforePaymentPay, &FraudChecker{})</code></pre>\n<div class=\"project-link\">简历关联：Before/After 生命周期事件钩子系统，覆盖 Order/Checkout/Payment/Product CRUD 全流程，业务扩展通过注册监听器实现，核心代码零侵入</div>",
        "id": "q-1yd5y53"
      },
      {
        "q": "微服务架构中 JSON-RPC 和 gRPC 的区别？你的项目为什么选 JSON-RPC？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>对比</h4>\n<table style=\"width:100%;font-size:13px;color:var(--text-dim);border-collapse:collapse\">\n<tr style=\"border-bottom:1px solid var(--border)\"><th style=\"text-align:left;padding:6px\">特性</th><th style=\"text-align:left;padding:6px\">JSON-RPC</th><th style=\"text-align:left;padding:6px\">gRPC</th></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">传输格式</td><td style=\"padding:6px\">JSON (文本)</td><td style=\"padding:6px\">Protobuf (二进制)</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">性能</td><td style=\"padding:6px\">中等</td><td style=\"padding:6px\">高（序列化快 3-10x）</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">调试</td><td style=\"padding:6px\">易（可读 JSON）</td><td style=\"padding:6px\">难（需要工具反序列化）</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">跨语言</td><td style=\"padding:6px\">天然（JSON）</td><td style=\"padding:6px\">需要 .proto + 代码生成</td></tr>\n<tr><td style=\"padding:6px\">流式</td><td style=\"padding:6px\">不支持</td><td style=\"padding:6px\">支持双向流</td></tr>\n</table>\n<h4>选型理由</h4>\n<ul>\n<li>Go + PHP 混合架构，PHP 生态对 JSON-RPC 支持最成熟</li>\n<li>业务场景不需要流式通信，JSON 可读性利于调试</li>\n<li>17 个服务规模下，JSON-RPC 的性能足够，无需引入 Protobuf 的复杂性</li>\n</ul>\n<div class=\"key-point\">如果面试官追问扩展：未来服务规模增大、需要更高性能时，可逐步引入 gRPC 替换核心链路，JSON-RPC 保留给 PHP 遗留服务</div>",
        "id": "q-1ad9nas"
      },
      {
        "q": "如何设计一个优雅关机 (Graceful Shutdown) 方案？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>核心步骤</h4>\n<pre><code>func main() {\n    // 1. 启动服务\n    srv := startServer()\n\n    // 2. 监听信号\n    quit := make(chan os.Signal, 1)\n    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)\n    <-quit\n\n    // 3. 超时保护\n    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)\n    defer cancel()\n\n    // 4. 按依赖顺序关闭（与启动顺序相反）\n    g, ctx := errgroup.WithContext(ctx)\n\n    // 4.1 先停止接收新请求\n    g.Go(func() error { return srv.ShutdownWithContext(ctx) })\n\n    // 4.2 等待异步任务完成\n    g.Go(func() error { return asynqSrv.Shutdown() })\n\n    // 4.3 关闭消息队列消费者\n    g.Go(func() error { return listener.Close() })\n\n    if err := g.Wait(); err != nil {\n        log.Error(\"shutdown error\", err)\n    }\n\n    // 5. 最后关闭基础设施（DB/Redis）\n    db.Close()\n    rdb.Close()\n}</code></pre>\n<h4>关键点</h4>\n<ul>\n<li><b>超时保护</b>必须有，防止某组件 hang 住导致进程无法退出</li>\n<li>关闭顺序：流量入口 → 异步任务 → 消息消费 → 数据库连接</li>\n<li>健康检查端点应在 shutdown 开始时立即返回不健康，让 LB 摘掉节点</li>\n</ul>\n<div class=\"project-link\">简历关联：go-fast 框架支持 errgroup 并发管理与优雅关机（10 秒超时保护）</div>",
        "id": "q-1ensob8"
      },
      {
        "q": "DDD 的核心概念是什么？实体、值对象、聚合根、领域事件分别怎么理解？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>四个高频概念</h4>\n<ul>\n<li><b>实体 (Entity)</b>：有唯一身份标识，关注“它是谁”，即使属性变化也还是同一个对象，比如订单、用户</li>\n<li><b>值对象 (Value Object)</b>：没有独立身份，关注“它是什么”，通常不可变，比如金额、地址、时间区间</li>\n<li><b>聚合根 (Aggregate Root)</b>：聚合的一致性边界入口，外部只能通过聚合根访问内部对象，比如订单聚合根统一管理订单项和状态流转</li>\n<li><b>领域事件 (Domain Event)</b>：领域内已经发生的重要事实，用来解耦副作用逻辑，比如“订单已支付”触发积分发放和通知</li>\n</ul>\n<h4>怎么理解更像工程师</h4>\n<p>DDD 不是为了把目录改花，而是先定义业务边界，再让代码结构围绕边界组织，减少跨模块的隐式耦合。</p>\n<div class=\"key-point\">面试里别只背定义，最好顺手举一个电商场景：订单是实体，金额是值对象，订单是聚合根，“订单已支付”是领域事件。</div>",
        "id": "q-fi8niu"
      },
      {
        "q": "Go 项目如何实践 DDD？目录结构和分层怎么组织？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>推荐分层</h4>\n<pre><code>internal/\n  order/\n    domain/        // 实体、值对象、领域服务、仓储接口\n    application/   // 用例编排、事务边界、DTO 转换\n    infrastructure/ // DB、MQ、第三方实现\n    interfaces/    // HTTP / gRPC Handler</code></pre>\n<h4>职责划分</h4>\n<ul>\n<li><b>Domain</b>：只表达业务规则，不依赖数据库和 Web 框架</li>\n<li><b>Application</b>：负责编排用例、事务和权限校验</li>\n<li><b>Infrastructure</b>：实现仓储、缓存、消息和外部依赖</li>\n<li><b>Interfaces</b>：处理 HTTP / gRPC 请求与响应映射</li>\n</ul>\n<h4>落地注意点</h4>\n<ul>\n<li>不要把 DDD 变成“多一层文件夹”而没有业务边界</li>\n<li>先从复杂领域开始，例如订单、支付、库存，不必全项目一次性改造</li>\n<li>应用服务负责编排，领域对象负责规则，仓储负责持久化，边界要清</li>\n</ul>",
        "id": "q-10q1978"
      },
      {
        "q": "Go 后端接口如何做 RESTful 设计和版本演进？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>RESTful 不是“URL 长得像资源名”这么简单</h4>\n<ul>\n<li><b>资源导向</b>：URL 表示资源，HTTP Method 表示动作，例如 <code>GET /orders/{id}</code>、<code>POST /orders</code>、<code>PATCH /orders/{id}</code></li>\n<li><b>状态语义清晰</b>：成功返回 200/201/204，参数错误 400，未授权 401/403，找不到资源 404，冲突 409</li>\n<li><b>列表接口规范化</b>：统一支持筛选、排序、分页，避免每个接口都自创参数格式</li>\n<li><b>幂等性意识</b>：<code>PUT</code> / <code>DELETE</code> 要天然幂等，创建类接口如果会重试，最好配合幂等键</li>\n</ul>\n<pre><code>GET    /v1/orders?status=paid&amp;cursor=xxx\nPOST   /v1/orders\nGET    /v1/orders/{id}\nPATCH  /v1/orders/{id}\nPOST   /v1/orders/{id}/refunds</code></pre>\n<h4>版本演进怎么做</h4>\n<ul>\n<li>优先做向后兼容的演进，比如新增可选字段而不是修改旧字段含义</li>\n<li>出现破坏性变更时，再引入 <code>/v1</code>、<code>/v2</code> 或媒体类型版本</li>\n<li>保留废弃窗口和迁移说明，不要一上来直接删旧接口</li>\n<li>错误码、字段命名和分页协议要尽量跨版本稳定</li>\n</ul>\n<div class=\"key-point\">像 AfterShip 这类岗位写了 RESTful，本质想考的是接口抽象能力，不是背 GET/POST，而是看你会不会设计长期可演进的 API。</div>",
        "id": "q-1nhqd6a"
      },
      {
        "q": "分布式存储系统设计要先回答哪几个核心问题？副本、一致性、分片、扩缩容分别怎么权衡？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>分布式存储不是先选产品名，而是先回答四类问题</h4>\n<ul>\n<li><b>存什么</b>：对象、KV、列族、文档还是时序数据，不同模型直接决定系统形态</li>\n<li><b>怎么写</b>：写多读少、读多写少、热点明显还是均匀分布，会影响副本和分片策略</li>\n<li><b>一致性要求</b>：是订单类强一致，还是日志类最终一致，决定你能接受多大读写延迟和复杂度</li>\n<li><b>故障目标</b>：单机故障、机架故障、机房故障都要不要扛住，决定副本拓扑和容灾成本</li>\n</ul>\n<h4>四个高频权衡</h4>\n<ul>\n<li><b>副本</b>：副本数越多，可用性越强，但写放大和成本越高</li>\n<li><b>一致性</b>：强一致简化业务语义，但吞吐和延迟通常更吃紧；最终一致更弹性，但业务要补偿</li>\n<li><b>分片</b>：分片键决定热点是否均匀，选错后期重平衡会非常痛</li>\n<li><b>扩缩容</b>：分布式存储必须预留 rebalancing 机制，不能只考虑“加节点”，还要考虑迁移成本和数据倾斜</li>\n</ul>\n<h4>怎么答更像做过系统设计</h4>\n<p>把问题落成一个路径会更好：先定义访问模式和一致性，再定副本策略和分片键，最后再谈故障恢复、扩缩容和观测指标。</p>\n<div class=\"key-point\">这题真正考的是你有没有“分布式存储”的建模能力，而不是只会背 CAP。高质量回答要体现：数据模型、访问模式、故障域和扩容路径是一起设计的。</div>",
        "id": "q-1ohx9b9"
      },
      {
        "q": "自动化工单系统如何设计状态机、审批流、幂等和审计？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>先分清两个对象</h4>\n<ul>\n<li><b>工单本身</b>：描述一次变更申请，关注提交、审批、执行和结果</li>\n<li><b>资源本身</b>：真正被操作的对象，如机器、实例、权限、域名，不要和工单揉成一张表</li>\n</ul>\n<h4>一个常见状态机</h4>\n<pre><code>draft → pending → approved → executing → success\n                 └────────→ rejected\nexecuting ───────→ failed / cancelled</code></pre>\n<ul>\n<li><b>draft</b>：草稿，尚未正式发起</li>\n<li><b>pending</b>：等待审批</li>\n<li><b>approved</b>：审批通过，等待执行</li>\n<li><b>executing</b>：执行中</li>\n<li><b>success / failed / cancelled</b>：终态</li>\n</ul>\n<h4>审批流怎么做</h4>\n<ul>\n<li>审批人和执行人要解耦，避免同一个人自己提自己批</li>\n<li>复杂流程支持按组织、资源类型、风险等级动态决定审批链</li>\n<li>审批动作要记录操作者、时间、意见和变更快照</li>\n</ul>\n<h4>幂等和审计</h4>\n<ul>\n<li>提交工单时最好有幂等键，避免前端重试产生重复工单</li>\n<li>执行阶段同样要幂等，防止重复点击“执行”导致多次下发</li>\n<li>每次状态变更都写审计日志，必要时保留请求参数和执行结果快照</li>\n</ul>\n<div class=\"key-point\">这题真正拉开差距的是：你能说清工单系统不是“多一张单据表”，而是“资源变更流程 + 审批约束 + 可追责审计”的组合。</div>",
        "id": "q-17pttmy"
      },
      {
        "q": "资源管理系统的数据模型怎么设计？资源、机房、节点、标签、配额、工单之间是什么关系？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>先把“资源”和“流程”拆开</h4>\n<ul>\n<li><b>资源实体</b>：机房、集群、节点、实例、网络、磁盘、账号等真实对象</li>\n<li><b>流程实体</b>：工单、审批记录、执行记录、审计日志</li>\n<li>不要把资源本体和流程状态硬塞到一张表里，否则后续会越改越乱</li>\n</ul>\n<h4>一个常见关系模型</h4>\n<pre><code>Region / IDC\n  └─ Node\n      └─ ResourceInstance (VM / Pod / DB / Cache ...)\n\nResourceInstance\n  ├─ Tags\n  ├─ Owner\n  ├─ QuotaBinding\n  └─ ChangeTickets</code></pre>\n<h4>对象职责</h4>\n<ul>\n<li><b>机房 / 区域</b>：表达物理或逻辑归属，支撑容灾和拓扑管理</li>\n<li><b>节点</b>：承载计算资源，记录 CPU、内存、磁盘、状态和所属集群</li>\n<li><b>资源实例</b>：真正对外服务的对象，带类型、规格、状态、负责人</li>\n<li><b>标签</b>：表达环境、业务线、风险级别、租户、用途等横切维度</li>\n<li><b>配额</b>：限制团队、租户或业务线的资源上限</li>\n<li><b>工单</b>：针对资源发起变更申请，不等于资源本体本身</li>\n</ul>\n<div class=\"key-point\">这题的高分点在于：你能说清平台系统本质上在管理元数据、关系和流程，而不是往一张表里不断堆字段。</div>",
        "id": "q-5ortqw"
      },
      {
        "q": "Go + PHP 双引擎中 plugin_mode 和 static_mode 是怎么实现的？各自适用什么场景？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>双模式运行机制</h4>\n<p>通过 Go <b>build tags</b> 编译期切换：</p>\n<pre><code>//go:build plugin  → plugin_mode.go\n// 无 build tag      → static_mode.go</code></pre>\n<h4>plugin_mode（开发期）</h4>\n<ul>\n<li>Go 原生 Plugin（.so 文件）动态加载模板引擎、ORM、验证码等模块</li>\n<li>修改插件无需重编译主进程，热加载提升开发效率</li>\n</ul>\n<h4>static_mode（生产期）</h4>\n<ul>\n<li>所有模块编译到单一二进制，部署简单、性能更好</li>\n<li>避免 .so 版本兼容和跨平台限制</li>\n</ul>\n<h4>RPC 桥接</h4>\n<p>25+ 个 RPC 服务通过 <code>net/rpc</code> 注册，PHP 端 TCP 调用。选 net/rpc 而非 gRPC：内部通信不跨网络，更轻量。</p>\n<div class=\"key-point\">架构核心：Go 扛流量（HTTP/WS/调度），PHP 扛灵活性（20+ 插件），各取所长</div>",
        "id": "q-arch-dual-engine"
      },
      {
        "q": "Checkout/Payment 的 Before/After 事件钩子怎么设计的？为什么用 Mutex 而不是 RWMutex？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>CRUD 生命周期事件</h4>\n<pre><code>type CheckoutService struct {\n    CreateBeforeEvents []event.CheckoutCreateBefore\n    CreateAfterEvents  []event.CheckoutCreateAfter\n    UpdateBeforeEvents / DeleteBeforeEvents ...\n}</code></pre>\n<ul>\n<li>通过 <code>AddCreateBeforeEvents()</code> 注册（sync.Mutex 保护）</li>\n<li>Create 前遍历所有 BeforeEvents，Create 后遍历 AfterEvents</li>\n</ul>\n<h4>插件扩展</h4>\n<ul>\n<li>分销插件在 CheckoutCreateAfter 记录佣金</li>\n<li>营销插件在 OrderCreateAfter 触发召回</li>\n<li>邮件插件在 PaymentUpdateAfter 发送通知</li>\n</ul>\n<h4>为什么 Mutex 而非 RWMutex？</h4>\n<p>注册只在启动时发生一次，运行时遍历是只读操作无需加锁。RWMutex 对极低频写操作没有意义。</p>\n<div class=\"key-point\">本质：观察者模式 + 生命周期钩子，插件扩展核心逻辑零侵入</div>",
        "id": "q-arch-event-hooks"
      }
    ]
  },
  {
    "cat": "支付与交易系统",
    "icon": "💳",
    "color": "#22d3ee",
    "items": [
      {
        "q": "支付系统的核心流程是什么？从用户下单到支付完成经历了哪些步骤？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>核心流程</h4>\n<ol>\n<li><b>下单</b>：用户提交订单，后端创建订单记录，锁定库存</li>\n<li><b>结算</b>：计算商品金额、优惠、运费、税费，生成应付总额</li>\n<li><b>支付</b>：调用支付网关（如 Stripe/PayPal）创建支付意图，用户完成付款</li>\n<li><b>回调</b>：支付网关异步通知支付结果（Webhook），后端验签后更新订单状态</li>\n<li><b>履约</b>：支付成功后触发发货、物流等后续流程</li>\n</ol>\n<h4>关键设计点</h4>\n<ul>\n<li>订单和支付是两个独立实体，一个订单可能对应多次支付尝试</li>\n<li>支付结果以 Webhook 回调为准，不能只靠前端跳转判断</li>\n<li>必须做幂等——同一笔支付回调可能重复到达</li>\n</ul>\n<div class=\"key-point\">面试入门题，但要能说清「订单」和「支付」的边界，以及为什么 Webhook 才是支付结果的唯一可信来源。</div>",
        "id": "q-pay1bas"
      },
      {
        "q": "你对接了 4 种支付网关，统一抽象层是怎么设计的？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>四层抽象架构</h4>\n<pre><code>// 第一层：Checkout（结账会话）\ntype CheckoutService interface {\n    Create(ctx context.Context, req CheckoutReq) (*Checkout, error)\n    // 生成商品快照、地址快照、计算金额\n}\n\n// 第二层：Payment（支付意图）\ntype PaymentService interface {\n    Create(ctx context.Context, checkout *Checkout) (*Payment, error)\n    // 根据支付方式路由到具体 gateway\n}\n\n// 第三层：PaymentTrade（支付交易）\ntype PaymentGateway interface {\n    CreateTrade(ctx context.Context, payment *Payment) (*Trade, error)\n    Capture(ctx context.Context, tradeId string) error\n    Refund(ctx context.Context, tradeId string, amount decimal.Decimal) error\n}\n\n// 第四层：Webhook（异步回调）\ntype WebhookHandler interface {\n    Verify(req *http.Request) ([]byte, error)  // 验签\n    Parse(payload []byte) (*WebhookEvent, error)\n    Handle(ctx context.Context, event *WebhookEvent) error\n}\n\n// 具体实现\ntype PayPalGateway struct{ ... }   // Standard/Advanced/Embed/Redirect\ntype StripeGateway struct{ ... }\ntype ApplePayGateway struct{ ... }\ntype GooglePayGateway struct{ ... }</code></pre>\n<h4>PayPal Express 快捷支付会话复用</h4>\n<p>用户首次 PayPal 支付后缓存 payer_id，后续支付跳过登录步骤。Capture 兜底：先尝试 authorize → capture，失败则走 direct capture</p>\n<div class=\"project-link\">简历关联：统一 Checkout→Payment→PaymentTrade→Webhook 四层抽象，支持 PayPal 4 种接入模式，实现 Express 快捷支付会话复用与 capture 兜底</div>\n<div class=\"key-point\">面试时画一个 PaymentGateway 接口 + 4 个实现（Stripe/PayPal/Airwallex/IPay88）的类图，比口述更清晰。</div>",
        "id": "q-atv685"
      },
      {
        "q": "订单状态机如何设计？主子订单拆分架构怎么处理退款？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>状态机流转</h4>\n<pre><code>待支付 (pending)\n  ├─ 支付成功 → 待发货 (paid)\n  │   ├─ 已发货 → 待收货 (shipped)\n  │   │   ├─ 确认收货 → 已完成 (completed)\n  │   │   └─ 申请退款 → 退款中 (refunding)\n  │   └─ 申请退款 → 退款中 (refunding)\n  ├─ 支付超时 → 已取消 (cancelled)\n  └─ 用户取消 → 已取消 (cancelled)\n\n退款中 (refunding)\n  ├─ 退款成功 → 已退款 (refunded)\n  └─ 退款失败 → 待发货/待收货 (回退)</code></pre>\n<h4>主子订单拆分</h4>\n<pre><code>// 用户下单：多商品多店铺合并\n主订单 (master_order)\n  ├─ 子订单 A (store_1 的商品)\n  ├─ 子订单 B (store_2 的商品)\n  └─ 子订单 C (store_3 的商品)\n\n// 支付：主订单级别统一支付\n// 发货：子订单级别独立发货\n// 退款：子订单级别独立退款，主订单金额 = sum(子订单)</code></pre>\n<h4>OrderLog 审计</h4>\n<pre><code>type OrderLog struct {\n    OrderId   uint\n    Action    string    // \"create\" / \"pay\" / \"ship\" / \"refund\"\n    Operator  string    // 操作人（用户/系统/管理员）\n    Content   string    // 操作说明\n    Payload   JSON      // 快照数据\n    CreatedAt time.Time\n}</code></pre>\n<div class=\"key-point\">面试要点：强调幂等性 — 支付回调可能重复，必须通过订单状态判断是否已处理，避免重复发货或重复退款</div>",
        "id": "q-k0d4gn"
      },
      {
        "q": "跨境电商中多币种金额精度问题怎么解决？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>浮点数问题</h4>\n<pre><code>// 经典陷阱\n0.1 + 0.2 = 0.30000000000000004\n// 金融场景绝不能用 float</code></pre>\n<h4>你的双轨金额方案</h4>\n<pre><code>type OrderAmount struct {\n    // 基础币种（商品原始币种，如 CNY）\n    SubtotalPrice decimal.Decimal  // 小计\n    TotalPrice    decimal.Decimal  // 总价\n    PayPrice      decimal.Decimal  // 实付\n\n    // 结算币种（用户支付币种，如 USD）\n    SettleSubtotalPrice decimal.Decimal\n    SettleTotalPrice    decimal.Decimal\n    SettlePayPrice      decimal.Decimal\n\n    ExchangeRate decimal.Decimal   // 下单时锁定汇率\n    BaseCurrency string            // \"CNY\"\n    SettleCurrency string          // \"USD\"\n}</code></pre>\n<h4>关键设计</h4>\n<ul>\n<li>使用 <code>shopspring/decimal</code> 库，避免浮点精度丢失</li>\n<li>下单时<b>锁定汇率快照</b>，退款时按原汇率计算，不受汇率波动影响</li>\n<li>DB 中用 <code>DECIMAL(20,4)</code> 存储，Go 中全程 decimal 运算</li>\n<li>Checkout 时生成商品快照和地址快照，确保支付时数据不变</li>\n</ul>\n<div class=\"key-point\">核心原则：永远不用 float 算钱。用最小货币单位（分）的整数运算，或用 decimal 库。</div>",
        "id": "q-1y3mnwx"
      },
      {
        "q": "支付系统如何保证幂等性？Webhook 重复回调怎么处理？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>幂等性保证</h4>\n<ul>\n<li><b>唯一订单号</b>：每个支付请求携带唯一 order_no，网关端去重</li>\n<li><b>状态机前置判断</b>：处理回调前先检查订单状态，已完成的直接返回成功</li>\n<li><b>数据库唯一约束</b>：payment_trade 表对 (gateway, trade_no) 建唯一索引</li>\n</ul>\n<h4>Webhook 处理流程</h4>\n<pre><code>func HandleWebhook(c *fiber.Ctx) error {\n    // 1. 验签（每个网关签名方式不同）\n    payload, err := gateway.Verify(c.Request())\n\n    // 2. 解析事件\n    event, err := gateway.Parse(payload)\n\n    // 3. 幂等检查\n    trade, err := findTrade(event.TradeNo)\n    if trade.Status == \"completed\" {\n        return c.SendStatus(200) // 已处理，直接返回成功\n    }\n\n    // 4. 加分布式锁（防止并发回调）\n    lock := redis.Lock(\"webhook:\" + event.TradeNo, 30*time.Second)\n    if !lock.Acquire() { return c.SendStatus(200) }\n    defer lock.Release()\n\n    // 5. 业务处理（更新订单状态、触发发货等）\n    // 6. 返回 200（告诉网关不要重试）\n}</code></pre>\n<div class=\"key-point\">PayPal/Stripe 都会在收到非 2xx 响应时重试 Webhook（最多重试数天），必须做好幂等处理</div>",
        "id": "q-15z7zx"
      },
      {
        "q": "优惠、运费、税费按商品行分摊时，为什么容易出错？如何处理精度、尾差和退款反算？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>为什么这题很容易出事故</h4>\n<ul>\n<li>优惠、运费、税费往往不是天然属于某一行商品，而是订单级费用，需要再拆回到商品行</li>\n<li>如果直接用 <code>float</code>，金额会有精度误差</li>\n<li>分摊后的尾差如果不收敛，最终“行金额之和”就会和订单总额对不上</li>\n<li>退款时如果重新按当前规则计算，而不是按下单时的分摊快照回放，金额就会失真</li>\n</ul>\n<h4>常见处理方式</h4>\n<ul>\n<li>统一使用 <code>decimal</code> 做金额计算</li>\n<li>先确定分摊权重：按金额、数量、重量或混合规则来分</li>\n<li>尾差通过“最大项补差”或“最后一项补差”收敛，确保合计严格等于订单级金额</li>\n<li>把每一行的分摊结果落快照，退款和售后按原始分摊回放，而不是重算</li>\n</ul>\n<pre><code>type LineAllocation struct {\n    OrderLineID   uint\n    DiscountShare decimal.Decimal\n    ShippingShare decimal.Decimal\n    TaxShare      decimal.Decimal\n}</code></pre>\n<div class=\"key-point\">这题真正想听的是：你知道分摊不是“算一下比例”这么简单，而是必须同时满足精度正确、合计闭合、可审计、可退款回放。</div>",
        "id": "q-ro9kaq"
      },
      {
        "q": "为什么下单链路要做商品快照、地址快照、汇率快照？哪些字段必须冻结？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>为什么必须做快照</h4>\n<ul>\n<li>商品标题、价格、规格、库存策略都会变化，如果订单只引用实时商品表，后续对账和售后会失真</li>\n<li>地址会变，税区和运费命中结果也会跟着变</li>\n<li>汇率波动会直接影响退款、结算和财务解释口径</li>\n</ul>\n<h4>通常要冻结哪些字段</h4>\n<ul>\n<li><b>商品快照</b>：SKU、标题、规格、单价、折扣前后金额、税类目</li>\n<li><b>地址快照</b>：国家、省份、城市、邮编、关键收货信息</li>\n<li><b>汇率快照</b>：基础币种、结算币种、换算汇率、生效时间</li>\n<li><b>规则命中快照</b>：运费规则、税费规则、优惠规则的命中结果</li>\n</ul>\n<h4>工程价值</h4>\n<ul>\n<li>保证支付、退款、售后、审计时使用的是“下单当时的事实”</li>\n<li>避免商品改价、地址修改、汇率波动影响已成交订单</li>\n<li>能清晰解释一笔订单当时为什么是这个金额</li>\n</ul>\n<div class=\"key-point\">这题别答成“为了方便查历史”。更完整的说法是：快照是订单事实层，后续支付、退款、税费解释和财务对账都依赖它。</div>",
        "id": "q-1bwu8at"
      },
      {
        "q": "工作流引擎和规则引擎分别解决什么问题？跨境电商里哪些场景需要它们？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>先分清两者</h4>\n<ul>\n<li><b>工作流引擎</b>：编排多步骤、多角色的流程推进，核心是状态流转和节点编排。典型：订单审批流、退款审核流、采购入库流</li>\n<li><b>规则引擎</b>：在某个决策点，根据条件集合计算出结果。典型：运费规则、税费规则、风控规则、优惠叠加规则</li>\n<li>两者经常配合：工作流某个节点调用规则引擎做决策，决策结果决定流程走向</li>\n</ul>\n<h4>跨境电商的常见场景</h4>\n<ul>\n<li><b>工作流</b>：采购单审批 → 供应商确认 → 入库 → 质检 → 上架；退款申请 → 客服审核 → 财务放款</li>\n<li><b>规则引擎</b>：根据目的国+商品类目+重量命中运费模板；根据收货地址命中税率和税种（VAT/Sales Tax）；根据用户标签+订单金额命中优惠策略</li>\n</ul>\n<h4>工程实现要点</h4>\n<ul>\n<li>工作流引擎的核心是状态机 + 节点注册 + 条件分支 + 超时/补偿</li>\n<li>规则引擎的核心是规则匹配优先级（精确 > 通配 > 默认）和命中结果可审计</li>\n<li>不要把业务逻辑硬编码在流程代码里，要做到规则和流程可配置、可追溯</li>\n</ul>\n<div class=\"key-point\">面试高分点：能说清工作流管「流程推进」、规则引擎管「决策计算」，两者边界清晰但常配合使用。</div>",
        "id": "q-wf1rul"
      },
      {
        "q": "跨境电商的物流履约系统（WMS/TMS）后端需要关注哪些核心设计问题？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>WMS（仓储管理）核心问题</h4>\n<ul>\n<li><b>库存模型</b>：可售库存、在途库存、冻结库存、预扣库存要分开记账，不能只靠一个字段</li>\n<li><b>入库流程</b>：采购到货 → 质检 → 上架 → 库位分配，每一步都要有状态和审计</li>\n<li><b>出库流程</b>：订单锁库 → 拣货 → 打包 → 交接物流，库存扣减时机要明确</li>\n<li><b>库位管理</b>：SKU 和库位的映射关系，支持多仓、多区域</li>\n</ul>\n<h4>TMS（运输管理）核心问题</h4>\n<ul>\n<li><b>物流商对接</b>：不同物流商 API 差异大，需要统一抽象层（类似支付网关抽象）</li>\n<li><b>运单生命周期</b>：下单 → 揽收 → 转运 → 清关 → 派送 → 签收，每个节点都靠回调或轮询更新</li>\n<li><b>物流轨迹</b>：多来源轨迹合并、时区统一、异常状态检测（长时间无更新告警）</li>\n</ul>\n<h4>跨境特有挑战</h4>\n<ul>\n<li>海外仓 + 国内仓的库存同步和调拨</li>\n<li>清关环节的不确定性（状态长时间卡住）</li>\n<li>退货逆向物流链路复杂度远高于国内电商</li>\n</ul>\n<div class=\"key-point\">这题和你的项目直接相关：你做过订单和支付链路，面试时可以顺着说「订单确认后进入履约环节」，展示你对全链路的理解。</div>",
        "id": "q-tms1wm"
      },
      {
        "q": "Stripe 自动退款是怎么接入统一退款网关的？如何保证多渠道退款的可扩展性？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>统一退款网关设计（RefundGateway）</h4>\n<ul>\n<li>退款网关按<b>支付方式自动路由</b>：通过 <code>isStripeRefund()</code> / <code>isPaypalRefund()</code> 判断退款通道</li>\n<li>判断优先级：Application.UniqueName → Order.PayMethod → Payment.PayMethod</li>\n<li>退款请求通过 RPC 调用对应支付插件执行实际退款</li>\n</ul>\n<h4>Stripe 退款响应校验</h4>\n<pre><code>func validateStripeRefundResponse(res []byte) error {\n    var payload struct {\n        Status string `json:\"status\"`\n        ID     string `json:\"id\"`\n    }\n    json.Unmarshal(res, &payload)\n    // status 必须为 SUCCEEDED，refund_id 不能为空\n}</code></pre>\n<h4>扩展性设计</h4>\n<p>新增支付渠道退款只需加一个 <code>isXxxRefund()</code> + <code>validateXxxRefundResponse()</code>，不改动主流程，符合<b>开闭原则</b>。</p>\n<div class=\"project-link\">简历关联：Stripe 自动退款链路，统一退款网关按支付方式自动路由</div>",
        "id": "q-sp-stripe-refund"
      },
      {
        "q": "Apple Pay 域名注册与校验文件托管的完整链路是什么？SaaS 多租户场景下怎么处理？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>Apple Pay 域名验证流程</h4>\n<ol>\n<li><b>域名注册 API</b>：后台调用 PayPal Apple Pay 域名注册接口，传入商户域名</li>\n<li><b>校验文件托管</b>：Apple 访问 <code>https://{domain}/.well-known/apple-developer-merchantid-domain-association</code> 验证域名所有权</li>\n<li><b>动态路由代理</b>：Go 层通过动态路由将 .well-known 路径映射到文件解析服务</li>\n<li><b>状态管理</b>：注册状态存入 Payment 配置的 <code>paymentMethods.PayPal_APPLEPAY</code> 字段</li>\n</ol>\n<h4>SaaS 多租户兼容</h4>\n<ul>\n<li>每个店铺可绑定不同的自定义域名，每个域名需要<b>独立注册</b></li>\n<li>域名标准化处理：去协议头、去端口、去路径、转小写</li>\n<li>实现涉及 go-fast（路由代理）+ go-shoply（注册 API + 配置管理）+ Shoply-admin（前端配置页）三层协作</li>\n</ul>\n<div class=\"project-link\">简历关联：Apple Pay 域名注册与校验文件托管全链路</div>",
        "id": "q-sp-applepay-domain"
      }
    ]
  },
  {
    "cat": "搜索引擎",
    "icon": "🔍",
    "color": "#34d399",
    "items": [
      {
        "q": "倒排索引的原理？你的 go-es 如何兼容 Elasticsearch Query DSL？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>倒排索引原理</h4>\n<pre><code>// 正排索引（文档 → 词）\ndoc1: \"Go 语言并发编程\"\ndoc2: \"Go 语言网络编程\"\n\n// 倒排索引（词 → 文档列表）\n\"Go\"   → [doc1, doc2]\n\"并发\" → [doc1]\n\"网络\" → [doc2]\n\"编程\" → [doc1, doc2]</code></pre>\n<h4>go-es 兼容实现</h4>\n<pre><code>// 将 ES DSL 转换为 Bluge 查询\nfunc ParseQuery(dsl map[string]interface{}) bluge.Query {\n    if boolQ, ok := dsl[\"bool\"]; ok {\n        return parseBoolQuery(boolQ)  // must/should/must_not → AND/OR/NOT\n    }\n    if matchQ, ok := dsl[\"match\"]; ok {\n        // 先分词，再 OR 组合\n        return parseMatchQuery(matchQ)\n    }\n    if termQ, ok := dsl[\"term\"]; ok {\n        return bluge.NewTermQuery(value) // 精确匹配\n    }\n    if rangeQ, ok := dsl[\"range\"]; ok {\n        return parseRangeQuery(rangeQ)   // gte/lte → NumericRange\n    }\n    // Geo, Fuzzy 类似...\n}</code></pre>\n<h4>Rendezvous 一致性哈希分片</h4>\n<ul>\n<li>每个分片一个 Bluge 索引实例</li>\n<li>写入时通过 Rendezvous Hash 确定文档归属分片</li>\n<li>查询时并行查所有分片，合并排序后返回</li>\n<li>对比 Consistent Hash Ring：Rendezvous Hash 分布更均匀，增删节点时迁移数据更少</li>\n</ul>\n<div class=\"project-link\">简历关联：go-es 基于 Bluge 引擎，兼容 ES Query DSL (Bool/Match/Term/Range/Geo/Fuzzy)，Rendezvous 一致性哈希分片 + gse 中文分词 + WAL 事务日志</div>",
        "id": "q-1eytra5"
      },
      {
        "q": "WAL (Write-Ahead Logging) 在你的搜索引擎中起什么作用？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>WAL 原理</h4>\n<p>所有修改操作<b>先写日志，再写数据</b>。崩溃恢复时重放日志即可恢复到一致状态</p>\n<h4>go-es 中的 WAL 实现</h4>\n<pre><code>type WAL struct {\n    file   *os.File\n    mu     sync.Mutex\n    offset int64\n}\n\nfunc (w *WAL) Write(op Operation) error {\n    w.mu.Lock()\n    defer w.mu.Unlock()\n    // 1. 序列化操作（type + docId + data + checksum）\n    entry := encodeEntry(op)\n    // 2. 写入日志文件（顺序追加，高性能）\n    _, err := w.file.Write(entry)\n    // 3. fsync 确保持久化\n    return w.file.Sync()\n}\n\n// 崩溃恢复\nfunc (w *WAL) Recover(index *bluge.Writer) error {\n    entries := w.ReadAll()\n    for _, entry := range entries {\n        // 重放：将未持久化的操作重新应用到索引\n        switch entry.Type {\n        case OpIndex:  index.Update(entry.Doc)\n        case OpDelete: index.Delete(entry.DocId)\n        }\n    }\n    return w.Truncate() // 恢复完毕，截断日志\n}</code></pre>\n<h4>为什么需要 WAL</h4>\n<ul>\n<li>Bluge 索引写入有 batch commit 延迟，中间崩溃会丢数据</li>\n<li>WAL 是顺序写（极快），索引是随机写（较慢），WAL 填补了两者之间的安全间隙</li>\n</ul>",
        "id": "q-1xdj11h"
      },
      {
        "q": "搜索/推荐/广告系统的核心架构是什么？召回、粗排、精排、重排分别做什么？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>四层典型链路</h4>\n<ol>\n<li><b>召回</b>：从海量候选中快速捞出一批相关结果，追求覆盖率，常用倒排索引、向量召回、协同过滤</li>\n<li><b>粗排</b>：用轻量模型快速过滤，把几千条候选压到几百条</li>\n<li><b>精排</b>：用更复杂的特征和模型算最终相关性分数</li>\n<li><b>重排</b>：考虑多样性、商业规则、广告位约束、冷热启动等因素做最后调整</li>\n</ol>\n<h4>各层关注点</h4>\n<ul>\n<li>召回关注快和全，宁可多捞，不要漏掉高价值候选</li>\n<li>排序关注准，用特征和模型提高点击率、转化率或 GMV</li>\n<li>重排关注业务目标平衡，不只是相关性最高</li>\n</ul>\n<div class=\"key-point\">这题别答成“一个模型从头算到尾”。真正的工业系统一定是分层做取舍：先快，再准，最后加业务约束。</div>",
        "id": "q-1ietist"
      },
      {
        "q": "实时特征、离线特征和 Feature Store 分别是什么？为什么推荐系统需要它们？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>三者区别</h4>\n<ul>\n<li><b>离线特征</b>：按小时或天批量产出，如用户长期兴趣、商品历史 CTR，计算成本低但不够实时</li>\n<li><b>实时特征</b>：基于最新行为流实时更新，如最近 5 分钟点击、实时曝光数，时效性强但系统复杂度更高</li>\n<li><b>Feature Store</b>：统一管理特征定义、生成、存储和在线/离线一致性的系统</li>\n</ul>\n<h4>为什么需要 Feature Store</h4>\n<ul>\n<li>避免训练和推理用到的特征口径不一致</li>\n<li>让离线训练特征和在线服务特征共用同一份定义</li>\n<li>便于复用、回溯和权限管理</li>\n</ul>\n<div class=\"key-point\">面试里如果能补一句“推荐系统最怕 feature skew”，会很加分，说明你知道训练和线上不一致会直接把模型效果打废。</div>",
        "id": "q-je4gks"
      },
      {
        "q": "程序化广告的 RTB（实时竞价）流程是什么？DSP、SSP、ADX 各自扮演什么角色？",
        "diff": "easy",
        "tags": [
          "scene"
        ],
        "a": "<h4>三方角色</h4>\n<ul>\n<li><b>SSP</b>：供给方平台，代表媒体方出售广告位</li>\n<li><b>ADX</b>：广告交易平台，负责撮合多方竞价</li>\n<li><b>DSP</b>：需求方平台，代表广告主根据人群和预算出价</li>\n</ul>\n<h4>典型 RTB 流程</h4>\n<ol>\n<li>用户访问页面，媒体侧产生一个广告请求</li>\n<li>SSP 将流量和用户信息打包给 ADX</li>\n<li>ADX 向多个 DSP 发起竞价请求</li>\n<li>DSP 根据人群画像、预算和出价策略返回 bid</li>\n<li>ADX 选中胜出广告并返回素材</li>\n<li>用户看到广告，后续再走曝光、点击和转化归因</li>\n</ol>\n<div class=\"key-point\">真正的挑战不只是出价，而是整条链路通常要求在几十毫秒内完成。</div>",
        "id": "q-wunp6"
      },
      {
        "q": "高并发广告系统的技术挑战有哪些？QPS 和延迟要求通常是什么级别？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>为什么难</h4>\n<ul>\n<li>请求量大，很多系统要扛到 10 万 QPS 甚至更高</li>\n<li>延迟预算极紧，往往要在 100ms 甚至更短时间内完成竞价和返回</li>\n<li>每个请求都可能依赖画像、预算、频控、素材和策略服务</li>\n<li>日志量巨大，曝光、点击、竞价明细都要异步可靠落地</li>\n</ul>\n<h4>常见设计手段</h4>\n<ul>\n<li>把关键数据尽量前置到内存或本地缓存</li>\n<li>预算、频控等状态做高性能读写与批量异步刷新</li>\n<li>日志、计费和归因链路异步化，避免阻塞主请求</li>\n<li>核心链路优先保证低延迟，复杂模型放到更靠后的精排或离线阶段</li>\n</ul>\n<div class=\"key-point\">这类题的重点不是背系统名词，而是讲清楚“高 QPS + 低延迟 + 多依赖 + 强计费”四个约束如何同时满足。</div>",
        "id": "q-1049m5x"
      }
    ]
  },
  {
    "cat": "安全防护",
    "icon": "🛡️",
    "color": "#f472b6",
    "items": [
      {
        "q": "JWT + RSA 认证方案怎么设计？和 HMAC 签名的区别？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>JWT 结构</h4>\n<p><code>Header.Payload.Signature</code>（Base64URL 编码）</p>\n<h4>HMAC vs RSA</h4>\n<ul>\n<li><b>HMAC (HS256)</b>：对称加密，签发和验证使用同一个密钥。适合单体应用</li>\n<li><b>RSA (RS256)</b>：非对称加密，私钥签发、公钥验证。适合微服务（各服务只需公钥即可验证）</li>\n</ul>\n<h4>微服务场景选 RSA 的原因</h4>\n<pre><code>// Auth Service（持有私钥）\ntoken := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)\nsignedToken, _ := token.SignedString(privateKey)\n\n// 其他 Service（只需公钥验证）\ntoken, _ := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {\n    return publicKey, nil  // 公钥泄露不影响安全\n})</code></pre>\n<ul>\n<li>私钥只在 Auth Service，其他 17 个服务不需要接触私钥</li>\n<li>公钥可以公开分发，降低密钥管理复杂度</li>\n</ul>",
        "id": "q-1o4zsc6"
      },
      {
        "q": "你的自研 WAF 中间件是怎么做访客风险分析的？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>多层风险分析</h4>\n<pre><code>func WAFMiddleware(c *fiber.Ctx) error {\n    risk := &RiskScore{}\n\n    // 1. ASN 识别（云服务商 IP 段）\n    asn := lookupASN(c.IP())\n    if isCloudProvider(asn) { // AWS/GCP/Azure/阿里云\n        risk.Add(30, \"cloud_provider_ip\")\n    }\n\n    // 2. 代理头伪造检测\n    if hasConflictingProxyHeaders(c) {\n        // X-Forwarded-For 和实际 IP 不一致\n        risk.Add(20, \"proxy_header_forgery\")\n    }\n\n    // 3. WAF 正则匹配（SQL注入/XSS/路径遍历）\n    if matched, rule := matchWAFRules(c); matched {\n        risk.Add(50, \"waf_rule: \" + rule)\n    }\n\n    // 4. 高频访问防护（滑动窗口）\n    count := redis.Incr(\"rate:\" + c.IP()) // 1 分钟窗口\n    if count > threshold {\n        risk.Add(40, \"high_frequency\")\n        // 触发 10 分钟冷却\n        redis.Set(\"cooldown:\" + c.IP(), 1, 10*time.Minute)\n    }\n\n    // 5. 超过阈值 → 拦截\n    if risk.Total() >= 80 {\n        return c.Status(403).JSON(...)\n    }\n\n    // 6. 异步批处理：将访客记录推入队列\n    visitorQueue <- VisitorLog{IP: c.IP(), Risk: risk, ...}\n    return c.Next()\n}\n\n// 后台 worker 批量写入，不阻塞主链路\ngo func() {\n    batch := make([]VisitorLog, 0, 100)\n    ticker := time.NewTicker(5 * time.Second)\n    for {\n        select {\n        case v := <-visitorQueue: batch = append(batch, v)\n        case <-ticker.C: flushBatch(batch); batch = batch[:0]\n        }\n    }\n}()</code></pre>\n<div class=\"project-link\">简历关联：自研轻量级 WAF 中间件，集成 ASN 识别、代理头伪造检测、WAF 正则匹配、高频访问防护（1 分钟窗口 + 10 分钟冷却），异步批处理</div>",
        "id": "q-2zizcr"
      },
      {
        "q": "AES-CBC + RSA 混合加密的流程？为什么不直接用 RSA 加密全部数据？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>为什么不直接用 RSA</h4>\n<ul>\n<li>RSA 加密数据长度受限（2048 位密钥最多加密 245 字节）</li>\n<li>RSA 加密速度极慢（比 AES 慢约 1000 倍）</li>\n</ul>\n<h4>混合加密流程</h4>\n<pre><code>// 加密\n1. 随机生成 AES-256 密钥 (32 bytes) 和 IV (16 bytes)\n2. 用 AES-CBC 加密明文数据（对称，快速，无长度限制）\n3. 用 RSA 公钥加密 AES 密钥（非对称，只加密 32 bytes）\n4. 发送：RSA(AES_Key) + IV + AES_CBC(Data)\n\n// 解密\n1. 用 RSA 私钥解密出 AES 密钥\n2. 用 AES 密钥 + IV 解密数据</code></pre>\n<h4>CBC 模式注意事项</h4>\n<ul>\n<li>需要 PKCS7 Padding（明文长度对齐到块大小 16 字节）</li>\n<li>IV 必须每次随机生成，不能复用（否则相同明文产生相同密文）</li>\n<li>生产中建议用 AES-GCM（自带认证，防篡改）替代 AES-CBC</li>\n</ul>",
        "id": "q-1fg3w7k"
      },
      {
        "q": "WAF 的累加评分模型是怎么设计的？加分减分策略有哪些？灰度拦截怎么做？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>累加评分制</h4>\n<p>初始 Score = 0，各检测模块独立加/减分：</p>\n<ul>\n<li>Score < 50：正常放行</li>\n<li>50 ≤ Score < 80：弹出验证码（CAPTCHA）</li>\n<li>Score ≥ 80：直接拉黑</li>\n<li>Score ≥ 100：短路返回（跳过后续检测节省资源）</li>\n</ul>\n<h4>加分项</h4>\n<ul>\n<li>代理头检测（Via / X-Forwarded-For 多层跳板 / 隐蔽代理头）：+20~+40</li>\n<li>ASN 识别（DigitalOcean/Vultr/OVH/Hetzner）：高危 ASN 高分</li>\n<li>频率限制（10s 超阈值）：softLimit +60，hardLimit 直接 200</li>\n<li>无 Cookie 连续访问（阶梯式：3次+15，5次+50，10次+80）</li>\n<li>HTTP/1.0 协议降级：+20</li>\n</ul>\n<h4>减分项（信用加分）</h4>\n<ul>\n<li>来源是搜索引擎（Google/Bing/Baidu 等）：直接放行</li>\n<li>有本站 Referer + Cookie：-40</li>\n</ul>\n<div class=\"key-point\">灰度拦截哲学：不是非黑即白，可疑流量弹验证码给自证机会，只有高度确认的恶意流量才封禁</div>",
        "id": "q-sec-waf-score"
      },
      {
        "q": "频率限制为什么做动态阈值？无 Cookie 连续访问检测的设计考量？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>动态阈值频率限制</h4>\n<p>Redis INCR + EXPIRE 滑动窗口，关键是<b>动态阈值</b>：</p>\n<ul>\n<li>正常请求：softLimit = 60/10s，hardLimit = 120/10s</li>\n<li>前序 Score ≥ 30（已有嫌疑）：收紧到 10/10s 和 30/10s</li>\n</ul>\n<p>visitor hash = MD5(IP + UA + Accept-Language)，同设备同浏览器一个计数器。</p>\n<h4>无 Cookie 检测设计</h4>\n<ul>\n<li><b>只检测主文档请求</b>（Sec-Fetch-Dest: document），过滤图片/CSS</li>\n<li><b>带 Cookie 立即重置</b>（Redis DEL），给真人自证机会</li>\n<li><b>阶梯式加分</b>：3次(+15) → 5次(+50) → 10次(+80)</li>\n<li><b>30 分钟过期</b>：应对慢速爬虫</li>\n</ul>\n<div class=\"key-point\">核心：只对 HTML 文档请求计数，不对 API 或静态资源计数，避免误杀</div>",
        "id": "q-sec-ratelimit-cookie"
      }
    ]
  },
  {
    "cat": "WebSocket 与实时通信",
    "icon": "🔌",
    "color": "#fb923c",
    "items": [
      {
        "q": "WebSocket 和 HTTP 长轮询的区别？你在哪些场景用了 WebSocket？",
        "diff": "easy",
        "tags": [
          "project"
        ],
        "a": "<h4>对比</h4>\n<ul>\n<li><b>HTTP 长轮询</b>：客户端发请求 → 服务端 hold 住 → 有数据时响应 → 客户端再次请求。每次都有完整 HTTP 头，单向通信</li>\n<li><b>WebSocket</b>：一次握手（HTTP Upgrade）后保持<b>全双工</b>长连接，双向实时通信，头部开销极小（2-14 bytes）</li>\n</ul>\n<h4>你项目中的 3 个 WebSocket 场景</h4>\n<ul>\n<li><b>AI 任务状态推送</b>：AI 文章生成/SEO 优化是异步任务，通过 WebSocket 实时推送进度和结果（生成中→完成→错误映射）</li>\n<li><b>商品导入进度</b>：从 Shopify/微店批量导入商品时，实时通知前端当前进度（已导入/总数/失败数）</li>\n<li><b>任务编排状态</b>：Asynq 异步任务的执行状态变更实时推送到管理后台</li>\n</ul>\n<div class=\"key-point\">Fiber 中 WebSocket 基于 gorilla/websocket 或 fasthttp/websocket 封装，每个连接一个 goroutine 读 + 一个 goroutine 写</div>",
        "id": "q-u0lewn"
      },
      {
        "q": "WebSocket 连接管理：如何处理断线重连、心跳、多实例广播？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>连接管理 Hub</h4>\n<pre><code>type Hub struct {\n    connections map[string]*Connection  // userId → conn\n    mu          sync.RWMutex\n    register    chan *Connection\n    unregister  chan *Connection\n    broadcast   chan Message\n}\n\nfunc (h *Hub) Run() {\n    for {\n        select {\n        case conn := <-h.register:\n            h.mu.Lock()\n            h.connections[conn.UserId] = conn\n            h.mu.Unlock()\n        case conn := <-h.unregister:\n            h.mu.Lock()\n            delete(h.connections, conn.UserId)\n            h.mu.Unlock()\n        case msg := <-h.broadcast:\n            h.mu.RLock()\n            for _, conn := range h.connections {\n                conn.Send(msg)\n            }\n            h.mu.RUnlock()\n        }\n    }\n}</code></pre>\n<h4>心跳保活</h4>\n<pre><code>// 服务端定期发 Ping，客户端回 Pong\n// 超过 60 秒无 Pong 则关闭连接\nconn.SetPongHandler(func(string) error {\n    conn.SetReadDeadline(time.Now().Add(60 * time.Second))\n    return nil\n})</code></pre>\n<h4>多实例广播</h4>\n<p>多个服务实例时，用户可能连在不同实例上。通过 Redis Pub/Sub 广播消息到所有实例，各实例再推送给自己管理的连接</p>",
        "id": "q-10vreb4"
      },
      {
        "q": "SSE 和 WebSocket 的区别？AI 流式输出场景怎么选？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>两者的核心差异</h4>\n<ul>\n<li><b>SSE (Server-Sent Events)</b>：基于 HTTP 长连接，服务端单向推送文本事件给客户端，浏览器原生支持 <code>EventSource</code></li>\n<li><b>WebSocket</b>：一次 Upgrade 后建立全双工连接，客户端和服务端都能持续发消息</li>\n</ul>\n<table style=\"width:100%;font-size:13px;color:var(--text-dim);border-collapse:collapse\">\n<tr style=\"border-bottom:1px solid var(--border)\"><th style=\"text-align:left;padding:6px\">维度</th><th style=\"text-align:left;padding:6px\">SSE</th><th style=\"text-align:left;padding:6px\">WebSocket</th></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">通信方向</td><td style=\"padding:6px\">服务端 → 客户端</td><td style=\"padding:6px\">双向</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">协议基础</td><td style=\"padding:6px\">HTTP</td><td style=\"padding:6px\">独立 WebSocket 协议</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">断线重连</td><td style=\"padding:6px\">浏览器原生支持</td><td style=\"padding:6px\">通常要自己实现</td></tr>\n<tr><td style=\"padding:6px\">适合场景</td><td style=\"padding:6px\">流式文本、进度更新、通知</td><td style=\"padding:6px\">聊天、协作、实时控制</td></tr>\n</table>\n<h4>AI 流式输出怎么选</h4>\n<ul>\n<li><b>只需要把 token 连续推给前端</b>：优先 SSE，接入简单、对代理和 CDN 更友好</li>\n<li><b>需要前端同时持续上送控制消息</b>：如语音对话、多人协作、实时打断，选 WebSocket</li>\n<li><b>工程细节</b>：SSE 要考虑心跳注释、防代理超时、事件 ID 断点续传；WebSocket 要考虑连接管理、背压和广播</li>\n</ul>\n<div class=\"key-point\">现在很多 AI Agent 岗写“流式输出”，面试里说“token 流默认 SSE，双向互动再升到 WebSocket”会非常加分。</div>",
        "id": "q-1g7gty9"
      },
      {
        "q": "语音房 / 直播间服务端的核心模块有哪些？房间状态、在线人数、消息投递如何保证一致性？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>一个常见的模块拆分</h4>\n<ul>\n<li><b>房间服务</b>：创建房间、上下线、状态流转、权限控制</li>\n<li><b>在线状态服务</b>：管理用户进房、离房、心跳和在线人数</li>\n<li><b>消息服务</b>：处理聊天消息、系统通知、礼物消息、禁言踢人广播</li>\n<li><b>互动与风控</b>：礼物、连麦、禁言、黑名单、限流、防刷</li>\n<li><b>统计链路</b>：在线峰值、消息吞吐、礼物流水、房间活跃度</li>\n</ul>\n<h4>一致性怎么做</h4>\n<ul>\n<li><b>房间状态</b>：要有明确 source of truth，不能完全依赖前端上报</li>\n<li><b>在线人数</b>：通常采用“缓存实时值 + 异步校准”的思路，而不是每次都强依赖数据库精确计数</li>\n<li><b>消息投递</b>：房间广播和状态通知要区分可靠性等级，关键控制消息优先保证送达和顺序</li>\n<li><b>加入 / 离开幂等</b>：重复进房、断线重连、心跳丢失都要能安全重放</li>\n</ul>\n<div class=\"key-point\">这题不是考你背 IM 架构，而是看你能不能讲清：实时系统里“在线态、房间态、消息流”是三条不同的一致性问题。</div>",
        "id": "q-1s009sz"
      },
      {
        "q": "TCP、UDP、WebSocket、HTTP/2 在实时社交产品里怎么选？分别适合什么链路？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>先把“信令链路”和“媒体链路”分开</h4>\n<ul>\n<li><b>TCP</b>：可靠、有序，适合关键控制消息、状态同步、需要严格送达的链路</li>\n<li><b>UDP</b>：低延迟、无连接，适合音视频媒体流，但要接受丢包并通过编解码或协议层补偿</li>\n<li><b>WebSocket</b>：浏览器端最常见的实时双向通道，适合聊天、房间状态、信令交互</li>\n<li><b>HTTP/2</b>：更适合服务间 RPC 和多路复用请求，不是浏览器端房间长连接的首选</li>\n</ul>\n<h4>常见选型</h4>\n<ul>\n<li><b>客户端实时信令</b>：WebSocket</li>\n<li><b>服务间内部调用</b>：HTTP/2 / gRPC</li>\n<li><b>音视频媒体流</b>：UDP / QUIC 方向</li>\n<li><b>关键控制消息</b>：仍走可靠链路，不要为了低延迟把所有消息都扔到不可靠通道</li>\n</ul>\n<div class=\"key-point\">这题的高分答案不是“哪个协议最快”，而是你能按可靠性、时延、顺序性和连接管理成本，把不同链路分开回答。</div>",
        "id": "q-szt6bc"
      }
    ]
  },
  {
    "cat": "Docker 与部署",
    "icon": "🐳",
    "color": "#0ea5e9",
    "items": [
      {
        "q": "Go 项目的 Dockerfile 如何写？多阶段构建有什么好处？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>多阶段构建</h4>\n<pre><code># 阶段一：编译\nFROM golang:1.22-alpine AS builder\nWORKDIR /app\nCOPY go.mod go.sum ./\nRUN go mod download\nCOPY . .\nRUN CGO_ENABLED=0 GOOS=linux go build -ldflags=\"-s -w\" -o /app/server ./cmd/server\n\n# 阶段二：运行\nFROM alpine:3.19\nRUN apk --no-cache add ca-certificates tzdata\nCOPY --from=builder /app/server /usr/local/bin/server\nCOPY --from=builder /app/configs /etc/app/configs\nEXPOSE 8080\nENTRYPOINT [\"server\"]</code></pre>\n<h4>好处</h4>\n<ul>\n<li>最终镜像不包含 Go 编译工具链，体积从 ~1GB 缩减到 ~20MB</li>\n<li><code>CGO_ENABLED=0</code> 生成静态二进制，可用 <code>scratch</code> 或 <code>distroless</code> 更小的基础镜像</li>\n<li><code>-ldflags=\"-s -w\"</code> 去掉符号表和调试信息，进一步缩小</li>\n</ul>",
        "id": "q-7n8n2h"
      },
      {
        "q": "容器健康检查 + 优雅关机如何配合 K8s 的滚动更新？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>完整链路</h4>\n<pre><code># K8s Deployment 配置\nspec:\n  containers:\n  - name: app\n    livenessProbe:     # 存活探针：失败则重启容器\n      httpGet: { path: /healthz, port: 8080 }\n      periodSeconds: 10\n    readinessProbe:    # 就绪探针：失败则从 Service 摘除\n      httpGet: { path: /readyz, port: 8080 }\n      periodSeconds: 5\n    lifecycle:\n      preStop:          # 在 SIGTERM 前执行\n        exec:\n          command: [\"sh\", \"-c\", \"sleep 5\"]  # 等待 LB 摘掉流量\n  terminationGracePeriodSeconds: 30</code></pre>\n<h4>滚动更新流程</h4>\n<ol>\n<li>K8s 发送 SIGTERM 给 Pod，同时将 Pod 从 Service Endpoints 移除</li>\n<li>preStop hook 执行（sleep 5s 等 LB 生效）</li>\n<li>应用收到 SIGTERM，readiness 返回不健康，开始优雅关机</li>\n<li>等待处理中的请求完成（你的 10 秒超时保护）</li>\n<li>关闭 DB/Redis 连接，进程退出</li>\n<li>超过 terminationGracePeriodSeconds 仍未退出则 SIGKILL 强杀</li>\n</ol>",
        "id": "q-1ry7gt7"
      },
      {
        "q": "Go 项目的 CI/CD 流程一般怎么设计？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>一条常见流水线</h4>\n<ol>\n<li>代码提交后先跑静态检查和单元测试，例如 <code>golangci-lint</code>、<code>go test ./...</code></li>\n<li>构建可执行文件或 Docker 镜像，产出可部署制品</li>\n<li>将镜像推到镜像仓库，如 GHCR、Docker Hub、ECR</li>\n<li>部署到测试环境，做 smoke test 和关键路径校验</li>\n<li>通过后再进入生产发布，例如滚动更新或灰度发布</li>\n</ol>\n<h4>关键原则</h4>\n<ul>\n<li>把“是否可合并”前置到 CI，而不是等上线后再发现问题</li>\n<li>构建产物要唯一可追踪，最好带 commit SHA 或版本号</li>\n<li>部署后要有健康检查和回滚手段，不能只有发布没有验证</li>\n</ul>\n<div class=\"key-point\">这题别只背工具名，重点是讲清楚：校验、制品、部署、验证、回滚这五步。</div>",
        "id": "q-1h0a9vw"
      },
      {
        "q": "灰度发布和金丝雀发布怎么实现？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>核心目标</h4>\n<p>不是一次性全量替换，而是先让一小部分流量进入新版本，观察指标没问题再逐步放量。</p>\n<h4>常见实现方式</h4>\n<ul>\n<li><b>Kubernetes</b>：两个 Deployment 并存，通过 Service、Ingress 或 Gateway 做权重分流</li>\n<li><b>Service Mesh</b>：如 Istio 通过 <code>VirtualService</code> 按比例分流，例如 10% → 30% → 100%</li>\n<li><b>应用层</b>：按用户 ID、租户 ID、地区或白名单做 Feature Flag 分桶</li>\n</ul>\n<h4>发布时看什么</h4>\n<ul>\n<li>错误率、延迟、CPU/内存、下游依赖异常</li>\n<li>关键业务指标是否劣化，比如下单成功率、支付成功率</li>\n<li>一旦指标异常，立刻切回旧版本，这就是灰度发布真正的价值</li>\n</ul>",
        "id": "q-1dy8w42"
      },
      {
        "q": "AWS 核心服务有哪些？EC2、S3、RDS、Lambda 分别适合什么场景？",
        "diff": "easy",
        "tags": [
          "scene"
        ],
        "a": "<h4>四个最常见的 AWS 服务</h4>\n<ul>\n<li><b>EC2</b>：云主机，适合自管应用、特殊运行环境或需要完整系统权限的服务</li>\n<li><b>S3</b>：对象存储，适合图片、视频、静态资源、备份和日志归档</li>\n<li><b>RDS</b>：托管数据库，适合 MySQL / PostgreSQL 等关系型数据库场景</li>\n<li><b>Lambda</b>：函数计算，适合事件驱动的小任务、定时任务、轻量 API</li>\n</ul>\n<h4>怎么理解更实用</h4>\n<p>EC2 管的是机器，Lambda 管的是函数，S3 管的是对象，RDS 管的是数据库。答题时别只背服务名，重点说“谁负责运维、谁负责弹性、谁负责存储”。</p>",
        "id": "q-1snbf9s"
      },
      {
        "q": "如何设计一个可靠的 AWS 部署架构？高可用和容灾怎么做？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>基础高可用</h4>\n<ul>\n<li>计算层跨多个 Availability Zone 部署，前面挂 ALB 或 NLB</li>\n<li>数据库用 RDS Multi-AZ，关键数据定期快照</li>\n<li>静态资源放 S3 + CloudFront，减少源站压力</li>\n<li>配置和密钥交给 Parameter Store 或 Secrets Manager</li>\n</ul>\n<h4>容灾设计</h4>\n<ul>\n<li>同 Region 内做 AZ 级容灾，防单机房故障</li>\n<li>跨 Region 做异地备份或热备，防区域级故障</li>\n<li>提前定义 RPO / RTO，别把容灾答成“多备几份”</li>\n</ul>\n<h4>发布与回滚</h4>\n<p>可以用蓝绿或金丝雀发布，配合 Route 53、ALB 权重或应用层开关；回滚时优先切流，再回退镜像或版本。</p>",
        "id": "q-1aoeo63"
      },
      {
        "q": "Docker 容器和虚拟机的核心区别是什么？namespace 和 cgroup 分别解决什么问题？",
        "diff": "easy",
        "tags": [
          "scene"
        ],
        "a": "<h4>核心区别</h4>\n<table>\n<tr><th>维度</th><th>虚拟机</th><th>Docker 容器</th></tr>\n<tr><td>隔离级别</td><td>硬件虚拟化，每个 VM 有独立 OS 内核</td><td>OS 级隔离，共享宿主机内核</td></tr>\n<tr><td>启动速度</td><td>分钟级（要启动完整 OS）</td><td>秒级甚至毫秒级</td></tr>\n<tr><td>资源开销</td><td>重（每个 VM 需要独立的内核、系统进程）</td><td>轻（只有应用进程和依赖）</td></tr>\n<tr><td>镜像大小</td><td>GB 级</td><td>MB 级（多阶段构建后）</td></tr>\n<tr><td>安全隔离</td><td>更强（独立内核，攻击面小）</td><td>较弱（共享内核，存在逃逸风险）</td></tr>\n<tr><td>典型用途</td><td>不同 OS 环境、强隔离需求</td><td>微服务部署、CI/CD、快速扩缩容</td></tr>\n</table>\n<h4>Linux 两大隔离技术</h4>\n<ul>\n<li><b>namespace</b>：实现资源视图隔离。不同容器看到独立的 PID、网络栈、文件系统、用户等\n  <ul>\n  <li><code>PID namespace</code>：容器内进程 PID 从 1 开始</li>\n  <li><code>Network namespace</code>：独立网络栈、IP、端口</li>\n  <li><code>Mount namespace</code>：独立文件系统挂载点</li>\n  <li><code>UTS namespace</code>：独立主机名</li>\n  </ul>\n</li>\n<li><b>cgroup (Control Group)</b>：实现资源用量限制。防止某个容器占用过多资源\n  <ul>\n  <li>限制 CPU 使用率、内存上限、磁盘 I/O 带宽、网络带宽</li>\n  <li>K8s 的 <code>resources.limits</code> 底层就是 cgroup</li>\n  </ul>\n</li>\n</ul>\n<h4>一句话总结</h4>\n<p>namespace 让容器\"看到\"自己独立的世界，cgroup 让容器\"用到\"有限的资源。两者结合实现了轻量级隔离。</p>\n<div class=\"key-point\">面试追问\"容器比虚拟机不安全在哪\"——答：共享内核意味着内核漏洞可能导致容器逃逸。生产环境通常通过 seccomp、AppArmor、只读文件系统等加固。</div>",
        "id": "q-1juftm"
      }
    ]
  },
  {
    "cat": "项目场景深挖",
    "icon": "🎯",
    "color": "#e879f9",
    "items": [
      {
        "q": "「游客订单归户」是什么？购物车串单问题怎么解决的？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>游客订单归户</h4>\n<p>用户未登录时以游客身份（visitorId，通常存在 Cookie/localStorage）浏览、加购、甚至下单。用户登录/注册后，需要将游客期间的数据归属到用户账号</p>\n<pre><code>func MergeVisitorData(userId uint, visitorId string) error {\n    // 1. 合并购物车\n    visitorCart := getCartByVisitorId(visitorId)\n    userCart := getCartByUserId(userId)\n    mergedCart := mergeCartItems(userCart, visitorCart)\n    saveCart(userId, mergedCart)\n\n    // 2. 关联历史订单\n    db.Model(&Order{}).\n        Where(\"visitor_id = ? AND user_id = 0\", visitorId).\n        Update(\"user_id\", userId)\n\n    // 3. 清理游客数据\n    deleteVisitorCart(visitorId)\n    return nil\n}</code></pre>\n<h4>购物车串单问题</h4>\n<p>场景：游客 A 和游客 B 在同一浏览器（如公用电脑），购物车勾选列表可能串到另一个人</p>\n<pre><code>// 问题根因：勾选状态存在 Redis，key 只用了 visitorId\n// 但 visitorId 的 Cookie 可能被多人共享\n\n// 解决方案：\n// 1. 勾选列表绑定 session（而非 visitorId）\n// 2. 登录后立即清除游客态的勾选状态\n// 3. 切换用户时重置购物车勾选\nfunc (c *CartService) GetCheckedItems(ctx context.Context) []CartItem {\n    sessionId := getSessionId(ctx)  // 绑定 session 而非 visitor\n    checkedIds := redis.SMembers(\"cart_checked:\" + sessionId)\n    return filterByIds(c.GetAll(ctx), checkedIds)\n}</code></pre>\n<div class=\"project-link\">简历关联：通过 visitorId 透传完成登录注册后历史订单与购物车的自动关联，并解决购物车勾选列表游客串单问题</div>",
        "id": "q-1x4gxxf"
      },
      {
        "q": "第三方平台商品导入：图片去重和异步下载重试机制怎么实现？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>图片去重</h4>\n<pre><code>// 基于图片 URL 的 MD5 去重\nfunc DeduplicateImages(images []string) []string {\n    seen := make(map[string]bool)\n    result := make([]string, 0)\n    for _, url := range images {\n        hash := md5.Sum([]byte(url))\n        key := hex.EncodeToString(hash[:])\n        if !seen[key] {\n            seen[key] = true\n            result = append(result, url)\n        }\n    }\n    return result\n}\n\n// 更严格：下载后对图片内容做 perceptual hash，避免同图不同 URL</code></pre>\n<h4>异步下载 + 重试</h4>\n<pre><code>// Worker Pool + 指数退避重试\nfunc DownloadImages(ctx context.Context, urls []string) {\n    sem := make(chan struct{}, 5) // 5 并发\n    var wg sync.WaitGroup\n\n    for i, url := range urls {\n        wg.Add(1)\n        go func(idx int, u string) {\n            defer wg.Done()\n            sem <- struct{}{}\n            defer func() { <-sem }()\n\n            var err error\n            for retry := 0; retry < 3; retry++ {\n                err = downloadAndSave(ctx, u)\n                if err == nil {\n                    // WebSocket 推送进度\n                    pushProgress(idx, len(urls), \"success\")\n                    return\n                }\n                time.Sleep(time.Duration(1<<retry) * time.Second) // 指数退避\n            }\n            pushProgress(idx, len(urls), \"failed: \"+err.Error())\n        }(i, url)\n    }\n    wg.Wait()\n}</code></pre>\n<div class=\"project-link\">简历关联：对接 Shopify/微店 API，实现商品批量导入、图片去重与异步下载重试、WebSocket 导入进度通知</div>",
        "id": "q-2mq2hq"
      },
      {
        "q": "请介绍一下你的 go-storage 分片上传的完整流程？为什么用 io.ReadSeeker？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>分片上传三步</h4>\n<pre><code>// 1. ChunkInit — 初始化上传会话\nuploadId, err := storage.ChunkInit(\"video.mp4\", fileSize)\n// Local: 创建临时目录存放分片\n// OSS:  调用 InitiateMultipartUpload 获取 uploadId\n\n// 2. ChunkPart — 上传每个分片\nfor partNum := 1; partNum <= totalParts; partNum++ {\n    reader := io.NewSectionReader(file, offset, chunkSize)\n    err := storage.ChunkPart(uploadId, partNum, reader)\n    // Local: 写入 tmp/{uploadId}/part_{partNum}\n    // OSS:  调用 UploadPart\n}\n\n// 3. ChunkComplete — 合并分片\nurl, err := storage.ChunkComplete(uploadId)\n// Local: 按顺序合并所有分片文件，删除临时目录\n// OSS:  调用 CompleteMultipartUpload</code></pre>\n<h4>为什么用 io.ReadSeeker / io.ReadCloser</h4>\n<ul>\n<li><code>io.ReadSeeker</code>：支持 <code>Seek()</code>，OSS SDK 需要在失败重试时重新定位到分片起始位置重新读取</li>\n<li><code>io.ReadCloser</code>：用于流式传输场景，读完即释放，不需要缓冲整个文件到内存</li>\n<li>使用标准接口而非 <code>[]byte</code>，支持大文件（如几 GB 的视频）不占内存</li>\n</ul>",
        "id": "q-1dqlfpk"
      },
      {
        "q": "你如何从零构建 AI Agent 应用模块？任务编排和错误处理怎么做？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>整体架构</h4>\n<pre><code>用户请求 → API → 创建异步任务 (Asynq)\n                        ↓\n              Task Worker 执行 AI 调用\n                        ↓\n              WebSocket 推送实时状态\n                        ↓\n              结果入库 → 用户编辑 → 一键应用</code></pre>\n<h4>任务编排</h4>\n<pre><code>// AI 文章生成任务链\nfunc HandleArticleGeneration(ctx context.Context, t *asynq.Task) error {\n    taskId := getTaskId(t)\n    pushStatus(taskId, \"generating\")    // WS 推送\n\n    // 1. 调用 AI API 生成文章\n    result, err := aiClient.Generate(ctx, prompt)\n    if err != nil {\n        pushStatus(taskId, \"error\", mapError(err))  // 错误映射\n        return err\n    }\n\n    // 2. 存储生成结果（草稿状态）\n    saveAsDraft(taskId, result)\n    pushStatus(taskId, \"completed\", result.Summary)\n    return nil\n}\n\n// SEO 优化建议：生成 → 用户编辑 → 一键应用\nfunc HandleSEOOptimization(ctx context.Context, t *asynq.Task) error {\n    product := getProduct(t)\n    suggestions := aiClient.GenerateSEO(ctx, product)\n    // 生成 title/description/keywords 建议\n    // 用户在前端编辑确认后，调用 apply 接口一键更新\n    saveSuggestions(product.Id, suggestions)\n    return nil\n}</code></pre>\n<h4>错误映射</h4>\n<pre><code>// AI 接口错误 → 用户友好提示\nfunc mapError(err error) string {\n    switch {\n    case errors.Is(err, context.DeadlineExceeded):\n        return \"AI 生成超时，请稍后重试\"\n    case isRateLimitError(err):\n        return \"请求频率过高，请 1 分钟后重试\"\n    case isTokenLimitError(err):\n        return \"内容过长，请缩短输入\"\n    default:\n        return \"生成失败，请重试\"\n    }\n}</code></pre>\n<div class=\"project-link\">简历关联：从零构建 AI Agent 应用模块，AI 文章定时生成 + 产品 SEO 优化建议生成→用户编辑→一键应用，WebSocket 实时状态推送与错误映射</div>",
        "id": "q-teeahw"
      },
      {
        "q": "为什么选择 Go + PHP 混合架构而不是纯 Go？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>核心原因</h4>\n<ul>\n<li><b>Go</b> 负责高并发、长连接、任务调度和网关层，适合扛流量和做基础设施能力</li>\n<li><b>PHP</b> 负责插件系统、动态业务逻辑和电商场景下快速迭代，生态成熟、业务团队改动成本低</li>\n</ul>\n<h4>为什么不是纯 Go</h4>\n<ul>\n<li>纯 Go 当然能做，但会推高业务改造成本，尤其是已有 PHP 插件和后台逻辑已经很重的时候</li>\n<li>混合架构的目标不是追求技术纯度，而是在性能、迭代速度和迁移成本之间取平衡</li>\n</ul>\n<h4>落地方式</h4>\n<p>系统采用 Go 作为高性能网关层，PHP 作为灵活业务层，通过 RPC 桥接。这样既能利用 Go 的并发性能，又能保留 PHP 生态对电商插件和模板体系的支持。</p>\n<div class=\"project-link\">简历关联：Shoply 采用 Go + PHP 双引擎架构，Go 侧承接性能敏感链路，PHP 侧承接高频业务迭代。</div>",
        "id": "q-1logdyo"
      },
      {
        "q": "Checkout 八步计算管道的执行顺序是什么？为什么不能随便调整？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>标准执行顺序</h4>\n<ol>\n<li><code>prepareBaseItems</code>：预校验商品、库存和原价</li>\n<li><code>applyPromotions</code>：计算活动满减</li>\n<li><code>applyCoupons</code>：计算优惠券</li>\n<li><code>applyExternalDiscounts</code>：计算联盟或外部折扣</li>\n<li><code>applyShipping</code>：基于折后金额判断运费和免邮门槛</li>\n<li><code>applyTax</code>：基于配置和折后金额计算税费</li>\n<li><code>summarize</code>：汇总金额、处理精度补偿和改价容错</li>\n<li><code>applyCurrency</code>：最后统一做多币种换算</li>\n</ol>\n<h4>为什么顺序不能乱</h4>\n<ul>\n<li>优惠必须先算，否则运费免邮门槛会基于错误的金额判断</li>\n<li>税费通常依赖折后金额，且某些场景运费也要参与计税</li>\n<li>汇率转换必须最后做，否则每一步都换算会放大精度误差</li>\n</ul>\n<div class=\"key-point\">面试加分：这个题本质在考你能不能把复杂结算逻辑拆成可测试、可组合、可解释的 Pipeline。</div>",
        "id": "q-1mw1c5q"
      },
      {
        "q": "Capability 套餐能力控制系统是怎么设计的？为什么用 Assert 模式？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>三层模型</h4>\n<ul>\n<li><b>Plan</b>：套餐定义，如 Free / Pro / Enterprise</li>\n<li><b>Quota</b>：资源上限，如商品数、员工数、自定义域名数</li>\n<li><b>Feature</b>：布尔能力开关，如某些高级功能是否启用</li>\n</ul>\n<h4>运行时校验</h4>\n<p>调用 <code>Assert*</code> 方法时先加载当前店铺套餐快照，再读取真实资源用量，判断 <code>used + incoming &lt;= limit</code> 是否成立；超限则记录日志并返回业务错误。</p>\n<h4>为什么不用统一中间件</h4>\n<ul>\n<li>不同资源的校验时机不同，创建商品、绑定域名、触发召回任务分别发生在不同业务点</li>\n<li>Assert 模式调用点清晰，日志里还能通过 <code>source</code> 参数追踪到底是哪个入口触发的</li>\n<li>对复杂业务来说，这比“所有请求都过一层中间件”更精确也更容易维护</li>\n</ul>\n<div class=\"project-link\">简历关联：Shoply 的套餐系统采用 Plan + Quota + Feature 三层模型，并通过 Assert 模式做增量拦截。</div>",
        "id": "q-123b1zo"
      },
      {
        "q": "UUFind 的跨平台商品统一标识是怎么设计的？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>问题背景</h4>\n<p>1688、淘宝、Shopify 等平台的商品 ID 体系不同，直接拿原始平台 ID 做主键会导致跨平台聚合、去重和回显都很难统一。</p>\n<h4>设计思路</h4>\n<ul>\n<li>定义平台无关的统一商品实体，如 <code>UufindProduct</code>，作为内部主标识</li>\n<li>各平台原始商品通过关联表映射到统一实体，例如记录平台类型、平台商品 ID、店铺信息和同步状态</li>\n<li>查询时优先命中统一实体，再按平台信息回查原始详情，实现聚合展示和二次加工</li>\n</ul>\n<h4>好处</h4>\n<ul>\n<li>同一商品可以挂多个来源，方便做比价、聚合和去重</li>\n<li>上层业务不需要关心各平台字段差异，只依赖统一模型</li>\n<li>后续新增平台时，只要新增映射层，不需要改核心业务模型</li>\n</ul>\n<div class=\"project-link\">简历关联：UUFind 通过统一商品标识模型，把多平台原始商品映射到同一业务实体，支撑聚合检索和数据治理。</div>",
        "id": "q-esz930"
      },
      {
        "q": "Prompt Engineering 的基本技巧有哪些？Few-shot、Chain-of-Thought、ReAct 分别适合什么场景？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>三种常见技巧</h4>\n<ul>\n<li><b>Few-shot</b>：给模型几个输入输出示例，适合让输出格式更稳定</li>\n<li><b>Chain-of-Thought</b>：引导模型分步推理，适合复杂推导、规划和解释型任务</li>\n<li><b>ReAct</b>：让模型在“思考”和“调用工具”之间交替进行，适合 Agent 场景</li>\n</ul>\n<h4>工程上怎么用</h4>\n<ul>\n<li>结构化输出任务优先用 Few-shot + JSON 约束</li>\n<li>复杂任务拆解优先用分步提示和中间状态</li>\n<li>需要查资料、算结果、调接口时，用 ReAct 或工具调用链</li>\n</ul>\n<div class=\"project-link\">简历关联：你的 AI Agent 模块如果要稳定生成文章或 SEO 建议，核心不是“提示词越长越好”，而是提示策略和工具编排要匹配任务。</div>",
        "id": "q-10vccg3"
      },
      {
        "q": "LLM 应用里的 RAG 架构是什么？为什么它常常比直接长上下文更实用？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>标准流程</h4>\n<ol>\n<li>文档切块并生成 Embedding</li>\n<li>把向量存到向量库，如 pgvector、Milvus、Weaviate</li>\n<li>用户提问时先做 Query Embedding</li>\n<li>召回最相关片段，拼接到 Prompt 里</li>\n<li>LLM 基于检索到的上下文生成回答</li>\n</ol>\n<h4>为什么常比直接塞长上下文更实用</h4>\n<ul>\n<li>上下文窗口有限，RAG 能把真正相关的信息捞出来</li>\n<li>文档更新时只要重建索引，不必频繁改 Prompt</li>\n<li>更容易做来源引用、权限隔离和内容审计</li>\n</ul>\n<h4>常见坑</h4>\n<ul>\n<li>切块太大导致召回不准，太小又缺上下文</li>\n<li>Embedding 模型和业务语料不匹配</li>\n<li>只做召回不做重排，导致最终上下文质量不稳</li>\n</ul>",
        "id": "q-gebpar"
      },
      {
        "q": "AI 大模型推理部署方案里，vLLM、TGI、Triton 分别适合什么场景？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>三个常见方案</h4>\n<ul>\n<li><b>vLLM</b>：面向 LLM 推理做了高吞吐优化，核心优势是 PagedAttention，适合大模型高并发服务</li>\n<li><b>TGI (Text Generation Inference)</b>：Hugging Face 出的推理服务框架，生态友好，适合快速接入开源模型</li>\n<li><b>Triton Inference Server</b>：NVIDIA 的通用推理服务框架，不只做 LLM，也适合 CV、语音、多模型统一服务</li>\n</ul>\n<h4>怎么选</h4>\n<ul>\n<li>要极致 LLM 吞吐，优先考虑 vLLM</li>\n<li>要 Hugging Face 模型快速上线，TGI 很顺手</li>\n<li>要统一管理多类模型、做企业级推理平台，Triton 更合适</li>\n</ul>\n<div class=\"key-point\">面试官真正想听的是：你知道它们不是“谁更高级”，而是针对不同推理目标的工程取舍。</div>",
        "id": "q-1xgzadm"
      },
      {
        "q": "Dify 和 LangChain 这类 AI 应用开发框架有什么区别？怎么选？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>定位差异</h4>\n<ul>\n<li><b>LangChain</b> 更像开发框架，适合工程师在代码里编排链路、工具和 Agent</li>\n<li><b>Dify</b> 更像低代码 AI 应用平台，适合快速搭建工作流、知识库和对话应用</li>\n</ul>\n<h4>选择依据</h4>\n<ul>\n<li>如果团队偏工程化、需要深度定制，LangChain 更灵活</li>\n<li>如果团队更看重快速交付和产品同学参与，Dify 更省时间</li>\n<li>复杂场景里也常见组合用法：上层产品流程用 Dify，底层复杂能力自己写服务</li>\n</ul>\n<div class=\"project-link\">简历关联：如果你已经做过 AI Agent 模块，这题最好顺手补一句：框架只是壳，真正难的是上下文管理、工具编排、异常处理和观测。</div>",
        "id": "q-ewu3mp"
      },
      {
        "q": "LangChain 的核心概念是什么？Chain、Agent、Tool、Memory 分别怎么理解？",
        "diff": "easy",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>四个核心概念</h4>\n<ul>\n<li><b>Chain</b>：把多个步骤串起来，例如“用户输入 → 检索上下文 → 组装 Prompt → 调模型”</li>\n<li><b>Agent</b>：让模型自己决定下一步调用哪个 Tool 或走哪条链路</li>\n<li><b>Tool</b>：模型可调用的外部能力，比如搜索、数据库查询、计算器、HTTP API</li>\n<li><b>Memory</b>：对话或任务上下文的记忆层，用来保留历史信息</li>\n</ul>\n<h4>怎么区分</h4>\n<p>Chain 是固定流程，Agent 是动态决策；Tool 是能力接口，Memory 是上下文状态。</p>\n<div class=\"project-link\">简历关联：如果你已经做过 AI Agent 模块，这题要体现你知道“框架概念”背后对应的是任务编排、工具调用和上下文管理。</div>",
        "id": "q-o9wizi"
      },
      {
        "q": "跨境电商独立站的核心技术挑战有哪些？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>几个真正难的点</h4>\n<ul>\n<li><b>多币种与汇率</b>：展示币种、结算币种、对账币种可能都不同，精度和换算链路容易出错</li>\n<li><b>税费与合规</b>：价内税、价外税、不同国家法规和 GDPR 这类要求不能统一用一套规则硬套</li>\n<li><b>国际物流</b>：运费报价、时效、地区匹配和追踪链路复杂</li>\n<li><b>支付网关多样化</b>：不同国家用户习惯和风控规则不同，支付链路很容易碎片化</li>\n<li><b>全球访问性能</b>：需要 CDN、静态资源优化和多区域基础设施支撑</li>\n<li><b>反欺诈</b>：刷单、盗刷、羊毛党和代理流量识别都是独立挑战</li>\n</ul>\n<div class=\"project-link\">简历关联：你的项目在多币种、税费、支付网关、WAF 和营销召回上都可以拿来支撑这道题。</div>",
        "id": "q-leyruw"
      },
      {
        "q": "Agent 项目里怎么做框架选型？LangChain、轻量编排、自研流程各自的取舍是什么？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>不要把框架选型答成“哪个更火”</h4>\n<ul>\n<li><b>LangChain</b>：生态成熟、组件齐全、上手快，适合快速搭原型或中小规模 Agent 编排</li>\n<li><b>轻量编排框架</b>：抽象更少、启动更轻、定制更灵活，适合你已经知道核心流程、不想被重框架绑住的场景</li>\n<li><b>自研流程</b>：适合核心链路已经非常明确，且你需要强控制、强观测、强定制的时候</li>\n</ul>\n<h4>真实取舍点</h4>\n<ul>\n<li>LangChain 的优势是快，但缺点往往是抽象层多、链路重、问题定位绕</li>\n<li>轻量方案更适合生产长期维护，但前提是团队对 Agent 流程有足够清晰的建模</li>\n<li>自研不代表“更高级”，而是你愿意承担更多基础设施和演进成本</li>\n</ul>\n<h4>怎么答得更像工程师</h4>\n<p>一个高质量回答要落到业务：POC 阶段可能先用 LangChain 快速验证，等链路稳定后，把核心流程收敛成自研或轻量编排层，只保留真正需要的插件能力。</p>\n<div class=\"key-point\">面试官真正想听的是你理解框架 trade-off，而不是会背某个框架的 API。</div>",
        "id": "q-7b1rcb"
      },
      {
        "q": "AI Agent 最常见的失败场景有哪些？工具调用失败、上下文溢出、目标漂移怎么治理？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>三个高频失败场景</h4>\n<ul>\n<li><b>工具调用失败</b>：LLM 生成的参数格式不对、字段缺失、调用结果不符合预期</li>\n<li><b>上下文溢出</b>：对话轮数变长后，Agent 忘记之前的关键约束和历史状态</li>\n<li><b>目标漂移</b>：任务执行越走越偏，输出和原始目标不再一致</li>\n</ul>\n<h4>治理手段</h4>\n<ul>\n<li><b>工具调用失败</b>：加参数校验层，非法参数先拦住；可恢复错误让模型重试，不可恢复错误直接走兜底逻辑</li>\n<li><b>上下文溢出</b>：做摘要压缩、sliding window、长期记忆抽取，不要把所有历史生硬塞进上下文</li>\n<li><b>目标漂移</b>：每一步都显式保留目标约束，阶段性做自检或反思，必要时重新规划</li>\n</ul>\n<h4>工程上要补的东西</h4>\n<ul>\n<li>结构化日志：至少能看到用户输入、工具调用、模型输出和最终结果</li>\n<li>失败分类：区分模型问题、工具问题、数据问题、上下文问题</li>\n<li>人工兜底：关键链路不能让 Agent 无限制重试到天荒地老</li>\n</ul>\n<div class=\"key-point\">现在 AI Agent 岗很爱问这题，因为它能直接区分“做过 Demo”和“做过真实可恢复系统”的差别。</div>",
        "id": "q-1s90v9j"
      },
      {
        "q": "ReAct、CoT、ToT 这些规划方法怎么选？线上效果和成本怎么权衡？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>三个方法各自适合什么</h4>\n<ul>\n<li><b>CoT (Chain-of-Thought)</b>：适合让模型按步骤解释推理过程，适用于中等复杂度问题</li>\n<li><b>ReAct</b>：适合需要一边思考一边调用工具的任务，比如检索、查询、执行动作</li>\n<li><b>ToT (Tree-of-Thought)</b>：适合需要探索多条候选路径再选最优解的复杂规划问题</li>\n</ul>\n<h4>为什么线上不一定选最强的</h4>\n<ul>\n<li>CoT 相对稳定，成本可控，适合大部分中等复杂任务</li>\n<li>ReAct 在线上最常见，因为它兼顾了推理和工具调用</li>\n<li>ToT 效果可能更好，但 token 成本、延迟和实现复杂度都会明显上升</li>\n</ul>\n<h4>怎么答出 trade-off</h4>\n<p>高质量回答不只是背概念，而是说：我试过哪些方法，准确率提升多少、成本增加多少、最终为什么选择某种方案在线上落地。</p>\n<div class=\"key-point\">如果你能补一句“线上先看稳定性和成本，再看理论最优”，会比单纯背方法名更像做过生产系统。</div>",
        "id": "q-zff9w4"
      },
      {
        "q": "面向企业客服的 AI Agent 怎么做分层架构、记忆设计和幻觉防控？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>一个生产可用的分层思路</h4>\n<pre><code>接入层       → 网页 / App / 企微 / 公众号\n对话管理层   → 会话状态、多轮上下文、意图识别\nAgent 核心层 → 规划、工具调用、反思、记忆\n工具层       → 知识库检索、工单系统、用户信息、物流查询\n输出管控层   → 敏感词过滤、内容审核、话术规范</code></pre>\n<h4>记忆怎么设计</h4>\n<ul>\n<li><b>短期记忆</b>：当前会话上下文，通常放 Redis，设置过期时间</li>\n<li><b>长期记忆</b>：用户画像、历史问题总结、偏好信息，放向量库或业务库，需要时召回</li>\n<li>不要把“所有历史”都当长期记忆，应该做抽取、压缩和业务归档</li>\n</ul>\n<h4>幻觉怎么防控</h4>\n<ul>\n<li><b>RAG</b>：让回答尽量基于知识库，而不是放任模型胡编</li>\n<li><b>置信度校验</b>：没把握就转人工，不要强答</li>\n<li><b>事实核查</b>：把生成结果和检索原文做比对，不一致就打回</li>\n<li><b>人工复核</b>：金融、医疗、售后争议等高风险场景要有人兜底</li>\n</ul>\n<div class=\"key-point\">这题不是考你会不会画一个大图，而是看你知不知道企业级 Agent 的核心不是“能回答”，而是“能控风险、能追踪、能接管”。</div>",
        "id": "q-1vy0rvs"
      },
      {
        "q": "AI 训练数据的清洗管道怎么设计？后端工程师在里面负责什么？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>数据清洗管道的典型流程</h4>\n<pre><code>数据采集 → 格式统一 → 去重去噪 → 标注/校验 → 质量评估 → 入库/交付</code></pre>\n<ul>\n<li><b>数据采集</b>：从多源拉取（API、爬虫、日志、数据库导出），统一写入消息队列或对象存储</li>\n<li><b>格式统一</b>：编码归一、字段映射、时间格式标准化、多语言处理</li>\n<li><b>去重去噪</b>：基于内容哈希或 SimHash 去重；过滤无效数据（空值、乱码、过短文本）</li>\n<li><b>质量评估</b>：抽样人工校验 + 自动化规则检查（覆盖率、一致性、完整性）</li>\n</ul>\n<h4>后端工程师的职责</h4>\n<ul>\n<li>构建稳定的数据处理管道（Kafka + Worker Pool / Flink）</li>\n<li>设计任务调度和重试机制，保证幂等和断点续跑</li>\n<li>管理数据版本和血缘关系，知道每批数据从哪来、经过什么处理</li>\n<li>提供 API 给标注团队和模型训练侧消费清洗后的数据</li>\n</ul>\n<h4>和普通业务 ETL 的区别</h4>\n<ul>\n<li>AI 数据清洗对质量的要求更高——脏数据进模型，训练结果直接崩</li>\n<li>数据量通常更大，需要分布式处理能力</li>\n<li>需要支持「人在回路」（Human-in-the-Loop），标注和校验环节有人工介入</li>\n</ul>\n<div class=\"key-point\">面试不会让你讲模型训练，而是看你能不能把数据管道讲清楚：采集、清洗、调度、质量保障、交付，这些全是后端能力。</div>",
        "id": "q-ai1etl"
      },
      {
        "q": "Redis 的内部实现机制有哪些值得深入了解的？渐进式 rehash、过期策略、内存淘汰怎么讲？",
        "diff": "hard",
        "tags": [],
        "a": "<h4>渐进式 Rehash</h4>\n<ul>\n<li>Redis 的 dict 使用两个哈希表（ht[0] 和 ht[1]），扩容时不会一次性迁移所有 key</li>\n<li>每次读写操作顺带迁移一部分（分摊到每次命令），避免长时间阻塞</li>\n<li>rehash 期间，查询先查 ht[0]，miss 再查 ht[1]；写入直接写 ht[1]</li>\n</ul>\n<h4>过期策略</h4>\n<ul>\n<li><b>惰性删除</b>：访问 key 时检查是否过期，过期才删——省 CPU 但可能有内存浪费</li>\n<li><b>定期删除</b>：每 100ms 随机抽查一批 key，删除已过期的——平衡 CPU 和内存</li>\n<li>两种策略配合使用，既不会漏删太多，也不会占太多 CPU</li>\n</ul>\n<h4>内存淘汰策略</h4>\n<ul>\n<li><code>noeviction</code>：内存满了直接报错（默认）</li>\n<li><code>allkeys-lru</code>：在所有 key 中淘汰最近最少使用的</li>\n<li><code>volatile-lru</code>：只在有过期时间的 key 中做 LRU 淘汰</li>\n<li><code>allkeys-lfu</code>：基于访问频率淘汰（Redis 4.0+），比 LRU 更准确</li>\n<li><code>volatile-ttl</code>：优先淘汰 TTL 最短的 key</li>\n</ul>\n<h4>其他值得了解的内部机制</h4>\n<ul>\n<li><b>SDS（Simple Dynamic String）</b>：预分配 + 惰性释放，避免频繁内存分配</li>\n<li><b>ziplist → listpack</b>：小数据量时的紧凑编码，省内存</li>\n<li><b>IO 多路复用</b>：单线程 + epoll 事件循环处理所有连接</li>\n</ul>\n<div class=\"key-point\">这题在外企面试中很常见——不是问你会不会用 SET/GET，而是看你理不理解 Redis 为什么快、内存怎么管、扩容怎么做到不阻塞。</div>",
        "id": "q-rd1int"
      },
      {
        "q": "为什么用 Go 做 SSR 而不是 Node.js？主题系统的核心模块和缓存怎么设计？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>为什么选 Go 做 SSR</h4>\n<ul>\n<li><b>性能</b>：Go 的并发模型天然适合高并发 SSR，不需要 Node.js 的 cluster 管理</li>\n<li><b>部署简单</b>：单一 Go 二进制包含所有能力，不需要额外维护 Node.js 进程</li>\n<li><b>资源消耗低</b>：SaaS 场景下多个租户共享进程，Go 的内存占用远低于 Node.js</li>\n</ul>\n<h4>主题系统核心模块</h4>\n<ul>\n<li><b>Theme（主题管理）</b>：主题 CRUD、文件扫描、截图缓存</li>\n<li><b>Components（组件注册）</b>：可视化编辑器的组件库，注册渲染函数</li>\n<li><b>Nodes（节点树）</b>：页面由组件节点树构成，支持拖拽编辑</li>\n<li><b>DIY（自定义页面）</b>：商家自由搭建的页面，独立于主题模板</li>\n<li><b>Cache（渲染缓存）</b>：主题渲染结果缓存，避免重复编译模板</li>\n</ul>\n<h4>智能渲染切换</h4>\n<p>SSR 中间件根据主题的 <code>Runtime</code> 配置智能切换：<code>ThemeRuntimeStatic</code> 走静态文件直出（纯 HTML），<code>ThemeRuntimeDynamic</code> 走 Go 模板引擎实时渲染。静态模式性能更好，动态模式支持个性化内容。</p>\n<div class=\"project-link\">简历关联：go-fast 框架主题系统支持组件注册渲染、节点树管理、DIY 自定义页面、主题缓存，Go 层直接实现 SSR 服务端渲染</div>\n<div class=\"key-point\">面试追问\"为什么不用 Next.js / Nuxt.js\"：SaaS 多租户场景下几千个店铺共享进程，Go 单二进制 + 低内存占用的运维优势远大于前端框架的生态优势。</div>",
        "id": "q-5gq8ts"
      },
      {
        "q": "积分系统为什么用 Builder 模式？事务内行锁怎么保证余额一致性？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>为什么用 Builder 模式</h4>\n<p>积分变更涉及多个参数组合（credits/points/ruleCode/ruleId/userId/remark），不同业务场景需要传入的参数不同。Builder 模式的好处：</p>\n<pre><code>NewCredit(db).\n    WithCredits(10).\n    WithPoints(50).\n    WithRuleCode(\"order_complete\").\n    WithUserId(uid).\n    Do()</code></pre>\n<ul>\n<li><b>可读性</b>：链式调用语义清晰，一眼看出这次操作做了什么</li>\n<li><b>灵活性</b>：只传需要的参数，不用构造一个大 struct 填一堆零值</li>\n<li><b>校验内聚</b>：<code>Do()</code> 内部统一校验必填参数，外部无需关心校验逻辑</li>\n</ul>\n<h4>事务内行锁保证一致性</h4>\n<pre><code>func (b *CreditBuilder) Do() error {\n    return b.db.Transaction(func(tx *gorm.DB) error {\n        // 1. SELECT FOR UPDATE 锁定用户行\n        var user User\n        tx.Clauses(clause.Locking{Strength: \"UPDATE\"}).\n            First(&user, b.userId)\n        // 2. 幂等校验：sourceId 防重复发放\n        if exists(tx, b.sourceId) { return nil }\n        // 3. 计算新余额，校验不能透支\n        newBalance := user.Credits + b.credits\n        if newBalance < 0 { return ErrInsufficientCredits }\n        // 4. 更新余额 + 写流水日志\n        tx.Model(&user).Update(\"credits\", newBalance)\n        tx.Create(&CreditLog{...})\n        return nil\n    })\n}</code></pre>\n<h4>关键设计点</h4>\n<ul>\n<li><b>行锁</b>：<code>SELECT FOR UPDATE</code> 锁住当前用户行，防止并发修改余额不一致</li>\n<li><b>幂等</b>：<code>sourceId</code> 唯一校验，同一笔订单不会重复发放积分</li>\n<li><b>事务包裹</b>：余额更新和流水日志在同一事务中，失败自动回滚</li>\n</ul>\n<div class=\"project-link\">简历关联：Shoply 用户积分系统，Builder 模式封装积分变更操作，事务内行锁保证余额一致性，sourceId 幂等校验防止重复发放</div>",
        "id": "q-a0qyy2"
      },
      {
        "q": "企业级 AI 模型管理平台需要解决什么问题？统一接入、Key 管控、多模型路由怎么做？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>为什么需要统一管理</h4>\n<p>企业接入多个 AI 模型（OpenAI/Claude/国产大模型），如果每个业务自己对接，会出现：Key 散落各处无法审计、成本无法管控、模型切换需要改代码、缺乏统一的限流和监控。</p>\n<h4>核心能力</h4>\n<ul>\n<li><b>统一接入层</b>：对外暴露标准化 API（通常兼容 OpenAI 格式），内部转发到不同模型提供商。业务方不需要关心底层用的是哪个模型</li>\n<li><b>Key 集中管控</b>：所有 API Key 集中存储和轮转，业务方通过内部 token 认证，不直接持有外部 Key</li>\n<li><b>多模型路由</b>：按场景（翻译/生成/摘要）、成本（便宜模型优先 + 复杂任务用强模型）、可用性（某个模型超时自动 fallback）动态路由</li>\n<li><b>成本控制</b>：按团队/项目设置 token 配额和预算告警，统计每次调用的 token 消耗</li>\n<li><b>可观测性</b>：记录每次调用的模型、耗时、token 数、错误率，接入监控和告警</li>\n</ul>\n<h4>两种架构模式</h4>\n<ul>\n<li><b>项目内嵌式</b>：在业务服务中直接封装模型调用模块，适合单一项目</li>\n<li><b>平台网关式</b>：独立部署 AI 网关服务，所有业务统一接入，适合多团队多项目</li>\n</ul>\n<div class=\"project-link\">简历关联：你有 AI Agent 后端落地经验，理解模型调用链路。面试时可以结合你的 WebSocket 实时状态推送 + 异步任务编排来说明 AI 模块怎么和后端系统集成</div>\n<div class=\"key-point\">面试新趋势：企业不是要你训练模型，而是看你能不能管理模型调用。这个角度比\"会用 LangChain\"更贴近实际岗位需求。</div>",
        "id": "q-5c8mut"
      },
      {
        "q": "你的项目 QPS 大概是多少？遇到的最大技术挑战是什么？如果重新设计你会改什么？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>这三个问题几乎每场面试都会问</h4>\n<p>它们考察的不是标准答案，而是你对自己项目的理解深度和反思能力。</p>\n<h4>QPS 怎么答</h4>\n<ul>\n<li>如果有监控数据，直接说：日常 QPS XX，峰值 QPS XX，P99 延迟 XXms</li>\n<li>如果没有精确数据，按合理估算：日活用户 × 平均请求数 ÷ 活跃时长秒数</li>\n<li>关键是能说清<b>瓶颈在哪</b>：是数据库、缓存、还是下游依赖</li>\n<li>不要凭空编大数字，面试官一追问就会穿帮</li>\n</ul>\n<h4>最大技术挑战怎么答（STAR 结构）</h4>\n<ul>\n<li><b>Situation</b>：什么背景下遇到了什么问题</li>\n<li><b>Task</b>：你需要解决什么</li>\n<li><b>Action</b>：你具体做了什么（技术方案 + 为什么选这个方案）</li>\n<li><b>Result</b>：结果如何（最好有量化数据）</li>\n</ul>\n<p>比如：多币种精度问题 → 从 float 迁移到 decimal → 配合残差补偿算法 → 财务对账零差异</p>\n<h4>重新设计会改什么（反思能力）</h4>\n<p>这题答得好会非常加分。可以从以下角度思考：</p>\n<ul>\n<li>当初因为赶工妥协了什么？现在会怎么做？</li>\n<li>哪些模块耦合度太高？会怎么拆？</li>\n<li>哪些技术选型现在看来不是最优？</li>\n<li>监控和可观测性当初做得够不够？</li>\n</ul>\n<div class=\"key-point\">切忌说\"我觉得现在设计已经很好了不需要改\"——面试官要的是你的反思和成长能力，而不是自满。</div>",
        "id": "q-tdwoih"
      },
      {
        "q": "冷热迁移为什么从一次性搬运改成按日播种 + 分钟级微批续跑？参数怎么设？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>问题</h4>\n<p>原方案每日一次性迁移所有冷数据，数据量大时长事务导致 DB IO 冲击。</p>\n<h4>两阶段优化</h4>\n<ol>\n<li><b>每日播种（Seed）</b>：只标记新进入冷区的 1 天数据为待迁移</li>\n<li><b>分钟级微批续跑（Tick）</b>：每分钟执行，每次最多 2 批 × 100 条，单 tick ≤ 3 秒</li>\n</ol>\n<h4>关键参数</h4>\n<pre><code>BatchSize       = 100    // 每批 100 条\nMaxBatchPerTick = 2      // 每 tick 最多 2 批\nMaxTickDuration = 3s     // 单 tick 时长上限\nMinuteLockTTL   = 20s    // Tick 分布式锁\nSeedLockTTL     = 30s    // Seed 分布式锁</code></pre>\n<h4>断点续跑</h4>\n<p>进度存 Redis，进程异常退出 → 锁自动过期 → 下一分钟从断点续跑。</p>\n<div class=\"key-point\">核心思想：大 IO 打散成涓流，\"尖峰\"变\"均匀\"</div>",
        "id": "q-proj-coldhot-optimize"
      },
      {
        "q": "SaaS 多租户为什么用 store_id 逻辑隔离？自定义 GORM Sharding 和官方有什么区别？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>逻辑隔离 vs 物理隔离</h4>\n<p>物理隔离（每租户一个库）的问题：连接池爆炸、schema 变更逐库执行、成本高。</p>\n<p>逻辑隔离通过 <code>store_id</code> + GORM 中间件自动注入 <code>WHERE store_id = ?</code>。</p>\n<h4>自定义 Sharding</h4>\n<p>替代 <code>gorm.io/sharding</code> 的原因：</p>\n<ul>\n<li>官方插件 AutoMigrate 时 Schema 注册导致<b>空指针</b></li>\n<li>对 <code>store_id = 0</code> 全局表异常</li>\n</ul>\n<p>自定义版本：分片基于 store_id、兼容 AutoMigrate、全局表白名单跳过。</p>\n<div class=\"key-point\">推荐：基础逻辑隔离 + 高流量表 Sharding + 大客户可选物理隔离</div>",
        "id": "q-proj-saas-tenant"
      },
      {
        "q": "营销召回系统的三条任务链怎么设计的？和 SaaS 套餐能力控制怎么联动？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>三条召回链路（Asynq + Redis）</h4>\n<ul>\n<li><b>购物车召回</b>：加购未结账 → 10min 后邮件提醒</li>\n<li><b>结账页召回</b>：进入结账未支付 → 分步提醒（10min → 1h → 24h）</li>\n<li><b>订单召回</b>：下单未支付 → 支付提醒</li>\n</ul>\n<h4>执行机制</h4>\n<ul>\n<li>定时任务每 10 分钟扫描符合条件的记录</li>\n<li>创建 Asynq 任务 → Redis 队列 → Worker 消费 → 发送邮件</li>\n<li>发送前检查用户是否已完成操作（避免误发）</li>\n</ul>\n<h4>套餐联动</h4>\n<p>召回功能受 Capability 系统管控：Free 版不开放，Pro/Enterprise 开放。触发前调用 <code>AssertRecoveryEnabled()</code> 校验。</p>\n<div class=\"project-link\">简历关联：营销召回 + SaaS 能力控制闭环</div>",
        "id": "q-proj-recovery"
      },
      {
        "q": "行为面试：描述一次你独立解决复杂技术问题的经历（STAR 法）",
        "diff": "medium",
        "tags": [
          "behavior"
        ],
        "a": "<h4>推荐用 UUFind 项目（STAR 法）</h4>\n<ul>\n<li><b>S</b>：UUFind 需要聚合 1688/淘宝多渠道商品，各平台 ID 和数据结构不同</li>\n<li><b>T</b>：独立负责设计整个平台的数据模型和后端业务（210+ commits）</li>\n<li><b>A</b>：设计 UufindProduct 统一商品标识 + AgentLink 跨渠道关联；构建 ExternalGoodsService 实现 URL 实时解析落库 + 原站优先查询；引入请求级汇率缓存</li>\n<li><b>R</b>：平台上线稳定运行，商品列表响应时间显著下降</li>\n</ul>\n<h4>备选：支付串单问题</h4>\n<ul>\n<li><b>S</b>：游客在公用设备下单后，下一个游客购物车出现前人商品</li>\n<li><b>A</b>：排查发现 visitorId Cookie 未在登录时清除 → 重构归户逻辑：只归户当前 session 的 visitorId 并清除旧绑定</li>\n<li><b>R</b>：线上串单问题归零</li>\n</ul>\n<div class=\"key-point\">STAR 法：Situation 简短、Task 说清职责、Action 要具体、Result 要量化</div>",
        "id": "q-proj-star-behavior"
      },
      {
        "q": "AI 辅助编程工具（Claude Code / Cursor / Codex）在实际项目中怎么用？各自擅长什么？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>为什么面试会问这个</h4>\n<p>越来越多公司把\"会用 AI 工具\"作为硬性要求。不是问你\"知不知道有这些工具\"，而是要看你<b>日常开发中真的在用，并且能说出具体提效场景</b>。</p>\n<h4>主流 AI 编程工具定位</h4>\n<ul>\n<li><b>Claude Code (CLI)</b>：终端原生的 AI 编程助手，擅长多文件重构、代码库级别的理解、复杂 debug。适合后端工程师在终端工作流中使用</li>\n<li><b>Cursor</b>：基于 VS Code 的 AI IDE，Tab 补全 + Chat + Composer 多文件编辑。适合需要实时补全和可视化的全栈开发</li>\n<li><b>GitHub Copilot</b>：最广泛的行级补全工具，集成到各种 IDE。适合日常编码加速</li>\n<li><b>Codex (OpenAI)</b>：API 级别的代码生成能力，适合集成到自动化流水线或自定义工具中</li>\n<li><b>Gemini CLI</b>：Google 的终端 AI 工具，擅长搜索整合和代码生成</li>\n</ul>\n<h4>实际提效场景</h4>\n<ul>\n<li><b>代码生成</b>：给 AI 描述业务需求，生成 CRUD、数据模型、API 路由的初始代码，再人工审查调整</li>\n<li><b>Debug</b>：把报错信息和相关代码丢给 AI，让它分析根因并给出修复方案</li>\n<li><b>重构</b>：让 AI 理解现有代码结构后，批量重命名、拆分函数、提取公共模块</li>\n<li><b>写测试</b>：给 AI 看实现代码，让它生成 Table-Driven Tests，覆盖正常/边界/异常用例</li>\n<li><b>代码审查</b>：让 AI 审查 PR diff，找潜在 bug、性能问题、安全风险</li>\n<li><b>文档与注释</b>：给复杂函数生成清晰的文档和使用示例</li>\n</ul>\n<h4>怎么答得像真正在用</h4>\n<p>不要泛泛而谈，要举具体例子：\"上周我用 Claude Code 重构了支付模块的错误处理链路，它理解了整个 Checkout→Payment→Webhook 的调用关系，一次性把 15 个文件的错误包装统一成 fmt.Errorf + %w 格式。人工审查后只改了两处。\"</p>\n<div class=\"key-point\">核心态度：AI 是加速器不是替代品。你要展示的是\"我用 AI 提效，但我能判断 AI 的输出质量并做最终决策\"。</div>",
        "id": "q-u76ayt"
      },
      {
        "q": "AI 驱动开发的工作流是什么？从需求到代码到测试，怎么和 AI 配合？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>AI 驱动开发 ≠ 让 AI 写所有代码</h4>\n<p>AI 驱动开发是一种<b>人机协作的工作方式</b>：人负责需求理解、架构决策、质量把关；AI 负责代码生成、模式识别、重复劳动。</p>\n<h4>典型工作流（以功能开发为例）</h4>\n<ol>\n<li><b>需求理解</b>：用 AI 帮忙梳理需求文档，生成技术方案大纲，列出需要修改的文件和接口</li>\n<li><b>架构设计</b>：人做关键决策（数据模型、接口设计、技术选型），AI 辅助画图或生成设计文档</li>\n<li><b>代码实现</b>：AI 生成初始代码框架（路由、模型、基础 CRUD），人审查并补充业务逻辑</li>\n<li><b>测试编写</b>：AI 根据实现代码生成单元测试和集成测试用例</li>\n<li><b>代码审查</b>：AI 做第一轮审查（风格、安全、性能），人做最终审查</li>\n<li><b>Debug</b>：遇到问题时，把错误上下文给 AI 分析，快速定位根因</li>\n</ol>\n<h4>提效的关键不是工具，是 Prompt 质量</h4>\n<ul>\n<li><b>给足上下文</b>：不是说\"帮我写个接口\"，而是\"这是现有的 Order 模型和路由结构，我需要新增一个退款接口，要求幂等、记日志、支持 PayPal 和 Stripe 两个通道\"</li>\n<li><b>分步骤拆</b>：复杂功能拆成小步骤，每步让 AI 做一件事，逐步推进</li>\n<li><b>给约束条件</b>：代码风格、框架版本、错误处理方式、命名规范——约束越明确，输出越可用</li>\n<li><b>让 AI 解释</b>：生成代码后让它解释为什么这么写，判断它的理解是否正确</li>\n</ul>\n<h4>常见误区</h4>\n<ul>\n<li>❌ 完全信任 AI 输出，不做审查</li>\n<li>❌ 让 AI 一次性写整个模块（上下文太大，质量下降）</li>\n<li>❌ 只用 AI 写新代码，不用它做重构和测试（后者提效更大）</li>\n</ul>\n<div class=\"key-point\">面试时的核心信号：你不是\"会按按钮\"，而是\"知道什么时候该用 AI、什么时候不该，以及怎么让 AI 的输出质量更高\"。</div>",
        "id": "q-wjtvi3"
      },
      {
        "q": "Python、Go、Java 各自适合什么后端场景？出海 SaaS 技术栈怎么选？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>三种语言的后端定位</h4>\n<table>\n<tr><th>维度</th><th>Go</th><th>Python</th><th>Java</th></tr>\n<tr><td>核心优势</td><td>并发性能、部署简单、低资源占用</td><td>开发速度快、AI/ML 生态、胶水语言</td><td>企业级生态、类型安全、大团队协作</td></tr>\n<tr><td>典型场景</td><td>高并发 API、微服务网关、基础设施</td><td>AI 应用、数据处理、快速原型、脚本</td><td>大型业务系统、金融、ERP</td></tr>\n<tr><td>启动速度</td><td>毫秒级</td><td>百毫秒级</td><td>秒级（JVM 预热）</td></tr>\n<tr><td>部署体积</td><td>单二进制 ~10MB</td><td>需 Python 环境 + 依赖</td><td>JAR + JVM ~200MB+</td></tr>\n<tr><td>AI 生态</td><td>弱（调用 API 为主）</td><td>最强（PyTorch/LangChain/HuggingFace）</td><td>中（Spring AI 在追赶）</td></tr>\n<tr><td>类型系统</td><td>静态强类型</td><td>动态类型（可选 type hints）</td><td>静态强类型</td></tr>\n</table>\n<h4>出海 SaaS 技术栈选型思路</h4>\n<ul>\n<li><b>API 层 / 高并发服务</b>：Go — 扛并发、部署轻、K8s 友好</li>\n<li><b>AI 功能模块</b>：Python — 直接用 LangChain/OpenAI SDK，生态最成熟</li>\n<li><b>复杂业务中台</b>：Java — Spring Boot 生态成熟，适合大团队长期维护</li>\n<li><b>前端 + BFF</b>：Next.js / TypeScript — SSR + API Routes 一体化</li>\n</ul>\n<h4>混合架构示例</h4>\n<pre><code>Next.js (前端 + BFF)\n  ↓ HTTP / tRPC\nGo 服务 (核心 API、支付、订单)\n  ↓ gRPC / HTTP\nPython 服务 (AI 内容生成、SEO 优化)\n  ↓\nMySQL + Redis + MQ</code></pre>\n<h4>结合你的经历怎么讲</h4>\n<p>Shoply 平台用 Go + PHP 混合架构，Go 扛高并发和核心链路，PHP 做灵活业务插件。如果面向 AI 驱动的 SaaS，Python 可以替代 PHP 的角色——做 AI 功能模块，而 Go 继续承担性能敏感的核心服务。</p>\n<div class=\"key-point\">面试核心观点：不存在\"一种语言适合所有场景\"，技术选型要看业务特征、团队能力和生态需求。能说清每种语言的边界，比只精通一种更有价值。</div>",
        "id": "q-7zioa5"
      },
      {
        "q": "后端怎么集成 LLM API（OpenAI / Claude）？流式输出、错误重试、成本控制怎么做？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>基本集成架构</h4>\n<pre><code>客户端 → 后端 API → LLM Provider (OpenAI/Claude/国产模型)\n         ↓\n  统一适配层（标准化请求/响应格式）\n         ↓\n  流式输出（SSE/WebSocket → 前端逐字显示）</code></pre>\n<h4>流式输出（Streaming）实现</h4>\n<ul>\n<li><b>后端</b>：调用 LLM API 时设置 <code>stream: true</code>，逐块读取响应</li>\n<li><b>传给前端</b>：用 <b>SSE (Server-Sent Events)</b> 逐块推送，前端用 <code>EventSource</code> 接收</li>\n<li>为什么不用 WebSocket：SSE 更简单，单向推送足够，且 HTTP/2 下复用连接</li>\n</ul>\n<pre><code>// Go 后端 SSE 流式推送示例\nw.Header().Set(\"Content-Type\", \"text/event-stream\")\nw.Header().Set(\"Cache-Control\", \"no-cache\")\nfor chunk := range llmStream {\n    fmt.Fprintf(w, \"data: %s\\n\\n\", chunk)\n    w.(http.Flusher).Flush()\n}</code></pre>\n<h4>错误处理与重试</h4>\n<ul>\n<li><b>超时控制</b>：LLM 响应慢（首 token 可能 2-5 秒），超时设长一些（30-60s），但要有上限</li>\n<li><b>重试策略</b>：429 (Rate Limit) 指数退避重试；500 系列最多重试 2 次；400 系列（Prompt 问题）不重试</li>\n<li><b>模型降级</b>：主模型超时/报错时自动 fallback 到备用模型（如 Claude → GPT-4 → GPT-3.5）</li>\n<li><b>幂等保证</b>：同一请求重试时用相同的 request_id，避免重复计费</li>\n</ul>\n<h4>成本控制</h4>\n<ul>\n<li><b>Token 计量</b>：每次请求记录 input/output token 数，按用户/项目聚合统计</li>\n<li><b>配额管理</b>：按团队设 token 月度预算，接近上限时告警</li>\n<li><b>缓存</b>：相同 Prompt 的结果做语义缓存（Embedding 相似度匹配），避免重复调用</li>\n<li><b>Prompt 优化</b>：减少冗余上下文，用 system prompt 复用替代每次重传</li>\n</ul>\n<div class=\"project-link\">简历关联：你有 AI Agent 模块经验，基于 WebSocket 实现任务状态实时推送。流式输出和错误映射的经验可以直接迁移</div>\n<div class=\"key-point\">面试追问\"你们的 AI 模块怎么控制成本\"——能答出 token 计量 + 语义缓存 + 模型降级这三点就很加分。</div>",
        "id": "q-16opd4"
      },
      {
        "q": "全栈工程师怎么设计前后端架构？Next.js + 后端 API 的分层方案和职责划分？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>为什么面试会问全栈架构</h4>\n<p>全栈岗位不是\"前端后端都会一点\"，而是要求你能<b>设计整体方案并独立交付</b>。面试官要看你对前后端边界、数据流向、部署方式有清晰认知。</p>\n<h4>典型 SaaS 全栈架构</h4>\n<pre><code>用户浏览器\n  ↓\nNext.js (SSR/SSG + API Routes / Server Actions)\n  ↓ 内部 API 调用\n后端服务 (Go/Python/Java)\n  ├─ 核心业务 API\n  ├─ AI 服务（LLM 调用、内容生成）\n  └─ 异步任务（邮件、数据处理）\n  ↓\nMySQL + Redis + MQ + OSS</code></pre>\n<h4>各层职责划分</h4>\n<ul>\n<li><b>Next.js 层</b>：页面渲染（SSR/SSG）、BFF 聚合（把多个后端接口合成前端需要的数据结构）、鉴权中间件、静态资源</li>\n<li><b>后端 API 层</b>：核心业务逻辑、数据校验、事务处理、支付/订单等强一致性操作</li>\n<li><b>AI 服务层</b>：LLM API 调用封装、Prompt 管理、流式输出、结果缓存</li>\n</ul>\n<h4>前后端分离 vs Next.js 全栈</h4>\n<ul>\n<li><b>纯前后端分离</b>（React SPA + 独立后端）：适合大团队、前后端独立部署和迭代</li>\n<li><b>Next.js 全栈</b>（API Routes / Server Actions）：适合小团队快速迭代、SEO 友好、减少部署复杂度</li>\n<li><b>混合方案</b>：Next.js 做 BFF + SSR，核心业务仍由独立后端服务处理——<b>这是出海 SaaS 最常见的架构</b></li>\n</ul>\n<h4>你的经验怎么关联</h4>\n<p>Shoply 项目中你做了前后端全链路：Go 后端 + C 端 Vue 页面 Apple Pay/Google Pay 3DS 集成。这证明你有全栈交付能力，只是前端框架从 Vue 换成 React/Next.js。</p>\n<div class=\"key-point\">全栈面试核心：不是\"我会写前端也会写后端\"，而是\"我能设计整体方案、划清职责边界、独立交付完整功能\"。</div>",
        "id": "q-xm41mo"
      },
      {
        "q": "系统中 visitorId 是怎么设计的？生成策略、存储方式、过期机制和安全性分别怎么考虑？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>生成策略</h4>\n<ul>\n<li>前端生成 UUID v4，首次访问时写入 Cookie（<code>visitor_id</code>），后续请求自动携带</li>\n<li>为什么不用浏览器指纹（fingerprint）：指纹依赖 Canvas/WebGL 等 API，同一设备不同浏览器会生成不同值，且隐私法规（GDPR）对指纹追踪限制越来越严。Cookie 方案更简单、用户可感知、可清除</li>\n</ul>\n<h4>存储方式</h4>\n<ul>\n<li>Cookie 端：<code>HttpOnly=false</code>（前端需读取用于加购等操作），<code>SameSite=Lax</code>，<code>Secure=true</code></li>\n<li>服务端：购物车和订单表的 <code>visitor_id</code> 字段关联游客数据，WAF 访客表用 <code>visitor_hash</code>（IP+UA+Accept-Language 的 MD5）做风控维度的去重</li>\n<li>两者区别：Cookie 的 visitorId 用于业务归户，visitor_hash 用于安全风控，职责分离</li>\n</ul>\n<h4>过期与清理</h4>\n<ul>\n<li>Cookie 过期时间 30 天，覆盖大多数购买决策周期</li>\n<li>登录归户后清除 visitorId 与旧数据的绑定关系，防止下一个游客串数据</li>\n<li>WAF 侧的 visitor_hash 通过冷热迁移定期归档，热表只保留近 7 天</li>\n</ul>\n<h4>安全性</h4>\n<ul>\n<li>visitorId 本身不含敏感信息（纯随机 UUID），泄露不会造成数据风险</li>\n<li>归户操作在事务内执行，防止并发归户导致数据错乱</li>\n<li>公共设备场景：登录时只归户当前 session 的 visitorId 数据，而非所有历史</li>\n</ul>\n<div class=\"key-point\">面试追问重点：visitorId 和 session 的区别是什么？答：visitorId 跨 session 持久化（30 天 Cookie），用于长周期行为追踪；session 是单次会话，关闭浏览器即失效。</div>",
        "id": "q-vid-design"
      },
      {
        "q": "电商 SaaS 的数据统计链路怎么设计？埋点采集、实时聚合、冷热分离分别怎么做？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>采集层</h4>\n<ul>\n<li><b>前端埋点</b>：页面浏览（PV）、商品曝光、加购、结账、支付等关键事件通过 JS SDK 上报</li>\n<li><b>后端埋点</b>：WAF 中间件拦截每个请求，提取 IP、UA、Referer、Cookie 等维度，写入内存 channel</li>\n<li><b>关键设计</b>：主链路只做数据入队（纳秒级），不阻塞 HTTP 响应。后台 Worker 从 channel 批量消费写库</li>\n</ul>\n<h4>聚合层</h4>\n<ul>\n<li><b>实时聚合</b>：Redis INCR 计数器实现当日 PV/UV/转化率等指标，按 <code>store_id:date:metric</code> 维度存储</li>\n<li><b>离线聚合</b>：每日定时任务将 Redis 计数器落盘到 MySQL 统计表，生成日报/周报/月报</li>\n<li><b>UV 去重</b>：基于 visitor_hash（IP+UA+Accept-Language MD5）在 Redis HyperLogLog 中去重，内存占用极小</li>\n</ul>\n<h4>冷热分离</h4>\n<ul>\n<li>热表存近 7 天数据，支撑实时看板查询</li>\n<li>冷表存历史归档数据，按日播种 + 分钟级微批迁移，避免大 IO 冲击</li>\n<li>查询时根据时间范围自动路由：近期查热表，历史查冷表</li>\n</ul>\n<div class=\"project-link\">简历关联：Shoply 的访客统计采用 WAF 中间件采集 + channel 异步批写 + Redis 实时聚合 + 冷热分表归档的四层链路</div>",
        "id": "q-stat-pipeline"
      },
      {
        "q": "订单号和交易号的生成规则是什么？为什么不直接用数据库自增 ID？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>为什么不用自增 ID</h4>\n<ul>\n<li><b>安全性</b>：自增 ID 可被外部推测订单量和业务规模，竞品可以通过连续下单估算日单量</li>\n<li><b>分库分表</b>：多租户 Sharding 场景下，不同分片的自增 ID 会冲突</li>\n<li><b>业务语义</b>：订单号通常需要包含时间、渠道等业务信息，纯数字自增无法承载</li>\n</ul>\n<h4>常见生成方案对比</h4>\n<table>\n<tr><th>方案</th><th>优点</th><th>缺点</th><th>适用场景</th></tr>\n<tr><td>UUID v4</td><td>全局唯一、无中心依赖</td><td>无序、索引性能差、不可读</td><td>内部关联 ID</td></tr>\n<tr><td>Snowflake</td><td>有序、高性能、可分布式</td><td>依赖时钟、需要 worker ID 分配</td><td>高并发订单号</td></tr>\n<tr><td>前缀+时间+随机</td><td>可读、含业务语义</td><td>需处理并发冲突</td><td>对外展示的单号</td></tr>\n</table>\n<h4>项目中的实践</h4>\n<ul>\n<li><b>订单号</b>：时间戳前缀 + 店铺标识 + 随机后缀，保证可读且全局唯一</li>\n<li><b>交易号（Trade ID）</b>：每次支付尝试生成独立 Trade ID，同一个 Checkout 可能产生多条 Trade 记录（用户切换支付方式或重试），每条 Trade 是独立的支付凭证</li>\n<li><b>幂等保证</b>：支付网关用 Checkout ID 做幂等 key，同一个 Checkout 不会重复扣款</li>\n</ul>\n<div class=\"key-point\">面试加分：能说清订单号（面向用户展示）和交易号（面向支付网关对账）的区别，说明你理解支付链路的完整模型。</div>",
        "id": "q-orderid-design"
      },
      {
        "q": "支付场景下的幂等怎么设计？Checkout ID、Trade ID 和 Webhook 去重分别怎么保证？",
        "diff": "hard",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>三层幂等机制</h4>\n<ul>\n<li><b>Checkout 层</b>：同一个 Checkout ID 只允许创建一笔成功的 Payment，重复提交直接返回已有结果</li>\n<li><b>Trade 层</b>：每次支付尝试生成唯一 Trade ID 传给支付网关（PayPal/Stripe），网关侧保证同一 Trade ID 不会重复扣款</li>\n<li><b>Webhook 层</b>：支付网关可能重复推送回调通知，用 <code>webhook_event_id</code> 做去重，已处理过的事件直接返回 200 不重复执行</li>\n</ul>\n<h4>为什么需要三层而不是一层</h4>\n<ul>\n<li>Checkout 层防的是<b>用户重复点击</b>提交按钮</li>\n<li>Trade 层防的是<b>网络超时重试</b>导致网关侧重复扣款</li>\n<li>Webhook 层防的是<b>网关重复推送</b>导致本地重复处理订单状态</li>\n</ul>\n<h4>实现细节</h4>\n<pre><code>// Webhook 去重伪代码\nfunc HandleWebhook(eventId string, payload []byte) error {\n    // 1. 检查是否已处理\n    if exists := redis.SetNX(\"webhook:\"+eventId, 1, 24*time.Hour); !exists {\n        return nil // 已处理，直接返回成功\n    }\n    // 2. 处理业务逻辑\n    err := processPayment(payload)\n    if err != nil {\n        redis.Del(\"webhook:\" + eventId) // 处理失败，允许重试\n        return err\n    }\n    return nil\n}</code></pre>\n<div class=\"key-point\">面试核心：幂等不是\"加个唯一索引\"就完事，而是要在每一层分别防御不同来源的重复请求。</div>",
        "id": "q-idempotent-design"
      },
      {
        "q": "多币种场景下数据库金额字段怎么存？decimal 字段 vs 整数分存储 vs float，怎么选？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>三种方案对比</h4>\n<table>\n<tr><th>方案</th><th>优点</th><th>缺点</th><th>适用场景</th></tr>\n<tr><td>DECIMAL(20,2)</td><td>精确、可读、SQL 直接聚合</td><td>运算比整数慢</td><td>电商、金融结算</td></tr>\n<tr><td>整数分存储（单位：分）</td><td>性能好、无精度问题</td><td>代码中频繁 ×100/÷100 转换容易出错；多币种小数位数不同（日元 0 位、科威特第纳尔 3 位）</td><td>单一币种、简单场景</td></tr>\n<tr><td>FLOAT/DOUBLE</td><td>性能最好</td><td>精度丢失（0.1+0.2≠0.3），金融场景不可接受</td><td>非金融统计数据</td></tr>\n</table>\n<h4>项目中的选择：DECIMAL + shopspring/decimal</h4>\n<ul>\n<li>数据库用 <code>DECIMAL(20,2)</code> 存储，保证持久化精度</li>\n<li>Go 代码中用 <code>shopspring/decimal</code> 做运算，避免 float 精度丢失</li>\n<li>为什么不用整数分：跨境电商涉及多币种，日元没有小数位，科威特第纳尔有三位小数，整数分方案需要对每种币种维护不同的倍率，复杂度反而更高</li>\n</ul>\n<h4>双轨金额设计</h4>\n<ul>\n<li>每个金额字段都有 Settle 对应字段：<code>PayPrice</code> / <code>SettlePayPrice</code></li>\n<li>所有计算在基础币种下完成，最后通过 <code>applyCurrency</code> 一次性转换到结算币种</li>\n<li>这样基础币种金额精确可对账，结算币种金额用于买家展示</li>\n</ul>\n<div class=\"project-link\">简历关联：Shoply 采用 DECIMAL + shopspring/decimal + 双轨金额体系，残差补偿算法保证分摊后金额之和严格等于原始金额</div>",
        "id": "q-currency-storage"
      },
      {
        "q": "AI Agent 模块的 WebSocket 连接管理怎么设计？心跳保活、断线重连和多任务隔离怎么做？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>连接管理</h4>\n<ul>\n<li>每个 WebSocket 连接绑定 <code>userId</code> + <code>sessionId</code>，用 <code>sync.Map</code> 维护在线连接池</li>\n<li>同一用户允许多个连接（多 tab 页），通过 sessionId 区分</li>\n<li>连接建立时注册到连接池，断开时自动清理</li>\n</ul>\n<h4>心跳保活</h4>\n<ul>\n<li>服务端每 30 秒发送 Ping 帧，客户端响应 Pong</li>\n<li>超过 60 秒未收到 Pong 则主动断开连接，释放资源</li>\n<li>为什么服务端主动 Ping 而不是客户端：服务端需要及时感知僵尸连接并释放资源，依赖客户端不可靠</li>\n</ul>\n<h4>多任务隔离</h4>\n<ul>\n<li>每个 AI 异步任务（文章生成、SEO 优化）有独立的 <code>taskId</code></li>\n<li>推送消息格式：<code>{taskId, status, data}</code>，前端按 taskId 路由到对应的 UI 组件</li>\n<li>任务完成/失败后不再推送该 taskId 的消息，避免过期数据干扰</li>\n</ul>\n<h4>断线重连</h4>\n<ul>\n<li>前端实现指数退避重连：1s → 2s → 4s → 8s → 最大 30s</li>\n<li>重连后服务端推送该用户所有进行中任务的最新状态快照，前端无需刷新页面即可恢复</li>\n</ul>\n<div class=\"project-link\">简历关联：Shoply AI Agent 模块通过 WebSocket 实时推送任务状态，支持多任务并行、断线状态恢复</div>",
        "id": "q-ws-design"
      },
      {
        "q": "营销召回为什么选 Asynq 而不是 Kafka 或 RabbitMQ？什么规模下应该切换？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>三者定位对比</h4>\n<table>\n<tr><th>维度</th><th>Asynq</th><th>Kafka</th><th>RabbitMQ</th></tr>\n<tr><td>底层依赖</td><td>Redis</td><td>独立集群</td><td>独立集群</td></tr>\n<tr><td>核心能力</td><td>延迟任务、定时任务、重试</td><td>高吞吐流式消息、消费组</td><td>灵活路由、消息确认</td></tr>\n<tr><td>运维成本</td><td>极低（复用 Redis）</td><td>高（ZK/KRaft + Broker 集群）</td><td>中（Erlang 运维门槛）</td></tr>\n<tr><td>适用规模</td><td>万级任务/天</td><td>百万级消息/秒</td><td>十万级消息/秒</td></tr>\n<tr><td>延迟任务</td><td>原生支持</td><td>不原生支持，需额外实现</td><td>通过 TTL + DLX 实现</td></tr>\n</table>\n<h4>项目中选 Asynq 的理由</h4>\n<ul>\n<li><b>场景匹配</b>：营销召回的核心需求是延迟任务（加购后 10 分钟触发），Asynq 原生支持，Kafka 需要额外开发</li>\n<li><b>运维成本</b>：系统已经依赖 Redis，Asynq 零额外基础设施。引入 Kafka 需要维护独立集群，SaaS 初期投入产出不合理</li>\n<li><b>任务量级</b>：召回邮件每天几千到几万封，远未到 Kafka 的适用场景</li>\n</ul>\n<h4>什么时候该切换</h4>\n<ul>\n<li>任务量突破 Redis 单机承载（通常百万级/天）时，考虑迁移到 Kafka</li>\n<li>需要消息回溯、多消费组、精确一次语义时，Kafka 更合适</li>\n<li>需要复杂路由规则（如按国家、语言分发）时，RabbitMQ 的 Exchange 模型更灵活</li>\n</ul>\n<div class=\"key-point\">面试核心：不是\"Kafka 比 Asynq 高级\"，而是在当前业务规模和团队能力下，哪个方案的投入产出比最高。过度设计和设计不足一样是问题。</div>",
        "id": "q-asynq-vs-kafka"
      },
      {
        "q": "go-storage 为什么要抽象 Storage 接口？直接写死 OSS SDK 和加一层适配器的取舍是什么？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>为什么不直接写死 OSS SDK</h4>\n<ul>\n<li><b>环境差异</b>：开发环境用本地磁盘，测试环境用 MinIO，生产环境用阿里云 OSS 或 AWS S3。写死 SDK 意味着每个环境都要配置真实的云存储账号</li>\n<li><b>云厂商切换</b>：SaaS 出海场景下可能从阿里云迁到 AWS，如果业务代码直接依赖阿里云 SDK，迁移成本极高</li>\n<li><b>测试困难</b>：单元测试中无法 mock 真实的 OSS 操作</li>\n</ul>\n<h4>适配器模式的设计</h4>\n<pre><code>type Storage interface {\n    Put(key string, r io.Reader) error\n    Get(key string) (io.ReadCloser, error)\n    Delete(key string) error\n    ChunkInit(name string, size int64) (string, error)\n    ChunkPart(uploadId string, partNum int, r io.ReadSeeker) error\n    ChunkComplete(uploadId string) (string, error)\n}</code></pre>\n<ul>\n<li>Local 实现：读写本地文件系统，分片上传用临时目录存放分片</li>\n<li>OSS 实现：封装阿里云 SDK，分片上传对接 MultipartUpload API</li>\n<li>业务代码只依赖 Storage 接口，通过配置切换具体实现</li>\n</ul>\n<h4>什么时候不该抽象</h4>\n<ul>\n<li>如果项目确定只用一个云厂商、没有本地开发需求，直接用 SDK 更简单</li>\n<li>过度抽象的代价：接口设计要覆盖不同厂商的能力差集，某些厂商特有功能（如 OSS 的图片处理）无法通过统一接口暴露</li>\n</ul>\n<div class=\"key-point\">面试追问\"适配器模式的代价是什么\"——答：最小公约数问题。接口只能定义所有实现都支持的操作，厂商特有能力需要类型断言或额外接口。</div>",
        "id": "q-storage-adapter"
      },
      {
        "q": "SaaS 多租户场景下为什么选 JWT+RSA 而不是 Session？两者在分布式环境下的核心差异？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>核心差异对比</h4>\n<table>\n<tr><th>维度</th><th>JWT + RSA</th><th>Session（服务端存储）</th></tr>\n<tr><td>状态</td><td>无状态，Token 自包含用户信息</td><td>有状态，需要 Redis/DB 存 session</td></tr>\n<tr><td>扩容</td><td>天然支持水平扩容，任何节点都能验证</td><td>需要共享 session 存储（Redis Cluster）</td></tr>\n<tr><td>性能</td><td>验签是本地 CPU 计算，无网络开销</td><td>每次请求需查 Redis/DB</td></tr>\n<tr><td>吊销</td><td>困难，需要黑名单机制</td><td>简单，删除 session 即可</td></tr>\n<tr><td>安全</td><td>RSA 公私钥分离，私钥只在签发端</td><td>依赖 session 存储的安全性</td></tr>\n</table>\n<h4>项目中选 JWT+RSA 的理由</h4>\n<ul>\n<li><b>多租户架构</b>：每个店铺是独立租户，JWT 的 payload 直接携带 <code>store_id</code> + <code>user_id</code> + <code>role</code>，中间件无需查库即可完成鉴权和租户隔离</li>\n<li><b>Go + PHP 跨服务验证</b>：Go 签发 Token，PHP 侧只需持有公钥即可验签，不需要共享 Redis session</li>\n<li><b>部署简单</b>：SaaS 多实例部署时无需配置 session 共享存储</li>\n</ul>\n<h4>JWT 的缺点和应对</h4>\n<ul>\n<li><b>Token 吊销</b>：用户改密码或被封禁时需要即时失效。通过 Redis 黑名单 + 短过期时间（如 2 小时）+ Refresh Token 轮转来解决</li>\n<li><b>Token 体积</b>：JWT 比 session ID 大，每次请求多传几百字节。对于 HTTP API 可接受，对于高频 WebSocket 可考虑首次认证后切换为轻量 session</li>\n</ul>\n<div class=\"key-point\">面试追问\"如果让你重新选，还会选 JWT 吗\"——答：SaaS 多租户 + 多语言服务场景下仍然选 JWT，但会增加 Refresh Token 轮转和更严格的黑名单机制。</div>",
        "id": "q-jwt-vs-session"
      },
      {
        "q": "项目中同时有 JSON-RPC 和 HTTP API，怎么决定哪些接口走 RPC 哪些走 HTTP？划分边界是什么？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>划分原则</h4>\n<ul>\n<li><b>HTTP API</b>：面向外部（前端、第三方、Webhook 回调），需要标准化的 RESTful 语义、CORS、鉴权中间件</li>\n<li><b>JSON-RPC</b>：面向内部服务间调用（Go ↔ PHP），不需要 HTTP 语义，追求调用简单和性能</li>\n</ul>\n<h4>项目中的具体边界</h4>\n<table>\n<tr><th>走 HTTP 的接口</th><th>走 RPC 的接口</th></tr>\n<tr><td>前端 CRUD API（商品/订单/用户）</td><td>PHP 调 Go 的高性能服务（ES 搜索/支付/邮件）</td></tr>\n<tr><td>支付网关 Webhook 回调</td><td>Go 调 PHP 的业务逻辑（插件执行/模板渲染）</td></tr>\n<tr><td>第三方平台对接（Shopify/1688 API）</td><td>内部数据同步（商品变更 → ES 索引更新）</td></tr>\n<tr><td>Apple Pay 域名验证文件托管</td><td>积分变更、能力校验等内部操作</td></tr>\n</table>\n<h4>为什么内部不用 gRPC 而选 JSON-RPC</h4>\n<ul>\n<li><b>协议轻量</b>：JSON-RPC 基于 JSON，PHP 端原生支持解析，不需要安装 Protobuf 编译器和额外依赖</li>\n<li><b>调试方便</b>：JSON 文本格式可直接抓包可读，gRPC 的二进制协议需要额外工具解码</li>\n<li><b>场景不需要</b>：内部通信不跨网络、不需要流式传输、不需要多语言 IDL，gRPC 的优势发挥不出来</li>\n</ul>\n<h4>什么场景应该换成 gRPC</h4>\n<ul>\n<li>服务数量超过 10 个，需要强类型接口契约（Protobuf IDL）防止联调出错</li>\n<li>需要双向流式传输（如实时数据推送）</li>\n<li>跨语言服务增多（Python/Java/Rust），Protobuf 的多语言代码生成价值更大</li>\n</ul>\n<div class=\"project-link\">简历关联：Shoply 用 Go net/rpc（JSON 编码）桥接 Go 和 PHP，25+ 个 RPC 服务覆盖商品、支付、搜索、邮件等模块</div>",
        "id": "q-rpc-vs-http"
      },
      {
        "q": "Go SSR 中 ThemeRuntimeStatic 和 ThemeRuntimeDynamic 两种模式怎么选择？切换策略背后的考量？",
        "diff": "hard",
        "tags": [
          "project"
        ],
        "a": "<h4>两种渲染模式</h4>\n<ul>\n<li><b>ThemeRuntimeStatic</b>：主题编译为纯静态 HTML 文件直出，Go 层只做文件读取和响应。性能极高，适合内容固定的页面（关于我们、政策页）</li>\n<li><b>ThemeRuntimeDynamic</b>：Go 模板引擎实时渲染，支持动态数据注入（用户信息、实时库存、个性化推荐）。性能低于静态模式，但支持个性化内容</li>\n</ul>\n<h4>切换策略</h4>\n<ul>\n<li>主题配置中声明 <code>Runtime</code> 字段，SSR 中间件根据该字段自动路由</li>\n<li>同一个站点可以混合使用：首页走动态渲染（展示推荐商品），博客页走静态直出</li>\n<li>主题开发者在主题 JSON 配置中声明每个页面的渲染模式</li>\n</ul>\n<h4>为什么不全部用动态渲染</h4>\n<ul>\n<li><b>性能</b>：模板编译有 CPU 开销，SaaS 多租户场景下几千个店铺共享进程，静态直出可以大幅减少 CPU 压力</li>\n<li><b>缓存效率</b>：静态 HTML 可以直接被 CDN 缓存，命中率接近 100%。动态页面需要额外的缓存策略</li>\n<li><b>稳定性</b>：静态页面不会因为数据库查询失败导致渲染错误</li>\n</ul>\n<h4>为什么不全部用静态直出</h4>\n<ul>\n<li><b>实时性</b>：商品库存、价格、个性化推荐需要实时数据，静态页面无法满足</li>\n<li><b>构建成本</b>：每次内容更新需要重新生成静态文件，对频繁更新的电商站不现实</li>\n</ul>\n<div class=\"key-point\">面试加分：能说清\"不是 SSR vs SSG 的二选一，而是根据页面特征混合使用\"，体现你对渲染策略有工程级理解。</div>",
        "id": "q-ssr-mode-tradeoff"
      },
      {
        "q": "项目中 Redis String、Hash、Set、本地缓存分别用在什么场景？为什么不统一用一种结构？",
        "diff": "medium",
        "tags": [
          "project",
          "scene"
        ],
        "a": "<h4>项目中的实际使用</h4>\n<table>\n<tr><th>数据结构</th><th>使用场景</th><th>为什么选它</th></tr>\n<tr><td>String + INCR</td><td>WAF 频率限制计数器、UV 计数</td><td>原子自增、可设过期时间，天然滑动窗口</td></tr>\n<tr><td>String + SetNX</td><td>分布式锁（冷热迁移、定时任务）</td><td>原子操作、自带 TTL 防死锁</td></tr>\n<tr><td>String（JSON）</td><td>套餐配置缓存、汇率缓存</td><td>整体读写、数据量小、结构简单</td></tr>\n<tr><td>Hash</td><td>用户 session 扩展信息、购物车勾选状态</td><td>需要读写单个字段而非整体，减少序列化开销</td></tr>\n<tr><td>Set + SMembers</td><td>购物车勾选列表、Webhook 去重</td><td>无序集合、自动去重、支持交集并集</td></tr>\n<tr><td>Sorted Set</td><td>Asynq 延迟任务队列（底层实现）</td><td>按时间戳排序、高效范围查询</td></tr>\n<tr><td>HyperLogLog</td><td>UV 去重统计</td><td>内存极小（12KB），亿级去重误差 &lt; 1%</td></tr>\n<tr><td>本地内存缓存</td><td>请求级汇率缓存、主题截图缓存（sync.Map）</td><td>同一请求内多次读取，避免重复查 Redis</td></tr>\n</table>\n<h4>为什么不统一用 String+JSON</h4>\n<ul>\n<li><b>性能</b>：购物车勾选状态如果用 String+JSON，每次修改一个商品的勾选都要读取→反序列化→修改→序列化→写回。用 Set 只需 SADD/SREM 一条命令</li>\n<li><b>原子性</b>：频率限制用 String+INCR 是原子操作，用 JSON 读写则需要加锁</li>\n<li><b>内存效率</b>：UV 去重如果用 Set 存所有 visitor_hash，百万用户占几十 MB。HyperLogLog 只要 12KB</li>\n</ul>\n<div class=\"key-point\">面试核心：不是\"我会用 Redis\"，而是能说清楚每个场景为什么选这个数据结构、换一个会有什么问题。这体现的是对 Redis 数据模型的工程理解。</div>",
        "id": "q-redis-structures"
      }
    ]
  },
  {
    "cat": "高频手撕代码",
    "icon": "✍️",
    "color": "#facc15",
    "items": [
      {
        "q": "用 Go 实现一个并发安全的 LRU Cache",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<pre><code>type LRUCache struct {\n    capacity int\n    mu       sync.Mutex\n    list     *list.List                    // 双向链表（最近使用 → 最久未用）\n    cache    map[string]*list.Element      // key → 链表节点\n}\n\ntype entry struct {\n    key   string\n    value interface{}\n}\n\nfunc NewLRUCache(cap int) *LRUCache {\n    return &LRUCache{\n        capacity: cap,\n        list:     list.New(),\n        cache:    make(map[string]*list.Element),\n    }\n}\n\nfunc (c *LRUCache) Get(key string) (interface{}, bool) {\n    c.mu.Lock()\n    defer c.mu.Unlock()\n    if elem, ok := c.cache[key]; ok {\n        c.list.MoveToFront(elem)  // 移到链表头部\n        return elem.Value.(*entry).value, true\n    }\n    return nil, false\n}\n\nfunc (c *LRUCache) Put(key string, value interface{}) {\n    c.mu.Lock()\n    defer c.mu.Unlock()\n    if elem, ok := c.cache[key]; ok {\n        c.list.MoveToFront(elem)\n        elem.Value.(*entry).value = value\n        return\n    }\n    if c.list.Len() >= c.capacity {\n        // 淘汰链表尾部（最久未使用）\n        tail := c.list.Back()\n        c.list.Remove(tail)\n        delete(c.cache, tail.Value.(*entry).key)\n    }\n    elem := c.list.PushFront(&entry{key, value})\n    c.cache[key] = elem\n}</code></pre>\n<div class=\"key-point\">复杂度：Get/Put 均为 O(1)。并发安全通过 sync.Mutex 实现，如需更高性能可用分片锁</div>",
        "id": "q-hkgo2f"
      },
      {
        "q": "用 Go 实现一个简单的 Worker Pool（限制并发数）",
        "diff": "easy",
        "tags": [],
        "a": "<pre><code>type WorkerPool struct {\n    maxWorkers int\n    taskQueue  chan func()\n    wg         sync.WaitGroup\n}\n\nfunc NewWorkerPool(maxWorkers, queueSize int) *WorkerPool {\n    wp := &WorkerPool{\n        maxWorkers: maxWorkers,\n        taskQueue:  make(chan func(), queueSize),\n    }\n    wp.start()\n    return wp\n}\n\nfunc (wp *WorkerPool) start() {\n    for i := 0; i < wp.maxWorkers; i++ {\n        go func() {\n            for task := range wp.taskQueue {\n                task()\n                wp.wg.Done()\n            }\n        }()\n    }\n}\n\nfunc (wp *WorkerPool) Submit(task func()) {\n    wp.wg.Add(1)\n    wp.taskQueue <- task\n}\n\nfunc (wp *WorkerPool) Wait() {\n    wp.wg.Wait()\n}\n\nfunc (wp *WorkerPool) Shutdown() {\n    close(wp.taskQueue)\n}\n\n// 使用\npool := NewWorkerPool(5, 100)\nfor _, url := range urls {\n    u := url\n    pool.Submit(func() { download(u) })\n}\npool.Wait()\npool.Shutdown()</code></pre>",
        "id": "q-qpqv9v"
      },
      {
        "q": "用 Go 实现 singleflight（合并并发请求）",
        "diff": "hard",
        "tags": [],
        "a": "<pre><code>type call struct {\n    wg  sync.WaitGroup\n    val interface{}\n    err error\n}\n\ntype SingleFlight struct {\n    mu sync.Mutex\n    m  map[string]*call\n}\n\nfunc (sf *SingleFlight) Do(key string, fn func() (interface{}, error)) (interface{}, error) {\n    sf.mu.Lock()\n    if sf.m == nil {\n        sf.m = make(map[string]*call)\n    }\n\n    // 如果已有相同 key 的请求在执行，等待结果\n    if c, ok := sf.m[key]; ok {\n        sf.mu.Unlock()\n        c.wg.Wait()           // 等待第一个请求完成\n        return c.val, c.err   // 共享结果\n    }\n\n    // 第一个请求，创建 call 并执行\n    c := &call{}\n    c.wg.Add(1)\n    sf.m[key] = c\n    sf.mu.Unlock()\n\n    c.val, c.err = fn()  // 实际执行\n    c.wg.Done()           // 唤醒等待者\n\n    sf.mu.Lock()\n    delete(sf.m, key)     // 清理\n    sf.mu.Unlock()\n\n    return c.val, c.err\n}\n\n// 使用场景：缓存击穿防护\nval, err := sf.Do(cacheKey, func() (interface{}, error) {\n    return db.Query(...)  // 只有一个请求打到 DB\n})</code></pre>\n<div class=\"key-point\">这就是 <code>golang.org/x/sync/singleflight</code> 的核心实现。理解它对回答缓存击穿问题非常加分</div>",
        "id": "q-chozb9"
      },
      {
        "q": "实现 Top K 问题（海量数据中找前 K 大的元素）",
        "diff": "medium",
        "tags": [],
        "a": "<h4>思路</h4>\n<p>维护一个大小为 <code>k</code> 的小顶堆。遍历所有元素时，如果当前值大于堆顶，就替换堆顶并重新下沉。遍历结束后，堆里保留的就是前 K 大元素。</p>\n<pre><code>type MinHeap []int\n\nfunc topK(nums []int, k int) []int {\n    h := &MinHeap{}\n    heap.Init(h)\n    for _, num := range nums {\n        if h.Len() < k {\n            heap.Push(h, num)\n            continue\n        }\n        if num > (*h)[0] {\n            heap.Pop(h)\n            heap.Push(h, num)\n        }\n    }\n    return *h\n}</code></pre>\n<div class=\"key-point\">时间复杂度 <code>O(n log k)</code>，空间复杂度 <code>O(k)</code>，这是面试里最标准的 Top K 解法。</div>",
        "id": "q-i5famw"
      },
      {
        "q": "实现一个简单的布隆过滤器（Bloom Filter）",
        "diff": "medium",
        "tags": [],
        "a": "<h4>核心思想</h4>\n<p>布隆过滤器用一个位数组和多个哈希函数表示集合。插入元素时，把多个哈希位置都置为 1；查询时只要有一个位置为 0，就一定不存在；全部为 1 则表示“可能存在”。</p>\n<pre><code>type Bloom struct {\n    bits []bool\n}\n\nfunc (b *Bloom) Add(s string) {\n    for _, idx := range []int{hash1(s), hash2(s), hash3(s)} {\n        b.bits[idx%len(b.bits)] = true\n    }\n}\n\nfunc (b *Bloom) MightContain(s string) bool {\n    for _, idx := range []int{hash1(s), hash2(s), hash3(s)} {\n        if !b.bits[idx%len(b.bits)] {\n            return false\n        }\n    }\n    return true\n}</code></pre>\n<h4>特点</h4>\n<ul>\n<li>优点：空间效率高，查询快</li>\n<li>缺点：有误判，不支持精准删除</li>\n<li>常见用途：缓存穿透防护、URL 去重、黑名单预判</li>\n</ul>",
        "id": "q-dxyqet"
      },
      {
        "q": "用 Go 实现生产者-消费者模型（channel + select）",
        "diff": "easy",
        "tags": [],
        "a": "<pre><code>func main() {\n    ctx, cancel := context.WithCancel(context.Background())\n    defer cancel()\n\n    queue := make(chan int, 16)\n    var wg sync.WaitGroup\n\n    // producer\n    wg.Add(1)\n    go func() {\n        defer wg.Done()\n        for i := 0; i < 100; i++ {\n            select {\n            case queue <- i:\n            case <-ctx.Done():\n                return\n            }\n        }\n        close(queue)\n    }()\n\n    // consumers\n    for i := 0; i < 3; i++ {\n        wg.Add(1)\n        go func(worker int) {\n            defer wg.Done()\n            for {\n                select {\n                case v, ok := <-queue:\n                    if !ok {\n                        return\n                    }\n                    fmt.Println(worker, v)\n                case <-ctx.Done():\n                    return\n                }\n            }\n        }(i)\n    }\n\n    wg.Wait()\n}</code></pre>\n<div class=\"key-point\">这题别只写 happy path，最好带上 <code>close(channel)</code>、<code>context</code> 和优雅退出，面试官会更认可。</div>",
        "id": "q-15zi8zt"
      },
      {
        "q": "实现一个 Go 版本的跳表（Skip List），为什么它适合有序集合？",
        "diff": "hard",
        "tags": [],
        "a": "<h4>核心结构</h4>\n<p>跳表本质上是“多层有序链表”。底层保存完整数据，上层作为索引层，查询时先从高层快速跳，再逐层下探。</p>\n<pre><code>type Node struct {\n    score float64\n    value string\n    next  []*Node\n}\n\nfunc search(head *Node, score float64) *Node {\n    cur := head\n    for level := len(head.next) - 1; level >= 0; level-- {\n        for cur.next[level] != nil && cur.next[level].score < score {\n            cur = cur.next[level]\n        }\n    }\n    return cur.next[0]\n}</code></pre>\n<h4>为什么适合有序集合</h4>\n<ul>\n<li>查询、插入、删除的平均复杂度都是 <code>O(log n)</code></li>\n<li>比平衡树更容易实现区间遍历和顺序扫描</li>\n<li>Redis 的 ZSet 在一定规模下就采用了 skiplist + hash 的组合</li>\n</ul>",
        "id": "q-blkq5"
      },
      {
        "q": "用 Go 实现环形链表入口检测（快慢指针）",
        "diff": "medium",
        "tags": [],
        "a": "<h4>题目</h4>\n<p>给定一个链表，判断是否有环，如果有环则返回环的入口节点。</p>\n<h4>思路：快慢指针两步走</h4>\n<ol>\n<li><b>判断是否有环</b>：快指针每次走 2 步，慢指针每次走 1 步。如果有环，快慢指针一定会在环内相遇；如果无环，快指针会先遇到 nil</li>\n<li><b>找环入口</b>：相遇后，把一个指针移回头节点，两个指针都改为每次走 1 步，再次相遇的节点就是环入口</li>\n</ol>\n<h4>数学证明</h4>\n<p>设头到入口距离为 a，入口到相遇点距离为 b，环长为 c。相遇时慢指针走了 a+b，快指针走了 a+b+nc。因为快指针速度是慢指针 2 倍：2(a+b) = a+b+nc → a = nc-b。所以从头走 a 步 = 从相遇点走 nc-b 步，都到达入口。</p>\n<h4>Go 实现</h4>\n<pre><code>type ListNode struct {\n    Val  int\n    Next *ListNode\n}\n\nfunc detectCycle(head *ListNode) *ListNode {\n    slow, fast := head, head\n    for fast != nil && fast.Next != nil {\n        slow = slow.Next\n        fast = fast.Next.Next\n        if slow == fast { // 有环，找入口\n            p := head\n            for p != slow {\n                p = p.Next\n                slow = slow.Next\n            }\n            return p\n        }\n    }\n    return nil // 无环\n}</code></pre>\n<p>时间 O(n)，空间 O(1)。</p>\n<div class=\"key-point\">这是 LeetCode 142 原题，Go 后端面试手撕高频题。能说清数学推导是加分项。</div>",
        "id": "q-71dk9x"
      }
    ]
  },
  {
    "cat": "测试与工程质量",
    "icon": "🧪",
    "color": "#14b8a6",
    "items": [
      {
        "q": "Go 项目如何做好单元测试？Table-Driven Tests、Mock、覆盖率分别怎么用？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>三个关键点</h4>\n<ul>\n<li><b>Table-Driven Tests</b>：把输入、输出和预期错误组织成表格，用例更清晰、扩展更方便</li>\n<li><b>Mock</b>：把外部依赖替换掉，例如数据库、Redis、HTTP 调用，保证单元测试只测当前逻辑</li>\n<li><b>覆盖率</b>：用 <code>go test -cover</code> 看测试有没有覆盖核心路径，但不要把覆盖率当唯一目标</li>\n</ul>\n<pre><code>func TestAdd(t *testing.T) {\n    cases := []struct {\n        a, b int\n        want int\n    }{\n        {1, 2, 3},\n        {0, 0, 0},\n        {-1, 1, 0},\n    }\n    for _, tc := range cases {\n        if got := Add(tc.a, tc.b); got != tc.want {\n            t.Fatalf(\"got %d, want %d\", got, tc.want)\n        }\n    }\n}</code></pre>\n<div class=\"key-point\">高质量单元测试不是追求覆盖率数字，而是优先覆盖核心逻辑、边界条件和典型失败路径。</div>",
        "id": "q-zwrzuz"
      },
      {
        "q": "TDD（测试驱动开发）的流程是什么？Red-Green-Refactor 分别代表什么？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>经典三步</h4>\n<ul>\n<li><b>Red</b>：先写一个失败的测试，明确想要的行为</li>\n<li><b>Green</b>：写最少的代码让测试通过</li>\n<li><b>Refactor</b>：在测试保护下重构，让实现更干净</li>\n</ul>\n<h4>TDD 的价值</h4>\n<ul>\n<li>逼你先想清楚接口和行为，再写实现</li>\n<li>天然会留下可回归的测试资产</li>\n<li>对复杂规则密集的逻辑特别有效，例如金额计算、状态机和校验器</li>\n</ul>\n<h4>常见误区</h4>\n<p>TDD 不是“所有代码都必须先写测试”，而是对高风险逻辑优先用测试约束设计。否则容易把简单问题流程化过度。</p>",
        "id": "q-ktllce"
      },
      {
        "q": "压测方案怎么设计才有意义？除了 QPS，还要看哪些指标才能真正定位瓶颈？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>先别把压测做成“刷一个 QPS 数字”</h4>\n<ul>\n<li>压测流量要尽量接近真实读写比例、热点分布和依赖调用路径</li>\n<li>只看平均值意义不大，必须关注尾延迟和错误率</li>\n<li>压测的目标不是“机器打满”，而是定位系统的第一瓶颈在哪</li>\n</ul>\n<h4>除了 QPS 还要看什么</h4>\n<ul>\n<li><b>延迟</b>：P95 / P99，别只看平均响应时间</li>\n<li><b>错误率</b>：超时、5xx、熔断、限流比例</li>\n<li><b>应用指标</b>：CPU、内存、goroutine、GC 次数和停顿</li>\n<li><b>连接池</b>：DB / Redis / HTTP 连接池是否打满</li>\n<li><b>缓存层</b>：命中率、热点 key、慢日志</li>\n<li><b>队列层</b>：lag、积压时长、消费速率</li>\n<li><b>数据库</b>：慢查询数、锁等待、扫描行数</li>\n</ul>\n<h4>一个更完整的闭环</h4>\n<ol>\n<li>先定义目标链路和业务场景</li>\n<li>压测前做好指标埋点和观测面板</li>\n<li>压测时同步看应用、缓存、DB、MQ 四层指标</li>\n<li>压测后把瓶颈收敛到具体组件或代码路径，而不是只汇报“最高能扛多少 QPS”</li>\n</ol>\n<div class=\"key-point\">这题真正想听的是你的诊断思维：QPS 只是表象，定位瓶颈要靠尾延迟、错误率和分层指标一起看。</div>",
        "id": "q-izu016"
      },
      {
        "q": "Go 项目里集成测试和单元测试怎么区分？什么时候该用 testcontainers？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>单元测试 vs 集成测试</h4>\n<ul>\n<li><b>单元测试</b>：只测一个函数或方法的逻辑，外部依赖全部 mock 掉，跑得快、确定性高</li>\n<li><b>集成测试</b>：真实连接数据库、Redis、消息队列等外部服务，验证多个组件协作是否正确</li>\n<li>两者互补，不能用集成测试替代单元测试，也不能只靠 mock 就觉得万事大吉</li>\n</ul>\n<h4>testcontainers-go 的使用场景</h4>\n<ul>\n<li>在 CI 或本地用 Docker 启动真实的 MySQL、Redis、Kafka 容器</li>\n<li>每次测试创建全新容器，测完销毁，避免环境污染</li>\n<li>适合验证 SQL 迁移、Redis 命令兼容性、消息消费逻辑等 mock 无法覆盖的场景</li>\n</ul>\n<h4>实践建议</h4>\n<ul>\n<li>单元测试放 <code>_test.go</code>，集成测试用 <code>// +build integration</code> tag 隔离</li>\n<li>CI 中先跑单元测试（快），再跑集成测试（慢）</li>\n<li>不要对所有东西都上 testcontainers——简单逻辑用 mock 就够了</li>\n</ul>\n<div class=\"key-point\">面试加分点：能说出你在什么场景下从 mock 切到了真实容器测试，以及这个切换避免了什么线上问题。</div>",
        "id": "q-tc1int"
      }
    ]
  },
  {
    "cat": "Kafka 消息队列",
    "icon": "📨",
    "color": "#10b981",
    "items": [
      {
        "q": "Kafka 的核心架构？Producer / Broker / Consumer / Partition 分别是什么？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>核心组件</h4>\n<ul>\n<li><b>Producer</b>：消息生产者，将消息发送到指定 Topic 的 Partition</li>\n<li><b>Broker</b>：Kafka 服务节点，负责存储消息。一个集群由多个 Broker 组成</li>\n<li><b>Topic</b>：消息的逻辑分类（如 order_events、payment_events）</li>\n<li><b>Partition</b>：Topic 的物理分片，每个 Partition 是一个有序的、不可变的消息序列（追加写入）</li>\n<li><b>Consumer Group</b>：消费者组，组内每个 Consumer 消费不同 Partition，实现并行消费</li>\n<li><b>Offset</b>：消费者在 Partition 中的读取位置，持久化在 __consumer_offsets Topic</li>\n</ul>\n<h4>为什么快</h4>\n<ul>\n<li><b>顺序写磁盘</b>：比随机写快 3 个数量级</li>\n<li><b>零拷贝 (sendfile)</b>：数据从磁盘直接到网卡，不经过用户态</li>\n<li><b>批量发送 + 压缩</b>：减少网络 IO 次数</li>\n<li><b>Page Cache</b>：利用 OS 页缓存，读写都在内存中完成</li>\n</ul>",
        "id": "q-w5vcxz"
      },
      {
        "q": "Kafka 如何保证消息不丢失？Producer / Broker / Consumer 三端分别怎么做？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>Producer 端</h4>\n<pre><code>// acks 配置\nacks=0   // 不等确认，最快但可能丢消息\nacks=1   // Leader 写入即确认（Leader 挂了可能丢）\nacks=all // 所有 ISR 副本写入才确认（最安全）\n\n// 重试 + 幂等\nretries=3\nenable.idempotence=true  // Producer 幂等，防止重试导致重复</code></pre>\n<h4>Broker 端</h4>\n<pre><code>// 副本机制\nreplication.factor=3          // 每个 Partition 3 个副本\nmin.insync.replicas=2         // 至少 2 个副本同步才允许写入\nunclean.leader.election=false // 禁止非 ISR 副本成为 Leader</code></pre>\n<h4>Consumer 端</h4>\n<pre><code>// 手动提交 Offset（处理完再提交）\nenable.auto.commit=false\n\nfor msg := range consumer.Messages() {\n    process(msg)                    // 先处理\n    consumer.CommitMessage(msg)     // 再提交 offset\n}\n// 如果 process 失败不提交，下次消费会重试（at-least-once）</code></pre>\n<div class=\"key-point\">三端配合：acks=all + min.insync.replicas=2 + 手动提交 offset = 消息不丢失（at-least-once 语义）</div>",
        "id": "q-13n8aa"
      },
      {
        "q": "Kafka 消息积压怎么处理？Consumer 消费太慢怎么办？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>排查步骤</h4>\n<ol>\n<li>查看 Consumer Lag：<code>kafka-consumer-groups.sh --describe --group mygroup</code></li>\n<li>确认是否是消费逻辑慢（DB 操作、外部 API 调用等）</li>\n<li>确认 Partition 数量是否足够</li>\n</ol>\n<h4>解决方案</h4>\n<ul>\n<li><b>增加 Partition + Consumer</b>：Consumer 数量不能超过 Partition 数（超过的会空闲）</li>\n<li><b>消费端批量处理</b>：批量写入 DB 而非逐条插入</li>\n<li><b>异步消费</b>：Consumer 接收后投入本地队列，Worker Pool 并行处理</li>\n<li><b>临时扩容</b>：新建一个 Topic（更多 Partition），用转发 Consumer 把积压消息转发过去，扩大消费并行度</li>\n</ul>\n<pre><code>// Go 消费端并行处理\nfunc consume(msg *kafka.Message) {\n    // 投入 Worker Pool 而非同步处理\n    pool.Submit(func() {\n        process(msg)\n        consumer.CommitMessage(msg)\n    })\n}</code></pre>",
        "id": "q-rmp1qo"
      },
      {
        "q": "Kafka 如何保证消息顺序性？全局有序和分区有序的区别？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>Kafka 的顺序保证</h4>\n<ul>\n<li><b>分区内有序</b>：单个 Partition 内的消息严格有序（追加写入）</li>\n<li><b>跨分区无序</b>：不同 Partition 之间没有顺序保证</li>\n</ul>\n<h4>需要顺序的场景怎么做</h4>\n<pre><code>// 方案一：同一个 Key 的消息发到同一个 Partition\nproducer.Produce(&kafka.Message{\n    TopicPartition: kafka.TopicPartition{Topic: &topic},\n    Key:   []byte(orderId),   // 用 orderId 做 Key\n    Value: payload,\n})\n// Kafka 对 Key 做 hash % partitionCount，相同 Key 固定到同一 Partition\n\n// 方案二：全局有序（极端场景）\n// Topic 只设 1 个 Partition（牺牲并行度，不推荐）</code></pre>\n<h4>顺序消费注意</h4>\n<ul>\n<li>Consumer 内不能用多线程并行处理同一个 Partition 的消息（否则乱序）</li>\n<li>如需并行：按 Key 分组，相同 Key 的消息由同一个 goroutine 处理</li>\n</ul>\n<div class=\"key-point\">岗位关联：腾讯赛事平台、百度广告平台都重度依赖 Kafka 做事件驱动，订单/支付/广告投放事件必须保证分区有序</div>",
        "id": "q-1h9bs4f"
      },
      {
        "q": "Kafka 与 Redis 消息队列 (Asynq) 的区别？各自适用场景？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>对比</h4>\n<table style=\"width:100%;font-size:13px;color:var(--text-dim);border-collapse:collapse\">\n<tr style=\"border-bottom:1px solid var(--border)\"><th style=\"text-align:left;padding:6px\">特性</th><th style=\"text-align:left;padding:6px\">Kafka</th><th style=\"text-align:left;padding:6px\">Asynq (Redis)</th></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">定位</td><td style=\"padding:6px\">分布式事件流平台</td><td style=\"padding:6px\">异步任务队列</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">消息保留</td><td style=\"padding:6px\">持久化，可重复消费</td><td style=\"padding:6px\">处理完即删除</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">吞吐量</td><td style=\"padding:6px\">百万级/秒</td><td style=\"padding:6px\">万级/秒</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">消费模式</td><td style=\"padding:6px\">发布/订阅 + Consumer Group</td><td style=\"padding:6px\">竞争消费</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">延时任务</td><td style=\"padding:6px\">不原生支持</td><td style=\"padding:6px\">原生支持 (ProcessIn)</td></tr>\n<tr><td style=\"padding:6px\">运维复杂度</td><td style=\"padding:6px\">高（ZK/KRaft + Broker 集群）</td><td style=\"padding:6px\">低（复用 Redis）</td></tr>\n</table>\n<h4>选型建议</h4>\n<ul>\n<li><b>Kafka</b>：大数据量事件流、日志收集、跨服务事件广播、需要消息回溯</li>\n<li><b>Asynq</b>：后台异步任务（邮件/通知）、定时任务、延时任务、业务量中等</li>\n</ul>\n<div class=\"project-link\">简历关联：你的项目用 Asynq 做营销召回（延时任务场景），如果面试岗位问 Kafka，可以说明为什么当前场景选 Asynq 以及何时该引入 Kafka</div>",
        "id": "q-1e0b4eb"
      },
      {
        "q": "延迟队列、重试队列、死信队列分别解决什么问题？如何避免消息重试风暴？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>三个队列各管什么</h4>\n<ul>\n<li><b>延迟队列</b>：消息不是立刻消费，而是在未来某个时间点再处理，适合订单超时关闭、优惠券到期提醒、定时补偿</li>\n<li><b>重试队列</b>：业务失败后稍后再试，适合下游临时不可用、网络抖动、第三方接口超时</li>\n<li><b>死信队列 (DLQ)</b>：消息多次重试仍失败，或明确判定为毒消息时，转入死信队列等待人工排查和补偿</li>\n</ul>\n<pre><code>主队列 --消费失败--> 重试队列(指数退避)\n重试超过阈值 -------> 死信队列\n未来执行任务 -------> 延迟队列</code></pre>\n<h4>为什么会出现重试风暴</h4>\n<ul>\n<li>所有失败消息立刻重试，把本来就不稳定的下游进一步压垮</li>\n<li>多个消费者同时失败并同步重试，形成流量脉冲</li>\n</ul>\n<h4>治理手段</h4>\n<ul>\n<li><b>指数退避 + jitter</b>：第 1 次 1s，第 2 次 5s，第 3 次 30s，避免同一时刻集体重试</li>\n<li><b>限制最大重试次数</b>：超过阈值直接进 DLQ，不要无限打同一个毒消息</li>\n<li><b>错误分类</b>：参数错误、数据脏消息直接进 DLQ；网络抖动、下游 5xx 才进入重试队列</li>\n<li><b>幂等性</b>：消息重试前提是消费逻辑可重复执行，否则越重试越乱</li>\n<li><b>熔断与限流</b>：下游明显异常时先暂停消费或降速，避免雪崩</li>\n</ul>\n<div class=\"key-point\">现在很多 Go 后端岗虽然只写“消息队列”，但真正想听的是：你不仅会发消息，还知道怎么治理失败、重试和毒消息。</div>",
        "id": "q-1vkbj6o"
      },
      {
        "q": "为什么业务消息队列通常不用 Redis List，而会选 Kafka / RabbitMQ / Asynq？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>Redis List 能做队列，但它不是完整 MQ 产品</h4>\n<ul>\n<li>用 <code>LPUSH/RPOP</code> 或 <code>BRPOP</code> 能很快搭一个简单队列</li>\n<li>但一旦涉及确认、重试、消费组、积压治理、死信处理，Redis List 就需要你自己补很多逻辑</li>\n</ul>\n<h4>为什么很多业务不会直接选它</h4>\n<ul>\n<li><b>确认语义弱</b>：消息处理失败后如何重新投递、如何避免丢失，要自己设计</li>\n<li><b>消费模型单一</b>：不像 Kafka 有 Consumer Group，不像 RabbitMQ 有成熟的 ack 和路由体系</li>\n<li><b>回溯能力弱</b>：普通 List 更偏“取走即删”，不适合事件流和回放场景</li>\n<li><b>角色不纯</b>：Redis 更擅长缓存、计数器、轻量任务，不适合无限堆叠复杂 MQ 语义</li>\n</ul>\n<h4>怎么选更合理</h4>\n<ul>\n<li><b>Kafka</b>：高吞吐事件流、日志、回溯消费、多消费组</li>\n<li><b>RabbitMQ</b>：复杂路由、ack、死信、延迟消息</li>\n<li><b>Asynq</b>：Go 业务里的后台任务、延时任务、轻中量异步作业</li>\n<li><b>Redis List</b>：只适合极轻量、容忍简单语义的小队列</li>\n</ul>\n<div class=\"key-point\">这题的高质量回答不是“Redis 不行”，而是你能讲清：不是不能做，而是随着可靠性要求上升，自己补语义的成本会越来越高。</div>",
        "id": "q-p7xed0"
      }
    ]
  },
  {
    "cat": "计算机网络",
    "icon": "🌐",
    "color": "#818cf8",
    "items": [
      {
        "q": "TCP 三次握手和四次挥手的流程？为什么握手三次，挥手四次？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>三次握手</h4>\n<pre><code>客户端         服务端\n  |--- SYN (seq=x) --->|     ① 客户端发起连接\n  |<-- SYN+ACK (seq=y, ack=x+1) --|  ② 服务端确认并发起\n  |--- ACK (ack=y+1) -->|     ③ 客户端确认</code></pre>\n<p><b>为什么三次</b>：防止历史连接请求（旧 SYN）造成误连。两次的话服务端无法确认客户端是否收到 SYN+ACK</p>\n\n<h4>四次挥手</h4>\n<pre><code>主动方         被动方\n  |--- FIN --->|    ① 我要关闭发送\n  |<-- ACK ----|    ② 知道了（但我可能还有数据要发）\n  |<-- FIN ----|    ③ 我也发完了，关闭\n  |--- ACK --->|    ④ 收到，连接关闭</code></pre>\n<p><b>为什么四次</b>：TCP 全双工，每个方向需要独立关闭。被动方收到 FIN 时可能还有数据没发完，所以 ACK 和 FIN 分两步</p>\n\n<h4>TIME_WAIT</h4>\n<ul>\n<li>主动关闭方进入 TIME_WAIT，等待 2MSL（通常 60 秒）</li>\n<li>原因：(1) 确保最后的 ACK 到达对方 (2) 让旧连接的迟到报文在网络中消亡</li>\n<li>服务端大量 TIME_WAIT 解决：<code>tcp_tw_reuse</code>、连接池复用</li>\n</ul>",
        "id": "q-1a3g4ml"
      },
      {
        "q": "HTTP/1.1、HTTP/2、HTTP/3 的区别？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>演进对比</h4>\n<table style=\"width:100%;font-size:13px;color:var(--text-dim);border-collapse:collapse\">\n<tr style=\"border-bottom:1px solid var(--border)\"><th style=\"text-align:left;padding:6px\">特性</th><th style=\"text-align:left;padding:6px\">HTTP/1.1</th><th style=\"text-align:left;padding:6px\">HTTP/2</th><th style=\"text-align:left;padding:6px\">HTTP/3</th></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">传输层</td><td style=\"padding:6px\">TCP</td><td style=\"padding:6px\">TCP</td><td style=\"padding:6px\">QUIC (UDP)</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">多路复用</td><td style=\"padding:6px\">无（管线化鸡肋）</td><td style=\"padding:6px\">有（二进制帧）</td><td style=\"padding:6px\">有（无队头阻塞）</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">头部压缩</td><td style=\"padding:6px\">无</td><td style=\"padding:6px\">HPACK</td><td style=\"padding:6px\">QPACK</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">服务端推送</td><td style=\"padding:6px\">无</td><td style=\"padding:6px\">支持</td><td style=\"padding:6px\">支持</td></tr>\n<tr><td style=\"padding:6px\">队头阻塞</td><td style=\"padding:6px\">应用层+传输层</td><td style=\"padding:6px\">传输层（TCP丢包）</td><td style=\"padding:6px\">无</td></tr>\n</table>\n<h4>关键概念</h4>\n<ul>\n<li><b>HTTP/2 多路复用</b>：一个 TCP 连接上并行传输多个 Stream，每个 Stream 由多个 Frame 组成，解决 HTTP/1.1 的队头阻塞</li>\n<li><b>HTTP/2 队头阻塞</b>：虽然应用层无阻塞，但 TCP 层丢包会阻塞整个连接的所有 Stream</li>\n<li><b>HTTP/3 QUIC</b>：基于 UDP，每个 Stream 独立可靠传输，一个 Stream 丢包不影响其他 Stream</li>\n</ul>",
        "id": "q-10s0hae"
      },
      {
        "q": "HTTPS 的 TLS 握手过程？对称加密和非对称加密在其中的角色？",
        "diff": "medium",
        "tags": [
          "project"
        ],
        "a": "<h4>TLS 1.2 握手（简化）</h4>\n<pre><code>客户端                    服务端\n  |--- ClientHello -------->|   支持的加密套件、随机数A\n  |<-- ServerHello ---------|   选定加密套件、随机数B、证书\n  |  验证证书（CA 链）        |\n  |--- ClientKeyExchange -->|   用证书公钥加密预主密钥 (Pre-Master Secret)\n  |  双方计算会话密钥          |   Key = PRF(PreMaster, 随机数A, 随机数B)\n  |--- ChangeCipherSpec --->|   切换到加密通信\n  |<-- ChangeCipherSpec ----|\n  |=== 加密数据传输 =========|</code></pre>\n<h4>两种加密的角色</h4>\n<ul>\n<li><b>非对称加密 (RSA/ECDHE)</b>：仅用于握手阶段安全地交换密钥，速度慢但安全</li>\n<li><b>对称加密 (AES-GCM)</b>：用于数据传输阶段，速度快</li>\n</ul>\n<h4>TLS 1.3 改进</h4>\n<ul>\n<li>握手从 2-RTT 缩减到 1-RTT（0-RTT 可选）</li>\n<li>移除了 RSA 密钥交换（仅保留前向安全的 ECDHE）</li>\n<li>精简加密套件（只保留 AEAD）</li>\n</ul>\n<div class=\"project-link\">简历关联：你的 go-utils 实现了 AES-CBC + RSA 混合加密，原理与 TLS 的混合加密思路一致</div>",
        "id": "q-1cu35pj"
      },
      {
        "q": "TCP 粘包/拆包是什么？怎么解决？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>什么是粘包/拆包</h4>\n<p>TCP 是<b>字节流</b>协议（非消息边界协议），发送方的多条消息可能被合并成一个包（粘包），或一条消息被拆成多个包（拆包）</p>\n<pre><code>// 发送 \"Hello\" 和 \"World\"\n// 可能收到：\n\"HelloWorld\"        // 粘包\n\"Hel\" + \"loWorld\"   // 拆包+粘包\n\"Hello\" + \"World\"   // 正常</code></pre>\n<h4>解决方案</h4>\n<ul>\n<li><b>固定长度</b>：每条消息固定 N 字节，不足补零（简单但浪费）</li>\n<li><b>分隔符</b>：用特殊字符分割（如 <code>\\n</code>、<code>\\r\\n</code>），HTTP/1.1 即如此</li>\n<li><b>长度前缀 (TLV)</b>：消息头包含消息体长度，最常用</li>\n</ul>\n<pre><code>// 长度前缀方案（Go 实现）\n// 写入\nfunc writeMessage(conn net.Conn, data []byte) error {\n    header := make([]byte, 4)\n    binary.BigEndian.PutUint32(header, uint32(len(data)))\n    conn.Write(header)   // 先写 4 字节长度\n    conn.Write(data)     // 再写消息体\n    return nil\n}\n\n// 读取\nfunc readMessage(conn net.Conn) ([]byte, error) {\n    header := make([]byte, 4)\n    io.ReadFull(conn, header)\n    length := binary.BigEndian.Uint32(header)\n    data := make([]byte, length)\n    io.ReadFull(conn, data)\n    return data, nil\n}</code></pre>",
        "id": "q-1k8jhph"
      },
      {
        "q": "从浏览器输入 URL 到页面显示，发生了什么？（网络全链路）",
        "diff": "easy",
        "tags": [
          "scene"
        ],
        "a": "<h4>完整链路</h4>\n<ol>\n<li><b>DNS 解析</b>：浏览器缓存 → OS 缓存 → hosts → 本地 DNS → 递归查询根/顶级/权威 DNS → 拿到 IP</li>\n<li><b>TCP 三次握手</b>：与服务器建立 TCP 连接</li>\n<li><b>TLS 握手</b>（HTTPS）：协商加密套件、交换密钥</li>\n<li><b>HTTP 请求</b>：发送 GET / HTTP/1.1（或 HTTP/2 帧）</li>\n<li><b>服务端处理</b>：负载均衡 → Web Server → 应用逻辑 → 数据库查询 → 返回响应</li>\n<li><b>HTTP 响应</b>：状态码 + 响应头 + 响应体（HTML）</li>\n<li><b>浏览器渲染</b>：\n  <ul>\n  <li>解析 HTML → DOM 树</li>\n  <li>解析 CSS → CSSOM 树</li>\n  <li>DOM + CSSOM → Render 树</li>\n  <li>Layout（计算位置大小）→ Paint（绘制像素）→ Composite（合成图层）</li>\n  </ul>\n</li>\n<li><b>异步加载</b>：JS 执行、图片/字体等资源异步请求</li>\n</ol>\n<div class=\"key-point\">面试中可以根据岗位侧重展开不同层：后端重点讲第 5 步（Nginx → 路由 → 中间件 → Handler → DB）</div>",
        "id": "q-fv9so3"
      },
      {
        "q": "TCP 的拥塞控制算法是什么？慢启动、拥塞避免、快重传、快恢复分别在做什么？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>四个关键阶段</h4>\n<ul>\n<li><b>慢启动</b>：连接刚建立时不知道网络容量，拥塞窗口 <code>cwnd</code> 指数增长，快速探测带宽上限</li>\n<li><b>拥塞避免</b>：接近阈值后改为线性增长，避免把网络一下冲爆</li>\n<li><b>快重传</b>：收到 3 个重复 ACK 时，不等超时，直接重传丢失报文</li>\n<li><b>快恢复</b>：发生丢包后不回到最初状态，而是把窗口减半后继续增长</li>\n</ul>\n<h4>核心目标</h4>\n<p>拥塞控制不是为了把链路跑满，而是为了在吞吐、延迟和丢包之间找到平衡，避免全网一起拥塞。</p>\n<div class=\"key-point\">回答这题时如果能带上 <code>cwnd</code>、<code>ssthresh</code> 这两个词，会比只背中文名更像真懂。</div>",
        "id": "q-1d7q686"
      },
      {
        "q": "弱网场景下的优化策略有哪些？超时重试、断线重连、背压怎么配合？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>客户端策略</h4>\n<ul>\n<li><b>超时 + 指数退避</b>：失败后不要立刻重试风暴，要带 jitter 做退避</li>\n<li><b>断线重连</b>：WebSocket 或长连接断开后按退避策略重连，并做会话恢复</li>\n<li><b>本地缓冲</b>：弱网时先写本地队列，网络恢复后批量上送</li>\n<li><b>幂等设计</b>：重试必须可安全重复执行，避免重复下单或重复扣费</li>\n</ul>\n<h4>服务端策略</h4>\n<ul>\n<li><b>背压</b>：当下游处理不过来时，明确限流、排队或丢弃，而不是无限堆积</li>\n<li><b>请求降级</b>：先保核心链路，弱网下关掉高成本的附加能力</li>\n<li><b>心跳探活</b>：及时发现连接假死，避免资源一直被占着</li>\n</ul>\n<div class=\"key-point\">弱网优化不是“多重试几次”，而是重试、会话恢复、幂等和背压一起设计。</div>",
        "id": "q-1chyr79"
      },
      {
        "q": "HTTP/2 的 Stream 多路复用在 gRPC 中是怎么体现的？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>核心机制</h4>\n<p>gRPC 建立在 HTTP/2 之上，一个 TCP 连接里可以并行存在多个 Stream。每个 RPC 调用通常对应一个独立 Stream，消息被拆成 Frame 交错传输。</p>\n<h4>带来的价值</h4>\n<ul>\n<li>不需要为每个 RPC 单独建连接，降低握手和连接管理成本</li>\n<li>一个连接内可以同时跑很多调用，特别适合微服务内部高频通信</li>\n<li>头部压缩和二进制帧让传输更省带宽</li>\n</ul>\n<h4>限制点</h4>\n<p>HTTP/2 虽然解决了应用层队头阻塞，但底层还是 TCP。只要 TCP 丢包，连接上的所有 Stream 仍会一起受影响，这也是 HTTP/3 / QUIC 继续演进的原因。</p>",
        "id": "q-uka9s5"
      }
    ]
  },
  {
    "cat": "Kubernetes 深入",
    "icon": "☸️",
    "color": "#326ce5",
    "items": [
      {
        "q": "K8s 的核心架构？Master 和 Node 各有哪些组件？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>Master 节点（控制平面）</h4>\n<ul>\n<li><b>kube-apiserver</b>：所有操作的入口（RESTful API），唯一与 etcd 通信的组件</li>\n<li><b>etcd</b>：分布式 KV 存储，保存集群所有状态数据</li>\n<li><b>kube-scheduler</b>：将 Pod 调度到合适的 Node（根据资源、亲和性、污点等）</li>\n<li><b>kube-controller-manager</b>：运行各种控制器（Deployment、ReplicaSet、Node、Service 等）</li>\n</ul>\n<h4>Node 节点（工作节点）</h4>\n<ul>\n<li><b>kubelet</b>：管理 Pod 生命周期，向 apiserver 汇报节点状态</li>\n<li><b>kube-proxy</b>：维护网络规则（iptables/IPVS），实现 Service 的负载均衡</li>\n<li><b>Container Runtime</b>：运行容器（containerd / CRI-O）</li>\n</ul>\n<h4>核心对象</h4>\n<ul>\n<li><b>Pod</b>：最小调度单元，包含一个或多个容器</li>\n<li><b>Deployment</b>：管理 ReplicaSet，支持滚动更新和回滚</li>\n<li><b>Service</b>：为 Pod 提供稳定的网络入口（ClusterIP / NodePort / LoadBalancer）</li>\n<li><b>ConfigMap / Secret</b>：配置和敏感数据管理</li>\n</ul>",
        "id": "q-1x5mfm2"
      },
      {
        "q": "Pod 的生命周期？init 容器、就绪探针、存活探针的作用？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>Pod 生命周期</h4>\n<pre><code>Pending → Running → Succeeded / Failed\n           ↑\n    Init Containers → App Containers</code></pre>\n<h4>Init 容器</h4>\n<ul>\n<li>在 App 容器启动<b>之前</b>按顺序运行，全部成功后才启动 App 容器</li>\n<li>用途：等待依赖服务就绪、初始化配置文件、数据库 migration</li>\n</ul>\n<pre><code>initContainers:\n- name: wait-for-db\n  image: busybox\n  command: ['sh', '-c', 'until nc -z mysql 3306; do sleep 2; done']</code></pre>\n<h4>探针对比</h4>\n<table style=\"width:100%;font-size:13px;color:var(--text-dim);border-collapse:collapse\">\n<tr style=\"border-bottom:1px solid var(--border)\"><th style=\"text-align:left;padding:6px\">探针</th><th style=\"text-align:left;padding:6px\">失败后果</th><th style=\"text-align:left;padding:6px\">典型用途</th></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">startupProbe</td><td style=\"padding:6px\">重启容器</td><td style=\"padding:6px\">慢启动应用（Java等）</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">livenessProbe</td><td style=\"padding:6px\">重启容器</td><td style=\"padding:6px\">检测死锁/卡死</td></tr>\n<tr><td style=\"padding:6px\">readinessProbe</td><td style=\"padding:6px\">从 Service 摘除</td><td style=\"padding:6px\">是否准备好接流量</td></tr>\n</table>\n<div class=\"key-point\">readiness 失败不会重启 Pod，只是从 Endpoints 移除（不接受新请求）。你的优雅关机方案就是先让 readiness 失败</div>",
        "id": "q-dlfiam"
      },
      {
        "q": "K8s 中 Service 的负载均衡原理？ClusterIP / NodePort / LoadBalancer 区别？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>三种 Service 类型</h4>\n<ul>\n<li><b>ClusterIP</b>（默认）：分配集群内部虚拟 IP，只能集群内部访问。kube-proxy 通过 iptables/IPVS 将流量转发到后端 Pod</li>\n<li><b>NodePort</b>：在 ClusterIP 基础上，每个节点开放一个端口（30000-32767），外部可通过 NodeIP:NodePort 访问</li>\n<li><b>LoadBalancer</b>：在 NodePort 基础上，自动创建云厂商的负载均衡器（如 AWS ELB），提供外部入口 IP</li>\n</ul>\n<h4>kube-proxy 模式</h4>\n<ul>\n<li><b>iptables</b>（默认）：为每个 Service 创建 iptables 规则，随机选择后端 Pod。规则多时性能下降</li>\n<li><b>IPVS</b>：基于内核 IPVS 模块，支持多种负载均衡算法（RR/LC/WRR），大规模集群性能更好</li>\n</ul>\n<h4>Ingress</h4>\n<p>七层（HTTP）负载均衡，通过域名/路径路由到不同 Service（如 Nginx Ingress Controller）</p>",
        "id": "q-ssyycj"
      },
      {
        "q": "K8s 滚动更新的策略？如何实现零停机部署？",
        "diff": "medium",
        "tags": [
          "scene",
          "project"
        ],
        "a": "<h4>Deployment 滚动更新策略</h4>\n<pre><code>spec:\n  strategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxSurge: 1        # 最多多创建 1 个 Pod\n      maxUnavailable: 0  # 不允许有不可用的 Pod（零停机）\n  minReadySeconds: 10    # Pod Ready 后等 10 秒才算可用</code></pre>\n<h4>零停机部署要点</h4>\n<ol>\n<li><b>maxUnavailable: 0</b>：新 Pod Ready 后才销毁旧 Pod</li>\n<li><b>readinessProbe</b>：应用完全启动后才接收流量</li>\n<li><b>preStop hook + sleep</b>：给 kube-proxy 时间更新 iptables 规则</li>\n<li><b>优雅关机</b>：收到 SIGTERM 后处理完在途请求再退出</li>\n<li><b>PDB (PodDisruptionBudget)</b>：限制同时不可用的 Pod 数量</li>\n</ol>\n<pre><code># PDB：确保至少 2 个 Pod 可用\napiVersion: policy/v1\nkind: PodDisruptionBudget\nspec:\n  minAvailable: 2\n  selector:\n    matchLabels: { app: myapp }</code></pre>\n<div class=\"project-link\">简历关联：你的 go-fast 框架的 10 秒超时优雅关机 + errgroup 并行关闭，正是零停机部署的应用端实现</div>",
        "id": "q-fzaiml"
      },
      {
        "q": "什么是 K8s 的 CRD 和 Operator？Kubebuilder 在里面扮演什么角色？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>CRD 是什么</h4>\n<p><code>CustomResourceDefinition</code> 允许你在 Kubernetes 里定义自己的资源类型，比如 <code>RedisCluster</code>、<code>AIJob</code>。</p>\n<h4>Operator 是什么</h4>\n<p>Operator 本质上是“理解某类业务资源生命周期的控制器”。它持续监听自定义资源状态，并把集群实际状态修正到期望状态。</p>\n<h4>Kubebuilder 的作用</h4>\n<ul>\n<li>帮你生成 Operator 项目的脚手架</li>\n<li>定义 API、Controller、RBAC、CRD 清单</li>\n<li>底层基于 <code>controller-runtime</code>，减少样板代码</li>\n</ul>\n<div class=\"key-point\">一句话概括：CRD 定义“我要管理什么”，Operator 定义“怎么把它管好”。</div>",
        "id": "q-1khb0gx"
      },
      {
        "q": "Operator 的 Reconcile 循环是什么？为什么它必须保证幂等？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>Reconcile 的职责</h4>\n<p>Controller 收到资源变更事件后，会进入 <code>Reconcile</code>：读取期望状态，读取实际状态，然后不断执行修正动作，直到两者一致。</p>\n<pre><code>func (r *RedisReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {\n    desired := getDesiredSpec(req)\n    actual := queryClusterState(req)\n    diff := compare(desired, actual)\n    if diff.needScale {\n        scaleStatefulSet(...)\n    }\n    if diff.needConfigUpdate {\n        updateConfigMap(...)\n    }\n    return ctrl.Result{}, nil\n}</code></pre>\n<h4>为什么必须幂等</h4>\n<ul>\n<li>Reconcile 可能被反复触发，甚至同一个对象短时间多次进入循环</li>\n<li>如果逻辑不幂等，就可能重复创建资源、重复发通知或把状态改乱</li>\n<li>好的 Reconcile 不依赖“上次执行到哪一步”，而是每次都基于当前真实状态重新收敛</li>\n</ul>",
        "id": "q-wpeuxb"
      },
      {
        "q": "GPU 调度在 K8s 中怎么实现？资源管理有什么挑战？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>怎么调度 GPU</h4>\n<ul>\n<li>通过 NVIDIA Device Plugin 把 GPU 作为扩展资源暴露给 Kubernetes</li>\n<li>Pod 通过 <code>resources.limits[\"nvidia.com/gpu\"]</code> 申请 GPU</li>\n<li>调度器会把请求了 GPU 的 Pod 放到有足够 GPU 资源的节点</li>\n</ul>\n<pre><code>resources:\n  limits:\n    nvidia.com/gpu: 1</code></pre>\n<h4>常见挑战</h4>\n<ul>\n<li>GPU 资源昂贵，碎片化严重，容易出现“总量够但没有连续可用卡”</li>\n<li>不同模型对显存、带宽和延迟要求差异很大</li>\n<li>多租户场景下要处理配额、抢占和隔离</li>\n<li>推理任务和训练任务混跑时，调度策略要区分优先级</li>\n</ul>\n<div class=\"key-point\">面试里加一句“MIG、time-slicing、节点池拆分”会显得你更像做过 AI 基础设施的人。</div>",
        "id": "q-e20dxe"
      }
    ]
  },
  {
    "cat": "MongoDB",
    "icon": "🍃",
    "color": "#47a248",
    "items": [
      {
        "q": "MongoDB 和 MySQL 的核心区别？什么场景适合用 MongoDB？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>核心区别</h4>\n<table style=\"width:100%;font-size:13px;color:var(--text-dim);border-collapse:collapse\">\n<tr style=\"border-bottom:1px solid var(--border)\"><th style=\"text-align:left;padding:6px\">特性</th><th style=\"text-align:left;padding:6px\">MySQL</th><th style=\"text-align:left;padding:6px\">MongoDB</th></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">数据模型</td><td style=\"padding:6px\">关系型（行/列/表）</td><td style=\"padding:6px\">文档型（JSON/BSON）</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">Schema</td><td style=\"padding:6px\">强 Schema（需建表）</td><td style=\"padding:6px\">灵活 Schema（无需预定义）</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">JOIN</td><td style=\"padding:6px\">支持</td><td style=\"padding:6px\">不支持（嵌入文档或 $lookup）</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">事务</td><td style=\"padding:6px\">完整 ACID</td><td style=\"padding:6px\">4.0+ 支持多文档事务</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">扩展</td><td style=\"padding:6px\">垂直扩展为主</td><td style=\"padding:6px\">原生分片（水平扩展）</td></tr>\n<tr><td style=\"padding:6px\">索引</td><td style=\"padding:6px\">B+ 树</td><td style=\"padding:6px\">B 树 + 支持嵌套字段索引</td></tr>\n</table>\n<h4>适用场景</h4>\n<ul>\n<li><b>MongoDB 适合</b>：日志/埋点、内容管理（CMS）、IoT 时序数据、Schema 频繁变更的早期项目、嵌套结构数据</li>\n<li><b>MySQL 适合</b>：强一致性事务（支付/订单）、复杂关联查询、数据结构稳定的业务</li>\n</ul>\n<div class=\"key-point\">岗位关联：腾讯赛事平台和运维工具岗位要求 MongoDB 经验，通常用于日志存储、赛事数据（嵌套结构）、运维指标等场景</div>",
        "id": "q-gay2ec"
      },
      {
        "q": "MongoDB 的索引类型有哪些？复合索引和 MySQL 有什么不同？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>索引类型</h4>\n<ul>\n<li><b>单字段索引</b>：<code>db.col.createIndex({name: 1})</code></li>\n<li><b>复合索引</b>：<code>db.col.createIndex({city: 1, age: -1})</code></li>\n<li><b>多键索引 (Multikey)</b>：自动为数组字段创建，每个数组元素都有索引条目</li>\n<li><b>文本索引</b>：<code>db.col.createIndex({content: \"text\"})</code>，支持全文搜索</li>\n<li><b>地理空间索引</b>：<code>2dsphere</code>（球面）/ <code>2d</code>（平面），支持地理查询</li>\n<li><b>哈希索引</b>：用于分片键的均匀分布</li>\n<li><b>TTL 索引</b>：文档到期自动删除（如 session、日志）</li>\n</ul>\n<h4>与 MySQL 的不同</h4>\n<ul>\n<li>MongoDB 支持对<b>嵌套文档字段</b>建索引：<code>{\"address.city\": 1}</code></li>\n<li>MongoDB 支持对<b>数组</b>建多键索引，MySQL 无此概念</li>\n<li>复合索引同样遵循最左前缀原则</li>\n<li>MongoDB 索引默认存在内存中（WiredTiger 引擎），查询时不需要磁盘 IO</li>\n</ul>",
        "id": "q-m6ivnq"
      },
      {
        "q": "MongoDB 的聚合管道 (Aggregation Pipeline) 是什么？常用的阶段有哪些？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>聚合管道</h4>\n<p>类似 Unix 管道，文档依次通过多个<b>阶段 (Stage)</b>，每个阶段对文档做一种变换</p>\n<pre><code>db.orders.aggregate([\n    { $match: { status: \"paid\" } },              // WHERE\n    { $group: {                                    // GROUP BY\n        _id: \"$storeId\",\n        totalAmount: { $sum: \"$amount\" },\n        count: { $sum: 1 }\n    }},\n    { $sort: { totalAmount: -1 } },               // ORDER BY\n    { $limit: 10 },                                // LIMIT\n    { $lookup: {                                   // LEFT JOIN\n        from: \"stores\",\n        localField: \"_id\",\n        foreignField: \"_id\",\n        as: \"store\"\n    }},\n    { $project: {                                  // SELECT\n        storeName: { $arrayElemAt: [\"$store.name\", 0] },\n        totalAmount: 1,\n        count: 1\n    }}\n])</code></pre>\n<h4>常用阶段</h4>\n<ul>\n<li><code>$match</code>：过滤（尽量放前面，利用索引）</li>\n<li><code>$group</code>：分组聚合（sum/avg/count/max/min）</li>\n<li><code>$sort</code> / <code>$limit</code> / <code>$skip</code>：排序分页</li>\n<li><code>$lookup</code>：类似 LEFT JOIN（跨集合关联）</li>\n<li><code>$unwind</code>：展开数组（一条文档变多条）</li>\n<li><code>$project</code> / <code>$addFields</code>：字段选择/计算</li>\n</ul>",
        "id": "q-jljpb8"
      },
      {
        "q": "MongoDB 的事务怎么用？它和 MySQL 事务有什么差异？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>MongoDB 事务怎么写</h4>\n<p>MongoDB 4.0+ 支持多文档事务，但需要在副本集或分片集群里，通过 <code>session</code> 开启：</p>\n<pre><code>session, _ := client.StartSession()\ndefer session.EndSession(ctx)\n\nerr := mongo.WithSession(ctx, session, func(sc mongo.SessionContext) error {\n    if err := session.StartTransaction(); err != nil {\n        return err\n    }\n    if _, err := orderCol.InsertOne(sc, orderDoc); err != nil {\n        return session.AbortTransaction(sc)\n    }\n    if _, err := stockCol.UpdateOne(sc, filter, update); err != nil {\n        return session.AbortTransaction(sc)\n    }\n    return session.CommitTransaction(sc)\n})</code></pre>\n<h4>和 MySQL 的差异</h4>\n<ul>\n<li><b>MySQL</b>：事务是第一公民，关系模型、外键、JOIN、锁模型都更成熟，适合订单、支付这类强事务场景</li>\n<li><b>MongoDB</b>：事务是后来补上的能力，能用但成本更高，通常更鼓励通过文档建模减少跨文档事务</li>\n<li><b>性能影响</b>：MongoDB 多文档事务会带来更多协调和资源占用，不适合滥用</li>\n<li><b>设计思路</b>：如果数据能嵌入同一文档，MongoDB 更推荐单文档原子更新；MySQL 则天然适合多表事务</li>\n</ul>\n<h4>工程建议</h4>\n<ul>\n<li>只在确实需要维护跨文档一致性时再上事务</li>\n<li>事务里不要做长时间外部调用，避免持有资源过久</li>\n<li>对高并发读多写少场景，优先靠文档模型设计而不是把 MongoDB 用成另一套 MySQL</li>\n</ul>\n<div class=\"key-point\">现在不少 Go 后端 JD 只写“MongoDB 经验”，真正拉开差距的是你能说清：什么时候该用事务，什么时候应该回到文档建模本身。</div>",
        "id": "q-ikzhl1"
      },
      {
        "q": "时序数据库适合什么场景？它和 MySQL、Redis、MongoDB 的边界是什么？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>什么时候应该考虑 TSDB</h4>\n<ul>\n<li>指标、监控、埋点、设备上报、资源使用率这类“按时间持续写入”的数据</li>\n<li>查询模式通常是“某个时间窗口内的聚合、降采样、趋势分析”</li>\n<li>写多读多但关系不复杂，且数据会按时间自然过期</li>\n</ul>\n<h4>它擅长什么</h4>\n<ul>\n<li>高吞吐写入</li>\n<li>按时间范围查询和聚合</li>\n<li>保留策略、冷热分层、降采样</li>\n</ul>\n<h4>和其他存储的边界</h4>\n<ul>\n<li><b>MySQL</b>：适合事务和关系查询，不适合海量时间序列长期堆积</li>\n<li><b>Redis</b>：适合热点计数、秒级缓存和窗口内近实时状态，不适合长期明细留存</li>\n<li><b>MongoDB</b>：适合文档结构灵活的数据，但如果核心查询就是时间窗口聚合，TSDB 往往更自然</li>\n<li><b>TSDB</b>：适合“时间是第一维度”的数据，而不是所有历史数据都应该无脑塞进去</li>\n</ul>\n<div class=\"key-point\">这题的高质量回答不是背数据库名字，而是说清：数据模型、查询模式、保留周期和成本结构决定了你该不该上 TSDB。</div>",
        "id": "q-l2i20y"
      },
      {
        "q": "MongoDB 在高并发写入场景下如何做分片？分片键怎么选？踩过什么坑？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>MongoDB 分片架构</h4>\n<ul>\n<li><b>mongos</b>：路由层，接收客户端请求，根据分片键路由到对应 shard</li>\n<li><b>config server</b>：存储元数据和分片映射关系</li>\n<li><b>shard</b>：实际存储数据的副本集</li>\n</ul>\n<h4>分片键选择原则</h4>\n<ul>\n<li><b>高基数</b>：分片键的取值范围要足够大，否则数据集中在少数 chunk</li>\n<li><b>低频变更</b>：分片键一旦设定不能修改（MongoDB 5.0 前），选错代价极高</li>\n<li><b>查询对齐</b>：最常见的查询条件应包含分片键，否则变成 scatter-gather 全分片扫描</li>\n</ul>\n<h4>常见的坑</h4>\n<ul>\n<li><b>用自增 ID 做分片键</b>：所有写入都落到最后一个 chunk（热点写入），吞吐量打不上去</li>\n<li><b>用低基数字段（如 status）</b>：数据倾斜严重，某些 shard 被撑爆</li>\n<li><b>忽略 jumbo chunk</b>：单个 chunk 超过阈值后无法自动迁移，需要手动拆分</li>\n<li><b>推荐方案</b>：哈希分片键（如 userId 的 hash）可以均匀分布，但牺牲了范围查询能力</li>\n</ul>\n<div class=\"key-point\">分片键选错是 MongoDB 生产事故的高频原因之一。面试时能说出「自增 ID 导致热点写入」这个反例，就能展示实战经验。</div>",
        "id": "q-mg1shr"
      }
    ]
  },
  {
    "cat": "高并发与高可用",
    "icon": "⚡",
    "color": "#f43f5e",
    "items": [
      {
        "q": "什么是高并发？QPS、TPS、RT、P99 这些指标分别是什么意思？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>核心概念</h4>\n<ul>\n<li><b>高并发</b>：系统在同一时刻能处理大量请求的能力，不是单纯的流量大，而是要在高流量下保持低延迟和高可用</li>\n<li><b>QPS (Queries Per Second)</b>：每秒查询数，衡量读请求吞吐能力</li>\n<li><b>TPS (Transactions Per Second)</b>：每秒事务数，衡量写操作吞吐能力</li>\n<li><b>RT (Response Time)</b>：响应时间，通常关注平均值和尾延迟</li>\n<li><b>P99</b>：99% 的请求在这个时间内完成，比平均值更能反映用户真实体验</li>\n</ul>\n<h4>为什么 P99 比平均值更重要</h4>\n<ul>\n<li>平均 RT 20ms 可能掩盖了 1% 的请求需要 2 秒的事实</li>\n<li>尾延迟影响的往往是付费用户或高频用户</li>\n<li>优化方向：先看 P99 定位瓶颈，而不是盯着平均值优化</li>\n</ul>\n<div class=\"key-point\">面试时别把高并发等同于「加机器」，先说清你关注的指标是什么、瓶颈在哪里，再谈方案。</div>",
        "id": "q-hc1bas"
      },
      {
        "q": "高并发系统设计的常见手段有哪些？",
        "diff": "medium",
        "tags": [
          "scene",
          "project"
        ],
        "a": "<h4>六大核心手段</h4>\n<ul>\n<li><b>缓存</b>：多级缓存（本地 → Redis → DB），减少 DB 压力。你的 go-cache 适配器模式支持 Redis/Badger/File 三级</li>\n<li><b>异步</b>：非核心逻辑异步化（消息队列/任务队列）。你的 Asynq 营销召回就是异步设计</li>\n<li><b>限流</b>：令牌桶 / 漏桶 / 滑动窗口。你的 WAF 中间件就实现了高频访问防护</li>\n<li><b>分库分表</b>：水平拆分降低单库压力。你的多租户 SaaS 按 StoreId 分片</li>\n<li><b>池化</b>：连接池（DB/Redis/HTTP）、goroutine 池。你的连接池根据 CPU/内存动态计算</li>\n<li><b>读写分离</b>：主库写、从库读，分担读压力</li>\n</ul>\n<h4>架构层面</h4>\n<ul>\n<li><b>微服务拆分</b>：独立扩缩容高负载服务</li>\n<li><b>CDN + 静态资源</b>：减少服务端压力</li>\n<li><b>数据库索引优化</b>：你在 UUFind 项目中的实践</li>\n</ul>\n<div class=\"project-link\">简历关联：你的项目几乎覆盖了所有高并发手段 — 面试时可以逐个对应到具体实现</div>",
        "id": "q-1sk5mxj"
      },
      {
        "q": "限流算法有哪些？令牌桶和漏桶的区别？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>四种限流算法</h4>\n<ul>\n<li><b>固定窗口计数器</b>：时间窗口内计数，超过阈值拒绝。缺点：窗口边界突发（两个窗口交界可能 2 倍流量）</li>\n<li><b>滑动窗口计数器</b>：将窗口分成多个小格子，平滑统计。你的 WAF 用的就是滑动窗口思路</li>\n<li><b>漏桶 (Leaky Bucket)</b>：请求进入桶中，以固定速率流出。流出速率恒定，能平滑突发流量</li>\n<li><b>令牌桶 (Token Bucket)</b>：以固定速率向桶中放令牌，请求需要取令牌才能通过。允许一定程度突发</li>\n</ul>\n<h4>漏桶 vs 令牌桶</h4>\n<table style=\"width:100%;font-size:13px;color:var(--text-dim);border-collapse:collapse\">\n<tr style=\"border-bottom:1px solid var(--border)\"><th style=\"text-align:left;padding:6px\">特性</th><th style=\"text-align:left;padding:6px\">漏桶</th><th style=\"text-align:left;padding:6px\">令牌桶</th></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">流出速率</td><td style=\"padding:6px\">恒定</td><td style=\"padding:6px\">可突发</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">突发流量</td><td style=\"padding:6px\">排队等待</td><td style=\"padding:6px\">允许（消耗积累的令牌）</td></tr>\n<tr><td style=\"padding:6px\">适用场景</td><td style=\"padding:6px\">严格平滑（如短信发送）</td><td style=\"padding:6px\">允许突发（如 API 限流）</td></tr>\n</table>\n<pre><code>// Go 标准库令牌桶\nimport \"golang.org/x/time/rate\"\nlimiter := rate.NewLimiter(rate.Every(100*time.Millisecond), 10) // 每秒10个，突发10个\nif !limiter.Allow() {\n    return fiber.ErrTooManyRequests\n}</code></pre>",
        "id": "q-1n761t2"
      },
      {
        "q": "分布式系统中如何保证数据一致性？CAP 和 BASE 理论？",
        "diff": "medium",
        "tags": [],
        "a": "<h4>CAP 定理</h4>\n<ul>\n<li><b>C (Consistency)</b>：所有节点同一时间看到的数据一致</li>\n<li><b>A (Availability)</b>：每个请求都能收到非错误响应</li>\n<li><b>P (Partition tolerance)</b>：网络分区时系统仍能工作</li>\n<li>三者最多满足两个。分布式系统中 P 必选 → 实际选择是 CP 或 AP</li>\n</ul>\n<h4>BASE 理论（AP 系统的妥协）</h4>\n<ul>\n<li><b>BA (Basically Available)</b>：基本可用（允许部分功能降级）</li>\n<li><b>S (Soft state)</b>：软状态（中间状态，数据可能暂时不一致）</li>\n<li><b>E (Eventually consistent)</b>：最终一致性</li>\n</ul>\n<h4>常见一致性方案</h4>\n<ul>\n<li><b>强一致性</b>：分布式事务（2PC / 3PC）— 性能差，适合金融核心</li>\n<li><b>最终一致性</b>：消息队列 + 本地消息表 / TCC / Saga — 性能好，适合电商</li>\n</ul>\n<div class=\"key-point\">你的支付系统用 Webhook 异步回调 + 幂等处理，本质就是 BASE 的最终一致性方案</div>",
        "id": "q-1rup8vt"
      },
      {
        "q": "服务雪崩是什么？熔断、降级、限流怎么配合？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>服务雪崩</h4>\n<p>服务 A 调用服务 B，B 响应慢 → A 的线程/goroutine 被占满 → A 也变慢 → 调用 A 的 C 也受影响 → 雪崩</p>\n<h4>三板斧</h4>\n<ul>\n<li><b>限流 (Rate Limiting)</b>：入口处控制流量，超过阈值直接拒绝。防止过载</li>\n<li><b>熔断 (Circuit Breaker)</b>：检测到下游错误率过高时，暂停调用一段时间（快速失败），避免无效重试。状态：Closed → Open → Half-Open</li>\n<li><b>降级 (Fallback)</b>：熔断后返回兜底数据（缓存数据/默认值），而非直接报错</li>\n</ul>\n<pre><code>// Go 熔断器（简化版）\ntype CircuitBreaker struct {\n    failures    int\n    threshold   int       // 连续失败 N 次后熔断\n    state       string    // closed / open / half-open\n    lastFailure time.Time\n    cooldown    time.Duration\n}\n\nfunc (cb *CircuitBreaker) Call(fn func() error) error {\n    if cb.state == \"open\" {\n        if time.Since(cb.lastFailure) > cb.cooldown {\n            cb.state = \"half-open\" // 试探一次\n        } else {\n            return ErrCircuitOpen // 快速失败\n        }\n    }\n    err := fn()\n    if err != nil {\n        cb.failures++\n        cb.lastFailure = time.Now()\n        if cb.failures >= cb.threshold { cb.state = \"open\" }\n        return err\n    }\n    cb.failures = 0\n    cb.state = \"closed\"\n    return nil\n}</code></pre>\n<div class=\"key-point\">岗位关联：腾讯赛事平台要求「高可用系统设计经验」，熔断+降级+限流是核心考点</div>",
        "id": "q-1lta6ds"
      },
      {
        "q": "Go 程序的性能分析工具链有哪些？pprof、trace、benchmark 分别解决什么问题？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>三类工具各看什么</h4>\n<ul>\n<li><b><code>pprof</code></b>：看 CPU、堆内存、goroutine、锁阻塞、block profile，适合定位热点函数和资源泄漏</li>\n<li><b><code>trace</code></b>：看 goroutine 调度、系统调用、GC 和网络事件时间线，适合分析“为什么慢”</li>\n<li><b><code>benchmark</code></b>：看某个函数或算法在不同实现下的耗时和分配量，适合做局部优化对比</li>\n</ul>\n<h4>常见命令</h4>\n<pre><code># benchmark\ngo test -bench=. -benchmem ./...\n\n# pprof\ngo tool pprof http://localhost:6060/debug/pprof/profile?seconds=30\n\n# trace\ngo test -run=^$ -trace trace.out ./...\ngo tool trace trace.out</code></pre>\n<div class=\"key-point\">回答这题时不要只背工具名，重点是说明：函数级优化看 benchmark，热点定位看 pprof，时序和调度问题看 trace。</div>",
        "id": "q-94lt8t"
      },
      {
        "q": "性能优化方法论不是背工具：线上性能问题应该如何建立指标、定位、实验和回归的闭环？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>性能优化方法论的核心不是“调一把参数”</h4>\n<p>真正有用的性能优化方法论，应该是一条可复用闭环：先定义性能目标，再找瓶颈、做实验、验证收益、沉淀回放，而不是碰到慢就盲目上缓存。</p>\n<h4>一个常见闭环</h4>\n<ol>\n<li><b>定义指标</b>：先确定你要守的是吞吐、P95/P99、错误率、资源成本还是队列积压</li>\n<li><b>建立基线</b>：没有优化前的真实数据，就无法判断改动是不是有效</li>\n<li><b>定位瓶颈</b>：用 metrics、日志、pprof、trace、慢查询把问题收敛到某一层</li>\n<li><b>提出假设并做实验</b>：一次只改一个关键因素，避免多变量一起动导致结论失真</li>\n<li><b>回归验证</b>：看改完后指标有没有稳定改善，而不是只看某次压测截图</li>\n<li><b>沉淀 SOP</b>：把有效动作、阈值和回滚条件写下来，下一次才能复用</li>\n</ol>\n<h4>为什么这叫方法论</h4>\n<ul>\n<li>它能解释“为什么慢”而不是只会“我试过调大连接池”</li>\n<li>它能区分瓶颈是在 CPU、锁、网络、缓存、数据库还是下游依赖</li>\n<li>它能把一次性能事故变成后续可以复用的工程经验</li>\n</ul>\n<div class=\"key-point\">这题真正拉开差距的地方在于：你能把性能优化讲成“指标 → 定位 → 实验 → 回归 → 沉淀”的工程闭环，这才是岗位里常写的“性能优化方法论”。</div>",
        "id": "q-6ao1y7"
      },
      {
        "q": "Redis 热点 Key 和大 Key 怎么治理？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>热点 Key 治理</h4>\n<ul>\n<li>本地缓存兜底，减少所有请求都压到 Redis</li>\n<li>对可拆分的热点数据做 Key 打散，例如按用户桶或分片后缀拆开</li>\n<li>读写分离或增加副本，缓解单节点读热点</li>\n<li>对极热点内容采用“永不过期 + 异步刷新”，避免击穿</li>\n</ul>\n<h4>大 Key 治理</h4>\n<ul>\n<li>先用 <code>MEMORY USAGE</code>、<code>bigkeys</code> 等手段找出大 Key</li>\n<li>把超大 Hash、List、Set 拆成多个小 Key 或分段存储</li>\n<li>删除时优先用 <code>UNLINK</code> 做异步删除，避免阻塞主线程</li>\n<li>从设计上限制单个 Key 的元素规模，避免把 Redis 当对象存储</li>\n</ul>\n<div class=\"key-point\">面试里最好把热点 Key 和大 Key 分开答：前者关注流量集中，后者关注单次操作成本。</div>",
        "id": "q-es6a6z"
      },
      {
        "q": "MySQL 慢查询定位和优化的完整流程？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>标准流程</h4>\n<ol>\n<li>开启 <code>slow_query_log</code>，先确认慢 SQL 真实样本</li>\n<li>用 <code>pt-query-digest</code> 或日志聚合工具找最耗时、最频繁的 SQL</li>\n<li>执行 <code>EXPLAIN</code>，重点看 <code>type</code>、<code>rows</code>、<code>Extra</code></li>\n<li>判断问题属于索引缺失、回表过多、排序临时表、SQL 写法不佳还是数据量过大</li>\n<li>执行优化：补索引、改写查询、拆分页方式、分表或冷热分离</li>\n<li>回到压测或线上观察，确认优化后延迟、扫描行数和 QPS 是否真正改善</li>\n</ol>\n<h4>常见信号</h4>\n<ul>\n<li><code>Using filesort</code>：排序可能没走到合适索引</li>\n<li><code>Using temporary</code>：说明中间结果需要临时表</li>\n<li><code>type=ALL</code>：接近全表扫描，需要重点关注</li>\n</ul>\n<div class=\"key-point\">这题不是背索引口诀，重点是展示你有完整排查闭环：日志采样 → 执行计划 → 改法 → 验证。</div>",
        "id": "q-1sde06e"
      },
      {
        "q": "线上接口响应变慢，系统化排查思路是什么？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>先定范围，再逐层下钻</h4>\n<ol>\n<li>先看监控，确认是平均延迟升高还是 P95/P99 尾延迟恶化</li>\n<li>看错误率、QPS、实例 CPU/内存、goroutine 数，判断是否伴随资源异常</li>\n<li>从网关 → 应用 → 缓存 → DB 逐层排查，避免一上来就拍脑袋改代码</li>\n</ol>\n<h4>常见工具</h4>\n<ul>\n<li><b>应用层</b>：日志、pprof、trace、链路追踪</li>\n<li><b>缓存层</b>：Redis slow log、命中率、热点 Key</li>\n<li><b>数据库</b>：慢查询日志、连接数、锁等待、执行计划</li>\n<li><b>网络层</b>：连接数、超时、重传、DNS 和出口依赖状态</li>\n</ul>\n<h4>经验总结</h4>\n<p>真正的高质量回答不是“我会看日志”，而是先用监控缩小范围，再用 profile 和慢日志把问题收敛到某一层，最后给出验证过的根因。</p>",
        "id": "q-vszs02"
      },
      {
        "q": "Go 中减少锁竞争的方案有哪些？无锁设计思路怎么讲？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>先减少竞争，再谈无锁</h4>\n<ul>\n<li><b>分片锁</b>：把全局一把锁拆成多个 shard，按 key 哈希落到不同锁上</li>\n<li><b>读写分离</b>：读多写少场景用 <code>RWMutex</code> 或 <code>sync.Map</code></li>\n<li><b>缩小临界区</b>：把耗时逻辑移出锁内，减少持锁时间</li>\n<li><b>批量处理</b>：把频繁小操作合并，降低锁进入次数</li>\n</ul>\n<h4>常见无锁思路</h4>\n<ul>\n<li><b>atomic</b>：计数器、状态位、指针切换这类简单共享状态优先用原子操作</li>\n<li><b>Copy-on-Write</b>：读多写少时写入复制新副本，再原子替换指针</li>\n<li><b>Channel ownership</b>：让单 goroutine 独占状态，其他协程通过消息通信而不是共享内存</li>\n<li><b>CAS 结构</b>：如 lock-free queue，但实现复杂、易踩 ABA 和内存序问题</li>\n</ul>\n<div class=\"key-point\">面试里别上来就吹 lock-free。大多数业务系统的最优解是先把数据结构和临界区设计好，再谈无锁。</div>",
        "id": "q-lpgq5z"
      },
      {
        "q": "协程池怎么设计？为什么 goroutine 不能无上限地开？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>为什么 goroutine 不能无限开</h4>\n<ul>\n<li>单个 goroutine 虽轻量，但不是零成本：有初始栈、调度开销、上下文切换成本</li>\n<li>任务如果会打 DB、Redis、RPC，下游资源通常比 goroutine 本身更早被打满</li>\n<li>无上限并发会带来内存膨胀、队列堆积、调度抖动，严重时把系统拖进雪崩</li>\n</ul>\n<h4>一个常见协程池设计</h4>\n<pre><code>type Pool struct {\n    jobs chan func()\n    wg   sync.WaitGroup\n}\n\nfunc NewPool(workerCount, queueSize int) *Pool {\n    p := &Pool{jobs: make(chan func(), queueSize)}\n    for i := 0; i < workerCount; i++ {\n        go func() {\n            for job := range p.jobs {\n                job()\n                p.wg.Done()\n            }\n        }()\n    }\n    return p\n}\n\nfunc (p *Pool) Submit(job func()) {\n    p.wg.Add(1)\n    p.jobs <- job\n}\n\nfunc (p *Pool) Wait() { p.wg.Wait() }</code></pre>\n<h4>设计时要想清楚的点</h4>\n<ul>\n<li><b>并发度上限</b>：通常按 CPU、连接池大小、下游吞吐能力共同决定</li>\n<li><b>队列长度</b>：太短会频繁拒绝，太长会造成排队过久</li>\n<li><b>拒绝策略</b>：阻塞等待、直接丢弃、返回错误、降级到异步补偿</li>\n<li><b>超时与取消</b>：最好配合 <code>context</code>，否则任务堆积后很难止损</li>\n</ul>\n<div class=\"key-point\">这题真正想听的不是你会写 worker pool，而是你知道协程池的价值在于控制并发和保护下游，不是为了“把 goroutine 用满”。</div>",
        "id": "q-lf7hbg"
      },
      {
        "q": "程序化广告或数据监测类系统的实时统计链路怎么设计？如何做去重、聚合和延迟控制？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>先把链路拆开看</h4>\n<ul>\n<li><b>入口</b>：曝光、点击、转化等事件先统一写入 MQ / Kafka</li>\n<li><b>去重</b>：依赖 requestId、impressionId、traceId 或业务指纹做幂等去重</li>\n<li><b>实时聚合</b>：按事件时间做窗口聚合，输出近实时统计值</li>\n<li><b>明细留存</b>：原始日志异步落明细库或 OLAP，供离线对账和校准</li>\n</ul>\n<h4>为什么不能只做“实时加一”</h4>\n<ul>\n<li>会遇到重复上报、乱序到达、延迟上报、补发重放</li>\n<li>如果口径不清，实时面板和离线报表很容易打架</li>\n<li>高峰时如果同步落库，主链路延迟会被直接拖垮</li>\n</ul>\n<h4>常见工程做法</h4>\n<ul>\n<li><b>Redis / 本地缓存</b>：承接热点计数，先给近实时看板用</li>\n<li><b>流式处理</b>：按窗口聚合，控制延迟和迟到事件策略</li>\n<li><b>离线校准</b>：把实时近似值和离线精确值分层表达，别混成一个数字</li>\n<li><b>背压与降级</b>：高峰时优先保主链路，统计链路允许近似和延迟</li>\n</ul>\n<div class=\"key-point\">这题真正的核心不是“会不会统计”，而是你知不知道实时统计系统要同时处理去重、口径、一致性和高峰延迟这四个矛盾。</div>",
        "id": "q-1m8jgdz"
      },
      {
        "q": "“高并发”不是泛词：社交或广告系统里最先爆的通常是哪几层？容量评估怎么做？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>最先爆的通常不是你以为的那一层</h4>\n<ul>\n<li><b>连接层</b>：长连接数、心跳风暴、网关接入能力往往最先打满</li>\n<li><b>缓存热点层</b>：在线人数、房间状态、排行榜、计数器等热点 key 会先出问题</li>\n<li><b>队列层</b>：异步统计、消息广播、日志落地一旦积压，延迟会迅速放大</li>\n<li><b>数据库层</b>：写放大、索引竞争、热点行更新通常是最后的硬瓶颈</li>\n</ul>\n<h4>容量评估不能只看 QPS</h4>\n<ul>\n<li>还要看<b>并发连接数</b>、消息吞吐、P95/P99、错误率</li>\n<li>要结合 Redis 热点、队列 lag、连接池占用、慢查询数一起看</li>\n<li>要分清“入口流量大”还是“单次处理成本高”</li>\n</ul>\n<h4>更实用的方法</h4>\n<ol>\n<li>先找核心业务链路，例如进房、发消息、广告曝光回传</li>\n<li>为每一层定义关键指标和阈值</li>\n<li>用压测 + 线上监控双证据验证，而不是拍脑袋估容量</li>\n<li>最终输出“哪层先到极限、极限前怎么止损”，而不只是一个孤立数字</li>\n</ol>\n<div class=\"key-point\">这题的高分点在于你能讲清容量建模和分层瓶颈，而不是泛泛地说“我们系统很高并发”。</div>",
        "id": "q-25fyg1"
      }
    ]
  },
  {
    "cat": "微服务治理",
    "icon": "🔗",
    "color": "#06b6d4",
    "items": [
      {
        "q": "微服务的服务发现有哪些方式？注册中心的作用？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>两种模式</h4>\n<ul>\n<li><b>客户端发现</b>：服务实例注册到注册中心（如 Consul/etcd/Nacos），客户端从注册中心获取实例列表，自行负载均衡</li>\n<li><b>服务端发现</b>：请求先到负载均衡器（如 K8s Service/Nginx），由 LB 查询注册中心并转发</li>\n</ul>\n<h4>常见注册中心对比</h4>\n<table style=\"width:100%;font-size:13px;color:var(--text-dim);border-collapse:collapse\">\n<tr style=\"border-bottom:1px solid var(--border)\"><th style=\"text-align:left;padding:6px\">注册中心</th><th style=\"text-align:left;padding:6px\">一致性</th><th style=\"text-align:left;padding:6px\">语言</th><th style=\"text-align:left;padding:6px\">特点</th></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">etcd</td><td style=\"padding:6px\">CP (Raft)</td><td style=\"padding:6px\">Go</td><td style=\"padding:6px\">K8s 默认，强一致</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">Consul</td><td style=\"padding:6px\">CP (Raft)</td><td style=\"padding:6px\">Go</td><td style=\"padding:6px\">自带健康检查、KV 存储、DNS</td></tr>\n<tr style=\"border-bottom:1px solid var(--border)\"><td style=\"padding:6px\">Nacos</td><td style=\"padding:6px\">AP/CP 切换</td><td style=\"padding:6px\">Java</td><td style=\"padding:6px\">阿里开源，配置中心 + 服务发现</td></tr>\n<tr><td style=\"padding:6px\">ZooKeeper</td><td style=\"padding:6px\">CP (ZAB)</td><td style=\"padding:6px\">Java</td><td style=\"padding:6px\">老牌，Kafka 依赖（逐步淘汰）</td></tr>\n</table>\n<h4>K8s 内置服务发现</h4>\n<p>K8s 通过 Service + DNS 实现服务发现：<code>myservice.namespace.svc.cluster.local</code>，无需额外注册中心</p>",
        "id": "q-1drhjo5"
      },
      {
        "q": "分布式链路追踪是什么？OpenTelemetry 怎么用？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>为什么需要链路追踪</h4>\n<p>微服务架构下一个请求可能跨越多个服务（如你的 17 个服务），出问题时需要知道：哪个服务慢了？哪个调用链出错了？</p>\n<h4>核心概念</h4>\n<ul>\n<li><b>Trace</b>：一次完整请求的调用链（从入口到所有下游）</li>\n<li><b>Span</b>：Trace 中的一个操作（如一次 RPC 调用、一次 DB 查询）</li>\n<li><b>TraceID</b>：贯穿整个调用链的唯一 ID</li>\n<li><b>SpanID + ParentSpanID</b>：构建调用树</li>\n</ul>\n<h4>Go 中接入 OpenTelemetry</h4>\n<pre><code>import \"go.opentelemetry.io/otel\"\n\n// 中间件自动创建 Span\nfunc TracingMiddleware(c *fiber.Ctx) error {\n    tracer := otel.Tracer(\"myservice\")\n    ctx, span := tracer.Start(c.Context(), c.Path())\n    defer span.End()\n\n    span.SetAttributes(\n        attribute.String(\"http.method\", c.Method()),\n        attribute.Int(\"http.status_code\", c.Response().StatusCode()),\n    )\n    c.SetUserContext(ctx) // 传播 context\n    return c.Next()\n}\n\n// 下游 RPC 调用时 context 透传 TraceID\nfunc callOrderService(ctx context.Context) {\n    _, span := otel.Tracer(\"myservice\").Start(ctx, \"rpc.order.create\")\n    defer span.End()\n    // RPC 请求自动携带 TraceID\n}</code></pre>\n<div class=\"key-point\">面试加分：提到你的 17 个业务服务如果引入链路追踪，可以快速定位跨服务调用中的性能瓶颈</div>",
        "id": "q-agdyxq"
      },
      {
        "q": "微服务中如何处理分布式事务？Saga 模式是什么？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>分布式事务方案</h4>\n<ul>\n<li><b>2PC (两阶段提交)</b>：协调者 → 所有参与者 prepare → 全部 OK 则 commit，任一失败则 rollback。强一致但性能差、有单点问题</li>\n<li><b>TCC (Try-Confirm-Cancel)</b>：业务层实现三个方法，Try 预留 → Confirm 确认 → Cancel 撤销。侵入性强</li>\n<li><b>Saga</b>：将长事务拆成多个本地事务，每个事务有对应的<b>补偿操作</b>。任一步失败则逆序执行补偿</li>\n<li><b>本地消息表</b>：业务操作和消息写入同一个本地事务，后台异步发送消息。最终一致性</li>\n</ul>\n<h4>Saga 示例：跨境电商下单</h4>\n<pre><code>// 正向流程\nT1: 创建订单 (order-service)\nT2: 扣减库存 (inventory-service)\nT3: 创建支付 (payment-service)\n\n// 补偿流程（T3 失败时逆序执行）\nC2: 恢复库存\nC1: 取消订单\n\n// 编排方式\n// 1. 协调器模式：中央编排器管理所有步骤\n// 2. 事件驱动模式：每个服务完成后发事件，下一个服务监听</code></pre>\n<h4>你的项目场景</h4>\n<p>主子订单拆分 + 多支付网关场景，退款链路本质就是 Saga 的补偿机制：取消支付 → 恢复库存 → 更新订单状态</p>",
        "id": "q-1yahdcj"
      },
      {
        "q": "gRPC 的四种通信模式是什么？分别适合什么场景？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>四种模式</h4>\n<ul>\n<li><b>Unary</b>：一问一答，最常见，适合普通接口调用</li>\n<li><b>Server Streaming</b>：客户端发一次请求，服务端持续返回多条消息，适合日志流、价格流、进度流</li>\n<li><b>Client Streaming</b>：客户端持续上传多条消息，服务端最终返回一次结果，适合批量上报或分片上传</li>\n<li><b>Bidirectional Streaming</b>：双向都能持续发送消息，适合聊天、协同编辑、实时控制</li>\n</ul>\n<h4>怎么答更像工程师</h4>\n<p>不要只背定义，最好顺手补一句：gRPC 基于 HTTP/2，一个连接上可以并行承载多个 Stream，所以流式调用的成本比轮询低很多。</p>",
        "id": "q-1wl8hrc"
      },
      {
        "q": "Protobuf 的编码原理是什么？为什么通常比 JSON 更快？",
        "diff": "easy",
        "tags": [],
        "a": "<h4>核心原理</h4>\n<ul>\n<li>Protobuf 使用字段编号而不是字段名，减少了冗余文本</li>\n<li>整包采用二进制编码，常见整数使用 <code>Varint</code> 变长编码</li>\n<li>消息按 tag + value 的方式组织，解码时可以快速按字段号路由</li>\n</ul>\n<h4>为什么比 JSON 快</h4>\n<ul>\n<li>体积更小，网络传输成本更低</li>\n<li>省去了 JSON 文本解析和字段名匹配的成本</li>\n<li>字段类型在 schema 中已确定，反序列化更直接</li>\n</ul>\n<div class=\"key-point\">工程上常见结论是：Protobuf 不是“永远最快”，但在 RPC 和内部服务通信里，通常比 JSON 更省带宽也更稳定。</div>",
        "id": "q-1154leh"
      },
      {
        "q": "gRPC 的拦截器怎么用？和 HTTP 中间件有什么对应关系？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>对应关系</h4>\n<p>gRPC 的 <code>UnaryInterceptor</code> 和 <code>StreamInterceptor</code> 本质上就像 HTTP 中间件：在真正执行业务逻辑前后统一插入横切逻辑。</p>\n<h4>常见用途</h4>\n<ul>\n<li>认证鉴权</li>\n<li>请求日志与审计</li>\n<li>限流、熔断、超时控制</li>\n<li>TraceID 透传和链路追踪</li>\n</ul>\n<pre><code>server := grpc.NewServer(\n    grpc.ChainUnaryInterceptor(\n        loggingInterceptor,\n        authInterceptor,\n        tracingInterceptor,\n    ),\n)</code></pre>\n<div class=\"key-point\">如果面试官追问差异，可以补一句：流式拦截器拿到的是 Stream，需要特别处理消息读写和生命周期。</div>",
        "id": "q-1f937c9"
      },
      {
        "q": "gRPC 的负载均衡方案有哪些？客户端负载和代理负载怎么选？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>两类主流方案</h4>\n<ul>\n<li><b>客户端负载均衡</b>：客户端通过 Name Resolver 拿到实例列表，再由 balancer 选择目标实例，常见策略有 <code>pick_first</code> 和 <code>round_robin</code></li>\n<li><b>代理负载均衡</b>：客户端只连 Envoy、Nginx 或 Service Mesh，由代理统一转发到后端实例</li>\n</ul>\n<h4>怎么选</h4>\n<ul>\n<li>客户端负载更轻链路、少一跳，但客户端要理解服务发现和实例变化</li>\n<li>代理负载便于统一治理，如 TLS、熔断、限流、观测，但会增加一层基础设施</li>\n</ul>\n<div class=\"key-point\">小规模服务常用客户端负载，大规模多语言体系更常见代理或 Service Mesh 统一治理。</div>",
        "id": "q-qbpll5"
      },
      {
        "q": "可观测性的三支柱是什么？Metrics、Logs、Traces 分别解决什么问题？",
        "diff": "easy",
        "tags": [
          "scene"
        ],
        "a": "<h4>三支柱</h4>\n<ul>\n<li><b>Metrics</b>：数值型指标，适合看整体趋势和告警，如 QPS、错误率、P99、CPU 使用率</li>\n<li><b>Logs</b>：事件明细，适合定位具体报错和业务上下文</li>\n<li><b>Traces</b>：跨服务调用链，适合分析请求在哪一跳慢了、哪一层出错</li>\n</ul>\n<h4>各自擅长什么</h4>\n<ul>\n<li>先用 Metrics 发现问题</li>\n<li>再用 Logs 看具体异常</li>\n<li>最后用 Traces 把跨服务链路串起来</li>\n</ul>\n<div class=\"key-point\">真正的可观测性不是三套工具堆在一起，而是你能用它们快速回答：哪里有问题、为什么有问题、影响到谁。</div>",
        "id": "q-1omm89g"
      },
      {
        "q": "SLO、SLI、SLA 分别是什么？如何在系统里落地？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>三个概念</h4>\n<ul>\n<li><b>SLI</b>：服务指标，例如可用性、P99 延迟、错误率</li>\n<li><b>SLO</b>：目标值，例如“月可用性 99.9%”或“P99 &lt; 300ms”</li>\n<li><b>SLA</b>：对外承诺，通常写进合同或客户协议</li>\n</ul>\n<h4>怎么落地</h4>\n<ul>\n<li>先选真正影响用户体验的 SLI，而不是堆一堆无关指标</li>\n<li>围绕 SLO 做告警和 error budget 管理</li>\n<li>当 error budget 被大量消耗时，优先稳态而不是继续冲功能</li>\n</ul>\n<div class=\"key-point\">面试里加一句会很加分：SLO 不是写在 PPT 里的，它应该反过来约束发布节奏和告警策略。</div>",
        "id": "q-oa37fy"
      },
      {
        "q": "Prometheus + Grafana 监控体系怎么搭建？Go 服务如何暴露指标？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>典型链路</h4>\n<p>Go 服务暴露 <code>/metrics</code> → Prometheus 定时抓取 → Grafana 负责可视化和告警。</p>\n<pre><code>import \"github.com/prometheus/client_golang/prometheus\"\nimport \"github.com/prometheus/client_golang/prometheus/promhttp\"\n\nvar requestTotal = prometheus.NewCounterVec(\n    prometheus.CounterOpts{\n        Name: \"http_requests_total\",\n        Help: \"Total HTTP requests\",\n    },\n    []string{\"path\", \"method\", \"status\"},\n)\n\nfunc main() {\n    prometheus.MustRegister(requestTotal)\n    http.Handle(\"/metrics\", promhttp.Handler())\n    http.ListenAndServe(\":9090\", nil)\n}</code></pre>\n<h4>建议监控哪些</h4>\n<ul>\n<li>请求量、错误率、延迟分位数</li>\n<li>goroutine 数、GC、内存、CPU</li>\n<li>DB/Redis 连接池、命中率、超时数</li>\n</ul>",
        "id": "q-dmidpx"
      },
      {
        "q": "gRPC 的底层实现依赖哪些协议和机制？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>先说结论</h4>\n<p>gRPC 通常建立在 <b>HTTP/2 + Protobuf</b> 之上：HTTP/2 负责连接复用和流控，Protobuf 负责结构化二进制编码。</p>\n<h4>底层关键点</h4>\n<ul>\n<li><b>HTTP/2 Stream</b>：一个 TCP 连接里可并行承载多个 RPC 调用，每个调用对应一个 Stream</li>\n<li><b>Frame 分帧</b>：请求和响应最终会拆成 HEADER / DATA 等帧在连接里传输</li>\n<li><b>HPACK</b>：HTTP/2 的头部压缩机制，减少重复 Header 的传输成本</li>\n<li><b>Flow Control</b>：连接级和 Stream 级流控，避免接收方被流量压垮</li>\n<li><b>Protobuf</b>：把消息编码成紧凑的二进制结构，比 JSON 更省带宽</li>\n<li><b>TLS / ALPN</b>：生产环境里通常配合 TLS 使用，通过 ALPN 协商到 HTTP/2</li>\n</ul>\n<h4>为什么它适合内部服务通信</h4>\n<ul>\n<li>连接复用，减少频繁建连成本</li>\n<li>天然支持流式调用</li>\n<li>IDL 驱动，跨语言接口更规范</li>\n<li>配合 deadline、metadata、拦截器，更容易做统一治理</li>\n</ul>\n<div class=\"key-point\">这题别只答“gRPC 基于 HTTP/2”。真正拉开差距的是你能继续往下讲：Stream、多路复用、分帧、流控、Protobuf、TLS 这些机制是怎么一起工作的。</div>",
        "id": "q-108dns7"
      },
      {
        "q": "从告警触发到回滚止损，如何把 Metrics、日志、Trace、灰度发布串成一个排障闭环？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>真正的闭环不是“看到告警”就结束</h4>\n<ol>\n<li><b>Metrics 发现异常</b>：先由错误率、P99、吞吐突变等指标触发告警</li>\n<li><b>Logs 看具体报错</b>：确认异常是参数错误、下游超时、资源耗尽还是业务逻辑问题</li>\n<li><b>Trace 缩小范围</b>：用 TraceID 找到慢在哪个服务、哪一跳、哪个依赖</li>\n<li><b>判断是否只影响灰度流量</b>：如果异常主要集中在新版本，优先切流或回滚，而不是先硬扛</li>\n<li><b>验证恢复</b>：回滚或切流后再看指标是否回归，而不是做完动作就宣布结束</li>\n</ol>\n<h4>为什么这四件事要串起来</h4>\n<ul>\n<li>Metrics 负责“发现哪里不对”</li>\n<li>Logs 负责“看具体报错细节”</li>\n<li>Traces 负责“串联跨服务链路”</li>\n<li>灰度 / 回滚负责“快速止损”</li>\n</ul>\n<h4>落地时最常见的坑</h4>\n<ul>\n<li>只有告警没有 TraceID，看到红色却找不到根因</li>\n<li>回滚后不验证，结果问题根本不在版本本身</li>\n<li>日志和指标没统一标签，排障时跨系统对不上</li>\n<li>没有预先定义好回滚阈值，出问题时全靠拍脑袋</li>\n</ul>\n<div class=\"key-point\">这题能拉开层次的地方在于：你要表现出“发现异常、定位原因、快速止损、验证恢复、沉淀复盘”是一个完整闭环，而不是几套工具的名字清单。</div>",
        "id": "q-ixcscv"
      },
      {
        "q": "配置中心的分层覆盖怎么设计？环境、租户、主题、运行时配置冲突时谁优先？",
        "diff": "hard",
        "tags": [
          "scene"
        ],
        "a": "<h4>配置中心最怕的不是“没有配置”，而是“优先级说不清”</h4>\n<p>一个配置既可能来自默认层、环境层、租户层、主题层，也可能被运行时临时覆盖。核心问题不是有没有值，而是谁覆盖谁。</p>\n<h4>一个常见覆盖顺序</h4>\n<pre><code>default\n  &lt; environment\n  &lt; region\n  &lt; tenant\n  &lt; theme\n  &lt; runtime override</code></pre>\n<ul>\n<li><b>default</b>：全局默认值</li>\n<li><b>environment</b>：dev / test / prod 等环境维度</li>\n<li><b>tenant</b>：租户个性化配置</li>\n<li><b>theme</b>：业务主题或场景化覆盖</li>\n<li><b>runtime override</b>：热修、灰度、紧急开关，优先级最高</li>\n</ul>\n<h4>工程上还要补什么</h4>\n<ul>\n<li><b>来源可追踪</b>：要能回答“最终值来自哪一层”</li>\n<li><b>Schema 校验</b>：配置不是随便存字符串，类型和取值范围要校验</li>\n<li><b>灰度发布</b>：配置变更也可能是生产事故，需要小流量验证</li>\n<li><b>快速回滚</b>：运行时覆盖必须能立即撤销</li>\n</ul>\n<div class=\"key-point\">这题真正考的是配置治理，不是 key-value 存储本身。高质量回答要体现“分层、审计、灰度、回滚”四件事。</div>",
        "id": "q-1anj48l"
      },
      {
        "q": "etcd、ZooKeeper、Consul 怎么选？etcd 的 Watch + Lease 怎么做服务注册发现？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>三者核心对比</h4>\n<ul>\n<li><b>etcd</b>：Go 编写，Raft 共识算法，强一致性，Watch API + Lease 租约。单二进制部署简单，K8s 内置使用</li>\n<li><b>ZooKeeper</b>：Java 编写，ZAB 协议，强一致性。功能成熟但部署重（依赖 JVM），临时节点 + Watcher 做服务发现</li>\n<li><b>Consul</b>：Go 编写，Raft 共识，内置服务发现 + 健康检查 + KV + Service Mesh。功能最全但概念多</li>\n</ul>\n<h4>选型依据</h4>\n<ul>\n<li><b>已有 K8s 生态</b>：优先 etcd，天然集成</li>\n<li><b>需要全套服务网格</b>：考虑 Consul</li>\n<li><b>Java 技术栈 / 已有 ZK 运维经验</b>：继续用 ZooKeeper</li>\n<li><b>只需配置中心 + 服务发现</b>：etcd 最轻量</li>\n</ul>\n<h4>etcd Watch + Lease 服务注册流程</h4>\n<ol>\n<li>服务启动时，创建一个 Lease（设 TTL=10s），拿到 LeaseID</li>\n<li>将服务信息写入 etcd，Key 绑定 LeaseID：<code>PUT /services/user/instance-1 --lease=xxx</code></li>\n<li>服务持续发送 KeepAlive 续约，保持 Lease 不过期</li>\n<li>服务挂了 → 停止续约 → Lease 到期 → etcd 自动删除 Key</li>\n<li>消费端通过 <code>Watch /services/user/</code> 前缀，实时感知实例上下线</li>\n</ol>\n<div class=\"key-point\">面试追问\"为什么不用 Redis 做服务发现\"：Redis 不保证强一致性，网络分区时可能出现脑裂。etcd/ZK 基于共识算法，在一致性上有协议级保证。</div>",
        "id": "q-9kpxmf"
      }
    ]
  },
  {
    "cat": "Linux 基础",
    "icon": "🐧",
    "color": "#fbbf24",
    "items": [
      {
        "q": "常用的 Linux 排查命令？线上服务 CPU 飙高怎么定位？",
        "diff": "easy",
        "tags": [
          "scene"
        ],
        "a": "<h4>常用命令</h4>\n<ul>\n<li><code>top / htop</code>：实时查看 CPU、内存占用，按进程排序</li>\n<li><code>ps aux | grep xxx</code>：查看进程信息</li>\n<li><code>netstat -tlnp / ss -tlnp</code>：查看端口监听和连接状态</li>\n<li><code>lsof -i :8080</code>：查看端口被哪个进程占用</li>\n<li><code>df -h / du -sh</code>：磁盘空间</li>\n<li><code>free -h</code>：内存使用</li>\n<li><code>tail -f /var/log/xxx.log</code>：实时查看日志</li>\n<li><code>strace -p PID</code>：跟踪系统调用</li>\n</ul>\n<h4>CPU 飙高排查（Go 服务）</h4>\n<pre><code># 1. top 找到 CPU 最高的进程 PID\ntop -c\n\n# 2. 对 Go 服务，用 pprof\n# 在代码中引入\nimport _ \"net/http/pprof\"\ngo http.ListenAndServe(\":6060\", nil)\n\n# 3. 采集 CPU profile\ngo tool pprof http://localhost:6060/debug/pprof/profile?seconds=30\n\n# 4. 查看火焰图\ngo tool pprof -http=:8081 profile.out\n\n# 5. 常见原因：\n# - 死循环 / 无限递归\n# - GC 压力大（大量小对象分配）\n# - 锁竞争（mutex contention）\n# - 正则表达式回溯</code></pre>",
        "id": "q-1jr6c9a"
      },
      {
        "q": "Go 服务内存泄漏怎么排查？pprof 怎么用？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>pprof 排查流程</h4>\n<pre><code>// 1. 引入 pprof\nimport _ \"net/http/pprof\"\ngo http.ListenAndServe(\":6060\", nil)\n\n// 2. 查看堆内存分配\ngo tool pprof http://localhost:6060/debug/pprof/heap\n\n// 3. 常用命令\n(pprof) top 10          // 内存分配 Top 10 函数\n(pprof) list funcName   // 查看具体函数的分配详情\n(pprof) web             // 生成调用图（需要 graphviz）\n\n// 4. 对比两个时间点的堆快照\ngo tool pprof -base heap1.out heap2.out  // 查看增量\n\n// 5. Goroutine 泄漏\ngo tool pprof http://localhost:6060/debug/pprof/goroutine\n// goroutine 数量持续增长 → 泄漏</code></pre>\n<h4>常见 Go 内存泄漏原因</h4>\n<ul>\n<li><b>Goroutine 泄漏</b>：channel 无人读/写导致 goroutine 永远阻塞（最常见）</li>\n<li><b>未关闭的资源</b>：HTTP response body、DB rows、文件句柄未 Close()</li>\n<li><b>全局 map 无限增长</b>：如缓存没有淘汰策略</li>\n<li><b>time.After 在循环中</b>：每次创建新的 Timer 未被 GC</li>\n<li><b>slice 引用大数组</b>：<code>s := bigSlice[:2]</code> 仍引用底层大数组</li>\n</ul>\n<div class=\"key-point\">面试时可以结合项目：你的 WAF 中间件访客队列如果消费者挂了，channel 满后会阻塞生产者 goroutine → 需要带 default 或 select+timeout 防护</div>",
        "id": "q-152su1v"
      },
      {
        "q": "Linux 文件描述符是什么？Too many open files 怎么解决？",
        "diff": "easy",
        "tags": [
          "scene"
        ],
        "a": "<h4>文件描述符 (fd)</h4>\n<p>Linux 中一切皆文件。每个进程打开的文件、socket、管道等都有一个整数编号（fd）</p>\n<ul>\n<li><code>0</code>：stdin | <code>1</code>：stdout | <code>2</code>：stderr</li>\n<li>每个进程有 fd 上限（默认 1024）</li>\n</ul>\n<h4>Too many open files 排查</h4>\n<pre><code># 查看当前进程打开的 fd 数\nls /proc/PID/fd | wc -l\n\n# 查看进程的 fd 限制\ncat /proc/PID/limits | grep \"open files\"\n\n# 查看系统级限制\ncat /proc/sys/fs/file-max\n\n# 解决方案\n# 1. 临时调整\nulimit -n 65535\n\n# 2. 永久调整 (/etc/security/limits.conf)\n* soft nofile 65535\n* hard nofile 65535\n\n# 3. systemd 服务\n[Service]\nLimitNOFILE=65535</code></pre>\n<h4>根本原因</h4>\n<p>通常不是真的需要这么多 fd，而是代码有资源泄漏：</p>\n<ul>\n<li>HTTP 响应 Body 未 <code>resp.Body.Close()</code></li>\n<li>数据库连接未释放</li>\n<li>文件打开后未关闭</li>\n</ul>\n<div class=\"key-point\">Go 中养成习惯：<code>defer resp.Body.Close()</code>、<code>defer rows.Close()</code>、<code>defer f.Close()</code></div>",
        "id": "q-1vd8czs"
      },
      {
        "q": "Shell 脚本在后端日常运维中怎么用？写过哪些实用脚本？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>后端工程师常用的 Shell 场景</h4>\n<ul>\n<li><b>日志分析</b>：<code>grep + awk + sort + uniq -c</code> 快速统计错误分布、慢请求 Top N</li>\n<li><b>批量操作</b>：批量重启服务、批量更新配置、批量清理过期文件</li>\n<li><b>健康检查</b>：定时检测端口、进程、磁盘空间，异常时发告警</li>\n<li><b>部署脚本</b>：编译、打包、推送、滚动重启的自动化串联</li>\n</ul>\n<h4>实用示例</h4>\n<pre><code># 统计最近 1 小时 5xx 错误的 Top 10 接口\ngrep '$(date +%H):' access.log | awk '$9 >= 500 {print $7}' | sort | uniq -c | sort -rn | head -10\n\n# 批量检查多台机器的服务状态\nfor host in $(cat hosts.txt); do\n  ssh $host 'systemctl is-active myservice' 2>/dev/null || echo \"$host: DOWN\"\ndone\n\n# 清理 7 天前的日志\nfind /var/log/app/ -name '*.log' -mtime +7 -exec rm -f {} \\;</code></pre>\n<h4>写 Shell 脚本的工程习惯</h4>\n<ul>\n<li>开头加 <code>set -euo pipefail</code>，遇错即停，未定义变量报错</li>\n<li>关键操作前做 dry-run 或加确认提示</li>\n<li>日志输出带时间戳，方便事后排查</li>\n</ul>\n<div class=\"key-point\">面试时别只说\\\"会用 grep\\\"，能举一个你实际写过的脚本场景（比如日志分析、批量部署），说清输入输出和用到的命令组合。</div>",
        "id": "q-sh1ops"
      },
      {
        "q": "Go 项目如何建立代码审查（Code Review）规范？审查时重点看什么？",
        "diff": "medium",
        "tags": [
          "scene"
        ],
        "a": "<h4>Code Review 的核心目标</h4>\n<ul>\n<li>不是找 typo，而是<b>发现设计问题、逻辑漏洞和潜在风险</b></li>\n<li>同时也是团队知识传递和技术标准对齐的手段</li>\n</ul>\n<h4>Go 项目审查重点</h4>\n<ul>\n<li><b>错误处理</b>：error 是否被忽略、是否有合适的上下文包装（<code>fmt.Errorf(\"xxx: %w\", err)</code>）</li>\n<li><b>并发安全</b>：共享变量有没有加锁或用 channel 保护、goroutine 有没有泄漏风险</li>\n<li><b>资源释放</b>：DB 连接、HTTP Body、文件句柄是否 defer Close</li>\n<li><b>接口设计</b>：函数签名是否清晰、参数是否过多、返回值是否合理</li>\n<li><b>测试覆盖</b>：关键路径有没有测试、边界条件有没有覆盖</li>\n<li><b>性能隐患</b>：循环内是否有不必要的分配、SQL 是否有 N+1 问题</li>\n</ul>\n<h4>流程规范</h4>\n<ul>\n<li>PR 粒度要小，一个 PR 解决一个问题，不要混杂无关改动</li>\n<li>CI 先过（lint + test），再请人 Review</li>\n<li>Review 意见分级：Must Fix / Suggestion / Nit</li>\n<li>作者要写清 PR 描述：做了什么、为什么、怎么测的</li>\n</ul>\n<div class=\"key-point\">面试时的高分回答：不只是说\\\"我们有 CR 流程\\\"，而是能举例你在 Review 中发现过什么问题（比如并发 bug、资源泄漏），以及这个发现避免了什么线上事故。</div>",
        "id": "q-cr1rev"
      }
    ]
  }
];
