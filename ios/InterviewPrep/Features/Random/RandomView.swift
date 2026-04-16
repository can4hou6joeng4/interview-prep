import SwiftUI

struct RandomView: View {
    @EnvironmentObject private var store: QuestionStore
    @State private var pair: (Category, Question)?

    var body: some View {
        VStack(spacing: 20) {
            if let (cat, q) = pair {
                NavigationLink(value: q) {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text(cat.icon)
                            Text(cat.cat).font(.caption).foregroundStyle(.secondary)
                            Spacer()
                            DifficultyBadge(diff: q.diff)
                        }
                        Text(q.q).font(.headline).multilineTextAlignment(.leading)
                    }
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.secondary.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
                .navigationDestination(for: Question.self) { q in
                    QuestionDetailView(category: cat, question: q)
                }
            } else {
                ContentUnavailableView("点击下方按钮抽取一题", systemImage: "shuffle")
            }

            Button {
                pair = store.randomQuestion()
            } label: {
                Label("换一题", systemImage: "arrow.triangle.2.circlepath")
                    .frame(maxWidth: .infinity)
                    .padding()
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .onAppear { if pair == nil { pair = store.randomQuestion() } }
    }
}
