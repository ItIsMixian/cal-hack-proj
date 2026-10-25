# Mirrorville iPhone share source

This folder is native iOS source, **not an installable app**. The current Windows workspace has no
Xcode/iOS SDK, so it has not been compiled, signed or tested on an iPhone.

The Share extension accepts selected text or one http(s) URL, previews/edits it locally, and saves
only an explicitly reviewed draft to a protected App Group inbox. Open the containing app and tap
**Review in Mirrorville browser** to deliver it to the website's existing import review. Nothing is
automatically imported or deleted. Image-only, photo interpretation and audio are not implemented.

For the no-Mac iPhone Shortcuts alternative, exact setup steps, XcodeGen instructions, protocol and
acceptance checklist, read [`docs/design/iphone-share.md`](../docs/design/iphone-share.md).
