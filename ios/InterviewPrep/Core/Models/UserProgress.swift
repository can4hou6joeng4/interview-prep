import Foundation
import SwiftData

@Model
final class UserProgress {
    @Attribute(.unique) var questionId: String
    var status: Int           // 0 未学 1 学习中 2 已掌握
    var favorited: Bool
    var note: String
    var lastViewedAt: Date?
    var noteUpdatedAt: Date?

    init(questionId: String, status: Int = 0, favorited: Bool = false, note: String = "", lastViewedAt: Date? = nil, noteUpdatedAt: Date? = nil) {
        self.questionId = questionId
        self.status = status
        self.favorited = favorited
        self.note = note
        self.lastViewedAt = lastViewedAt
        self.noteUpdatedAt = noteUpdatedAt
    }
}
