import SwiftUI
import SwiftData

struct SettingsView: View {
    @EnvironmentObject private var store: QuestionStore
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
}
