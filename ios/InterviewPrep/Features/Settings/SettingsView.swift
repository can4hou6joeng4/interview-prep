import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var store: QuestionStore

    var body: some View {
        Form {
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
