import SwiftUI
import SwiftData
import WebKit

struct QuestionDetailView: View {
    let category: Category
    let question: Question
    var sessionTitle: String? = nil
    var sessionProgressText: String? = nil
    @Environment(\.modelContext) private var ctx
    @EnvironmentObject private var store: QuestionStore
    @EnvironmentObject private var tts: TTSService
    @EnvironmentObject private var cloud: CloudSyncService
    @Query private var all: [UserProgress]
    @State private var showNoteEditor = false
    @State private var noteDraft: String = ""
    @State private var showAnswer = false
    @State private var nextQuestion: Question?
    @State private var feedbackMessage: String?

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
                    if let sessionTitle {
                        sessionBanner(title: sessionTitle, progress: sessionProgressText)
                    }
                    heroCard
                    actionRow
                    recallCard
                    revealAnswerButton
                    if showAnswer {
                        answerCard
                        nextStepBar
                        masterySegmented
                    }
                    if let p = progress, !p.note.isEmpty {
                        noteCard(p.note)
                    }
                }
                .padding(20)
            }
            if let feedbackMessage {
                VStack {
                    Spacer()
                    FloatingToast(text: feedbackMessage)
                        .padding(.bottom, 28)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { ToolbarItem(placement: .principal) { EmptyView() } }
        .onAppear {
            touch()
            showAnswer = false
        }
        .onDisappear { if isReadingThis { tts.stop() } }
        .sheet(isPresented: $showNoteEditor) {
            NoteEditorSheet(questionText: question.q, note: $noteDraft, onSave: saveNote)
        }
        .navigationDestination(item: $nextQuestion) { q in
            if let (cat, _) = store.find(questionId: q.id) {
                QuestionDetailView(category: cat, question: q)
            }
        }
    }

    private func sessionBanner(title: String, progress: String?) -> some View {
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 4) {
                KickerText(text: title)
                Text("当前仍在复习流程中")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Theme.fg)
            }
            Spacer()
            if let progress {
                Text(progress)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.accentDim)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .brutalOutlined(bg: Theme.base2, radius: 999)
            }
        }
        .padding(14)
        .elevatedCard(bg: Theme.base2)
    }

    private var heroCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 8) {
                Text(category.icon)
                    .font(.system(size: 14))
                Text(category.cat)
                    .font(.system(size: 11, weight: .black))
                    .foregroundStyle(Theme.fgMuted)
                DifficultyChip(diff: question.diff)
                Spacer()
                if !question.tags.isEmpty {
                    TagChip(text: question.tags[0])
                }
            }
            Text(question.q)
                .font(.system(size: 24, weight: .bold))
                .foregroundStyle(Theme.fg)
                .fixedSize(horizontal: false, vertical: true)
                .lineSpacing(4)
        }
        .padding(18)
        .elevatedCard(bg: Theme.surface)
    }

    private var actionRow: some View {
        HStack(spacing: 10) {
            iconButton(
                system: (progress?.favorited ?? false) ? "star.fill" : "star",
                label: "收藏",
                active: progress?.favorited ?? false,
                tint: Theme.accentHi
            ) { toggleFavorite() }
            iconButton(
                system: isReadingThis ? "stop.fill" : "speaker.wave.2.fill",
                label: isReadingThis ? "停止" : "朗读",
                active: isReadingThis,
                tint: Theme.info.opacity(0.35)
            ) {
                if isReadingThis { tts.stop() } else { tts.speak(question: question) }
            }
            iconButton(
                system: (progress?.note.isEmpty ?? true) ? "square.and.pencil" : "pencil.circle.fill",
                label: "笔记",
                active: !(progress?.note.isEmpty ?? true),
                tint: Theme.purple.opacity(0.42)
            ) {
                noteDraft = progress?.note ?? ""
                showNoteEditor = true
            }
        }
    }

    private var recallCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            KickerText(text: "Recall First")
            Text("先自己想答案，再点按钮查看参考解析。")
                .font(.system(size: 14))
                .foregroundStyle(Theme.fg)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .elevatedCard(bg: Theme.base2)
    }

    private var revealAnswerButton: some View {
        Button {
            showAnswer.toggle()
        } label: {
            BrutalButtonLabel(
                title: showAnswer ? "收起答案" : "显示答案",
                icon: showAnswer ? "eye.slash" : "eye",
                bg: showAnswer ? Theme.base2 : Theme.accent,
                fg: showAnswer ? Theme.fg : .white,
                fullWidth: true
            )
        }
        .buttonStyle(.pressable)
    }

    private var answerCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            KickerText(text: "Answer · 参考解析")
            AnswerWebView(html: wrappedHTML)
                .frame(minHeight: 440)
                .clipShape(Rectangle())
                .elevatedCard(bg: Theme.base2, hairline: true)
        }
    }

    private var nextStepBar: some View {
        VStack(alignment: .leading, spacing: 10) {
            KickerText(text: "Next")
            HStack(spacing: 10) {
                if let nextInCategory {
                    Button {
                        nextQuestion = nextInCategory
                    } label: {
                        BrutalButtonLabel(
                            title: "下一题",
                            icon: "arrow.right",
                            bg: Theme.accent,
                            fg: .white,
                            fullWidth: true
                        )
                    }
                    .buttonStyle(.pressable)
                }

                Button {
                    if let (_, q) = store.randomQuestion() {
                        nextQuestion = q
                    }
                } label: {
                    BrutalButtonLabel(
                        title: "随机切题",
                        icon: "shuffle",
                        bg: Theme.base2,
                        fg: Theme.fg,
                        fullWidth: true
                    )
                }
                .buttonStyle(.pressable)
            }
        }
    }

    private func iconButton(system: String, label: String, active: Bool, tint: Color, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            VStack(spacing: 6) {
                Image(systemName: system)
                    .font(.system(size: 15, weight: .black))
                    .foregroundStyle(Theme.fg)
                Text(label)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundStyle(Theme.fg)
            }
            .frame(maxWidth: .infinity).padding(.vertical, 12)
            .elevatedCard(bg: active ? tint : Theme.surface)
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
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(active ? Theme.fg : Theme.fgMuted)
                        .frame(maxWidth: .infinity).padding(.vertical, 9)
                        .background(
                            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                .fill(active ? segmentedFill(for: i) : Theme.base2)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: Theme.rSm, style: .continuous)
                                .strokeBorder(Theme.border, lineWidth: 2)
                        )
                }
                .buttonStyle(.pressable)
            }
        }
        .padding(4)
        .background(
            RoundedRectangle(cornerRadius: Theme.rSm + 4, style: .continuous).fill(Theme.surface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: Theme.rSm + 4, style: .continuous).strokeBorder(Theme.border, lineWidth: 1)
        )
        .shadow(color: Theme.shadow, radius: 10, x: 0, y: 6)
    }

    private func noteCard(_ text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "pencil").font(.system(size: 11, weight: .black))
                KickerText(text: "My Note")
            }
            .foregroundStyle(Theme.fg)
            Text(text)
                .font(.system(size: 14))
                .foregroundStyle(Theme.fg)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .elevatedCard(bg: Theme.info.opacity(0.22))
    }

    // MARK: data ops
    private func ensureProgress() -> UserProgress {
        if let p = progress { return p }
        let p = UserProgress(questionId: question.id)
        ctx.insert(p)
        return p
    }
    private func touch() { let p = ensureProgress(); p.lastViewedAt = Date(); try? ctx.save(); cloud.push(all) }
    private func toggleFavorite() {
        let p = ensureProgress()
        p.favorited.toggle()
        try? ctx.save()
        cloud.push(all)
        showFeedback(p.favorited ? "已加入收藏" : "已取消收藏")
    }
    private func updateStatus(_ s: Int) {
        let p = ensureProgress()
        p.status = s
        try? ctx.save()
        cloud.push(all)
        let text: String
        switch s {
        case 1:
            text = "已标记为学习中"
        case 2:
            text = "已标记为已掌握"
        default:
            text = "已恢复为未学"
        }
        showFeedback(text)
    }
    private func saveNote(_ t: String) {
        let p = ensureProgress()
        p.note = t
        p.noteUpdatedAt = t.isEmpty ? nil : Date()
        try? ctx.save()
        cloud.push(all)
        showFeedback(t.isEmpty ? "已清空笔记" : "笔记已保存")
    }

    private func showFeedback(_ text: String) {
        withAnimation(Theme.ease) {
            feedbackMessage = text
        }
        Task { @MainActor in
            try? await Task.sleep(for: .seconds(1.6))
            withAnimation(Theme.ease) {
                if feedbackMessage == text {
                    feedbackMessage = nil
                }
            }
        }
    }

    private func segmentedFill(for index: Int) -> Color {
        switch index {
        case 1:
            return Theme.warning
        case 2:
            return Theme.success
        default:
            return Theme.base2
        }
    }

    private var nextInCategory: Question? {
        guard let index = category.items.firstIndex(where: { $0.id == question.id }),
              category.items.indices.contains(index + 1) else {
            return nil
        }
        return category.items[index + 1]
    }

    private var wrappedHTML: String {
        """
        <!doctype html><html><head><meta charset='utf-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <meta name='color-scheme' content='light'>
        <style>
          :root{
            --bg:#fff8e8; --surface:#ffffff; --text:#1a1a2e; --text2:#444444; --text-dim:#444444;
            --border:#d7dce5; --accent:#4f46e5; --warn:#fef3c7; --info:#dbeafe;
          }
          *{margin:0;padding:0;box-sizing:border-box}
          body{
            font:15px 'Inter',-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;
            color:var(--text); line-height:1.72; padding:18px; background:var(--bg);
            -webkit-font-smoothing:antialiased;
          }
          h4{
            margin:20px 0 10px; font-weight:700; font-size:13px;
            color:var(--text); letter-spacing:0.2px;
            border-bottom:1px solid var(--border); padding-bottom:6px;
          }
          p{margin:8px 0; color:var(--text2)}
          ul,ol{padding-left:22px; margin:8px 0}
          li{margin:5px 0; color:var(--text2)}
          b,strong{font-weight:700; color:var(--text)}
          pre{
            background:var(--surface); padding:14px 16px; margin:12px 0;
            border:1px solid var(--border); border-radius:12px; overflow-x:auto;
            font-size:12.5px; line-height:1.55;
          }
          code{
            font-family:'JetBrains Mono','SF Mono',Menlo,monospace; font-size:13px;
          }
          :not(pre) > code{
            background:var(--warn); color:var(--text); padding:1px 6px;
            border:1px solid var(--border); border-radius:6px; font-size:12.5px;
          }
          .key-point{
            background:var(--warn); border:1px solid var(--border);
            border-left:3px solid var(--accent);
            border-radius:12px;
            padding:12px 14px; margin:14px 0; color:var(--text);
          }
          .project-link{
            background:var(--info); border:1px solid var(--border);
            border-left:3px solid var(--accent);
            border-radius:12px;
            padding:12px 14px; margin:14px 0; color:var(--text);
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
