import SwiftUI

struct NoteEditorSheet: View {
    let questionText: String
    @Binding var note: String
    @Environment(\.dismiss) private var dismiss
    let onSave: (String) -> Void

    @State private var draft: String = ""
    @FocusState private var focused: Bool

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.base.ignoresSafeArea()
                VStack(alignment: .leading, spacing: 14) {
                    VStack(alignment: .leading, spacing: 6) {
                        KickerText(text: "Question")
                        Text(questionText)
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.fg)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .elevatedCard()

                    KickerText(text: "My Note")

                    TextEditor(text: $draft)
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.fg)
                        .scrollContentBackground(.hidden)
                        .focused($focused)
                        .padding(10)
                        .frame(minHeight: 260)
                        .elevatedCard(bg: Theme.elevated)

                    Spacer()
                }
                .padding(20)
            }
            .navigationTitle("编辑笔记")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("取消") { dismiss() }.font(.system(size: 14))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button { note = draft; onSave(draft); dismiss() } label: {
                        Text("保存").font(.system(size: 14, weight: .semibold))
                    }
                }
            }
            .onAppear { draft = note; focused = true }
        }
        .preferredColorScheme(.dark)
    }
}
