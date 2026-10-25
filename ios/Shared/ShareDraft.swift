import Foundation

enum ShareFailure: LocalizedError {
    case message(String)
    var errorDescription: String? { if case .message(let message) = self { return message }; return nil }
}

struct ShareDraft: Codable, Identifiable {
    let id: UUID
    let kind: String
    let text: String
    let createdAt: String

    static func make(text: String) throws -> ShareDraft {
        let original = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !original.isEmpty, original.utf16.count <= 12_000 else {
            throw ShareFailure.message("Choose a shorter piece of text, up to 12,000 characters.")
        }
        var url = URLComponents(string: original)
        let scheme = url?.scheme?.lowercased()
        let hasWhitespace = original.contains(where: { $0.isWhitespace })
        if let scheme, !hasWhitespace, scheme != "https", scheme != "http" {
            throw ShareFailure.message("Only text and http(s) web links are supported. File and app links stay out.")
        }
        let link = (scheme == "https" || scheme == "http") && url?.host != nil && !hasWhitespace
        let clean: String
        if link {
            // An explicitly shared link is retained as a link, never fetched. Strip tracking/tokens.
            url?.scheme = scheme; url?.user = nil; url?.password = nil; url?.query = nil; url?.fragment = nil
            guard let canonical = url?.url?.absoluteString else { throw ShareFailure.message("This link could not be read.") }
            clean = canonical
        } else { clean = redact(original) }
        let draft = ShareDraft(id: UUID(), kind: link ? "link" : "text", text: clean, createdAt: ISO8601DateFormatter().string(from: Date()))
        _ = try draft.payloadData()
        return draft
    }

    private static func redact(_ text: String) -> String {
        let rules = [
            (#"[\w.+-]+@[\w-]+(\.[\w-]+)+"#, "[email]"),
            (#"https?://\S+|www\.\S+"#, "[link]"),
            (#"(?:\+?\d[\d\s().-]{6,}\d)"#, "[number]"),
            (#"(^|\s)@[\w.]{2,}"#, "$1[handle]")
        ]
        return rules.reduce(text) { value, rule in
            guard let expression = try? NSRegularExpression(pattern: rule.0, options: [.caseInsensitive]) else { return value }
            return expression.stringByReplacingMatches(in: value, range: NSRange(value.startIndex..., in: value), withTemplate: rule.1)
        }
    }

    // createdAt records receiving the share, never when its narrated event happened.
    func payloadData() throws -> Data {
        guard ["text", "link"].contains(kind), !text.isEmpty, text.utf16.count <= 12_000,
              ISO8601DateFormatter().date(from: createdAt) != nil else {
            throw ShareFailure.message("This saved draft is invalid. Please share it again.")
        }
        if kind == "link" {
            guard let url = URLComponents(string: text), ["http", "https"].contains(url.scheme ?? ""), url.host != nil,
                  url.user == nil, url.password == nil, url.query == nil, url.fragment == nil,
                  !text.contains(where: { $0.isWhitespace }) else { throw ShareFailure.message("This link needs to be reviewed and shared again.") }
        } else if text != Self.redact(text) { throw ShareFailure.message("This draft contains unreviewed contact details. Share it again to prepare a clean draft.") }
        let payload = ShareEnvelope(type: "mirrorville.share", version: 1, kind: kind, text: text, source: "iphone_share", createdAt: createdAt)
        let data = try JSONEncoder().encode(payload)
        guard data.count <= 16_384 else { throw ShareFailure.message("This text is too large for the handoff. Choose a shorter excerpt.") }
        return data
    }

    func deliveryURL() throws -> URL {
        let approvedBases = ["https://itismixian.github.io/cal-hack-proj/", "https://frequent-converter-stockings-place.trycloudflare.com/"]
        guard let configured = Bundle.main.object(forInfoDictionaryKey: "MirrorvilleWebsiteURL") as? String,
              approvedBases.contains(configured),
              var url = URLComponents(string: configured), url.scheme == "https",
              url.port == nil, url.user == nil, url.password == nil, url.query == nil, url.fragment == nil else {
            throw ShareFailure.message("The Mirrorville website configuration is not approved.")
        }
        let encoded = try payloadData().base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
        url.fragment = "mirrorville-share=" + encoded
        guard let result = url.url else { throw ShareFailure.message("Could not prepare the local handoff.") }
        return result
    }
}

private struct ShareEnvelope: Encodable {
    let type: String
    let version: Int
    let kind: String
    let text: String
    let source: String
    let createdAt: String
}
