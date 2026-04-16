import Foundation

@MainActor
final class QuestionStore: ObservableObject {
    @Published private(set) var categories: [Category] = []
    @Published private(set) var loadError: String?

    init() {
        load()
    }

    func load() {
        guard let url = Bundle.main.url(forResource: "questions", withExtension: "json") else {
            loadError = "questions.json 未打包到 Bundle"
            return
        }
        do {
            let data = try Data(contentsOf: url)
            let decoded = try JSONDecoder().decode([Category].self, from: data)
            self.categories = decoded
            SpotlightIndexer.reindex(decoded)
        } catch {
            loadError = "解析失败: \(error.localizedDescription)"
        }
    }

    var totalCount: Int {
        categories.reduce(0) { $0 + $1.items.count }
    }

    func randomQuestion() -> (Category, Question)? {
        guard let cat = categories.randomElement(),
              let q = cat.items.randomElement() else { return nil }
        return (cat, q)
    }

    func find(questionId: String) -> (Category, Question)? {
        for cat in categories {
            if let q = cat.items.first(where: { $0.id == questionId }) {
                return (cat, q)
            }
        }
        return nil
    }

    func search(_ keyword: String) -> [(Category, Question)] {
        let kw = keyword.trimmingCharacters(in: .whitespaces).lowercased()
        guard !kw.isEmpty else { return [] }
        var out: [(Category, Question)] = []
        for cat in categories {
            for q in cat.items {
                if q.q.lowercased().contains(kw) || q.a.lowercased().contains(kw) {
                    out.append((cat, q))
                }
            }
        }
        return out
    }
}
