import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';

function load(path) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  runInNewContext(js, { exports, TextDecoder, Uint8Array,
    require: () => load(new URL('../spacetimedb/src/redact.ts', import.meta.url)) });
  return exports;
}
const { parseWeChatCsv, decodeImportFile, looksLikeWeChatCsv, parseWhatsApp, ownWords } = load(new URL('../src/importers.ts', import.meta.url));
const quote = value => `"${String(value).replaceAll('"', '""')}"`;
const csv = (rows, header = ['id', 'is_sender', 'type_name', 'msg', 'talker']) =>
  '\uFEFF' + [header, ...rows].map(row => row.map(quote).join(',')).join('\r\n');

test('keeps only sender=1 plain text; excludes incoming, quote replies, media, forwards and metadata', () => {
  const result = parseWeChatCsv(csv([
    [1, 0, '文本', 'INCOMING_SECRET', 'contact-secret'],
    [2, 1, '文本', 'I enjoy building things', 'owner-id'],
    [3, 1, '引用回复', 'OTHER_QUOTED_SECRET', 'owner-id'],
    [4, 1, '合并转发的聊天记录', 'FORWARDED_SECRET', 'owner-id'],
    [5, 1, '图片', 'IMAGE_PATH_SECRET', 'owner-id'],
  ]));
  assert.equal(result.text, 'I enjoy building things');
  assert.equal(result.kept, 1); assert.equal(result.dropped, 4); assert.equal(result.total, 5);
  assert.ok(!JSON.stringify(result).includes('SECRET'));
  assert.ok(!JSON.stringify(result).includes('owner-id'));
});
test('BOM, commas, escaped quotes and newlines stay within their message cells', () => {
  assert.equal(parseWeChatCsv(csv([[1, 1, '文本', 'I say "hello", then\nwrite again', 'me']])).text,
    'I say "hello", then\nwrite again');
});
test('redacts outgoing identifiers after filtering', () => {
  const { text } = parseWeChatCsv(csv([[1, 1, '文本', 'Email me@example.test or https://example.test @example 13800138000', 'me']]));
  assert.equal(text, 'Email [email] or [link] [handle] [number]');
});
test('unsupported or malformed CSV never becomes plaintext', () => {
  for (const value of ['name,message\nfriend,secret', 'is_sender,type_name,msg\n1,文本,"unfinished',
    'is_sender,type_name,msg\n1,文本,"hello"oops', 'is_sender,type_name,msg\n1,文本',
    'is_sender,is_sender,type_name,msg\n1,1,文本,hello', 'is_sender,type_name,msg\ntrue,文本,hello']) {
    assert.throws(() => parseWeChatCsv(value));
  }
});
test('empty files reject; files without outgoing text safely produce an empty preview', () => {
  assert.throws(() => parseWeChatCsv(''));
  assert.equal(parseWeChatCsv(csv([[1, 0, '文本', 'incoming', 'other']])).text, '');
});
test('column order is independent and blank rows are ignored', () => {
  assert.equal(parseWeChatCsv('msg,type_name,is_sender\nhello,文本,1\n\n').text, 'hello');
});
test('strict UTF-8 decoding retains Chinese; invalid bytes reject', () => {
  assert.equal(decodeImportFile(new TextEncoder().encode('文本').buffer), '文本');
  assert.throws(() => decodeImportFile(new Uint8Array([0xff, 0xff, 0xff]).buffer));
});
test('CSV header detection also catches exports renamed to txt or pasted', () => {
  assert.equal(looksLikeWeChatCsv('is_sender,type_name,msg\n1,文本,hi'), true);
  assert.equal(looksLikeWeChatCsv('My own thoughts today'), false);
});
test('WhatsApp speaker filtering continues to work', () => {
  const chat = parseWhatsApp('12/31/23, 9:41 PM - Me: My first line\n12/31/23, 9:42 PM - Them: OTHER_SECRET\n12/31/23, 9:43 PM - Me: My last line');
  assert.equal(ownWords(chat, 'Me'), 'My first line\nMy last line');
});

test('file UI combines CSVs, submits only sanitized own text, and blocks a bad replacement', async () => {
  const require = createRequire(import.meta.url);
  const values = []; let cursor = 0; const submitted = [];
  const mockReact = { useState(initial) {
    const slot = cursor++;
    if (!(slot in values)) values[slot] = initial;
    return [values[slot], value => { values[slot] = value; }];
  } };
  const exports = {};
  const source = readFileSync(new URL('../src/MirrorRoom.tsx', import.meta.url), 'utf8') + '\nexport { Importer as TestImporter };';
  const js = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  runInNewContext(js, { exports, TextDecoder, Uint8Array, require(name) {
    if (name === 'react') return mockReact;
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'spacetimedb/react') return { useReducer: () => async payload => submitted.push(payload) };
    if (name === './module_bindings') return { reducers: {} };
    if (name === './importers') return load(new URL('../src/importers.ts', import.meta.url));
    if (name.includes('/redact')) return load(new URL('../spacetimedb/src/redact.ts', import.meta.url));
    return {};
  } });
  const render = () => { cursor = 0; return exports.TestImporter({ mirrorId: 1n, busy: false }); };
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of [node.props?.children].flat(Infinity)) { const found = find(child, predicate); if (found) return found; }
  };
  const file = (name, text) => { const bytes = new TextEncoder().encode(text); return { name, size: bytes.byteLength, arrayBuffer: async () => bytes.buffer }; };
  const choose = async files => {
    find(render(), node => node.type === 'input' && node.props.type === 'file').props.onChange({ currentTarget: { files, value: '' } });
    await new Promise(resolve => setImmediate(resolve));
  };
  await choose([
    file('contact-private.csv', csv([[1, 1, '文本', 'My own thoughts about making useful tools at a hackathon.', 'me'], [2, 0, '文本', 'OTHER_SECRET', 'other']])),
    file('another-private.csv', csv([[3, 1, '文本', 'Contact me@example.test', 'me']])),
  ]);
  const preview = find(render(), node => node.type === 'textarea' && node.props.readOnly);
  assert.equal(preview.props.value, 'My own thoughts about making useful tools at a hackathon.\nContact [email]');
  const submit = () => find(render(), node => node.type === 'button' && node.props.className === 'primary');
  assert.equal(submit().props.disabled, false);
  await submit().props.onClick();
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].text, preview.props.value);
  assert.equal(submitted[0].source, 'WeChat / PyWxDump · friends');
  assert.ok(!JSON.stringify({ ...submitted[0], mirrorId: '1' }).includes('private'));
  await choose([file('valid.csv', csv([[1, 1, '文本', 'This previous import is long enough to submit to the server.', 'me']]))]);
  await choose([file('bad.csv', 'sender,body\nother,SECRET')]);
  assert.equal(submit().props.disabled, true);
  assert.equal(find(render(), node => node.type === 'textarea' && node.props.readOnly), undefined);
});
