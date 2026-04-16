import SwiftUI
import CoreSpotlight

struct RootView: View {
    @EnvironmentObject private var store: QuestionStore
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
                RandomView()
                    .navigationTitle("随机一题")
            }
            .tabItem { Label("随机", systemImage: "shuffle") }
            .tag(2)

            NavigationStack {
                SettingsView()
                    .navigationTitle("设置")
            }
            .tabItem { Label("设置", systemImage: "gearshape") }
            .tag(3)
        }
        .onContinueUserActivity(CSSearchableItemActionType) { activity in
            guard let id = activity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
                  let (cat, q) = store.find(questionId: id) else { return }
            deepLinkCategory = cat
            deepLinkQuestion = q
            selectedTab = 0
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
}
