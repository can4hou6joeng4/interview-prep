import SwiftUI
import SwiftData

struct MyView: View {
    @EnvironmentObject private var store: QuestionStore
    @Query(sort: \UserProgress.lastViewedAt, order: .reverse) private var all: [UserProgress]

    private var learning: [UserProgress] { all.filter { $0.status == 1 } }
    private var favorited: [UserProgress] { all.filter { $0.favorited } }
    private var recent: [UserProgress] {
        Array(all.compactMap { $0.lastViewedAt != nil ? $0 : nil }.prefix(20))
    }

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 18) {
                    section(title: "错题本 · 学习中", count: learning.count, bg: Theme.orange, items: learning)
                    section(title: "收藏夹 · Favorites", count: favorited.count, bg: Theme.yellow, items: favorited)
                    section(title: "最近查看 · Recent", count: recent.count, bg: Theme.blue, items: recent)
                }
                .padding(16)
            }
        }
        .navigationTitle("我的")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Question.self) { q in
            if let (cat, _) = store.find(questionId: q.id) {
                QuestionDetailView(category: cat, question: q)
            }
        }
    }

    private func section(title: String, count: Int, bg: Color, items: [UserProgress]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text(title)
                    .font(.system(size: 12, weight: .black))
                    .tracking(1).textCase(.uppercase)
                Spacer()
                Text("\(count)")
                    .font(.system(size: 12, weight: .black))
                    .padding(.horizontal, 8).padding(.vertical, 2)
                    .background(bg)
                    .overlay(Rectangle().stroke(Theme.border, lineWidth: 2))
            }
            if items.isEmpty {
                Text("暂无数据")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.text3)
                    .frame(maxWidth: .infinity, minHeight: 60)
                    .background(Theme.bg2)
                    .neoBorder()
                    .neoShadow(offset: 3)
            } else {
                VStack(spacing: 8) {
                    ForEach(items) { p in row(progress: p) }
                }
            }
        }
    }

    @ViewBuilder
    private func row(progress: UserProgress) -> some View {
        if let (cat, q) = store.find(questionId: progress.questionId) {
            NavigationLink(value: q) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(q.q)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundStyle(Theme.text)
                        .lineLimit(2).multilineTextAlignment(.leading)
                    HStack(spacing: 6) {
                        Text(cat.icon).font(.system(size: 13))
                        Text(cat.cat)
                            .font(.system(size: 10, weight: .heavy))
                            .tracking(0.3).textCase(.uppercase)
                            .foregroundStyle(Theme.text2)
                        DifficultyBadge(diff: q.diff)
                        Spacer()
                        if progress.favorited {
                            Image(systemName: "star.fill").font(.system(size: 11)).foregroundStyle(Theme.orangeSolid)
                        }
                        if !progress.note.isEmpty {
                            Image(systemName: "note.text").font(.system(size: 11)).foregroundStyle(Theme.purple)
                        }
                    }
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Theme.surface)
                .neoBorder()
                .neoShadow(offset: 3)
            }
            .buttonStyle(.plain)
        }
    }
}
