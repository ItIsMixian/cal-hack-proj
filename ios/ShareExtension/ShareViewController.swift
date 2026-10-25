import UIKit
import UniformTypeIdentifiers

final class ShareViewController: UIViewController {
    private let editor = UITextView()
    private let status = UILabel()
    private let save = UIButton(type: .system)
    private var received = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        let title = UILabel(); title.text = "Save to Mirrorville"; title.font = .preferredFont(forTextStyle: .headline)
        let detail = UILabel(); detail.text = "Review this text locally. Save a draft, then open the Mirrorville app to deliver it. No upload happens here."; detail.numberOfLines = 0; detail.font = .preferredFont(forTextStyle: .subheadline)
        editor.font = .preferredFont(forTextStyle: .body); editor.layer.borderColor = UIColor.separator.cgColor; editor.layer.borderWidth = 1; editor.layer.cornerRadius = 8
        editor.isEditable = false
        status.numberOfLines = 0; status.font = .preferredFont(forTextStyle: .footnote)
        save.setTitle("Save reviewed draft", for: .normal); save.isEnabled = false; save.addTarget(self, action: #selector(saveDraft), for: .touchUpInside)
        let cancel = UIButton(type: .system); cancel.setTitle("Cancel", for: .normal); cancel.addTarget(self, action: #selector(cancelShare), for: .touchUpInside)
        let stack = UIStackView(arrangedSubviews: [title, detail, editor, status, save, cancel]); stack.axis = .vertical; stack.spacing = 12; stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20), stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20), stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20), stack.bottomAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -12), editor.heightAnchor.constraint(equalToConstant: 220)])
        preferredContentSize = CGSize(width: 0, height: 480)
        status.text = "Reading the selected text or link…"
        receive()
    }

    private func receive() {
        let items = (extensionContext?.inputItems as? [NSExtensionItem]) ?? []
        let providers = items.flatMap { $0.attachments ?? [] }
        if let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.text.identifier) }) {
            let identifier = provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) ? UTType.plainText.identifier : UTType.text.identifier
            provider.loadItem(forTypeIdentifier: identifier, options: nil) { [weak self] item, _ in
                let data = item as? Data
                let decoded = data.flatMap { $0.count <= 16_384 ? String(data: $0, encoding: .utf8) : nil }
                let text = (item as? String) ?? (item as? NSAttributedString)?.string ?? decoded
                DispatchQueue.main.async { self?.accept(text) }
            }
        } else if let provider = providers.first(where: { $0.hasItemConformingToTypeIdentifier(UTType.url.identifier) }) {
            provider.loadItem(forTypeIdentifier: UTType.url.identifier, options: nil) { [weak self] item, _ in
                let url = item as? URL
                let allowed = url?.scheme == "http" || url?.scheme == "https"
                DispatchQueue.main.async { self?.accept(allowed ? url?.absoluteString : nil) }
            }
        } else if let text = items.first?.attributedContentText?.string, !text.isEmpty {
            accept(text)
        } else { accept(nil) }
        DispatchQueue.main.asyncAfter(deadline: .now() + 8) { [weak self] in
            if let self, !self.received { self.status.text = "This app did not provide readable text or a link. Cancel and try sharing a selected text excerpt." }
        }
    }

    private func accept(_ text: String?) {
        received = true
        guard let text, !text.isEmpty else { status.text = "Share selected text or one web link. Image-only, audio and file attachments are not supported yet."; return }
        do {
            let draft = try ShareDraft.make(text: text)
            editor.text = draft.text; editor.isEditable = true; save.isEnabled = true
            status.text = "Contact details in text are covered. Shared links keep their address but lose query/fragment details. Review the address and remove other people’s information; page contents are not read."
        } catch { status.text = error.localizedDescription }
    }

    @objc private func saveDraft() {
        do {
            let draft = try ShareDraft.make(text: editor.text)
            if draft.text != editor.text.trimmingCharacters(in: .whitespacesAndNewlines) {
                editor.text = draft.text
                status.text = "Contact or link details were covered. Review this exact draft, then tap Save reviewed draft again."
                return
            }
            try DraftInbox().save(draft)
            save.isEnabled = false; editor.isEditable = false
            status.text = "Saved on this iPhone. Open Mirrorville → inbox when ready. This has not been imported into your mirror."
            extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        } catch { status.text = error.localizedDescription }
    }
    @objc private func cancelShare() {
        extensionContext?.cancelRequest(withError: NSError(domain: "MirrorvilleShare", code: NSUserCancelledError))
    }
}
