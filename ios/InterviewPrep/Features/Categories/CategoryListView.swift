import SwiftUI
import SwiftData

struct CategoryListView: View {
    @EnvironmentObject private var store: QuestionStore
    @Query private var progresses: [UserProgress]

    private var mastered: Int { progresses.filter { $0.status == 2 }.count }
    private var learning: Int { progresses.filter { $0.status == 1 }.count }
    private var unstarted: Int { max(0, store.totalCount - mastered - learning) }
    private var pct: Double {
        store.totalCount > 0 ? Double(mastered) / Double(store.totalCount) : 0
    }

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 20) {
                    header
                    statsRow
                    progressBar
                    if let err = store.loadError {
                        Text(err).font(.callout).foregroundStyle(Theme.redSolid)
                            .padding().neoCard()
                    } else {
                        sectionTitle("Categories")
                        categoriesGrid
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 12)
                .padding(.bottom, 24)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .principal) { EmptyView() }
        }
        .navigationDestination(for: Category.self) { cat in
            QuestionListView(category: cat)
        }
    }

    private var header: some View {
        VStack(spacing: 10) {
            Text("面经刷题")
                .font(.system(size: 28, weight: .black))
                .tracking(-0.5)
                .padding(.horizontal, 20).padding(.vertical, 6)
                .background(Theme.yellow)
                .neoBorder()
                .neoShadow()
                .rotationEffect(.degrees(-1))
            KickerText(text: "Based on résumé · Memory Cards")
        }
        .padding(.top, 20)
    }

    private var statsRow: some View {
        HStack(spacing: 10) {
            statCard(value: store.totalCount, label: "总题数", bg: Theme.surface, fg: Theme.text)
            statCard(value: mastered, label: "已掌握", bg: Theme.green, fg: Theme.text)
            statCard(value: learning, label: "学习中", bg: Theme.orange, fg: Theme.text)
            statCard(value: unstarted, label: "未学", bg: Theme.red, fg: .white)
        }
    }

    private func statCard(value: Int, label: String, bg: Color, fg: Color) -> some View {
        VStack(spacing: 4) {
            Text("\(value)")
                .font(.system(size: 26, weight: .black))
                .foregroundStyle(fg)
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .tracking(1)
                .textCase(.uppercase)
                .foregroundStyle(fg.opacity(0.85))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(bg)
        .neoBorder()
        .neoShadow(offset: 3)
    }

    private var progressBar: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("已掌握 \(mastered) / \(store.totalCount)")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(Theme.text2)
                Spacer()
                Text("\(Int(pct * 100))%")
                    .font(.system(size: 11, weight: .heavy))
                    .foregroundStyle(Theme.text2)
            }
            StripedProgressBar(progress: pct)
        }
    }

    private func sectionTitle(_ text: String) -> some View {
        HStack {
            Text(text)
                .font(.system(size: 16, weight: .black))
                .tracking(1)
                .textCase(.uppercase)
            Spacer()
        }
        .padding(.top, 6)
    }

    private var categoriesGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            ForEach(store.categories) { cat in
                NavigationLink(value: cat) {
                    categoryCard(cat)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func categoryCard(_ cat: Category) -> some View {
        let count = cat.items.count
        let color = Theme.categoryColor(cat.color)
        return VStack(alignment: .leading, spacing: 8) {
            Text(cat.icon).font(.system(size: 28))
            Text(cat.cat)
                .font(.system(size: 14, weight: .black))
                .lineLimit(2)
                .multilineTextAlignment(.leading)
                .foregroundStyle(Theme.text)
            Text("\(count) 题")
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(Theme.text2)
        }
        .padding(14)
        .frame(maxWidth: .infinity, minHeight: 120, alignment: .leading)
        .background(color.opacity(0.3))
        .neoBorder()
        .neoShadow(offset: 3)
    }
}
