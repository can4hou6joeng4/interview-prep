import SwiftUI
import SwiftData

struct SettingsView: View {
    @EnvironmentObject private var store: QuestionStore
    @EnvironmentObject private var cloud: CloudSyncService
    @Environment(\.modelContext) private var ctx
    @Query private var progresses: [UserProgress]

    private var mastered: Int { progresses.filter { $0.status == 2 }.count }
    private var learning: Int { progresses.filter { $0.status == 1 }.count }
    private var favorited: Int { progresses.filter { $0.favorited }.count }

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    sectionCard(title: "学习进度") {
                        statsGrid
                    }
                    sectionCard(title: "iCloud 同步") {
                        cloudBlock
                    }
                    sectionCard(title: "题库信息") {
                        VStack(spacing: 8) {
                            row("分类数", "\(store.categories.count)")
                            row("题目总数", "\(store.totalCount)")
                        }
                    }
                    sectionCard(title: "关于") {
                        VStack(spacing: 8) {
                            row("版本", Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "-")
                            Link(destination: URL(string: "https://github.com/can4hou6joeng4/interview-prep")!) {
                                HStack {
                                    Text("仓库首页")
                                        .font(.system(size: 13, weight: .bold))
                                    Spacer()
                                    Image(systemName: "arrow.up.right")
                                }
                            }
                            .foregroundStyle(Theme.text)
                        }
                    }
                }
                .padding(16)
            }
        }
        .navigationTitle("设置")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var statsGrid: some View {
        HStack(spacing: 8) {
            statPill("\(mastered)", "已掌握", Theme.green)
            statPill("\(learning)", "学习中", Theme.orange)
            statPill("\(favorited)", "收藏", Theme.yellow)
        }
    }

    private func statPill(_ value: String, _ label: String, _ bg: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.system(size: 20, weight: .black))
            Text(label)
                .font(.system(size: 10, weight: .heavy))
                .tracking(1).textCase(.uppercase)
        }
        .frame(maxWidth: .infinity).padding(.vertical, 10)
        .background(bg)
        .neoBorder()
        .neoShadow(offset: 3)
    }

    private var cloudBlock: some View {
        VStack(spacing: 10) {
            row("状态", cloud.isAvailable ? "✓ 已登录 iCloud" : "✗ 未登录 iCloud")
            row("上次同步", cloud.lastSyncAt.map { Self.fmt.string(from: $0) } ?? "—")
            HStack(spacing: 8) {
                Button { cloud.push(progresses) } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.up.to.line").font(.system(size: 11))
                        Text("推送")
                    }
                    .font(.system(size: 12, weight: .black))
                    .tracking(0.5).textCase(.uppercase)
                    .frame(maxWidth: .infinity).padding(.vertical, 8)
                    .foregroundStyle(.white)
                    .background(Theme.cyanSolid)
                    .neoBorder()
                    .neoShadow(offset: 2)
                }
                Button { mergeFromCloud() } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.down.to.line").font(.system(size: 11))
                        Text("拉取合并")
                    }
                    .font(.system(size: 12, weight: .black))
                    .tracking(0.5).textCase(.uppercase)
                    .frame(maxWidth: .infinity).padding(.vertical, 8)
                    .foregroundStyle(Theme.text)
                    .background(Theme.surface)
                    .neoBorder()
                    .neoShadow(offset: 2)
                }
            }
            .buttonStyle(.plain)
        }
    }

    @ViewBuilder
    private func sectionCard<C: View>(title: String, @ViewBuilder content: () -> C) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            KickerText(text: title)
            content()
                .padding(12)
                .frame(maxWidth: .infinity)
                .background(Theme.surface)
                .neoBorder()
                .neoShadow(offset: 3)
        }
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.text2)
            Spacer()
            Text(value).font(.system(size: 13, weight: .black)).foregroundStyle(Theme.text)
        }
    }

    private static let fmt: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .short; f.timeStyle = .short
        return f
    }()

    private func mergeFromCloud() {
        guard let snap = cloud.pull() else { return }
        let byId = Dictionary(uniqueKeysWithValues: progresses.map { ($0.questionId, $0) })
        for item in snap.items {
            if let existing = byId[item.id] {
                existing.status = max(existing.status, item.status)
                existing.favorited = existing.favorited || item.favorited
                if existing.note.isEmpty { existing.note = item.note }
                if let viewed = item.viewed, (existing.lastViewedAt == nil || existing.lastViewedAt! < viewed) {
                    existing.lastViewedAt = viewed
                }
            } else {
                ctx.insert(UserProgress(
                    questionId: item.id,
                    status: item.status,
                    favorited: item.favorited,
                    note: item.note,
                    lastViewedAt: item.viewed
                ))
            }
        }
        try? ctx.save()
    }
}
