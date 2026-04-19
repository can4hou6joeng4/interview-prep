import SwiftUI

struct QuestionListView: View {
    let category: Category
    @State private var filter: DiffFilter = .all

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

    private var filtered: [Question] {
        switch filter {
        case .all: return category.items
        default: return category.items.filter { $0.diff == filter.rawValue }
        }
    }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            ScrollView {
                LazyVStack(spacing: 18) {
                    header
                    filterTabs
                    LazyVStack(spacing: 10) {
                        ForEach(Array(filtered.enumerated()), id: \.element.id) { idx, q in
                            NavigationLink(value: q) {
                                row(index: idx + 1, q: q)
                            }
                            .buttonStyle(.pressable)
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
            if filter != .all {
                DifficultyChip(diff: filter.rawValue)
            }
        }
        .padding(16)
        .elevatedCard(bg: Theme.surface)
    }

    private var filterTabs: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(DiffFilter.allCases) { f in
                    Button { filter = f } label: {
                        Text(f.label)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(filter == f ? .white : Theme.fgMuted)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 9)
                            .background(
                                Capsule()
                                    .fill(filterColor(for: f))
                            )
                            .overlay(
                                Capsule()
                                    .stroke(filter == f ? Color.clear : Theme.border, lineWidth: 1)
                            )
                    }
                    .buttonStyle(.pressable)
                }
            }
            .padding(.horizontal, 2)
        }
    }

    private func filterColor(for filter: DiffFilter) -> Color {
        let selected = self.filter == filter
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

    private func row(index: Int, q: Question) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(String(format: "%02d", index))
                .font(.system(size: 11, weight: .semibold, design: .monospaced))
                .foregroundStyle(Theme.accentDim)
                .frame(width: 34, height: 34)
                .background(
                    Circle()
                        .fill(Theme.base2)
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
}
