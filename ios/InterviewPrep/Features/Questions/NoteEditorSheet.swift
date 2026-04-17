import SwiftUI

struct NoteEditorSheet: View {
    let questionText: String
    @Binding var note: String
    @Environment(\.dismiss) private var dismiss
    let onSave: (String) -> Void

    @State private var draft: String = ""

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.bg.ignoresSafeArea()
                VStack(alignment: .leading, spacing: 12) {
                    VStack(alignment: .leading, spacing: 6) {
                        KickerText(text: "题目 · Question")
                        Text(questionText).font(.system(size: 14, weight: .bold))
                            .foregroundStyle(Theme.text)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.yellow.opacity(0.5))
                    .neoBorder()
                    .neoShadow(offset: 3)

                    KickerText(text: "我的笔记 · My Note")
                    TextEditor(text: $draft)
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.text)
                        .scrollContentBackground(.hidden)
                        .padding(8)
                        .frame(minHeight: 260)
                        .background(Theme.surface)
                        .neoBorder()
                        .neoShadow(offset: 3)
                    Spacer()
                }
                .padding(16)
            }
            .navigationTitle("编辑笔记")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }
                        .font(.system(size: 14, weight: .heavy))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("保存") {
                        note = draft
                        onSave(draft)
                        dismiss()
                    }
                    .font(.system(size: 14, weight: .heavy))
                }
            }
            .onAppear { draft = note }
        }
    }
}
