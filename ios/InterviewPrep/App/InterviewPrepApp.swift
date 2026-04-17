import SwiftUI
import SwiftData

@main
struct InterviewPrepApp: App {
    @StateObject private var store = QuestionStore()
    @StateObject private var tts = TTSService.shared
    @StateObject private var cloud = CloudSyncService.shared
    @StateObject private var deeplink = DeepLink.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .environmentObject(tts)
                .environmentObject(cloud)
                .environmentObject(deeplink)
        }
        .modelContainer(for: UserProgress.self)
    }
}
