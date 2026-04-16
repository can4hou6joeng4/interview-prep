import SwiftUI
import SwiftData

@main
struct InterviewPrepApp: App {
    @StateObject private var store = QuestionStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
        }
        .modelContainer(for: UserProgress.self)
    }
}
