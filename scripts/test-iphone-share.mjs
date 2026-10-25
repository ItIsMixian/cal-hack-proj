// Cross-platform manifest/privacy checks and JS receiver fixtures; never compile/execute Swift/iOS.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function plists() {
  const script = 'import json,plistlib,sys; print(json.dumps([plistlib.load(open(p,"rb")) for p in sys.argv[1:]]))';
  const paths = ['ios/Config/App-Info.plist', 'ios/Config/Share-Info.plist', 'ios/Config/Shared.entitlements'].map(path => fileURLToPath(new URL(`../${path}`, import.meta.url)));
  const result = spawnSync('python', ['-c', script, ...paths], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test('native manifests parse and share one configurable App Group without photo/audio activation', () => {
  const [app, share, entitlement] = plists();
  assert.equal(app.MirrorvilleAppGroup, share.MirrorvilleAppGroup);
  assert.deepEqual(entitlement['com.apple.security.application-groups'], [app.MirrorvilleAppGroup]);
  assert.equal(share.NSExtension.NSExtensionPointIdentifier, 'com.apple.share-services');
  assert.equal(share.NSExtension.NSExtensionPrincipalClass, '$(PRODUCT_MODULE_NAME).ShareViewController');
  const activation = share.NSExtension.NSExtensionAttributes.NSExtensionActivationRule;
  assert.deepEqual(Object.keys(activation).sort(), ['NSExtensionActivationSupportsText', 'NSExtensionActivationSupportsWebURLWithMaxCount']);
  assert.equal(activation.NSExtensionActivationSupportsWebURLWithMaxCount, 1);
  const project = read('ios/project.yml');
  assert.ok(project.includes('APPLICATION_EXTENSION_API_ONLY: YES'));
  assert.ok(project.includes('target: MirrorvilleShare'));
  assert.equal((project.match(/CODE_SIGN_ENTITLEMENTS: Config\/Shared.entitlements/g) ?? []).length, 2);
});

test('extension source has no networking, unsafe containing-app launch, provider-file copy or automatic save', () => {
  const extension = read('ios/ShareExtension/ShareViewController.swift');
  const shared = read('ios/Shared/ShareDraft.swift') + read('ios/Shared/DraftInbox.swift');
  for (const forbidden of ['UIApplication.shared', 'URLSession', 'performSelector', 'loadFileRepresentation', 'loadInPlaceFileRepresentation', 'UIPasteboard']) {
    assert.ok(!extension.includes(forbidden), forbidden);
    assert.ok(!shared.includes(forbidden), forbidden);
  }
  assert.equal((extension.match(/DraftInbox\(\)\.save\(draft\)/g) ?? []).length, 1);
  assert.ok(extension.indexOf('private func saveDraft()') < extension.indexOf('DraftInbox().save(draft)'));
  assert.ok(extension.includes('if draft.text != editor.text.trimmingCharacters'));
  assert.ok(extension.includes('completeRequest(returningItems: []'));
});

test('inbox protection and explicit deletion are configured without a fallback unshared store', () => {
  const inbox = read('ios/Shared/DraftInbox.swift');
  assert.ok(inbox.includes('containerURL(forSecurityApplicationGroupIdentifier: group)'));
  assert.ok(inbox.includes('.protectionKey: FileProtectionType.complete'));
  assert.ok(inbox.includes('[.atomic, .completeFileProtection]'));
  assert.ok(inbox.includes('isExcludedFromBackup = true'));
  assert.ok(!inbox.includes('UserDefaults'));
  const app = read('ios/App/InboxView.swift');
  assert.ok(app.includes('openURL(url)'));
  assert.ok(app.includes('.alert("Delete this local draft?"'));
  assert.ok(app.includes('keep draft until the owner explicitly deletes it'));
});

test('native handoff uses approved HTTPS base and URL fragment; setup docs expose platform limits', () => {
  const [app] = plists();
  const model = read('ios/Shared/ShareDraft.swift');
  assert.ok(model.includes(`"${app.MirrorvilleWebsiteURL}"`));
  assert.ok(model.includes('approvedBases.contains(configured)'));
  assert.ok(model.includes('url.fragment = "mirrorville-share=" + encoded'));
  assert.ok(model.includes('data.count <= 16_384'));
  assert.ok(model.includes('text.utf16.count <= 12_000'));
  const guide = read('docs/design/iphone-share.md');
  assert.ok(guide.includes('not compile or execute Swift'));
  assert.ok(guide.includes('No signed `.shortcut` artifact'));
  assert.ok(guide.includes('#mirrorville-text='));
  assert.ok(guide.includes('Get Contents of URL'));
});

test('native-protocol fixtures are accepted by actual website parser without receipt-date promotion or link fetch', () => {
  function load(path) {
    const exports = {};
    const source = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    runInNewContext(source, { exports, URL, TextEncoder, TextDecoder, atob, require: () => load('spacetimedb/src/redact.ts') });
    return exports;
  }
  const receiver = load('src/mobileShare.ts');
  const fixture = { type: 'mirrorville.share', version: 1, kind: 'text', text: '我这周终于跑通了机械臂抓取，想把这个小进展分享给朋友。', source: 'iphone_share', createdAt: '2026-10-25T12:00:00Z' };
  const fragment = '#mirrorville-share=' + Buffer.from(JSON.stringify(fixture), 'utf8').toString('base64url');
  const draft = receiver.parseMobileShareFragment(fragment, Date.parse(fixture.createdAt));
  assert.equal(draft.text, fixture.text);
  assert.equal(draft.source, 'iphone_share');
  assert.equal(draft.latestAt, undefined);
  const link = { ...fixture, kind: 'link', text: 'https://example.com/research' };
  const reference = receiver.parseMobileShareFragment('#mirrorville-share=' + Buffer.from(JSON.stringify(link)).toString('base64url'), Date.parse(fixture.createdAt));
  assert.equal(reference.kind, 'link');
  assert.equal(reference.linkHost, 'example.com');
  assert.equal(reference.text, '[link]');
  const simple = receiver.parseMobileShareFragment('#mirrorville-text=' + encodeURIComponent(fixture.text), Date.parse(fixture.createdAt));
  assert.equal(simple.text, fixture.text);
});
