import SwiftUI
import CoreSpotlight

struct RootView: View {
    @EnvironmentObject private var store: QuestionStore
    @EnvironmentObject private var deeplink: DeepLink
    @State private var selectedTab: Int = 0
    @State private var deepLinkQuestion: Question?
    @State private var deepLinkCategory: Category?

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                CategoryListView()
                    .navigationTitle("题库")
            }
            .tabItem { Label("题库", systemImage: "books.vertical") }
            .tag(0)

            NavigationStack {
                SearchView()
                    .navigationTitle("搜索")
            }
            .tabItem { Label("搜索", systemImage: "magnifyingglass") }
            .tag(1)

            NavigationStack {
                MyView()
                    .navigationTitle("我的")
            }
            .tabItem { Label("我的", systemImage: "person.crop.circle") }
            .tag(2)

            NavigationStack {
                RandomView()
                    .navigationTitle("随机一题")
            }
            .tabItem { Label("随机", systemImage: "shuffle") }
            .tag(3)

            NavigationStack {
                SettingsView()
                    .navigationTitle("设置")
            }
            .tabItem { Label("设置", systemImage: "gearshape") }
            .tag(4)
        }
        .onContinueUserActivity(CSSearchableItemActionType) { activity in
            guard let id = activity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
                  let (cat, q) = store.find(questionId: id) else { return }
            deepLinkCategory = cat
            deepLinkQuestion = q
            selectedTab = 0
        }
        .onChange(of: deeplink.pending) { _, target in
            guard let t = target else { return }
            handle(target: t)
            deeplink.pending = nil
        }
        .sheet(item: $deepLinkQuestion) { q in
            if let cat = deepLinkCategory {
                NavigationStack {
                    QuestionDetailView(category: cat, question: q)
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button("关闭") { deepLinkQuestion = nil }
                            }
                        }
                }
            }
        }
    }

    private func handle(target: DeepLinkTarget) {
        switch target {
        case .random:
            selectedTab = 3
            if let (cat, q) = store.randomQuestion() {
                deepLinkCategory = cat
                deepLinkQuestion = q
            }
        case .review:
            selectedTab = 2
        case .question(let id):
            if let (cat, q) = store.find(questionId: id) {
                deepLinkCategory = cat
                deepLinkQuestion = q
            }
        }
    }
}
