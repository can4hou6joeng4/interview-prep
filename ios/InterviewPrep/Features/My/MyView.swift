import SwiftUI
import SwiftData

struct MyView: View {
    @EnvironmentObject private var store: QuestionStore
    @Query(sort: \UserProgress.lastViewedAt, order: .reverse) private var all: [UserProgress]

    private var learning: [UserProgress] { all.filter { $0.status == 1 } }
    private var favorited: [UserProgress] { all.filter { $0.favorited } }
    private var recent: [UserProgress] {
        all.compactMap { $0.lastViewedAt != nil ? $0 : nil }.prefix(20).map { $0 }
    }

    var body: some View {
        List {
            Section("错题本 · 学习中（\(learning.count)）") {
                if learning.isEmpty {
                    Text("暂无学习中题目").foregroundStyle(.secondary)
                } else {
                    ForEach(learning) { p in row(progress: p) }
                }
            }

            Section("收藏夹（\(favorited.count)）") {
                if favorited.isEmpty {
                    Text("暂无收藏").foregroundStyle(.secondary)
                } else {
                    ForEach(favorited) { p in row(progress: p) }
                }
            }

            Section("最近查看") {
                if recent.isEmpty {
                    Text("暂无浏览历史").foregroundStyle(.secondary)
                } else {
                    ForEach(recent) { p in row(progress: p) }
                }
            }
        }
        .navigationDestination(for: Question.self) { q in
            if let (cat, _) = store.find(questionId: q.id) {
                QuestionDetailView(category: cat, question: q)
            }
        }
    }

    @ViewBuilder
    private func row(progress: UserProgress) -> some View {
        if let (cat, q) = store.find(questionId: progress.questionId) {
            NavigationLink(value: q) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(q.q).font(.body).lineLimit(2)
                    HStack(spacing: 6) {
                        Text(cat.icon)
                        Text(cat.cat).font(.caption).foregroundStyle(.secondary)
                        DifficultyBadge(diff: q.diff)
                        if progress.favorited {
                            Image(systemName: "star.fill").foregroundStyle(.yellow).font(.caption)
                        }
                        if !progress.note.isEmpty {
                            Image(systemName: "note.text").foregroundStyle(.blue).font(.caption)
                        }
                    }
                }
            }
        }
    }
}
