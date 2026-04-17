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

    var body: some View {
        ZStack {
            Theme.base.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    meta
                    title
                    actionRow
                    masterySegmented
                    if let p = progress, !p.note.isEmpty {
                        noteCard(p.note)
                    }
                    KickerText(text: "Answer · 参考解析")
                    AnswerWebView(html: wrappedHTML)
                        .frame(minHeight: 440)
                        .clipShape(RoundedRectangle(cornerRadius: Theme.r, style: .continuous))
                        .elevatedCard(bg: Theme.elevated2, hairline: true)
                }
                .padding(20)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .principal) { EmptyView() } }
        .onAppear { touch() }
        .onDisappear { if isReadingThis { tts.stop() } }
        .sheet(isPresented: $showNoteEditor) {
            NoteEditorSheet(questionText: question.q, note: $noteDraft, onSave: saveNote)
        }
    }

    private var meta: some View {
        HStack(spacing: 8) {
            Text(category.icon).font(.system(size: 14))
            Text(category.cat)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(Theme.fgMuted)
            DifficultyChip(diff: question.diff)
            Spacer()
        }
    }

    private var title: some View {
        Text(question.q)
            .font(.system(size: 21, weight: .semibold))
            .foregroundStyle(Theme.fg)
            .fixedSize(horizontal: false, vertical: true)
            .lineSpacing(4)
    }

    private var actionRow: some View {
        HStack(spacing: 10) {
            iconButton(
                system: (progress?.favorited ?? false) ? "star.fill" : "star",
                label: "收藏",
                active: progress?.favorited ?? false,
                tint: Theme.warning
            ) { toggleFavorite() }
            iconButton(
                system: isReadingThis ? "stop.fill" : "speaker.wave.2.fill",
                label: isReadingThis ? "停止" : "朗读",
                active: isReadingThis,
                tint: Theme.accent
            ) {
                if isReadingThis { tts.stop() } else { tts.speak(question: question) }
            }
            iconButton(
                system: (progress?.note.isEmpty ?? true) ? "square.and.pencil" : "pencil.circle.fill",
                label: "笔记",
                active: !(progress?.note.isEmpty ?? true),
                tint: Theme.info
            ) {
                noteDraft = progress?.note ?? ""
                showNoteEditor = true
            }
        }
    }

    private func iconButton(system: String, label: String, active: Bool, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: system)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(active ? tint : Theme.fg)
                Text(label)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.fgMuted)
            }
            .frame(maxWidth: .infinity).padding(.vertical, 12)
            .elevatedCard(bg: active ? tint.opacity(0.1) : Theme.elevated)
        }
        .buttonStyle(.pressable)
    }

    private var masterySegmented: some View {
        let labels = ["未学", "学习中", "已掌握"]
        return HStack(spacing: 6) {
            ForEach(0..<3, id: \.self) { i in
                Button { updateStatus(i) } label: {
                    let active = (progress?.status ?? 0) == i
                    Text(labels[i])
                        .font(.system(size: 13, weight: active ? .semibold : .regular))
                        .foregroundStyle(active ? Theme.fg : Theme.fgMuted)
                        .frame(maxWidth: .infinity).padding(.vertical, 9)
                        .background(
                            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                .fill(active ? Theme.surfaceHi : Color.clear)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                .strokeBorder(active ? Theme.borderHi : Color.clear, lineWidth: 0.5)
                        )
                }
                .buttonStyle(.pressable)
            }
        }
        .padding(4)
        .background(
            RoundedRectangle(cornerRadius: Theme.rSm + 4, style: .continuous).fill(Theme.elevated)
        )
        .overlay(
            RoundedRectangle(cornerRadius: Theme.rSm + 4, style: .continuous).strokeBorder(Theme.border, lineWidth: 0.5)
        )
    }

    private func noteCard(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "pencil").font(.system(size: 11))
                KickerText(text: "My Note")
            }
            .foregroundStyle(Theme.info)
            Text(text)
                .font(.system(size: 14))
                .foregroundStyle(Theme.fg)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: Theme.r, style: .continuous).fill(Theme.info.opacity(0.08))
        )
        .overlay(
            RoundedRectangle(cornerRadius: Theme.r, style: .continuous).strokeBorder(Theme.info.opacity(0.25), lineWidth: 0.5)
        )
    }

    // MARK: data ops
    private func ensureProgress() -> UserProgress {
        if let p = progress { return p }
        let p = UserProgress(questionId: question.id)
        ctx.insert(p)
        return p
    }
    private func touch() { let p = ensureProgress(); p.lastViewedAt = Date(); try? ctx.save(); cloud.push(all) }
    private func toggleFavorite() { let p = ensureProgress(); p.favorited.toggle(); try? ctx.save(); cloud.push(all) }
    private func updateStatus(_ s: Int) { let p = ensureProgress(); p.status = s; try? ctx.save(); cloud.push(all) }
    private func saveNote(_ t: String) { let p = ensureProgress(); p.note = t; try? ctx.save(); cloud.push(all) }

    private var wrappedHTML: String {
        """
        <!doctype html><html><head><meta charset='utf-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <style>
          :root{
            --bg:#0A0A0C; --fg:#EDEDEF; --fg2:#8A8F98; --border:rgba(255,255,255,0.08);
            --accent:#5E6AD2; --warn:#FACC15; --info:#60A5FA; --surface:rgba(255,255,255,0.04);
          }
          *{margin:0;padding:0;box-sizing:border-box}
          body{
            font:15px -apple-system,BlinkMacSystemFont,'SF Pro Text','Inter','PingFang SC',sans-serif;
            color:var(--fg); line-height:1.72; padding:18px; background:var(--bg);
            -webkit-font-smoothing:antialiased;
          }
          h4{
            margin:20px 0 10px; font-weight:600; font-size:13px;
            color:var(--fg); letter-spacing:0.2px;
          }
          h4::before{
            content:""; display:inline-block; width:3px; height:12px;
            background:var(--accent); margin-right:8px; vertical-align:-1px; border-radius:2px;
          }
          p{margin:8px 0; color:var(--fg)}
          ul,ol{padding-left:22px; margin:8px 0}
          li{margin:5px 0; color:var(--fg)}
          b,strong{font-weight:600; color:var(--fg)}
          pre{
            background:rgba(255,255,255,0.03); padding:14px 16px; margin:12px 0;
            border:0.5px solid var(--border); border-radius:10px; overflow-x:auto;
            font-size:12.5px; line-height:1.55;
          }
          code{
            font-family:'SF Mono','JetBrains Mono',Menlo,monospace; font-size:13px;
          }
          :not(pre) > code{
            background:var(--surface); color:var(--fg); padding:1px 6px;
            border:0.5px solid var(--border); border-radius:4px; font-size:12.5px;
          }
          .key-point{
            background:rgba(250,204,21,0.08); border:0.5px solid rgba(250,204,21,0.3);
            border-left:3px solid var(--warn); border-radius:10px;
            padding:12px 14px; margin:14px 0; color:var(--fg);
          }
          .project-link{
            background:rgba(96,165,250,0.08); border:0.5px solid rgba(96,165,250,0.3);
            border-left:3px solid var(--info); border-radius:10px;
            padding:12px 14px; margin:14px 0; color:var(--fg);
          }
          a{color:var(--accent); text-decoration:none}
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
