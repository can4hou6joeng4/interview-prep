import Foundation

enum QuestionSearch {
    struct Result {
        let category: Category
        let question: Question
    }

    static func search(keyword: String, in categories: [Category]) -> [Result] {
        let kw = keyword.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !kw.isEmpty else { return [] }
        var out: [Result] = []
        for category in categories {
            for question in category.items where matches(question: question, keyword: kw) {
                out.append(Result(category: category, question: question))
            }
        }
        return out
    }

    private static func matches(question: Question, keyword: String) -> Bool {
        if question.q.lowercased().contains(keyword) { return true }
        if question.a.lowercased().contains(keyword) { return true }
        return false
    }
}
