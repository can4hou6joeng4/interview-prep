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
    private var catColor: Color { Theme.categoryColor(category.color) }

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 14) {
                    catHeader
                    filterBar
                    ForEach(filtered) { q in
                        NavigationLink(value: q) {
                            row(q)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
            }
        }
        .navigationTitle(category.cat)
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Question.self) { q in
            QuestionDetailView(category: category, question: q)
        }
    }

    private var catHeader: some View {
        HStack(spacing: 12) {
            Text(category.icon).font(.system(size: 32))
            VStack(alignment: .leading, spacing: 4) {
                Text(category.cat)
                    .font(.system(size: 18, weight: .black))
                    .foregroundStyle(Theme.text)
                Text("\(category.items.count) 题")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(Theme.text2)
            }
            Spacer()
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(catColor.opacity(0.3))
        .neoBorder()
        .neoShadow()
    }

    private var filterBar: some View {
        HStack(spacing: 0) {
            ForEach(DiffFilter.allCases) { f in
                Button { filter = f } label: {
                    Text(f.label)
                        .font(.system(size: 12, weight: .black))
                        .tracking(0.3)
                        .textCase(.uppercase)
                        .foregroundStyle(filter == f ? .white : Theme.text2)
                        .padding(.vertical, 10)
                        .frame(maxWidth: .infinity)
                        .background(filter == f ? bgFor(f) : Color.clear)
                }
            }
        }
        .background(Theme.bg2)
        .neoBorder()
        .neoShadow(offset: 3)
    }

    private func bgFor(_ f: DiffFilter) -> Color {
        switch f {
        case .all: return Theme.pink
        case .easy: return Theme.greenSolid
        case .medium: return Theme.orangeSolid
        case .hard: return Theme.redSolid
        }
    }

    private func row(_ q: Question) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(q.q)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Theme.text)
                .multilineTextAlignment(.leading)
                .lineLimit(3)
            HStack(spacing: 6) {
                DifficultyBadge(diff: q.diff)
                ForEach(q.tags, id: \.self) { tag in
                    Text(tag)
                        .font(.system(size: 10, weight: .heavy))
                        .tracking(0.3)
                        .textCase(.uppercase)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(Theme.yellow)
                        .overlay(Rectangle().stroke(Theme.border, lineWidth: 2))
                }
                Spacer()
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface)
        .neoBorder()
        .neoShadow(offset: 3)
    }
}
