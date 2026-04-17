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
        VStack(spacing: 0) {
            Picker("难度", selection: $filter) {
                ForEach(DiffFilter.allCases) { f in
                    Text(f.label).tag(f)
                }
            }
            .pickerStyle(.segmented)
            .padding(.horizontal)
            .padding(.vertical, 8)

            List(filtered) { q in
                NavigationLink(value: q) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(q.q).font(.body).lineLimit(3)
                        HStack(spacing: 6) {
                            DifficultyBadge(diff: q.diff)
                            ForEach(q.tags, id: \.self) { tag in
                                Text(tag)
                                    .font(.caption2)
                                    .padding(.horizontal, 6).padding(.vertical, 2)
                                    .background(Color.secondary.opacity(0.15), in: Capsule())
                            }
                        }
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        .navigationTitle(category.cat)
        .navigationDestination(for: Question.self) { q in
            QuestionDetailView(category: category, question: q)
        }
    }
}

struct DifficultyBadge: View {
    let diff: String
    var color: Color {
        switch diff {
        case "easy": return .green
        case "medium": return .orange
        case "hard": return .red
        default: return .gray
        }
    }
    var body: some View {
        Text(diff.uppercased())
            .font(.caption2).bold()
            .padding(.horizontal, 6).padding(.vertical, 2)
            .foregroundStyle(.white)
            .background(color, in: Capsule())
    }
}
