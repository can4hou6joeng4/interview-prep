import Foundation

struct Category: Codable, Identifiable, Hashable {
    let cat: String
    let icon: String
    let color: String
    let slug: String
    let items: [Question]

    var id: String { slug }
}

struct Question: Codable, Identifiable, Hashable {
    let q: String
    let a: String
    let diff: String
    let tags: [String]
    let id: String
}
