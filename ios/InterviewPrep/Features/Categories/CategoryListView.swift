import SwiftUI
import SwiftData

struct CategoryListView: View {
    @EnvironmentObject private var store: QuestionStore
    @Query private var progresses: [UserProgress]

    private var mastered: Int { progresses.filter { $0.status == 2 }.count }
    private var learning: Int { progresses.filter { $0.status == 1 }.count }
    private var pct: Double {
        store.totalCount > 0 ? Double(mastered) / Double(store.totalCount) : 0
    }

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            ScrollView {
                LazyVStack(spacing: 24, pinnedViews: []) {
                    hero
                    metrics
                    sectionHeader("题目分类", trailing: "\(store.categories.count) 项")
                    categoriesList
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(for: Category.self) { cat in
            QuestionListView(category: cat)
        }
    }

    private var hero: some View {
        VStack(alignment: .leading, spacing: 8) {
            KickerText(text: "Interview Prep")
            Text("准备好下一场面试")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(Theme.fg)
            Text("离线题库 · \(store.totalCount) 道精选题 · iCloud 同步")
                .font(.system(size: 13))
                .foregroundStyle(Theme.fgMuted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 12)
    }

    private var metrics: some View {
        VStack(spacing: 14) {
            HStack(spacing: 10) {
                metric("已掌握", value: mastered, total: store.totalCount, tint: Theme.success)
                metric("学习中", value: learning, total: store.totalCount, tint: Theme.warning)
            }
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("总体进度").font(.system(size: 12)).foregroundStyle(Theme.fgMuted)
                    Spacer()
                    Text("\(Int(pct * 100))%").font(.system(size: 12, weight: .semibold)).foregroundStyle(Theme.fg)
                }
                ThinProgressBar(progress: pct)
            }
            .padding(16)
            .elevatedCard()
        }
    }

    private func metric(_ title: String, value: Int, total: Int, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Circle().fill(tint).frame(width: 6, height: 6)
                Text(title).font(.system(size: 12)).foregroundStyle(Theme.fgMuted)
                Spacer()
            }
            Text("\(value)")
                .font(.system(size: 26, weight: .semibold))
                .foregroundStyle(Theme.fg)
                .monospacedDigit()
            Text("共 \(total) 题")
                .font(.system(size: 11))
                .foregroundStyle(Theme.fgDim)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .elevatedCard()
    }

    private func sectionHeader(_ title: String, trailing: String? = nil) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Theme.fg)
            Spacer()
            if let trailing {
                Text(trailing)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.fgDim)
            }
        }
    }

    private var categoriesList: some View {
        LazyVStack(spacing: 10) {
            ForEach(store.categories) { cat in
                NavigationLink(value: cat) {
                    categoryRow(cat)
                }
                .buttonStyle(.pressable)
            }
        }
    }

    private func categoryRow(_ cat: Category) -> some View {
        let tint = Theme.categoryTint(cat.color)
        let masteredInCat = progresses.filter { p in
            p.status == 2 && cat.items.contains(where: { $0.id == p.questionId })
        }.count

        return HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(tint.opacity(0.14))
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(tint.opacity(0.35), lineWidth: 0.5)
                Text(cat.icon).font(.system(size: 22))
            }
            .frame(width: 44, height: 44)

            VStack(alignment: .leading, spacing: 4) {
                Text(cat.cat)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.fg)
                    .lineLimit(1)
                Text("\(cat.items.count) 题 · 已掌握 \(masteredInCat)")
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.fgMuted)
            }
            Spacer(minLength: 8)
            Image(systemName: "chevron.right")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Theme.fgDim)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .elevatedCard()
    }
}
