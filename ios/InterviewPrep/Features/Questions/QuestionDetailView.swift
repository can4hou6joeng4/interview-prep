import SwiftUI
import SwiftData
import WebKit

struct QuestionDetailView: View {
    let category: Category
    let question: Question
    @Environment(\.modelContext) private var ctx
    @EnvironmentObject private var tts: TTSService
    @EnvironmentObject private var cloud: CloudSyncService
    @Query private var all: [UserProgress]
    @State private var showNoteEditor = false
    @State private var noteDraft: String = ""

    private var progress: UserProgress? {
        all.first { $0.questionId == question.id }
    }
    private var isReadingThis: Bool {
        tts.isSpeaking && tts.currentQuestionId == question.id
    }
    private var catColor: Color { Theme.categoryColor(category.color) }

    var body: some View {
        ZStack {
            Theme.bg.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    questionHeader
                    actionRow
                    masteryPicker
                    if let p = progress, !p.note.isEmpty {
                        noteCard(p.note)
                    }
                    AnswerWebView(html: wrappedHTML)
                        .frame(minHeight: 420)
                        .background(Theme.surface)
                        .neoBorder()
                        .neoShadow(offset: 3)
                }
                .padding(14)
            }
        }
        .navigationTitle("题目")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear { touch() }
        .onDisappear { if isReadingThis { tts.stop() } }
        .sheet(isPresented: $showNoteEditor) {
            NoteEditorSheet(questionText: question.q, note: $noteDraft, onSave: saveNote)
        }
    }

    private var questionHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Text(category.icon).font(.system(size: 16))
                Text(category.cat)
                    .font(.system(size: 11, weight: .heavy))
                    .tracking(0.5)
                    .textCase(.uppercase)
                    .foregroundStyle(Theme.text2)
                DifficultyBadge(diff: question.diff)
                Spacer()
            }
            Text(question.q)
                .font(.system(size: 17, weight: .black))
                .foregroundStyle(Theme.text)
                .multilineTextAlignment(.leading)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(catColor.opacity(0.3))
        .neoBorder()
        .neoShadow()
    }

    private var actionRow: some View {
        HStack(spacing: 8) {
            actionButton(
                icon: (progress?.favorited ?? false) ? "star.fill" : "star",
                label: "收藏",
                bg: (progress?.favorited ?? false) ? Theme.yellow : Theme.surface
            ) { toggleFavorite() }

            actionButton(
                icon: isReadingThis ? "stop.circle.fill" : "speaker.wave.2.fill",
                label: isReadingThis ? "停止" : "朗读",
                bg: isReadingThis ? Theme.pink : Theme.blue
            ) {
                if isReadingThis { tts.stop() } else { tts.speak(question: question) }
            }

            actionButton(
                icon: (progress?.note.isEmpty ?? true) ? "note.text" : "note.text.badge.plus",
                label: "笔记",
                bg: (progress?.note.isEmpty ?? true) ? Theme.surface : Theme.purple
            ) {
                noteDraft = progress?.note ?? ""
                showNoteEditor = true
            }
        }
    }

    private func actionButton(icon: String, label: String, bg: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Image(systemName: icon).font(.system(size: 16, weight: .bold))
                Text(label)
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(0.3)
                    .textCase(.uppercase)
            }
            .frame(maxWidth: .infinity).padding(.vertical, 10)
            .foregroundStyle(Theme.text)
            .background(bg)
            .neoBorder()
            .neoShadow(offset: 3)
        }
        .buttonStyle(.plain)
    }

    private var masteryPicker: some View {
        HStack(spacing: 0) {
            ForEach(0..<3) { i in
                Button { updateStatus(i) } label: {
                    let label = ["未学", "学习中", "已掌握"][i]
                    let active = (progress?.status ?? 0) == i
                    let bg: Color = active ? [Theme.text3, Theme.orangeSolid, Theme.greenSolid][i] : Color.clear
                    Text(label)
                        .font(.system(size: 12, weight: .black))
                        .tracking(0.3)
                        .textCase(.uppercase)
                        .foregroundStyle(active ? .white : Theme.text2)
                        .frame(maxWidth: .infinity).padding(.vertical, 10)
                        .background(bg)
                }
            }
        }
        .background(Theme.bg2)
        .neoBorder()
        .neoShadow(offset: 3)
    }

    private func noteCard(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: "note.text")
                KickerText(text: "我的笔记 · My Note")
            }
            .foregroundStyle(Theme.text2)
            Text(text)
                .font(.system(size: 14))
                .foregroundStyle(Theme.text)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.purple.opacity(0.5))
        .neoBorder()
        .neoShadow(offset: 3)
    }

    private func ensureProgress() -> UserProgress {
        if let p = progress { return p }
        let p = UserProgress(questionId: question.id)
        ctx.insert(p)
        return p
    }
    private func touch() {
        let p = ensureProgress(); p.lastViewedAt = Date()
        try? ctx.save(); cloud.push(all)
    }
    private func toggleFavorite() {
        let p = ensureProgress(); p.favorited.toggle()
        try? ctx.save(); cloud.push(all)
    }
    private func updateStatus(_ s: Int) {
        let p = ensureProgress(); p.status = s
        try? ctx.save(); cloud.push(all)
    }
    private func saveNote(_ text: String) {
        let p = ensureProgress(); p.note = text
        try? ctx.save(); cloud.push(all)
    }

    private var wrappedHTML: String {
        """
        <!doctype html><html><head><meta charset='utf-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <style>
          :root{--bg:#ffffff;--text:#1a1a2e;--text2:#444;--border:#222;--pink:#ff6b9d;--yellow:#ffe156;--blue:#4ecdc4;}
          *{margin:0;padding:0;box-sizing:border-box}
          body{font:15px -apple-system,BlinkMacSystemFont,'PingFang SC','Inter',sans-serif;color:var(--text);line-height:1.75;padding:16px;background:var(--bg);}
          h4{margin:18px 0 8px;font-weight:900;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text);border-bottom:3px solid var(--border);padding-bottom:4px;}
          ul,ol{padding-left:20px;margin:6px 0}
          li{margin:4px 0}
          b,strong{font-weight:900}
          p{margin:6px 0}
          pre{background:#fff8e8;padding:12px;border:3px solid var(--border);box-shadow:3px 3px 0 var(--border);overflow-x:auto;font-size:13px;margin:10px 0}
          code{font-family:'JetBrains Mono','SF Mono',Menlo,monospace;font-weight:500}
          :not(pre) > code{background:var(--yellow);padding:1px 5px;border:2px solid var(--border);font-size:13px}
          .key-point{background:var(--yellow);border:3px solid var(--border);box-shadow:3px 3px 0 var(--border);padding:10px 14px;margin:12px 0;font-weight:700}
          .project-link{background:var(--blue);border:3px solid var(--border);box-shadow:3px 3px 0 var(--border);padding:10px 14px;margin:12px 0;font-weight:700}
          @media (prefers-color-scheme: dark){
            :root{--bg:#1c1c1e;--text:#e6e6e6;--border:#888}
            pre{background:#2c2c2e}
          }
        </style></head><body>\(question.a)</body></html>
        """
    }
}

struct AnswerWebView: UIViewRepresentable {
    let html: String
    func makeUIView(context: Context) -> WKWebView {
        let wv = WKWebView()
        wv.isOpaque = false
        wv.backgroundColor = .clear
        wv.scrollView.backgroundColor = .clear
        return wv
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {
        uiView.loadHTMLString(html, baseURL: nil)
    }
}
