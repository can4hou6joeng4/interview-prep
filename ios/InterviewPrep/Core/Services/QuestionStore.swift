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
}
