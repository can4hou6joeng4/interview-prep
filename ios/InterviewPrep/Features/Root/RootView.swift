import SwiftUI
import CoreSpotlight
import SwiftData

struct RootView: View {
    @EnvironmentObject private var store: QuestionStore
    @EnvironmentObject private var deeplink: DeepLink
    @State private var selectedTab: Int = 0
    @State private var deepLinkQuestion: Question?
    @State private var deepLinkCategory: Category?
    @State private var showReviewSession = false

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                CategoryListView()
                    .navigationTitle("学习")
            }
            .tabItem { Label("学习", systemImage: "books.vertical") }
            .tag(0)

            NavigationStack {
                SearchView()
                    .navigationTitle("搜索")
            }
            .tabItem { Label("搜索", systemImage: "magnifyingglass") }
            .tag(1)

            NavigationStack {
                MyView()
                    .navigationTitle("我的")
            }
            .tabItem { Label("我的", systemImage: "person.crop.circle") }
            .tag(2)
        }
        .onContinueUserActivity(CSSearchableItemActionType) { activity in
            guard let id = activity.userInfo?[CSSearchableItemActivityIdentifier] as? String,
                  let (cat, q) = store.find(questionId: id) else { return }
            deepLinkCategory = cat
            deepLinkQuestion = q
            selectedTab = 0
        }
        .onChange(of: deeplink.pending) { _, target in
            guard let t = target else { return }
            handle(target: t)
            deeplink.pending = nil
        }
        .sheet(item: $deepLinkQuestion) { q in
            if let cat = deepLinkCategory {
                NavigationStack {
                    QuestionDetailView(category: cat, question: q)
                        .toolbar {
                            ToolbarItem(placement: .cancellationAction) {
                                Button("关闭") { deepLinkQuestion = nil }
                            }
                        }
                }
            }
        }
        .sheet(isPresented: $showReviewSession) {
            NavigationStack {
                ReviewSessionView()
            }
        }
    }

    private func handle(target: DeepLinkTarget) {
        switch target {
        case .random:
            selectedTab = 0
            if let (cat, q) = store.randomQuestion() {
                deepLinkCategory = cat
                deepLinkQuestion = q
            }
        case .review:
            selectedTab = 0
            showReviewSession = true
        case .question(let id):
            if let (cat, q) = store.find(questionId: id) {
                deepLinkCategory = cat
                deepLinkQuestion = q
            }
        }
    }
}

private struct ReviewSessionItem: Identifiable, Hashable {
    let category: Category
    let question: Question
    var id: String { question.id }
}

struct ReviewSessionView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var ctx
    @EnvironmentObject private var store: QuestionStore
    @EnvironmentObject private var cloud: CloudSyncService
    @Query private var progresses: [UserProgress]
    @State private var currentIndex = 0
    @State private var randomQuestion: Question?
    @State private var sessionItems: [ReviewSessionItem] = []
    @State private var sessionResults: [String: Int] = [:]
    @State private var loadedFallback = false
    @State private var feedbackMessage: String?

    private var realQueueItems: [ReviewSessionItem] {
        let ordered = progresses
            .filter { $0.status == 1 || $0.favorited }
            .sorted {
                if $0.status != $1.status {
                    return $0.status == 1 && $1.status != 1
                }
                if $0.favorited != $1.favorited {
                    return $0.favorited && !$1.favorited
                }
                return ($0.lastViewedAt ?? .distantPast) < ($1.lastViewedAt ?? .distantPast)
            }

        var out: [ReviewSessionItem] = []
        var seen = Set<String>()
        for progress in ordered {
            guard !seen.contains(progress.questionId),
                  let pair = store.find(questionId: progress.questionId) else { continue }
            seen.insert(progress.questionId)
            out.append(.init(category: pair.0, question: pair.1))
        }
        return out
    }

    private var fallbackItems: [ReviewSessionItem] {
        store.categories
            .sorted { $0.items.count > $1.items.count }
            .prefix(3)
            .flatMap { category in
                category.items.prefix(2).map { ReviewSessionItem(category: category, question: $0) }
            }
    }

    private var currentItem: ReviewSessionItem? {
        guard currentIndex >= 0, currentIndex < sessionItems.count else { return nil }
        return sessionItems[currentIndex]
    }

    private var isSessionComplete: Bool {
        !sessionItems.isEmpty && currentIndex >= sessionItems.count
    }

    private var learningCount: Int { sessionItems.count }
    private var focusCount: Int { progresses.filter { $0.status == 1 }.count }
    private var favoriteCount: Int { progresses.filter { $0.favorited }.count }
    private var completedCount: Int { sessionResults.count }
    private var masteredThisRound: Int { sessionResults.values.filter { $0 == 2 }.count }
    private var continuedThisRound: Int { sessionResults.values.filter { $0 == 1 }.count }

    private var progressValue: Double {
        guard !sessionItems.isEmpty else { return 0 }
        return Double(min(currentIndex + 1, sessionItems.count)) / Double(sessionItems.count)
    }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    header
                    if isSessionComplete {
                        completionState
                    } else if let item = currentItem {
                        queueSummary
                        queueProgress
                        reviewCard(item)
                        quickRateBar(question: item.question)
                        queueActions
                    } else {
                        emptyState
                    }
                }
                .padding(20)
            }
            if let feedbackMessage {
                VStack {
                    Spacer()
                    FloatingToast(text: feedbackMessage)
                        .padding(.bottom, 28)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .navigationTitle("今日复习")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("关闭") { dismiss() }
            }
        }
        .navigationDestination(for: Question.self) { question in
            if let (category, _) = store.find(questionId: question.id),
               let item = currentItem,
               item.question.id == question.id {
                QuestionDetailView(
                    category: category,
                    question: question,
                    sessionTitle: "Today Review",
                    sessionProgressText: "\(min(currentIndex + 1, sessionItems.count))/\(sessionItems.count)"
                )
            } else if let (category, _) = store.find(questionId: question.id) {
                QuestionDetailView(category: category, question: question)
            }
        }
        .navigationDestination(item: $randomQuestion) { question in
            if let (category, _) = store.find(questionId: question.id) {
                QuestionDetailView(category: category, question: question)
            }
        }
        .onAppear {
            loadSessionIfNeeded()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            KickerText(text: "Review Queue")
            Text("先把今天最该补的题过一遍")
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(Theme.fg)
            Text("优先展示学习中和收藏的题目，让复习入口真正可执行。")
                .font(.system(size: 13))
                .foregroundStyle(Theme.fgMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var queueProgress: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                KickerText(text: "Progress")
                Spacer()
                Text("\(min(currentIndex + 1, sessionItems.count))/\(sessionItems.count)")
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundStyle(Theme.fgMuted)
            }
            ThinProgressBar(progress: progressValue)
        }
        .padding(16)
        .elevatedCard(bg: Theme.surface)
    }

    private var queueSummary: some View {
        HStack(spacing: 10) {
            summaryPill(title: "队列", value: "\(learningCount)", tint: Theme.accent)
            summaryPill(title: "学习中", value: "\(focusCount)", tint: Theme.warningSolid)
            summaryPill(title: "收藏", value: "\(favoriteCount)", tint: Theme.successSolid)
        }
    }

    private func reviewCard(_ item: ReviewSessionItem) -> some View {
        NavigationLink(value: item.question) {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    ZStack {
                        RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                            .fill(Theme.categoryTint(item.category.color).opacity(0.22))
                        Text(item.category.icon)
                            .font(.system(size: 20))
                    }
                    .frame(width: 40, height: 40)

                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.category.cat)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.fgMuted)
                        KickerText(text: loadedFallback ? "Recommended Drill" : "Ready To Recall")
                    }
                    Spacer()
                    DifficultyChip(diff: item.question.diff)
                }

                Text(item.question.q)
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(Theme.fg)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)

                HStack {
                    Text("点进去开始作答")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Theme.accent)
                    Spacer()
                    Image(systemName: "arrow.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                }
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .elevatedCard(bg: Theme.surface)
        }
        .buttonStyle(.pressable)
    }

    private func quickRateBar(question: Question) -> some View {
        HStack(spacing: 10) {
            Button {
                update(questionId: question.id, status: 1)
                sessionResults[question.id] = 1
                showFeedback("已加入继续学习")
                advanceAfterRating()
            } label: {
                BrutalButtonLabel(
                    title: "继续学习",
                    icon: "book",
                    bg: Theme.warning,
                    fg: Theme.fg,
                    fullWidth: true
                )
            }
            .buttonStyle(.pressable)

            Button {
                update(questionId: question.id, status: 2)
                sessionResults[question.id] = 2
                showFeedback("已标记为掌握")
                advanceAfterRating()
            } label: {
                BrutalButtonLabel(
                    title: "标记掌握",
                    icon: "checkmark",
                    bg: Theme.successSolid,
                    fg: .white,
                    fullWidth: true
                )
            }
            .buttonStyle(.pressable)
        }
    }

    private var queueActions: some View {
        HStack(spacing: 10) {
            Button {
                skipCurrent()
                showFeedback("已移到稍后再看")
            } label: {
                BrutalButtonLabel(
                    title: "稍后再看",
                    icon: "arrow.uturn.right",
                    bg: Theme.base2,
                    fg: Theme.fg,
                    fullWidth: true
                )
            }
            .buttonStyle(.pressable)

            Button {
                currentIndex = min(currentIndex + 1, max(sessionItems.count - 1, 0))
            } label: {
                BrutalButtonLabel(
                    title: "下一题",
                    icon: "arrow.right",
                    bg: Theme.accent,
                    fg: .white,
                    fullWidth: true
                )
            }
            .buttonStyle(.pressable)
            .disabled(sessionItems.isEmpty || currentIndex >= sessionItems.count - 1)
        }
    }

    private var completionState: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 8) {
                KickerText(text: "Session Complete")
                Text("本轮复习完成")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(Theme.fg)
                Text("继续学习和标记掌握的结果已经记住了。")
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.fgMuted)
            }

            HStack(spacing: 10) {
                summaryPill(title: "完成", value: "\(completedCount)", tint: Theme.accent)
                summaryPill(title: "继续学", value: "\(continuedThisRound)", tint: Theme.warningSolid)
                summaryPill(title: "已掌握", value: "\(masteredThisRound)", tint: Theme.successSolid)
            }

            HStack(spacing: 10) {
                Button {
                    restartSession()
                } label: {
                    BrutalButtonLabel(
                        title: "再来一轮",
                        icon: "arrow.counterclockwise",
                        bg: Theme.base2,
                        fg: Theme.fg,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)

                Button {
                    dismiss()
                } label: {
                    BrutalButtonLabel(
                        title: "返回学习",
                        icon: "house",
                        bg: Theme.accent,
                        fg: .white,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)
            }
        }
        .padding(18)
        .elevatedCard(bg: Theme.surface)
    }

    private var emptyState: some View {
        VStack(spacing: 14) {
            Image(systemName: "sparkles")
                .font(.system(size: 28, weight: .light))
            Text("今天还没有待复习题")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(Theme.fg)
            Text("先去随机刷一题，或把题目标成“学习中”后再回来。")
                .font(.system(size: 13))
                .foregroundStyle(Theme.fgMuted)
                .multilineTextAlignment(.center)
            Button {
                randomQuestion = store.randomQuestion()?.1
            } label: {
                BrutalButtonLabel(
                    title: "先随机刷一题",
                    icon: "shuffle",
                    bg: Theme.accent,
                    fg: .white
                )
            }
            .buttonStyle(.pressable)
        }
        .frame(maxWidth: .infinity, minHeight: 260)
        .padding(18)
        .elevatedCard(bg: Theme.surface)
    }

    private func summaryPill(title: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(Theme.fgMuted)
            Text(value)
                .font(.system(size: 17, weight: .bold, design: .monospaced))
                .foregroundStyle(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .elevatedCard(bg: Theme.surface)
    }

    private func loadSessionIfNeeded() {
        guard sessionItems.isEmpty else { return }
        let live = realQueueItems
        if !live.isEmpty {
            loadedFallback = false
            sessionItems = live
        } else {
            loadedFallback = true
            sessionItems = fallbackItems
        }
    }

    private func update(questionId: String, status: Int) {
        let progress = ensureProgress(questionId: questionId)
        progress.status = status
        progress.lastViewedAt = Date()
        try? ctx.save()
        cloud.push(progresses)
    }

    private func ensureProgress(questionId: String) -> UserProgress {
        if let existing = progresses.first(where: { $0.questionId == questionId }) {
            return existing
        }
        let created = UserProgress(questionId: questionId)
        ctx.insert(created)
        return created
    }

    private func advanceAfterRating() {
        currentIndex += 1
    }

    private func skipCurrent() {
        guard currentIndex < sessionItems.count else { return }
        let item = sessionItems.remove(at: currentIndex)
        sessionItems.append(item)
        if currentIndex >= sessionItems.count {
            currentIndex = max(sessionItems.count - 1, 0)
        }
    }

    private func restartSession() {
        currentIndex = 0
        sessionResults = [:]
        sessionItems = []
        loadSessionIfNeeded()
    }

    private func showFeedback(_ text: String) {
        withAnimation(Theme.ease) {
            feedbackMessage = text
        }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(1.4))
            withAnimation(Theme.ease) {
                if feedbackMessage == text {
                    feedbackMessage = nil
                }
            }
        }
    }
}
