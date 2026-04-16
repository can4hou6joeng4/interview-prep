import SwiftUI
import WebKit

struct QuestionDetailView: View {
    let category: Category
    let question: Question

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(question.q).font(.title3).bold()
                HStack {
                    DifficultyBadge(diff: question.diff)
                    Text(category.cat).font(.caption).foregroundStyle(.secondary)
                }
                Divider()
                AnswerWebView(html: wrappedHTML)
                    .frame(minHeight: 400)
            }
            .padding()
        }
        .navigationTitle("题目详情")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var wrappedHTML: String {
        """
        <!doctype html><html><head><meta charset='utf-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <style>
          body{font:16px -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;color:#222;line-height:1.7;margin:0;padding:0;}
          h4{margin:16px 0 8px;color:#0a57c2;}
          ul,ol{padding-left:20px;}
          pre{background:#f6f8fa;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;}
          code{font-family:'SF Mono',Menlo,monospace;}
          .key-point{background:#fff7e6;border-left:4px solid #ffa940;padding:8px 12px;margin:12px 0;border-radius:4px;}
          .project-link{background:#e6f7ff;border-left:4px solid #1890ff;padding:8px 12px;margin:12px 0;border-radius:4px;}
          @media (prefers-color-scheme: dark){
            body{color:#e6e6e6;background:#1c1c1e;}
            pre{background:#2c2c2e;}
            h4{color:#6aa9ff;}
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
