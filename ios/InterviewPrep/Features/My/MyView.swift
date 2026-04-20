import SwiftUI
import SwiftData

struct MyView: View {
    @EnvironmentObject private var store: QuestionStore
    @EnvironmentObject private var deeplink: DeepLink
    @Query(sort: \UserProgress.lastViewedAt, order: .reverse) private var all: [UserProgress]

    private var learning: [UserProgress] { all.filter { $0.status == 1 } }
    private var favorited: [UserProgress] { all.filter { $0.favorited } }
    private var recent: [UserProgress] {
        Array(all.compactMap { $0.lastViewedAt != nil ? $0 : nil }.prefix(20))
    }
    private var notedAll: [UserProgress] {
        let filtered = all.filter { progress in
            !progress.note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
        return filtered.sorted { a, b in
            (a.noteUpdatedAt ?? .distantPast) > (b.noteUpdatedAt ?? .distantPast)
        }
    }
    private var notedFiltered: [UserProgress] {
        let kw = noteKeyword.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        if kw.isEmpty {
            return Array(notedAll.prefix(6))
        }
        return notedAll.filter { progress in
            noteMatches(progress, keyword: kw)
        }
    }
    private func noteMatches(_ progress: UserProgress, keyword: String) -> Bool {
        if progress.note.lowercased().contains(keyword) { return true }
        guard let (cat, q) = store.find(questionId: progress.questionId) else { return false }
        if q.q.lowercased().contains(keyword) { return true }
        if cat.cat.lowercased().contains(keyword) { return true }
        return false
    }
    private var noted: [UserProgress] { notedFiltered }
    private var reviewQueueCount: Int {
        Set(all.filter { $0.status == 1 || $0.favorited }.map(\.questionId)).count
    }
    private var weekActivityCount: Int {
        let cal = Calendar.current
        let days = Set(all.compactMap { progress -> Date? in
            guard let date = progress.lastViewedAt else { return nil }
            return cal.startOfDay(for: date)
        })
        return days.filter { cal.dateComponents([.day], from: $0, to: Date()).day ?? 99 < 7 }.count
    }
    private var masteryRate: Double {
        store.totalCount > 0 ? Double(all.filter { $0.status == 2 }.count) / Double(store.totalCount) : 0
    }

    @State private var activeSection: Section = .learning
    @State private var noteKeyword: String = ""
    enum Section: String, CaseIterable, Identifiable {
        case learning = "错题本"
        case favorited = "收藏"
        case recent = "最近"
        var id: String { rawValue }
        var icon: String {
            switch self {
            case .learning: return "book"
            case .favorited: return "star.fill"
            case .recent: return "clock"
            }
        }
    }

    private var currentItems: [UserProgress] {
        switch activeSection {
        case .learning: return learning
        case .favorited: return favorited
        case .recent: return recent
        }
    }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 18) {
                    hero
                    snapshotCard
                    quickActions
                    segmentedPicker
                    listSection
                    recentSection
                    notesSection
                }
                .padding(20)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Question.self) { q in
            if let (cat, _) = store.find(questionId: q.id) {
                QuestionDetailView(category: cat, question: q)
            }
        }
    }

    private var hero: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 6) {
                KickerText(text: "Library")
                Text("我的学习")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(Theme.fg)
                Text("把错题、收藏、最近查看和复习入口收在一起。")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Theme.fgMuted)
            }
            Spacer()
            NavigationLink {
                SettingsView()
            } label: {
                Image(systemName: "gearshape")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Theme.fg)
                    .frame(width: 40, height: 40)
                    .background(
                        Circle()
                            .fill(Theme.surface)
                    )
                    .overlay(
                        Circle()
                            .stroke(Theme.border, lineWidth: 1)
                    )
                    .shadow(color: Theme.shadow, radius: 8, x: 0, y: 4)
            }
            .buttonStyle(.pressable)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 4)
    }

    private var snapshotCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    KickerText(text: "Snapshot")
                    Text("学习概览")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundStyle(Theme.fg)
                }
                Spacer()
                Text("\(Int(masteryRate * 100))% 已掌握")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.accentDim)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .brutalOutlined(bg: Theme.base2, radius: 999)
            }

            HStack(spacing: 10) {
                infoPill(label: "待复习", value: "\(reviewQueueCount)", tint: Theme.accent)
                infoPill(label: "本周活跃", value: "\(weekActivityCount)", tint: Theme.successSolid)
                infoPill(label: "笔记", value: "\(notedAll.count)", tint: Theme.warningSolid)
            }
        }
        .padding(16)
        .elevatedCard(bg: Theme.surface)
    }

    private var quickActions: some View {
        HStack(spacing: 10) {
            Button {
                activeSection = .learning
                deeplink.pending = .review
            } label: {
                BrutalButtonLabel(
                    title: "今日复习",
                    icon: "book",
                    bg: Theme.lime,
                    fg: Theme.fg,
                    fullWidth: true
                )
            }
            .buttonStyle(.pressable)

            Button {
                deeplink.pending = .random
            } label: {
                BrutalButtonLabel(
                    title: "随机来一题",
                    icon: "shuffle",
                    bg: Theme.accentHi,
                    fg: Theme.fg,
                    fullWidth: true
                )
            }
            .buttonStyle(.pressable)
        }
    }

    @ViewBuilder
    private var notesSection: some View {
        if !notedAll.isEmpty {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        KickerText(text: "Notes")
                        Text("近期笔记")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(Theme.fg)
                    }
                    Spacer()
                    Text("\(notedAll.count) 条")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.fgMuted)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .brutalOutlined(bg: Theme.base2, radius: 999)
                }

                noteSearchField

                if noted.isEmpty {
                    noteSearchEmpty
                } else {
                    LazyVStack(spacing: 10) {
                        ForEach(noted) { item in
                            noteRow(item)
                        }
                    }
                }
            }
        }
    }

    private var noteSearchField: some View {
        HStack(spacing: 10) {
            Image(systemName: "magnifyingglass")
                .font(.system(size: 12, weight: .black))
                .foregroundStyle(Theme.fgMuted)
            TextField("", text: $noteKeyword, prompt: Text("搜索笔记 / 题目 / 分类").foregroundColor(Theme.fgDim))
                .font(.system(size: 13, weight: .semibold))
                .foregroundStyle(Theme.fg)
                .textInputAutocapitalization(.never)
            if !noteKeyword.isEmpty {
                Button { noteKeyword = "" } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.fgDim)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .elevatedCard(bg: Theme.base2, radius: Theme.rSm)
    }

    private var noteSearchEmpty: some View {
        VStack(spacing: 8) {
            Image(systemName: "text.magnifyingglass")
                .font(.system(size: 24, weight: .light))
                .foregroundStyle(Theme.fgDim)
            Text("没有匹配「\(noteKeyword)」的笔记")
                .font(.system(size: 12))
                .foregroundStyle(Theme.fgDim)
            Button("清空关键词") {
                noteKeyword = ""
            }
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(Theme.accent)
        }
        .frame(maxWidth: .infinity, minHeight: 120)
        .padding(14)
        .elevatedCard(bg: Theme.surface)
    }

    @ViewBuilder
    private var recentSection: some View {
        if !recent.isEmpty && activeSection != .recent {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        KickerText(text: "Recently Opened")
                        Text("最近查看")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundStyle(Theme.fg)
                    }
                    Spacer()
                    Button("查看全部") {
                        activeSection = .recent
                    }
                    .font(.system(size: 11, weight: .semibold))
                }

                LazyVStack(spacing: 10) {
                    ForEach(Array(recent.prefix(3))) { item in
                        recentRow(item)
                    }
                }
            }
        }
    }

    private var segmentedPicker: some View {
        HStack(spacing: 6) {
            ForEach(Section.allCases) { s in
                Button { activeSection = s } label: {
                    HStack(spacing: 5) {
                        Image(systemName: s.icon).font(.system(size: 11, weight: .semibold))
                        Text(s.rawValue).font(.system(size: 12, weight: .black))
                        Text(count(for: s))
                            .font(.system(size: 10, weight: .medium, design: .monospaced))
                            .foregroundStyle(activeSection == s ? Theme.fg : Theme.fgDim)
                    }
                    .foregroundStyle(activeSection == s ? Theme.fg : Theme.fgMuted)
                    .padding(.horizontal, 11).padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                            .fill(activeSection == s ? Theme.accentHi : Theme.base2)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                            .strokeBorder(Theme.border, lineWidth: 2)
                    )
                }
                .buttonStyle(.pressable)
            }
            Spacer()
        }
    }

    private func count(for s: Section) -> String {
        let n: Int
        switch s {
        case .learning: n = learning.count
        case .favorited: n = favorited.count
        case .recent: n = recent.count
        }
        return "\(n)"
    }

    private func infoPill(label: String, value: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(Theme.fgMuted)
            Text(value)
                .font(.system(size: 18, weight: .bold, design: .monospaced))
                .foregroundStyle(tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .elevatedCard(bg: Theme.base2)
    }

    @ViewBuilder
    private var listSection: some View {
        if currentItems.isEmpty {
            VStack(spacing: 10) {
                Image(systemName: activeSection.icon).font(.system(size: 32, weight: .light))
                Text("暂无数据").font(.system(size: 13))
                Button {
                    deeplink.pending = .random
                } label: {
                    BrutalButtonLabel(title: "先随机刷一题", icon: "shuffle", bg: Theme.chrome, fg: Theme.fg)
                }
                .buttonStyle(.pressable)
            }
            .foregroundStyle(Theme.fgDim)
            .frame(maxWidth: .infinity, minHeight: 220)
            .padding(18)
            .elevatedCard(bg: Theme.surface)
        } else {
            LazyVStack(spacing: 10) {
                ForEach(currentItems) { p in row(p) }
            }
        }
    }

    @ViewBuilder
    private func row(_ p: UserProgress) -> some View {
        if let (cat, q) = store.find(questionId: p.questionId) {
            NavigationLink(value: q) {
                HStack(alignment: .top, spacing: 12) {
                    Text(cat.icon).font(.system(size: 18))
                        .frame(width: 28, height: 28)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(q.q)
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.fg)
                            .lineLimit(2).multilineTextAlignment(.leading)
                        HStack(spacing: 6) {
                            Text(cat.cat)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(Theme.fgMuted)
                            DifficultyChip(diff: q.diff)
                            Spacer()
                            if p.favorited {
                                Image(systemName: "star.fill").font(.system(size: 10))
                                    .foregroundStyle(Theme.warning)
                            }
                            if !p.note.isEmpty {
                                Image(systemName: "pencil").font(.system(size: 10))
                                    .foregroundStyle(Theme.info)
                            }
                        }
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .elevatedCard()
            }
            .buttonStyle(.pressable)
        }
    }

    @ViewBuilder
    private func noteRow(_ progress: UserProgress) -> some View {
        if let (cat, q) = store.find(questionId: progress.questionId) {
            NavigationLink(value: q) {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(spacing: 8) {
                        Text(cat.icon)
                            .font(.system(size: 14))
                        Text(cat.cat)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(Theme.fgMuted)
                        Spacer()
                        if progress.favorited {
                            Image(systemName: "star.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(Theme.warningSolid)
                        }
                    }
                    Text(q.q)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundStyle(Theme.fg)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)
                    Text(progress.note)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.fgMuted)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                    if let updated = progress.noteUpdatedAt {
                        Text("更新于 \(Self.noteDateFormatter.string(from: updated))")
                            .font(.system(size: 11))
                            .foregroundStyle(Theme.fgDim)
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .elevatedCard(bg: Theme.surface)
            }
            .buttonStyle(.pressable)
        }
    }

    @ViewBuilder
    private func recentRow(_ progress: UserProgress) -> some View {
        if let (cat, q) = store.find(questionId: progress.questionId) {
            NavigationLink(value: q) {
                HStack(alignment: .top, spacing: 12) {
                    Text(cat.icon)
                        .font(.system(size: 16))
                        .frame(width: 30, height: 30)
                    VStack(alignment: .leading, spacing: 6) {
                        Text(q.q)
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundStyle(Theme.fg)
                            .lineLimit(2)
                            .multilineTextAlignment(.leading)
                        HStack(spacing: 8) {
                            Text(cat.cat)
                                .font(.system(size: 11))
                                .foregroundStyle(Theme.fgMuted)
                            if let viewed = progress.lastViewedAt {
                                Text(Self.noteDateFormatter.string(from: viewed))
                                    .font(.system(size: 11))
                                    .foregroundStyle(Theme.fgDim)
                            }
                        }
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

    private static let noteDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .short
        return formatter
    }()
}
