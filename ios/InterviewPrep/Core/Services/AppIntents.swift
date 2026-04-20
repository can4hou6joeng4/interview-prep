import AppIntents
import SwiftUI

struct OpenRandomQuestionIntent: AppIntent {
    static var title: LocalizedStringResource = "随机来一题"
    static var description = IntentDescription("从面经题库中随机抽取一道题")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        DeepLink.shared.pending = .random
        return .result()
    }
}

struct OpenTodayReviewIntent: AppIntent {
    static var title: LocalizedStringResource = "开始今日复习"
    static var description = IntentDescription("打开今日待复习的题目列表")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        DeepLink.shared.pending = .review
        return .result()
    }
}

struct InterviewPrepShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OpenRandomQuestionIntent(),
            phrases: [
                "\(.applicationName) 随机来一题",
                "用 \(.applicationName) 抽一题",
                "\(.applicationName) 随机面试题"
            ],
            shortTitle: "随机来一题",
            systemImageName: "shuffle"
        )
        AppShortcut(
            intent: OpenTodayReviewIntent(),
            phrases: [
                "\(.applicationName) 开始复习",
                "\(.applicationName) 今日复习"
            ],
            shortTitle: "开始今日复习",
            systemImageName: "book"
        )
    }
}

enum DeepLinkTarget: Equatable {
    case random
    case review
    case question(id: String)
    case category(slug: String)
}

@MainActor
final class DeepLink: ObservableObject {
    static let shared = DeepLink()
    @Published var pending: DeepLinkTarget?
}
