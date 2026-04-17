import SwiftUI

struct SearchView: View {
    @EnvironmentObject private var store: QuestionStore
    @State private var keyword: String = ""

    var results: [(Category, Question)] {
        store.search(keyword)
    }

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            VStack(spacing: 12) {
                searchBar
                if keyword.isEmpty {
                    placeholder(icon: "magnifyingglass", text: "输入关键词搜索题目与答案")
                } else if results.isEmpty {
                    placeholder(icon: "magnifyingglass.circle", text: "未找到匹配「\(keyword)」的题目")
                } else {
                    ScrollView {
                        VStack(spacing: 10) {
                            ForEach(Array(results.enumerated()), id: \.offset) { _, pair in
                                NavigationLink(value: pair.1) {
                                    row(cat: pair.0, q: pair.1)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.horizontal, 16)
            .padding(.top, 12)
        }
        .navigationTitle("搜索")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Question.self) { q in
            if let (cat, _) = store.find(questionId: q.id) {
                QuestionDetailView(category: cat, question: q)
            }
        }
    }

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass").font(.system(size: 14, weight: .bold))
            TextField("搜索题目 / 答案", text: $keyword)
                .font(.system(size: 14, weight: .bold))
                .textInputAutocapitalization(.never)
            if !keyword.isEmpty {
                Button {
                    keyword = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundStyle(Theme.text3)
                }
            }
        }
        .padding(12)
        .foregroundStyle(Theme.text)
        .background(Theme.surface)
        .neoBorder()
        .neoShadow(offset: 3)
    }

    private func row(cat: Category, q: Question) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(q.q)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Theme.text)
                .lineLimit(2).multilineTextAlignment(.leading)
            HStack(spacing: 6) {
                Text(cat.icon)
                Text(cat.cat)
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.3).textCase(.uppercase)
                    .foregroundStyle(Theme.text2)
                DifficultyBadge(diff: q.diff)
                Spacer()
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.surface)
        .neoBorder()
        .neoShadow(offset: 3)
    }

    private func placeholder(icon: String, text: String) -> some View {
        VStack(spacing: 10) {
            Image(systemName: icon).font(.system(size: 40, weight: .heavy))
            Text(text)
                .font(.system(size: 12, weight: .heavy))
                .tracking(0.3).multilineTextAlignment(.center)
        }
        .foregroundStyle(Theme.text3)
        .frame(maxWidth: .infinity, minHeight: 200)
        .padding()
    }
}
