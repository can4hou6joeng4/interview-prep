import XCTest
@testable import InterviewPrep

final class ReviewCompletionSummaryTests: XCTestCase {
    private let goCategory = InterviewPrep.Category(cat: "Go", icon: "🐹", color: "#00ADD8", slug: "go", items: [])
    private let redisCategory = InterviewPrep.Category(cat: "Redis", icon: "🟥", color: "#DC382D", slug: "redis", items: [])
    private let kafkaCategory = InterviewPrep.Category(cat: "Kafka", icon: "📨", color: "#231F20", slug: "kafka", items: [])

    private func entry(_ category: InterviewPrep.Category, _ questionId: String) -> ReviewCompletionSummary.Entry {
        ReviewCompletionSummary.Entry(category: category, questionId: questionId)
    }

    func test_build_sumsCompletedMasteredContinued() {
        let entries = [
            entry(goCategory, "q1"),
            entry(goCategory, "q2"),
            entry(redisCategory, "q3"),
            entry(kafkaCategory, "q4")
        ]
        let results = ["q1": 2, "q2": 1, "q3": 2, "q4": 0]

        let summary = ReviewCompletionSummary.build(entries: entries, results: results)

        XCTAssertEqual(summary.totalCount, 4)
        XCTAssertEqual(summary.completedCount, 4)
        XCTAssertEqual(summary.masteredCount, 2)
        XCTAssertEqual(summary.continuedCount, 1)
    }

    func test_build_breakdownsAggregatePerCategory() {
        let entries = [
            entry(goCategory, "q1"),
            entry(goCategory, "q2"),
            entry(goCategory, "q3"),
            entry(redisCategory, "q4"),
            entry(redisCategory, "q5")
        ]
        let results = ["q1": 2, "q2": 1, "q3": 2, "q4": 2, "q5": 2]

        let summary = ReviewCompletionSummary.build(entries: entries, results: results)

        let go = summary.breakdowns.first { $0.category.id == self.goCategory.id }
        let redis = summary.breakdowns.first { $0.category.id == self.redisCategory.id }
        XCTAssertEqual(go?.total, 3)
        XCTAssertEqual(go?.mastered, 2)
        XCTAssertEqual(go?.continued, 1)
        XCTAssertEqual(redis?.total, 2)
        XCTAssertEqual(redis?.mastered, 2)
        XCTAssertEqual(redis?.continued, 0)
    }

    func test_build_recommendsCategoryWithMostContinued() {
        let entries = [
            entry(goCategory, "q1"),
            entry(redisCategory, "q2"),
            entry(redisCategory, "q3"),
            entry(kafkaCategory, "q4")
        ]
        let results = ["q1": 2, "q2": 1, "q3": 1, "q4": 2]

        let summary = ReviewCompletionSummary.build(entries: entries, results: results)

        XCTAssertEqual(summary.recommended?.id, redisCategory.id)
    }

    func test_build_recommendsLowestRateWhenNoContinued() {
        let entries = [
            entry(goCategory, "q1"),
            entry(goCategory, "q2"),
            entry(redisCategory, "q3")
        ]
        let results = ["q1": 2, "q2": 2, "q3": 0]

        let summary = ReviewCompletionSummary.build(entries: entries, results: results)

        XCTAssertEqual(summary.recommended?.id, redisCategory.id)
    }

    func test_build_noRecommendationWhenAllMastered() {
        let entries = [
            entry(goCategory, "q1"),
            entry(redisCategory, "q2")
        ]
        let results = ["q1": 2, "q2": 2]

        let summary = ReviewCompletionSummary.build(entries: entries, results: results)

        XCTAssertNil(summary.recommended)
    }

    func test_build_emptyEntriesReturnEmptySummary() {
        let summary = ReviewCompletionSummary.build(entries: [], results: [:])
        XCTAssertEqual(summary.totalCount, 0)
        XCTAssertEqual(summary.completedCount, 0)
        XCTAssertEqual(summary.breakdowns.count, 0)
        XCTAssertNil(summary.recommended)
    }

    func test_headlineReflectsMasteryRate() {
        let fullMastery = ReviewCompletionSummary.build(
            entries: [entry(goCategory, "q1"), entry(goCategory, "q2")],
            results: ["q1": 2, "q2": 2]
        )
        XCTAssertEqual(fullMastery.headline, "全部掌握，保持手感")

        let weak = ReviewCompletionSummary.build(
            entries: [entry(goCategory, "q1"), entry(goCategory, "q2"), entry(goCategory, "q3")],
            results: ["q1": 1, "q2": 1, "q3": 0]
        )
        XCTAssertEqual(weak.headline, "难点较多，建议继续攻克")
    }

    func test_masteryRateZeroWhenNothingCompleted() {
        let summary = ReviewCompletionSummary.build(
            entries: [entry(goCategory, "q1")],
            results: [:]
        )
        XCTAssertEqual(summary.masteryRate, 0)
        XCTAssertEqual(summary.headline, "本轮没有作答记录")
    }
}
