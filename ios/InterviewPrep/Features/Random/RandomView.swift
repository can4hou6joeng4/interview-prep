import SwiftUI

// Legacy screen kept only because the current Xcode project still references this file.
// Random study is now entered from the dashboard and "My" quick actions.
struct RandomView: View {
    @EnvironmentObject private var store: QuestionStore
    @State private var pair: (Category, Question)?

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 6) {
                    KickerText(text: "Quick Study")
                    Text("随机刷题")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(Theme.fg)
                    Text("这个页面已退居次要路径，主要随机入口在首页和“我的”。")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.fgMuted)
                }
                .frame(maxWidth: .infinity, alignment: .leading)

                if let (cat, q) = pair {
                    NavigationLink(value: q) {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(cat.icon)
                                Text(cat.cat)
                                    .font(.system(size: 12, weight: .semibold))
                                    .foregroundStyle(Theme.fgMuted)
                                Spacer()
                                DifficultyChip(diff: q.diff)
                            }
                            Text(q.q)
                                .font(.system(size: 18, weight: .semibold))
                                .foregroundStyle(Theme.fg)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .padding(18)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .elevatedCard()
                    }
                    .buttonStyle(.pressable)
                    .navigationDestination(for: Question.self) { question in
                        if let (category, _) = store.find(questionId: question.id) {
                            QuestionDetailView(category: category, question: question)
                        }
                    }
                } else {
                    Text("点击下方按钮随机抽一题。")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.fgMuted)
                        .frame(maxWidth: .infinity, minHeight: 180)
                        .elevatedCard(bg: Theme.surface)
                }

                Button {
                    pair = store.randomQuestion()
                } label: {
                    BrutalButtonLabel(
                        title: "换一题",
                        icon: "shuffle",
                        bg: Theme.accent,
                        fg: .white,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)

                Spacer()
            }
            .padding(20)
        }
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if pair == nil {
                pair = store.randomQuestion()
            }
        }
    }
}
