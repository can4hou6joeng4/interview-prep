import XCTest
@testable import InterviewPrep

final class QuestionSearchTests: XCTestCase {
    private func question(_ id: String, _ q: String, _ a: String = "", tags: [String] = [], diff: String = "medium") -> Question {
        Question(q: q, a: a, diff: diff, tags: tags, id: id)
    }

    private func category(_ name: String, _ slug: String, _ items: [Question]) -> InterviewPrep.Category {
        InterviewPrep.Category(cat: name, icon: "📚", color: "#4F46E5", slug: slug, items: items)
    }

    private lazy var goCategory = category("Go 核心", "go", [
        question("q1", "什么是 goroutine 调度？", "G-M-P 模型配合本地队列和全局队列调度协程"),
        question("q2", "context 如何取消传播？", "通过父子 context 树和 Done channel 串联"),
        question("q3", "sync.Map 的适用场景", "读多写少的并发安全映射")
    ])

    private lazy var mysqlCategory = category("MySQL", "mysql", [
        question("q4", "索引失效的常见原因", "隐式类型转换、函数包装、前缀模糊查询等都会使得索引失效"),
        question("q5", "事务四种隔离级别", "读未提交、读已提交、可重复读、串行化")
    ])

    private var allCategories: [InterviewPrep.Category] { [goCategory, mysqlCategory] }

    func test_search_emptyKeywordReturnsNothing() {
        XCTAssertTrue(QuestionSearch.search(keyword: "", in: allCategories).isEmpty)
    }

    func test_search_whitespaceOnlyKeywordReturnsNothing() {
        XCTAssertTrue(QuestionSearch.search(keyword: "   \n", in: allCategories).isEmpty)
    }

    func test_search_matchesQuestionText() {
        let results = QuestionSearch.search(keyword: "goroutine", in: allCategories)
        XCTAssertEqual(results.map(\.question.id), ["q1"])
    }

    func test_search_matchesAnswerText() {
        let results = QuestionSearch.search(keyword: "Done channel", in: allCategories)
        XCTAssertEqual(results.map(\.question.id), ["q2"])
    }

    func test_search_isCaseInsensitive() {
        let results = QuestionSearch.search(keyword: "MAP", in: allCategories)
        XCTAssertEqual(results.map(\.question.id), ["q3"])
    }

    func test_search_trimsLeadingTrailingWhitespace() {
        let results = QuestionSearch.search(keyword: "  索引  ", in: allCategories)
        XCTAssertEqual(results.map(\.question.id), ["q4"])
    }

    func test_search_preservesCategoryOrder() {
        let results = QuestionSearch.search(keyword: "隔离", in: allCategories)
        XCTAssertEqual(results.count, 1)
        XCTAssertEqual(results.first?.category.slug, "mysql")
    }

    func test_search_returnsAllMatchesAcrossCategories() {
        let results = QuestionSearch.search(keyword: "读", in: allCategories)
        XCTAssertEqual(Set(results.map(\.question.id)), ["q3", "q5"])
    }

    func test_search_doesNotMatchOnTagsToday() {
        let tagged = [question("tagged", "GC 影响性能？", "看 trace 工具的输出", tags: ["性能优化"])]
        let wrapped = category("性能", "perf", tagged)
        let results = QuestionSearch.search(keyword: "性能优化", in: [wrapped])
        XCTAssertTrue(results.isEmpty)
    }

    func test_search_excludesEmptyCategories() {
        let empty = category("空分类", "empty", [])
        let results = QuestionSearch.search(keyword: "goroutine", in: [empty, goCategory])
        XCTAssertEqual(results.map(\.question.id), ["q1"])
    }
}
