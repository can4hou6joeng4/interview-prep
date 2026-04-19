import SwiftUI

struct SearchView: View {
    @EnvironmentObject private var store: QuestionStore
    @EnvironmentObject private var deeplink: DeepLink
    @AppStorage("recentSearchTerms") private var recentSearchTermsRaw = "[]"
    @State private var keyword: String = ""
    @FocusState private var focused: Bool

    var results: [(Category, Question)] {
        store.search(keyword)
    }

    private var suggestionCategories: [Category] {
        Array(store.categories.prefix(6))
    }

    private var recentSearchTerms: [String] {
        get {
            (try? JSONDecoder().decode([String].self, from: Data(recentSearchTermsRaw.utf8))) ?? []
        }
        nonmutating set {
            if let data = try? JSONEncoder().encode(newValue),
               let string = String(data: data, encoding: .utf8) {
                recentSearchTermsRaw = string
            }
        }
    }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            VStack(spacing: 14) {
                header
                searchField
                if keyword.isEmpty {
                    suggestions
                } else if results.isEmpty {
                    emptyResults
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
                                .simultaneousGesture(TapGesture().onEnded {
                                    rememberSearch(keyword)
                                })
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

    private var header: some View {
        VStack(alignment: .leading, spacing: 6) {
            KickerText(text: "Search")
            Text("找一题，马上进入状态")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(Theme.fg)
            Text("支持按题目关键词、答案文本和常见主题快速定位。")
                .font(.system(size: 13))
                .foregroundStyle(Theme.fgMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var searchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 14, weight: .black))
                .foregroundStyle(Theme.fgMuted)
            TextField("", text: $keyword, prompt: Text("搜索题目 / 答案").foregroundColor(Theme.fgDim))
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.fg)
                .textInputAutocapitalization(.never)
                .focused($focused)
                .onSubmit {
                    rememberSearch(keyword)
                }
            if !keyword.isEmpty {
                Button { keyword = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.fgDim)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 12)
        .elevatedCard(bg: Theme.base2)
    }

    private var suggestions: some View {
        VStack(alignment: .leading, spacing: 12) {
            if !recentSearchTerms.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    HStack {
                        KickerText(text: "Recent")
                        Spacer()
                        Button("清空") {
                            recentSearchTerms = []
                        }
                        .font(.system(size: 11, weight: .semibold))
                    }
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(recentSearchTerms, id: \.self) { term in
                                Button(term) {
                                    keyword = term
                                    focused = false
                                }
                                .font(.system(size: 11, weight: .semibold))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 8)
                                .background(Capsule().fill(Theme.base2))
                                .overlay(Capsule().stroke(Theme.border, lineWidth: 1))
                            }
                        }
                    }
                }
            }

            KickerText(text: "Quick Picks")
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                ForEach(suggestionCategories) { category in
                    Button {
                        keyword = category.cat
                        focused = false
                        rememberSearch(category.cat)
                    } label: {
                        HStack(spacing: 10) {
                            Text(category.icon)
                                .font(.system(size: 18))
                            VStack(alignment: .leading, spacing: 3) {
                                Text(category.cat)
                                    .font(.system(size: 13, weight: .semibold))
                                    .foregroundStyle(Theme.fg)
                                    .lineLimit(1)
                                Text("\(category.items.count) 题")
                                    .font(.system(size: 11))
                                    .foregroundStyle(Theme.fgMuted)
                            }
                            Spacer()
                        }
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .elevatedCard(bg: Theme.surface)
                    }
                    .buttonStyle(.pressable)
                }
            }
            emptyHint(icon: "magnifyingglass", text: "搜索题目、答案文本")
                .padding(.top, 8)
            Button {
                deeplink.pending = .review
            } label: {
                BrutalButtonLabel(
                    title: "直接开始今日复习",
                    icon: "book",
                    bg: Theme.chrome,
                    fg: Theme.fg,
                    fullWidth: true
                )
            }
            .buttonStyle(.pressable)
        }
    }

    private var emptyResults: some View {
        VStack(spacing: 12) {
            emptyHint(icon: "text.magnifyingglass", text: "未找到「\(keyword)」相关题目")
            HStack(spacing: 10) {
                Button {
                    keyword = ""
                    focused = true
                } label: {
                    BrutalButtonLabel(
                        title: "重新搜索",
                        icon: "arrow.counterclockwise",
                        bg: Theme.base2,
                        fg: Theme.fg,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)

                Button {
                    deeplink.pending = .random
                } label: {
                    BrutalButtonLabel(
                        title: "随机刷一题",
                        icon: "shuffle",
                        bg: Theme.accent,
                        fg: .white,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)
            }
        }
    }

    private func row(cat: Category, q: Question) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(q.q)
                .font(.system(size: 14, weight: .bold))
                .foregroundStyle(Theme.fg)
                .lineLimit(2).multilineTextAlignment(.leading)
            HStack(spacing: 6) {
                Text(cat.icon).font(.system(size: 12))
                Text(cat.cat)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Theme.fgMuted)
                DifficultyChip(diff: q.diff)
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.fgDim)
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

    private func rememberSearch(_ term: String) {
        let trimmed = term.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }
        var next = recentSearchTerms.filter { $0.caseInsensitiveCompare(trimmed) != .orderedSame }
        next.insert(trimmed, at: 0)
        recentSearchTerms = Array(next.prefix(8))
    }
}
