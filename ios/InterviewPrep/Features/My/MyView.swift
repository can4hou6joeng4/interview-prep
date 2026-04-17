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

    @State private var activeSection: Section = .learning
    enum Section: String, CaseIterable, Identifiable {
        case learning = "错题本"
        case favorited = "收藏"
        case recent = "最近"
        var id: String { rawValue }
        var icon: String {
            switch self {
            case .learning: return "book"
            case .favorited: return "star.fill"
            case .recent: return "clock"
            }
        }
    }

    private var currentItems: [UserProgress] {
        switch activeSection {
        case .learning: return learning
        case .favorited: return favorited
        case .recent: return recent
        }
    }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 18) {
                    hero
                    segmentedPicker
                    listSection
                }
                .padding(20)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Question.self) { q in
            if let (cat, _) = store.find(questionId: q.id) {
                QuestionDetailView(category: cat, question: q)
            }
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 6) {
            KickerText(text: "Library")
            Text("我的学习")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(Theme.fg)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 4)
    }

    private var segmentedPicker: some View {
        HStack(spacing: 6) {
            ForEach(Section.allCases) { s in
                Button { activeSection = s } label: {
                    HStack(spacing: 5) {
                        Image(systemName: s.icon).font(.system(size: 11, weight: .semibold))
                        Text(s.rawValue).font(.system(size: 12, weight: activeSection == s ? .semibold : .regular))
                        Text(count(for: s))
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                            .foregroundStyle(activeSection == s ? Theme.accentHi : Theme.fgDim)
                    }
                    .foregroundStyle(activeSection == s ? Theme.fg : Theme.fgMuted)
                    .padding(.horizontal, 11).padding(.vertical, 8)
                    .background(
                        Capsule().fill(activeSection == s ? Theme.surfaceHi : Color.clear)
                    )
                    .overlay(
                        Capsule().strokeBorder(activeSection == s ? Theme.borderHi : Theme.border, lineWidth: 0.5)
                    )
                }
                .buttonStyle(.pressable)
            }
            Spacer()
        }
    }

    private func count(for s: Section) -> String {
        let n: Int
        switch s {
        case .learning: n = learning.count
        case .favorited: n = favorited.count
        case .recent: n = recent.count
        }
        return "\(n)"
    }

    @ViewBuilder
    private var listSection: some View {
        if currentItems.isEmpty {
            VStack(spacing: 10) {
                Image(systemName: activeSection.icon).font(.system(size: 32, weight: .light))
                Text("暂无数据").font(.system(size: 13))
            }
            .foregroundStyle(Theme.fgDim)
            .frame(maxWidth: .infinity, minHeight: 220)
        } else {
            LazyVStack(spacing: 10) {
                ForEach(currentItems) { p in row(p) }
            }
        }
    }

    @ViewBuilder
    private func row(_ p: UserProgress) -> some View {
        if let (cat, q) = store.find(questionId: p.questionId) {
            NavigationLink(value: q) {
                HStack(alignment: .top, spacing: 12) {
                    Text(cat.icon).font(.system(size: 18))
                        .frame(width: 28, height: 28)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(q.q)
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.fg)
                            .lineLimit(2).multilineTextAlignment(.leading)
                        HStack(spacing: 6) {
                            Text(cat.cat)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(Theme.fgMuted)
                            DifficultyChip(diff: q.diff)
                            Spacer()
                            if p.favorited {
                                Image(systemName: "star.fill").font(.system(size: 10))
                                    .foregroundStyle(Theme.warning)
                            }
                            if !p.note.isEmpty {
                                Image(systemName: "pencil").font(.system(size: 10))
                                    .foregroundStyle(Theme.info)
                            }
                        }
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .elevatedCard()
            }
            .buttonStyle(.pressable)
        }
    }
}
