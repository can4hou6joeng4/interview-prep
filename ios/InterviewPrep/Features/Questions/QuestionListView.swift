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
                LazyVStack(spacing: 16) {
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
        HStack(spacing: 12) {
            Text(category.icon).font(.system(size: 22))
            VStack(alignment: .leading, spacing: 2) {
                Text(category.cat).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.fg)
                Text("\(category.items.count) 题").font(.system(size: 11)).foregroundStyle(Theme.fgMuted)
            }
            Spacer()
        }
        .padding(14)
        .elevatedCard()
    }

    private var filterTabs: some View {
        HStack(spacing: 6) {
            ForEach(DiffFilter.allCases) { f in
                Button { filter = f } label: {
                    Text(f.label)
                        .font(.system(size: 12, weight: filter == f ? .semibold : .regular))
                        .foregroundStyle(filter == f ? Theme.fg : Theme.fgMuted)
                        .padding(.horizontal, 12).padding(.vertical, 7)
                        .background(
                            Capsule().fill(filter == f ? Theme.surfaceHi : Color.clear)
                        )
                        .overlay(
                            Capsule().strokeBorder(filter == f ? Theme.borderHi : Theme.border, lineWidth: 0.5)
                        )
                }
                .buttonStyle(.pressable)
            }
            Spacer()
        }
    }

    private func row(index: Int, q: Question) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Text(String(format: "%02d", index))
                .font(.system(size: 11, weight: .medium, design: .monospaced))
                .foregroundStyle(Theme.fgDim)
                .frame(width: 22, alignment: .leading)
                .padding(.top, 2)
            VStack(alignment: .leading, spacing: 8) {
                Text(q.q)
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.fg)
                    .multilineTextAlignment(.leading)
                    .lineLimit(3)
                HStack(spacing: 6) {
                    DifficultyChip(diff: q.diff)
                    ForEach(q.tags, id: \.self) { tag in TagChip(text: tag) }
                    Spacer()
                }
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .elevatedCard()
    }
}
