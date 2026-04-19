import SwiftUI

struct NoteEditorSheet: View {
    let questionText: String
    @Binding var note: String
    @Environment(\.dismiss) private var dismiss
    let onSave: (String) -> Void

    @State private var draft: String = ""
    @FocusState private var focused: Bool

    private let starters = [
        ("答题结构", "### 答题结构\n- 背景\n- 方案\n- 权衡\n"),
        ("项目例子", "### 项目例子\n- 场景：\n- 做法：\n- 指标：\n"),
        ("易错点", "### 易错点\n- \n")
    ]

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

                    starterRow

                    HStack {
                        Text("\(draft.count) 字")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Theme.fgMuted)
                        Spacer()
                        if !draft.isEmpty {
                            Button("清空") {
                                draft = ""
                            }
                            .font(.system(size: 12, weight: .semibold))
                        }
                    }

                    TextEditor(text: $draft)
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.fg)
                        .scrollContentBackground(.hidden)
                        .focused($focused)
                        .padding(10)
                        .frame(minHeight: 260)
                        .elevatedCard(bg: Theme.base2)

                    Spacer()
                }
                .padding(20)
            }
            .navigationTitle("编辑笔记")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: {
                        BrutalButtonLabel(title: "取消", bg: Theme.chrome, fg: Theme.fg)
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button { note = draft; onSave(draft); dismiss() } label: {
                        BrutalButtonLabel(title: "保存", bg: Theme.accent, fg: .white)
                    }
                }
            }
            .onAppear { draft = note; focused = true }
        }
    }

    private var starterRow: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(starters, id: \.0) { item in
                    Button(item.0) {
                        if !draft.contains(item.1.trimmingCharacters(in: .whitespacesAndNewlines)) {
                            draft = draft.isEmpty ? item.1 : draft + "\n" + item.1
                        }
                    }
                    .font(.system(size: 11, weight: .semibold))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Capsule().fill(Theme.base2))
                    .overlay(Capsule().stroke(Theme.border, lineWidth: 1))
                }
            }
        }
    }
}
