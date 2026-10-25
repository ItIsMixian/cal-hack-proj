import Foundation

struct DraftInbox {
    private let manager = FileManager.default

    private func directory() throws -> URL {
        guard let group = Bundle.main.object(forInfoDictionaryKey: "MirrorvilleAppGroup") as? String,
              group.hasPrefix("group."), !group.contains("$("),
              let container = manager.containerURL(forSecurityApplicationGroupIdentifier: group) else {
            throw ShareFailure.message("The shared inbox is unavailable. Both app targets need the same signed App Group.")
        }
        var inbox = container.appendingPathComponent("ShareInbox", isDirectory: true)
        try manager.createDirectory(at: inbox, withIntermediateDirectories: true, attributes: [.protectionKey: FileProtectionType.complete])
        try manager.setAttributes([.protectionKey: FileProtectionType.complete], ofItemAtPath: inbox.path)
        var resources = URLResourceValues(); resources.isExcludedFromBackup = true
        try inbox.setResourceValues(resources)
        return inbox
    }

    func drafts() throws -> [ShareDraft] {
        let files = try manager.contentsOfDirectory(at: directory(), includingPropertiesForKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey])
        var drafts: [ShareDraft] = []
        for file in files where file.pathExtension == "json" {
            let values = try file.resourceValues(forKeys: [.isRegularFileKey, .isSymbolicLinkKey, .fileSizeKey])
            guard values.isRegularFile == true, values.isSymbolicLink != true, (values.fileSize ?? 99_999) <= 20_000,
                  UUID(uuidString: file.deletingPathExtension().lastPathComponent) != nil else { continue }
            let draft = try JSONDecoder().decode(ShareDraft.self, from: Data(contentsOf: file))
            guard draft.id.uuidString == file.deletingPathExtension().lastPathComponent else { continue }
            _ = try draft.payloadData(); drafts.append(draft)
        }
        return drafts.sorted { $0.createdAt > $1.createdAt }
    }

    func save(_ draft: ShareDraft) throws {
        _ = try draft.payloadData()
        guard try drafts().count < 50 else { throw ShareFailure.message("Your inbox has 50 drafts. Open Mirrorville and remove a draft before saving another.") }
        let data = try JSONEncoder().encode(draft)
        let file = try directory().appendingPathComponent(draft.id.uuidString).appendingPathExtension("json")
        try data.write(to: file, options: [.atomic, .completeFileProtection])
    }

    func remove(_ draft: ShareDraft) throws {
        let file = try directory().appendingPathComponent(draft.id.uuidString).appendingPathExtension("json")
        try manager.removeItem(at: file)
    }
}
