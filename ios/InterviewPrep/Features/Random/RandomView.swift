import SwiftUI

struct RandomView: View {
    @EnvironmentObject private var store: QuestionStore
    @State private var pair: (Category, Question)?

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            VStack(spacing: 18) {
                KickerText(text: "Shuffle")
                    .frame(maxWidth: .infinity, alignment: .leading)
                if let (cat, q) = pair {
                    NavigationLink(value: q) {
                        card(cat: cat, q: q)
                    }
                    .buttonStyle(.pressable)
                    .navigationDestination(for: Question.self) { q in
                        if let (c, _) = store.find(questionId: q.id) {
                            QuestionDetailView(category: c, question: q)
                        }
                    }
                } else {
                    placeholder
                }
                shuffleButton
                Spacer()
            }
            .padding(20)
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { if pair == nil { pair = store.randomQuestion() } }
    }

    private func card(cat: Category, q: Question) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                Text(cat.icon).font(.system(size: 16))
                Text(cat.cat).font(.system(size: 12, weight: .medium)).foregroundStyle(Theme.fgMuted)
                Spacer()
                DifficultyChip(diff: q.diff)
            }
            Text(q.q)
                .font(.system(size: 19, weight: .semibold))
                .foregroundStyle(Theme.fg)
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
                .multilineTextAlignment(.leading)
            HStack {
                Spacer()
                HStack(spacing: 5) {
                    Text("查看解析")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.accentHi)
                    Image(systemName: "arrow.right")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.accentHi)
                }
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .elevatedCard()
    }

    private var placeholder: some View {
        VStack(spacing: 12) {
            Image(systemName: "shuffle").font(.system(size: 32, weight: .light))
            Text("点击下方按钮随机抽题")
                .font(.system(size: 13))
        }
        .foregroundStyle(Theme.fgDim)
        .frame(maxWidth: .infinity, minHeight: 200)
        .elevatedCard()
    }

    private var shuffleButton: some View {
        Button {
            pair = store.randomQuestion()
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .font(.system(size: 14, weight: .semibold))
                Text("换一题")
                    .font(.system(size: 14, weight: .semibold))
            }
            .frame(maxWidth: .infinity).padding(.vertical, 14)
            .foregroundStyle(.white)
            .background(
                RoundedRectangle(cornerRadius: Theme.r, style: .continuous).fill(Theme.accent)
            )
        }
        .buttonStyle(.pressable)
    }
}
