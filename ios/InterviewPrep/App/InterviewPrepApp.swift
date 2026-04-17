import SwiftUI
import SwiftData

@main
struct InterviewPrepApp: App {
    @StateObject private var store = QuestionStore()
    @StateObject private var tts = TTSService.shared
    @StateObject private var cloud = CloudSyncService.shared
    @StateObject private var deeplink = DeepLink.shared

    init() {
        // Neo-Brutalism: nav bar & tab bar
        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = UIColor(Theme.bg)
        navAppearance.shadowColor = UIColor(Theme.border)
        navAppearance.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.text),
            .font: UIFont.systemFont(ofSize: 16, weight: .black)
        ]
        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance

        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = UIColor(Theme.bg2)
        tabAppearance.shadowColor = UIColor(Theme.border)
        let itemAppearance = tabAppearance.stackedLayoutAppearance
        itemAppearance.normal.iconColor = UIColor(Theme.text3)
        itemAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.text3),
            .font: UIFont.systemFont(ofSize: 10, weight: .heavy)
        ]
        itemAppearance.selected.iconColor = UIColor(Theme.text)
        itemAppearance.selected.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.text),
            .font: UIFont.systemFont(ofSize: 10, weight: .black)
        ]
        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
        UITabBar.appearance().tintColor = UIColor(Theme.pink)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .environmentObject(tts)
                .environmentObject(cloud)
                .environmentObject(deeplink)
                .tint(Theme.pink)
        }
        .modelContainer(for: UserProgress.self)
    }
}
