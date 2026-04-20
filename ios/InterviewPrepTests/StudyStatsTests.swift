import XCTest
@testable import InterviewPrep

final class StudyStatsTests: XCTestCase {
    private let calendar = Calendar(identifier: .gregorian)

    private func day(_ yyyyMMdd: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.calendar = calendar
        formatter.timeZone = calendar.timeZone
        guard let date = formatter.date(from: yyyyMMdd) else {
            fatalError("invalid date literal: \(yyyyMMdd)")
        }
        return calendar.startOfDay(for: date)
    }

    func test_streakDays_countsConsecutiveDaysEndingToday() {
        let today = day("2026-04-20")
        let active: Set<Date> = [
            day("2026-04-18"),
            day("2026-04-19"),
            day("2026-04-20")
        ]
        XCTAssertEqual(StudyStats.streakDays(activeDays: active, today: today, calendar: calendar), 3)
    }

    func test_streakDays_breaksWhenGapAppears() {
        let today = day("2026-04-20")
        let active: Set<Date> = [
            day("2026-04-18"),
            day("2026-04-20")
        ]
        XCTAssertEqual(StudyStats.streakDays(activeDays: active, today: today, calendar: calendar), 1)
    }

    func test_streakDays_fallsBackToYesterdayIfTodayMissing() {
        let today = day("2026-04-20")
        let active: Set<Date> = [
            day("2026-04-18"),
            day("2026-04-19")
        ]
        XCTAssertEqual(StudyStats.streakDays(activeDays: active, today: today, calendar: calendar), 2)
    }

    func test_streakDays_returnsZeroWhenNoActiveDays() {
        let today = day("2026-04-20")
        XCTAssertEqual(StudyStats.streakDays(activeDays: [], today: today, calendar: calendar), 0)
    }

    func test_streakDays_returnsZeroWhenLastActiveTooOld() {
        let today = day("2026-04-20")
        let active: Set<Date> = [day("2026-04-10")]
        XCTAssertEqual(StudyStats.streakDays(activeDays: active, today: today, calendar: calendar), 0)
    }

    func test_thisWeekViewedCount_includesOnlyCurrentWeek() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.firstWeekday = 2
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.calendar = calendar
        formatter.timeZone = calendar.timeZone
        let today = formatter.date(from: "2026-04-22")!
        let dates: [Date] = [
            formatter.date(from: "2026-04-18")!,
            formatter.date(from: "2026-04-20")!,
            formatter.date(from: "2026-04-22")!
        ]
        let count = StudyStats.thisWeekViewedCount(viewedDates: dates, today: today, calendar: calendar)
        XCTAssertEqual(count, 2)
    }

    func test_thisMonthCategoryCoverage_deduplicatesCategories() {
        let today = day("2026-04-20")
        let entries: [(viewedAt: Date, categoryId: String?)] = [
            (day("2026-03-25"), "go"),
            (day("2026-04-18"), "go"),
            (day("2026-04-19"), "redis"),
            (day("2026-04-20"), "go"),
            (day("2026-04-19"), nil)
        ]
        let coverage = StudyStats.thisMonthCategoryCoverage(entries: entries, today: today, calendar: calendar)
        XCTAssertEqual(coverage, 2)
    }

    func test_activeDaySet_collapsesSameDayTimestamps() {
        let noon = calendar.date(from: DateComponents(year: 2026, month: 4, day: 20, hour: 12))!
        let evening = calendar.date(from: DateComponents(year: 2026, month: 4, day: 20, hour: 22))!
        let nextDay = calendar.date(from: DateComponents(year: 2026, month: 4, day: 21, hour: 1))!
        let result = StudyStats.activeDaySet(from: [noon, evening, nextDay], calendar: calendar)
        XCTAssertEqual(result.count, 2)
    }
}
