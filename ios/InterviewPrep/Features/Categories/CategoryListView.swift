import SwiftUI

struct CategoryListView: View {
    @EnvironmentObject private var store: QuestionStore

    var body: some View {
        Group {
            if let err = store.loadError {
                ContentUnavailableView("加载失败", systemImage: "exclamationmark.triangle", description: Text(err))
            } else {
                List(store.categories) { cat in
                    NavigationLink(value: cat) {
                        HStack(spacing: 12) {
                            Text(cat.icon).font(.title2)
                            VStack(alignment: .leading, spacing: 2) {
                                Text(cat.cat).font(.headline)
                                Text("\(cat.items.count) 题").font(.caption).foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                .navigationDestination(for: Category.self) { cat in
                    QuestionListView(category: cat)
                }
            }
        }
    }
}
