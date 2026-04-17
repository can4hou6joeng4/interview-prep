import Foundation
import Combine

@MainActor
final class CloudSyncService: ObservableObject {
    static let shared = CloudSyncService()

    private let store = NSUbiquitousKeyValueStore.default
    private let key = "user_progress_snapshot_v1"
    private let mirrorKey = "user_progress_local_mirror_v1"

    @Published private(set) var lastSyncAt: Date?
    @Published private(set) var isAvailable: Bool

    private init() {
        isAvailable = FileManager.default.ubiquityIdentityToken != nil
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(storeChanged),
            name: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
            object: store
        )
        store.synchronize()
    }

    struct Snapshot: Codable {
        struct Item: Codable {
            let id: String
            let status: Int
            let favorited: Bool
            let note: String
            let viewed: Date?
        }
        var updatedAt: Date
        var items: [Item]
    }

    func push(_ items: [UserProgress]) {
        let snap = Snapshot(
            updatedAt: Date(),
            items: items.map {
                .init(id: $0.questionId, status: $0.status, favorited: $0.favorited,
                      note: $0.note, viewed: $0.lastViewedAt)
            }
        )
        guard let data = try? JSONEncoder().encode(snap) else { return }
        store.set(data, forKey: key)
        UserDefaults.standard.set(data, forKey: mirrorKey)
        lastSyncAt = snap.updatedAt
        store.synchronize()
    }

    func pull() -> Snapshot? {
        guard let data = store.data(forKey: key),
              let snap = try? JSONDecoder().decode(Snapshot.self, from: data) else {
            return nil
        }
        lastSyncAt = snap.updatedAt
        return snap
    }

    @objc private func storeChanged(_ note: Notification) {
        NotificationCenter.default.post(name: .cloudSyncDidReceive, object: nil)
    }
}

extension Notification.Name {
    static let cloudSyncDidReceive = Notification.Name("cloudSyncDidReceive")
}
