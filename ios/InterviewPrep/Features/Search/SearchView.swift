import SwiftUI

struct SearchView: View {
    @EnvironmentObject private var store: QuestionStore
    @State private var keyword: String = ""
    @FocusState private var focused: Bool

    var results: [(Category, Question)] {
        store.search(keyword)
    }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            VStack(spacing: 14) {
                searchField
                if keyword.isEmpty {
                    emptyHint(icon: "magnifyingglass", text: "搜索题目、答案文本")
                } else if results.isEmpty {
                    emptyHint(icon: "text.magnifyingglass", text: "未找到「\(keyword)」相关题目")
                } else {
                    ScrollView {
                        LazyVStack(spacing: 10) {
                            HStack {
                                KickerText(text: "\(results.count) 条结果")
                                Spacer()
                            }
                            .padding(.top, 4)
                            ForEach(Array(results.enumerated()), id: \.offset) { _, pair in
                                NavigationLink(value: pair.1) {
                                    row(cat: pair.0, q: pair.1)
                                }
                                .buttonStyle(.pressable)
                            }
                        }
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Question.self) { q in
            if let (cat, _) = store.find(questionId: q.id) {
                QuestionDetailView(category: cat, question: q)
            }
        }
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(Theme.fgMuted)
            TextField("", text: $keyword, prompt: Text("搜索题目 / 答案").foregroundColor(Theme.fgDim))
                .font(.system(size: 14))
                .foregroundStyle(Theme.fg)
                .textInputAutocapitalization(.never)
                .focused($focused)
            if !keyword.isEmpty {
                Button { keyword = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.fgDim)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 11)
        .elevatedCard(bg: Theme.elevated)
    }

    private func row(cat: Category, q: Question) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(q.q)
                .font(.system(size: 14))
                .foregroundStyle(Theme.fg)
                .lineLimit(2).multilineTextAlignment(.leading)
            HStack(spacing: 6) {
                Text(cat.icon).font(.system(size: 12))
                Text(cat.cat)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Theme.fgMuted)
                DifficultyChip(diff: q.diff)
                Spacer()
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .elevatedCard()
    }

    private func emptyHint(icon: String, text: String) -> some View {
        VStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 32, weight: .light))
            Text(text).font(.system(size: 13))
        }
        .foregroundStyle(Theme.fgDim)
        .frame(maxWidth: .infinity, minHeight: 220)
        .padding(.top, 20)
    }
}
