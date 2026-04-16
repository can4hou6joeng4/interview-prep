import SwiftUI

struct RootView: View {
    @EnvironmentObject private var store: QuestionStore

    var body: some View {
        TabView {
            NavigationStack {
                CategoryListView()
                    .navigationTitle("题库")
            }
            .tabItem { Label("题库", systemImage: "books.vertical") }

            NavigationStack {
                RandomView()
                    .navigationTitle("随机一题")
            }
            .tabItem { Label("随机", systemImage: "shuffle") }

            NavigationStack {
                SettingsView()
                    .navigationTitle("设置")
            }
            .tabItem { Label("设置", systemImage: "gearshape") }
        }
    }
}
