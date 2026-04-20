import SwiftUI
import SwiftData

struct QuestionListView: View {
    let category: Category
    @Query private var allProgress: [UserProgress]
    @State private var diffFilter: DiffFilter = .all
    @State private var statusFilter: StatusFilter = .all

    enum DiffFilter: String, CaseIterable, Identifiable {
        case all, easy, medium, hard
        var id: String { rawValue }
        var label: String {
            switch self {
            case .all: return "全部"
            case .easy: return "简单"
            case .medium: return "中等"
            case .hard: return "困难"
            }
        }
    }

    enum StatusFilter: String, CaseIterable, Identifiable {
        case all, unstarted, learning, mastered, favorited
        var id: String { rawValue }
        var label: String {
            switch self {
            case .all: return "全部"
            case .unstarted: return "未学"
            case .learning: return "学习中"
            case .mastered: return "已掌握"
            case .favorited: return "收藏"
            }
        }
        var icon: String {
            switch self {
            case .all: return "square.grid.2x2"
            case .unstarted: return "circle"
            case .learning: return "book"
            case .mastered: return "checkmark.seal"
            case .favorited: return "star.fill"
            }
        }
    }

    private var progressById: [String: UserProgress] {
        Dictionary(uniqueKeysWithValues: allProgress.map { ($0.questionId, $0) })
    }

    private var categoryProgress: [UserProgress] {
        category.items.compactMap { progressById[$0.id] }
    }

    private var masteredCount: Int { categoryProgress.filter { $0.status == 2 }.count }
    private var learningCount: Int { categoryProgress.filter { $0.status == 1 }.count }
    private var favoritedCount: Int { categoryProgress.filter { $0.favorited }.count }
    private var masteryRate: Double {
        guard !category.items.isEmpty else { return 0 }
        return Double(masteredCount) / Double(category.items.count)
    }

    private var filtered: [Question] {
        category.items.filter { question in
            let matchesDiff = diffFilter == .all || question.diff == diffFilter.rawValue
            let progress = progressById[question.id]
            let matchesStatus: Bool
            switch statusFilter {
            case .all:
                matchesStatus = true
            case .unstarted:
                matchesStatus = progress == nil || progress?.status == 0
            case .learning:
                matchesStatus = progress?.status == 1
            case .mastered:
                matchesStatus = progress?.status == 2
            case .favorited:
                matchesStatus = progress?.favorited == true
            }
            return matchesDiff && matchesStatus
        }
    }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            ScrollView {
                LazyVStack(spacing: 18) {
                    header
                    progressCard
                    statusFilterBar
                    diffFilterTabs
                    if filtered.isEmpty {
                        emptyState
                    } else {
                        LazyVStack(spacing: 10) {
                            ForEach(Array(filtered.enumerated()), id: \.element.id) { idx, q in
                                NavigationLink(value: q) {
                                    row(index: idx + 1, q: q, progress: progressById[q.id])
                                }
                                .buttonStyle(.pressable)
                            }
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 14)
            }
        }
        .navigationTitle(category.cat)
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Question.self) { q in
            QuestionDetailView(category: category, question: q)
        }
    }

    private var header: some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                    .fill(Theme.categoryTint(category.color).opacity(0.3))
                Text(category.icon).font(.system(size: 24))
            }
            .frame(width: 54, height: 54)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                    .stroke(Theme.border, lineWidth: 2)
            )

            VStack(alignment: .leading, spacing: 6) {
                KickerText(text: "Question Bank")
                Text(category.cat)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(Theme.fg)
                Text("\(filtered.count) / \(category.items.count) 题")
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.fgMuted)
            }
            Spacer()
            if diffFilter != .all {
                DifficultyChip(diff: diffFilter.rawValue)
            }
        }
        .padding(16)
        .elevatedCard(bg: Theme.surface)
    }

    private var progressCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                KickerText(text: "Mastery")
                Spacer()
                Text("\(Int(masteryRate * 100))%")
                    .font(.system(size: 12, weight: .black))
                    .foregroundStyle(Theme.fg)
            }
            ThinProgressBar(progress: masteryRate, height: 10)
            HStack(spacing: 10) {
                statChip(label: "已掌握", value: masteredCount, tint: Theme.successSolid)
                statChip(label: "学习中", value: learningCount, tint: Theme.warningSolid)
                statChip(label: "收藏", value: favoritedCount, tint: Theme.accent)
            }
        }
        .padding(16)
        .elevatedCard(bg: Theme.base2)
    }

    private var statusFilterBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(StatusFilter.allCases) { option in
                    Button {
                        statusFilter = option
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: option.icon)
                                .font(.system(size: 10, weight: .semibold))
                            Text(option.label)
                                .font(.system(size: 12, weight: .semibold))
                            Text(statusCount(for: option))
                                .font(.system(size: 10, weight: .medium, design: .monospaced))
                                .foregroundStyle(statusFilter == option ? Theme.fg : Theme.fgDim)
                        }
                        .foregroundStyle(statusFilter == option ? Theme.fg : Theme.fgMuted)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(
                            Capsule().fill(statusFilter == option ? Theme.chrome : Theme.surface)
                        )
                        .overlay(
                            Capsule().stroke(statusFilter == option ? Theme.accent : Theme.border, lineWidth: 1)
                        )
                    }
                    .buttonStyle(.pressable)
                }
            }
            .padding(.horizontal, 2)
        }
    }

    private var diffFilterTabs: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(DiffFilter.allCases) { f in
                    Button { diffFilter = f } label: {
                        Text(f.label)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(diffFilter == f ? .white : Theme.fgMuted)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 9)
                            .background(
                                Capsule()
                                    .fill(filterColor(for: f))
                            )
                            .overlay(
                                Capsule()
                                    .stroke(diffFilter == f ? Color.clear : Theme.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.pressable)
                }
            }
            .padding(.horizontal, 2)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 10) {
            Image(systemName: statusFilter.icon)
                .font(.system(size: 30, weight: .light))
                .foregroundStyle(Theme.fgDim)
            Text("暂无符合条件的题目")
                .font(.system(size: 13))
                .foregroundStyle(Theme.fgDim)
            Button {
                statusFilter = .all
                diffFilter = .all
            } label: {
                BrutalButtonLabel(
                    title: "清除筛选",
                    icon: "arrow.counterclockwise",
                    bg: Theme.base2,
                    fg: Theme.fg
                )
            }
            .buttonStyle(.pressable)
        }
        .frame(maxWidth: .infinity, minHeight: 180)
        .padding(20)
        .elevatedCard(bg: Theme.surface)
    }

    private func statChip(label: String, value: Int, tint: Color) -> some View {
        HStack(spacing: 6) {
            Circle()
                .fill(tint)
                .frame(width: 7, height: 7)
            Text("\(label) \(value)")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Theme.fg)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .brutalOutlined(bg: Theme.surface, radius: 999)
    }

    private func statusCount(for option: StatusFilter) -> String {
        let count: Int
        switch option {
        case .all: count = category.items.count
        case .unstarted:
            let startedIds = Set(categoryProgress.filter { $0.status != 0 }.map { $0.questionId })
            count = category.items.filter { !startedIds.contains($0.id) }.count
        case .learning: count = learningCount
        case .mastered: count = masteredCount
        case .favorited: count = favoritedCount
        }
        return "\(count)"
    }

    private func filterColor(for filter: DiffFilter) -> Color {
        let selected = self.diffFilter == filter
        switch filter {
        case .all:
            return selected ? Theme.accent : Theme.surface
        case .easy:
            return selected ? Theme.successSolid : Theme.success
        case .medium:
            return selected ? Theme.warningSolid : Theme.warning
        case .hard:
            return selected ? Theme.dangerSolid : Theme.danger
        }
    }

    private func row(index: Int, q: Question, progress: UserProgress?) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(String(format: "%02d", index))
                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                .foregroundStyle(Theme.accentDim)
                .frame(width: 34, height: 34)
                .background(
                    Circle()
                        .fill(rowIndexBackground(for: progress))
                )
                .overlay(
                    Circle()
                        .stroke(Theme.border, lineWidth: 1)
                )
            VStack(alignment: .leading, spacing: 8) {
                Text(q.q)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.fg)
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)
                HStack(spacing: 6) {
                    DifficultyChip(diff: q.diff)
                    ForEach(q.tags.prefix(1), id: \.self) { tag in TagChip(text: tag) }
                    if progress?.favorited == true {
                        Image(systemName: "star.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.warningSolid)
                    }
                    if progress?.status == 2 {
                        Image(systemName: "checkmark.seal.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.successSolid)
                    } else if progress?.status == 1 {
                        Image(systemName: "book.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(Theme.accent)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.fgDim)
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .elevatedCard()
    }

    private func rowIndexBackground(for progress: UserProgress?) -> Color {
        guard let progress else { return Theme.base2 }
        switch progress.status {
        case 2:
            return Theme.success
        case 1:
            return Theme.warning
        default:
            return Theme.base2
        }
    }
}
