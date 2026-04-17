import SwiftUI

struct RandomView: View {
    @EnvironmentObject private var store: QuestionStore
    @State private var pair: (Category, Question)?

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            VStack(spacing: 16) {
                if let (cat, q) = pair {
                    NavigationLink(value: q) {
                        card(cat: cat, q: q)
                    }
                    .buttonStyle(.plain)
                    .navigationDestination(for: Question.self) { q in
                        if let (c, _) = store.find(questionId: q.id) {
                            QuestionDetailView(category: c, question: q)
                        }
                    }
                } else {
                    placeholder
                }

                Button {
                    pair = store.randomQuestion()
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.triangle.2.circlepath").font(.system(size: 16, weight: .bold))
                        Text("换一题")
                            .font(.system(size: 14, weight: .black))
                            .tracking(1).textCase(.uppercase)
                    }
                    .frame(maxWidth: .infinity).padding(.vertical, 14)
                    .foregroundStyle(.white)
                    .background(Theme.pink)
                    .neoBorder()
                    .neoShadow()
                }
                .buttonStyle(.plain)
                Spacer()
            }
            .padding(16)
        }
        .navigationTitle("随机一题")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { if pair == nil { pair = store.randomQuestion() } }
    }

    private func card(cat: Category, q: Question) -> some View {
        let color = Theme.categoryColor(cat.color)
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(cat.icon).font(.system(size: 20))
                Text(cat.cat)
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5).textCase(.uppercase)
                    .foregroundStyle(Theme.text2)
                Spacer()
                DifficultyBadge(diff: q.diff)
            }
            Text(q.q)
                .font(.system(size: 17, weight: .black))
                .foregroundStyle(Theme.text)
                .multilineTextAlignment(.leading)
            HStack {
                Spacer()
                HStack(spacing: 4) {
                    Text("查看解析")
                        .font(.system(size: 11, weight: .heavy))
                        .tracking(0.5).textCase(.uppercase)
                    Image(systemName: "arrow.right").font(.system(size: 10, weight: .black))
                }
                .foregroundStyle(Theme.text)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.3))
        .neoBorder()
        .neoShadow()
    }

    private var placeholder: some View {
        VStack(spacing: 12) {
            Image(systemName: "shuffle").font(.system(size: 40, weight: .heavy))
            Text("点击下方按钮抽一题")
                .font(.system(size: 13, weight: .heavy))
                .tracking(0.5).textCase(.uppercase)
        }
        .foregroundStyle(Theme.text2)
        .frame(maxWidth: .infinity, minHeight: 180)
        .background(Theme.bg2)
        .neoBorder()
        .neoShadow(offset: 3)
    }
}
