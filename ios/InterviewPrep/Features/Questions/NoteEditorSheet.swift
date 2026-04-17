import SwiftUI

struct NoteEditorSheet: View {
    let questionText: String
    @Binding var note: String
    @Environment(\.dismiss) private var dismiss
    let onSave: (String) -> Void

    @State private var draft: String = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("题目") {
                    Text(questionText).font(.subheadline).foregroundStyle(.secondary)
                }
                Section("我的笔记") {
                    TextEditor(text: $draft)
                        .frame(minHeight: 200)
                        .font(.body)
                }
            }
            .navigationTitle("编辑笔记")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        note = draft
                        onSave(draft)
                        dismiss()
                    }
                }
            }
            .onAppear { draft = note }
        }
    }
}
