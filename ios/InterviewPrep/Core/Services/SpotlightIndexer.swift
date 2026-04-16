import Foundation
import CoreSpotlight
import UniformTypeIdentifiers

enum SpotlightIndexer {
    static let domain = "com.can4hou6joeng4.interviewprep.questions"

    static func reindex(_ categories: [Category]) {
        let items: [CSSearchableItem] = categories.flatMap { cat in
            cat.items.map { q -> CSSearchableItem in
                let attrs = CSSearchableItemAttributeSet(contentType: UTType.text)
                attrs.title = q.q
                attrs.contentDescription = cat.cat
                attrs.keywords = [cat.cat, q.diff] + q.tags
                return CSSearchableItem(
                    uniqueIdentifier: q.id,
                    domainIdentifier: domain,
                    attributeSet: attrs
                )
            }
        }
        let index = CSSearchableIndex.default()
        index.deleteSearchableItems(withDomainIdentifiers: [domain]) { _ in
            index.indexSearchableItems(items) { err in
                if let err = err { print("[Spotlight] 索引失败: \(err)") }
            }
        }
    }
}
