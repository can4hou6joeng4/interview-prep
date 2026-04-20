import SwiftUI
import SwiftData

struct CategoryListView: View {
    @EnvironmentObject private var store: QuestionStore
    @EnvironmentObject private var deeplink: DeepLink
    @Query private var progresses: [UserProgress]

    private var mastered: Int { progresses.filter { $0.status == 2 }.count }
    private var learning: Int { progresses.filter { $0.status == 1 }.count }
    private var favorited: Int { progresses.filter { $0.favorited }.count }
    private var reviewCount: Int {
        Set(progresses.filter { $0.status == 1 || $0.favorited }.map(\.questionId)).count
    }

    private var activeDays: [Date] {
        let cal = Calendar.current
        let set = Set(progresses.compactMap { progress -> Date? in
            guard let date = progress.lastViewedAt else { return nil }
            return cal.startOfDay(for: date)
        })
        return set.sorted(by: >)
    }

    private var streakCount: Int {
        let cal = Calendar.current
        let today = cal.startOfDay(for: Date())
        var cursor = today
        var count = 0
        let active = Set(activeDays)
        while active.contains(cursor) {
            count += 1
            guard let prev = cal.date(byAdding: .day, value: -1, to: cursor) else { break }
            cursor = prev
        }
        if count == 0 {
            if let yesterday = cal.date(byAdding: .day, value: -1, to: today),
               active.contains(yesterday) {
                var c2 = 0
                var cur = yesterday
                while active.contains(cur) {
                    c2 += 1
                    guard let prev = cal.date(byAdding: .day, value: -1, to: cur) else { break }
                    cur = prev
                }
                return c2
            }
        }
        return count
    }

    private var thisWeekViewed: Int {
        let cal = Calendar.current
        let weekStart = cal.dateInterval(of: .weekOfYear, for: Date())?.start ?? .distantPast
        let ids = Set(progresses.compactMap { progress -> String? in
            guard let date = progress.lastViewedAt, date >= weekStart else { return nil }
            return progress.questionId
        })
        return ids.count
    }

    private var thisMonthCategoryCoverage: Int {
        let cal = Calendar.current
        let monthStart = cal.dateInterval(of: .month, for: Date())?.start ?? .distantPast
        let questionIds = progresses.compactMap { progress -> String? in
            guard let date = progress.lastViewedAt, date >= monthStart else { return nil }
            return progress.questionId
        }
        var seen = Set<String>()
        for id in questionIds {
            if let (cat, _) = store.find(questionId: id) {
                seen.insert(cat.id)
            }
        }
        return seen.count
    }
    private var recentPair: (Category, Question)? {
        guard let recent = progresses
            .compactMap({ progress -> (UserProgress, Date)? in
                guard let viewed = progress.lastViewedAt else { return nil }
                return (progress, viewed)
            })
            .max(by: { $0.1 < $1.1 })?.0
        else { return nil }
        return store.find(questionId: recent.questionId)
    }
    private var pct: Double {
        store.totalCount > 0 ? Double(mastered) / Double(store.totalCount) : 0
    }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            ScrollView {
                LazyVStack(spacing: 18, pinnedViews: []) {
                    hero
                    dashboard
                    streakCard
                    sectionHeader("题目分类", trailing: "\(store.categories.count) 项")
                    categoriesList
                    metrics
                }
                .padding(.horizontal, 20)
                .padding(.top, 14)
                .padding(.bottom, 36)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Category.self) { cat in
            QuestionListView(category: cat)
        }
        .navigationDestination(for: Question.self) { q in
            if let (cat, _) = store.find(questionId: q.id) {
                QuestionDetailView(category: cat, question: q)
            }
        }
    }

    private var streakCard: some View {
        HStack(spacing: 12) {
            streakModule(
                icon: "flame.fill",
                iconTint: Theme.dangerSolid,
                value: "\(streakCount)",
                label: "连续学习",
                unit: "天"
            )
            streakModule(
                icon: "calendar",
                iconTint: Theme.accent,
                value: "\(thisWeekViewed)",
                label: "本周浏览",
                unit: "题"
            )
            streakModule(
                icon: "rectangle.stack.fill",
                iconTint: Theme.successSolid,
                value: "\(thisMonthCategoryCoverage)",
                label: "本月专题",
                unit: "个"
            )
        }
    }

    private func streakModule(icon: String, iconTint: Color, value: String, label: String, unit: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            ZStack {
                Circle()
                    .fill(iconTint.opacity(0.18))
                Image(systemName: icon)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(iconTint)
            }
            .frame(width: 30, height: 30)

            HStack(alignment: .firstTextBaseline, spacing: 4) {
                Text(value)
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundStyle(Theme.fg)
                    .monospacedDigit()
                Text(unit)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.fgMuted)
            }
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(Theme.fgMuted)
                .textCase(.uppercase)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .elevatedCard(bg: Theme.surface)
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Theme.chrome)
                    Image(systemName: "books.vertical.fill")
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(Theme.accent)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 4) {
                    KickerText(text: "Go Backend Interview Prep")
                    Text("面经刷题")
                        .font(.system(size: 30, weight: .bold))
                        .foregroundStyle(Theme.fg)
                }
            }
            Text("一个更适合高频刷题和记忆巩固的原生学习工具。")
                .font(.system(size: 14))
                .foregroundStyle(Theme.fgMuted)
            HStack(spacing: 8) {
                statPill("\(store.categories.count) 分类")
                statPill("\(store.totalCount) 题")
                statPill("离线可用")
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .elevatedCard(bg: Theme.surface)
    }

    private var dashboard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    KickerText(text: "Today")
                    Text("下一步学什么")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(Theme.fg)
                }
                Spacer()
                Text("\(reviewCount) 待复习")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.accentDim)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .brutalOutlined(bg: Theme.chrome, radius: 999)
            }

            HStack(spacing: 10) {
                Button {
                    deeplink.pending = .random
                } label: {
                    BrutalButtonLabel(
                        title: "随机开刷",
                        icon: "shuffle",
                        bg: Theme.accent,
                        fg: .white,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)

                Button {
                    deeplink.pending = .review
                } label: {
                    BrutalButtonLabel(
                        title: "复习薄弱项",
                        icon: "book",
                        bg: Theme.base2,
                        fg: Theme.fg,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)
            }

            if let recentPair {
                NavigationLink(value: recentPair.1) {
                    HStack(alignment: .top, spacing: 12) {
                        ZStack {
                            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                .fill(Theme.base2)
                            Text(recentPair.0.icon)
                                .font(.system(size: 20))
                        }
                        .frame(width: 44, height: 44)
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                .stroke(Theme.border, lineWidth: 2)
                        )

                        VStack(alignment: .leading, spacing: 5) {
                            KickerText(text: "Continue")
                            Text(recentPair.1.q)
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Theme.fg)
                                .lineLimit(2)
                            Text(recentPair.0.cat)
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(Theme.fgMuted)
                        }
                        Spacer(minLength: 8)
                        Image(systemName: "arrow.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.fgDim)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .elevatedCard(bg: Theme.surface)
                }
                .buttonStyle(.pressable)
            }
        }
        .padding(16)
        .elevatedCard(bg: Theme.surface)
    }

    private var metrics: some View {
        VStack(spacing: 12) {
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                metric("总题数", value: store.totalCount, tint: Theme.surface)
                metric("已掌握", value: mastered, tint: Theme.success)
                metric("学习中", value: learning, tint: Theme.warning)
                metric("收藏", value: favorited, tint: Theme.info)
            }
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    KickerText(text: "Mastery Progress")
                    Spacer()
                    Text("\(Int(pct * 100))%")
                        .font(.system(size: 12, weight: .black))
                        .foregroundStyle(Theme.fg)
                }
                ThinProgressBar(progress: pct, height: 14)
            }
            .padding(16)
            .elevatedCard(bg: Theme.surface)
        }
    }

    private func metric(_ title: String, value: Int, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Theme.fgMuted)
                .textCase(.uppercase)
            Text("\(value)")
                .font(.system(size: 30, weight: .bold))
                .foregroundStyle(Theme.fg)
                .monospacedDigit()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .elevatedCard(bg: tint)
    }

    private func sectionHeader(_ title: String, trailing: String? = nil) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                KickerText(text: "Categories")
                Text(title)
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Theme.fg)
            }
            Spacer()
            if let trailing {
                Text(trailing)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.fgMuted)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .brutalOutlined(bg: Theme.surface, radius: 999)
            }
        }
    }

    private var categoriesList: some View {
        VStack(alignment: .leading, spacing: 18) {
            featuredOverview
            subsectionHeader(
                kicker: "Focus Tracks",
                title: "重点专题",
                subtitle: "先从高频、高价值的主题切入，形成更完整的答题框架。"
            )
            featuredCategories
            subsectionHeader(
                kicker: "Library",
                title: "全部分类",
                subtitle: "按主题快速浏览全部题库，自由切换到你最想补的知识面。"
            )
            compactCategories
        }
        .padding(16)
        .elevatedCard(bg: Theme.base2)
    }

    private var featuredOverview: some View {
        HStack(spacing: 10) {
            overviewPill(title: "重点专题", value: "\(featuredCategoryItems.count)")
            overviewPill(title: "全部分类", value: "\(compactCategoryItems.count)")
            overviewPill(title: "总题量", value: "\(store.totalCount)")
        }
    }

    private var featuredCategories: some View {
        VStack(spacing: 12) {
            if let hero = featuredHeroCategory {
                NavigationLink(value: hero) {
                    featuredHeroCard(hero)
                }
                .buttonStyle(.pressable)
            }

            if !featuredSecondaryCategories.isEmpty {
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(featuredSecondaryCategories) { cat in
                        NavigationLink(value: cat) {
                            featuredMiniCard(cat)
                        }
                        .buttonStyle(.pressable)
                    }
                }
            }
        }
    }

    private var compactCategories: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(compactCategoryItems) { cat in
                NavigationLink(value: cat) {
                    compactCategoryCard(cat)
                }
                .buttonStyle(.pressable)
            }
        }
    }

    private var featuredCategoryItems: [Category] {
        Array(store.categories.sorted { $0.items.count > $1.items.count }.prefix(3))
    }

    private var featuredHeroCategory: Category? {
        featuredCategoryItems.first
    }

    private var featuredSecondaryCategories: [Category] {
        Array(featuredCategoryItems.dropFirst())
    }

    private var compactCategoryItems: [Category] {
        let featuredIds = Set(featuredCategoryItems.map(\.id))
        return store.categories.filter { !featuredIds.contains($0.id) }
    }

    private func categoryStats(_ cat: Category) -> (mastered: Int, pct: Double) {
        let tint = Theme.categoryTint(cat.color)
        let masteredInCat = progresses.filter { p in
            p.status == 2 && cat.items.contains(where: { $0.id == p.questionId })
        }.count
        let pct = cat.items.isEmpty ? 0 : Double(masteredInCat) / Double(cat.items.count)
        _ = tint
        return (masteredInCat, pct)
    }

    private func featuredHeroCard(_ cat: Category) -> some View {
        let tint = Theme.categoryTint(cat.color)
        let stats = categoryStats(cat)

        return VStack(alignment: .leading, spacing: 14) {
            Capsule()
                .fill(tint.opacity(0.32))
                .frame(width: 72, height: 6)
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    KickerText(text: "Hero Track")
                    Text(cat.cat)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundStyle(Theme.fg)
                        .lineLimit(2)
                }
                Spacer(minLength: 12)
                ZStack {
                    Circle()
                        .fill(tint.opacity(0.18))
                    Text(cat.icon)
                        .font(.system(size: 22))
                }
                .frame(width: 48, height: 48)
            }

            Text(featuredDescription(for: cat))
                .font(.system(size: 13))
                .foregroundStyle(Theme.fgMuted)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: 8) {
                statPill("\(cat.items.count) 题")
                statPill("已掌握 \(stats.mastered)")
                Spacer()
                HStack(spacing: 6) {
                    Text("进入专题")
                        .font(.system(size: 12, weight: .semibold))
                    Image(systemName: "arrow.right")
                        .font(.system(size: 11, weight: .semibold))
                }
                .foregroundStyle(tint)
            }

            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("掌握进度")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(Theme.fgMuted)
                    Spacer()
                    Text("\(Int(stats.pct * 100))%")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.fgMuted)
                }
                ThinProgressBar(progress: stats.pct, height: 10)
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .elevatedCard(bg: tint.opacity(0.08))
    }

    private func featuredMiniCard(_ cat: Category) -> some View {
        let tint = Theme.categoryTint(cat.color)
        let stats = categoryStats(cat)

        return VStack(alignment: .leading, spacing: 12) {
            Capsule()
                .fill(tint.opacity(0.42))
                .frame(width: 42, height: 6)
            HStack {
                ZStack {
                    Circle()
                        .fill(tint.opacity(0.18))
                    Text(cat.icon)
                        .font(.system(size: 18))
                }
                .frame(width: 38, height: 38)
                Spacer()
                Text("\(cat.items.count)")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.accentDim)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .brutalOutlined(bg: Theme.surface, radius: 999)
            }
            Text(cat.cat)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Theme.fg)
                .lineLimit(2)
            Text("已掌握 \(stats.mastered)")
                .font(.system(size: 11))
                .foregroundStyle(Theme.fgMuted)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 156, alignment: .topLeading)
        .elevatedCard(bg: tint.opacity(0.06))
    }

    private func compactCategoryCard(_ cat: Category) -> some View {
        let tint = Theme.categoryTint(cat.color)
        let stats = categoryStats(cat)

        return VStack(alignment: .leading, spacing: 12) {
            Capsule()
                .fill(tint.opacity(0.45))
                .frame(width: 46, height: 6)
            HStack(alignment: .top) {
                ZStack {
                    RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                        .fill(tint.opacity(0.22))
                    Text(cat.icon)
                        .font(.system(size: 18))
                }
                .frame(width: 38, height: 38)

                Spacer()

                Text("\(cat.items.count)")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.accentDim)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 5)
                    .brutalOutlined(bg: Theme.base2, radius: 999)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(cat.cat)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.fg)
                    .lineLimit(2)
                Text("\(cat.items.count) 题 · 已掌握 \(stats.mastered)")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.fgMuted)
            }

            ThinProgressBar(progress: stats.pct, height: 8)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 164, alignment: .topLeading)
        .elevatedCard(bg: tint.opacity(0.06))
    }

    private func subsectionHeader(kicker: String, title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            KickerText(text: kicker)
            Text(title)
                .font(.system(size: 17, weight: .bold))
                .foregroundStyle(Theme.fg)
            Text(subtitle)
                .font(.system(size: 12))
                .foregroundStyle(Theme.fgMuted)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func overviewPill(title: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(Theme.fgMuted)
            Text(value)
                .font(.system(size: 16, weight: .bold, design: .monospaced))
                .foregroundStyle(Theme.fg)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .elevatedCard(bg: Theme.surface)
    }

    private func featuredDescription(for category: Category) -> String {
        switch category.cat {
        case "项目场景深挖":
            return "聚焦高频项目追问，把背景、方案、权衡和结果串成完整表达。"
        case "高并发与高可用":
            return "强化系统设计与容量意识，适合冲刺高频架构场景。"
        case "设计模式与架构":
            return "梳理常见抽象方式和设计权衡，提升系统题表达稳定性。"
        case "支付与交易系统":
            return "覆盖订单、支付、幂等与一致性，适合交易链路面试准备。"
        default:
            return "围绕这一主题集中练习，快速形成成体系的答题表达。"
        }
    }

    private func statPill(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(Theme.fgMuted)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .brutalOutlined(bg: Theme.base2, radius: 999)
    }
}
