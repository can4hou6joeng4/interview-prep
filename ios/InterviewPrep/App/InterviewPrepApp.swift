import SwiftUI

@main
struct InterviewPrepApp: App {
    @StateObject private var store = QuestionStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
        }
    }
}
