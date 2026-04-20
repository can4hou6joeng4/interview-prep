import Foundation

enum StudyStats {
    static func streakDays(activeDays: Set<Date>, today: Date = Date(), calendar: Calendar = .current) -> Int {
        let start = calendar.startOfDay(for: today)
        var cursor = start
        var count = 0
        while activeDays.contains(cursor) {
            count += 1
            guard let prev = calendar.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = prev
        }
        if count == 0 {
            guard let yesterday = calendar.date(byAdding: .day, value: -1, to: start) else { return 0 }
            var tail = 0
            var back = yesterday
            while activeDays.contains(back) {
                tail += 1
                guard let prev = calendar.date(byAdding: .day, value: -1, to: back) else { break }
                back = prev
            }
            return tail
        }
        return count
    }

    static func thisWeekViewedCount(viewedDates: [Date], today: Date = Date(), calendar: Calendar = .current) -> Int {
        guard let weekStart = calendar.dateInterval(of: .weekOfYear, for: today)?.start else { return 0 }
        return viewedDates.filter { $0 >= weekStart }.count
    }

    static func thisMonthCategoryCoverage<CategoryID: Hashable>(
        entries: [(viewedAt: Date, categoryId: CategoryID?)],
        today: Date = Date(),
        calendar: Calendar = .current
    ) -> Int {
        guard let monthStart = calendar.dateInterval(of: .month, for: today)?.start else { return 0 }
        var seen = Set<CategoryID>()
        for entry in entries {
            guard entry.viewedAt >= monthStart, let id = entry.categoryId else { continue }
            seen.insert(id)
        }
        return seen.count
    }

    static func activeDaySet(from viewedDates: [Date], calendar: Calendar = .current) -> Set<Date> {
        Set(viewedDates.map { calendar.startOfDay(for: $0) })
    }

    static func longestStreak(activeDays: Set<Date>, calendar: Calendar = .current) -> Int {
        guard !activeDays.isEmpty else { return 0 }
        let sorted = activeDays.sorted()
        var longest = 1
        var current = 1
        for index in 1..<sorted.count {
            let prev = sorted[index - 1]
            let curr = sorted[index]
            if let expected = calendar.date(byAdding: .day, value: 1, to: prev),
               calendar.isDate(expected, inSameDayAs: curr) {
                current += 1
                longest = max(longest, current)
            } else {
                current = 1
            }
        }
        return longest
    }
}
