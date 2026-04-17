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
        Form {
            Section("学习进度") {
                LabeledContent("已掌握", value: "\(mastered) / \(store.totalCount)")
                LabeledContent("学习中", value: "\(learning)")
                LabeledContent("已收藏", value: "\(favorited)")
            }
            Section("iCloud 同步（Key-Value Store）") {
                LabeledContent("状态", value: cloud.isAvailable ? "已启用" : "未登录 iCloud")
                LabeledContent("上次同步", value: cloud.lastSyncAt.map { Self.fmt.string(from: $0) } ?? "—")
                Button("立即推送到 iCloud") {
                    cloud.push(progresses)
                }
                Button("从 iCloud 拉取并合并") {
                    mergeFromCloud()
                }
            }
            Section("题库信息") {
                LabeledContent("分类数", value: "\(store.categories.count)")
                LabeledContent("题目总数", value: "\(store.totalCount)")
            }
            Section("关于") {
                LabeledContent("版本", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "-")
                Link("仓库首页", destination: URL(string: "https://github.com/can4hou6joeng4/interview-prep")!)
            }
        }
    }

    private static let fmt: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .short
        f.timeStyle = .short
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
