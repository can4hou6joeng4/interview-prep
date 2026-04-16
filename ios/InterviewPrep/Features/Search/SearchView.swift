import SwiftUI

struct SearchView: View {
    @EnvironmentObject private var store: QuestionStore
    @State private var keyword: String = ""

    var results: [(Category, Question)] {
        store.search(keyword)
    }

    var body: some View {
        List {
            if keyword.isEmpty {
                ContentUnavailableView("输入关键词搜索题目与答案", systemImage: "magnifyingglass")
            } else if results.isEmpty {
                ContentUnavailableView.search(text: keyword)
            } else {
                ForEach(Array(results.enumerated()), id: \.offset) { _, pair in
                    NavigationLink(value: pair.1) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(pair.1.q).font(.body).lineLimit(2)
                            HStack {
                                Text(pair.0.icon)
                                Text(pair.0.cat).font(.caption).foregroundStyle(.secondary)
                                DifficultyBadge(diff: pair.1.diff)
                            }
                        }
                    }
                }
            }
        }
        .searchable(text: $keyword, prompt: "搜索题目 / 答案")
        .navigationDestination(for: Question.self) { q in
            if let (cat, _) = store.find(questionId: q.id) {
                QuestionDetailView(category: cat, question: q)
            }
        }
    }
}
