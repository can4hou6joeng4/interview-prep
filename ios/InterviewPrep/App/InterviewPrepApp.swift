import SwiftUI
import SwiftData

@main
struct InterviewPrepApp: App {
    @StateObject private var store = QuestionStore()
    @StateObject private var tts = TTSService.shared
    @StateObject private var cloud = CloudSyncService.shared
    @StateObject private var deeplink = DeepLink.shared
    @AppStorage("appThemePreference") private var appThemePreferenceRaw = AppThemePreference.system.rawValue

    private var appThemePreference: AppThemePreference {
        get { AppThemePreference(rawValue: appThemePreferenceRaw) ?? .system }
        nonmutating set { appThemePreferenceRaw = newValue.rawValue }
    }

    init() {
        let nav = UINavigationBarAppearance()
        nav.configureWithDefaultBackground()
        nav.backgroundColor = UIColor(Theme.base)
        nav.shadowColor = UIColor(Theme.border).withAlphaComponent(0.4)
        nav.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.fg),
            .font: UIFont.systemFont(ofSize: 15, weight: .semibold)
        ]
        nav.largeTitleTextAttributes = [
            .foregroundColor: UIColor(Theme.fg),
            .font: UIFont.systemFont(ofSize: 30, weight: .bold)
        ]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
        UINavigationBar.appearance().compactAppearance = nav
        UINavigationBar.appearance().tintColor = UIColor(Theme.accent)

        let tab = UITabBarAppearance()
        tab.configureWithDefaultBackground()
        tab.backgroundColor = UIColor(Theme.surface)
        tab.shadowColor = UIColor(Theme.border).withAlphaComponent(0.35)
        let item = tab.stackedLayoutAppearance
        item.normal.iconColor = UIColor(Theme.fgDim)
        item.normal.titleTextAttributes = [
            .foregroundColor: UIColor(Theme.fgDim),
            .font: UIFont.systemFont(ofSize: 10, weight: .medium)
        ]
        item.selected.iconColor = UIColor(Theme.accent)
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
                .preferredColorScheme(appThemePreference.colorScheme)
        }
        .modelContainer(for: UserProgress.self)
    }
}
