import SwiftUI

struct QuestionListView: View {
    let category: Category

    var body: some View {
        List(category.items) { q in
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
