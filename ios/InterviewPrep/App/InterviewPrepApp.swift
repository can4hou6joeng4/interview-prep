import SwiftUI
import SwiftData

@main
struct InterviewPrepApp: App {
    @StateObject private var store = QuestionStore()
    @StateObject private var tts = TTSService.shared
    @StateObject private var cloud = CloudSyncService.shared
    @StateObject private var deeplink = DeepLink.shared

    init() {
        // Nav bar — transparent dark with subtle hairline
        let nav = UINavigationBarAppearance()
        nav.configureWithTransparentBackground()
        nav.backgroundColor = UIColor(Theme.base)
        nav.shadowColor = .clear
        nav.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.fg),
            .font: UIFont.systemFont(ofSize: 15, weight: .semibold)
        ]
        nav.largeTitleTextAttributes = [
            .foregroundColor: UIColor(Theme.fg),
            .font: UIFont.systemFont(ofSize: 28, weight: .bold)
        ]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        UINavigationBar.appearance().compactAppearance = nav
        UINavigationBar.appearance().tintColor = UIColor(Theme.fg)

        // Tab bar — matches elevated surface
        let tab = UITabBarAppearance()
        tab.configureWithOpaqueBackground()
        tab.backgroundColor = UIColor(Theme.elevated)
        tab.shadowColor = UIColor(Theme.border)
        let item = tab.stackedLayoutAppearance
        item.normal.iconColor = UIColor(Theme.fgDim)
        item.normal.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.fgDim),
            .font: UIFont.systemFont(ofSize: 10, weight: .medium)
        ]
        item.selected.iconColor = UIColor(Theme.fg)
        item.selected.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.fg),
            .font: UIFont.systemFont(ofSize: 10, weight: .semibold)
        ]
        UITabBar.appearance().standardAppearance = tab
        UITabBar.appearance().scrollEdgeAppearance = tab
        UITabBar.appearance().tintColor = UIColor(Theme.accent)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .environmentObject(tts)
                .environmentObject(cloud)
                .environmentObject(deeplink)
                .tint(Theme.accent)
                .preferredColorScheme(.dark)
        }
        .modelContainer(for: UserProgress.self)
    }
}
