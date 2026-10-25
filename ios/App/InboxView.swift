import SwiftUI

struct InboxView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.openURL) private var openURL
    @State private var drafts: [ShareDraft] = []
    @State private var error: String?
    @State private var delivery: Delivery?
    @State private var deletion: ShareDraft?
    private let inbox = DraftInbox()
    private struct Delivery: Identifiable { let id = UUID(); let url: URL }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Text("From another app, select text or a link, tap Share, then Save to Mirrorville. Open this inbox when you are ready to review it with your mirror.")
                    Text("Saved drafts stay on this device. Opening a draft prepares a website review; it does not import it automatically.").font(.footnote).foregroundColor(.secondary)
                }
                if drafts.isEmpty { Text("No saved drafts yet.").foregroundColor(.secondary) }
                ForEach(drafts) { draft in
                    Section {
                        Text(draft.kind == "link" ? "Shared link · contents not fetched" : "Shared text · authorship not assumed").font(.caption).foregroundColor(.secondary)
                        Text(draft.text).lineLimit(8).textSelection(.enabled)
                        Text("Received \(draft.createdAt)").font(.caption).foregroundColor(.secondary)
                        Button("Review in Mirrorville browser") { prepare(draft, external: true) }
                        Button("Preview in app instead") { prepare(draft, external: false) }
                        Text("Use the browser for your existing sign-in and email magic links. The in-app preview has a separate login session.").font(.caption).foregroundColor(.secondary)
                        Button("Delete local draft", role: .destructive) { deletion = draft }
                    }
                }
                if let error { Section { Text(error).foregroundColor(.red) } }
            }
            .navigationTitle("Mirrorville inbox")
            .toolbar { Button("Refresh") { refresh() } }
            .onAppear { refresh() }
            .onChange(of: scenePhase) { phase in if phase == .active { refresh() } }
            .sheet(item: $delivery) { value in
                NavigationStack {
                    MirrorvilleWebView(url: value.url)
                        .navigationTitle("Review with your mirror").navigationBarTitleDisplayMode(.inline)
                        .toolbar { Button("Done") { delivery = nil } }
                }
            }
            .alert("Delete this local draft?", isPresented: Binding(get: { deletion != nil }, set: { if !$0 { deletion = nil } })) {
                Button("Cancel", role: .cancel) { deletion = nil }
                Button("Delete", role: .destructive) {
                    if let draft = deletion { do { try inbox.remove(draft); refresh() } catch { self.error = error.localizedDescription } }
                    deletion = nil
                }
            } message: { Text("Deleting here does not remove information already imported into Mirrorville.") }
        }
    }

    private func refresh() { do { drafts = try inbox.drafts(); error = nil } catch { self.error = error.localizedDescription } }
    private func prepare(_ draft: ShareDraft, external: Bool) {
        do {
            let url = try draft.deliveryURL()
            if external { openURL(url) { accepted in if !accepted { error = "The browser could not open Mirrorville. Your local draft is still here." } } }
            else { delivery = Delivery(url: url) }
            // No completion handshake exists: keep draft until the owner explicitly deletes it.
        } catch { self.error = error.localizedDescription }
    }
}
