import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(path, imports = require) {
  const exports = {};
  runInNewContext(ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require: imports });
  return exports;
}
const { diaryTopics, sessionTopics } = load('../src/DiaryReview.ts');
const { diarySessions } = load('../src/DiarySessions.ts');
const world = load('../spacetimedb/src/world.ts');
const base = { id: 1n, mirrorId: 1n, myMirror: 'My mirror', otherName: 'Maya', otherDemo: false,
  place: 'cafe', text: 'I met Maya at the café. We discussed composting coffee grounds and a refill station. The conversation felt relaxed.',
  goodFit: false, fitReason: '', createdAt: { microsSinceUnixEpoch: 1792870200000000n },
  iAmInterested: false, theyAreInterested: false, mutual: false, theirContact: 'PRIVATE_CONTACT' };

function render(entries, mirrorId) {
  const { default: Diary } = load('../src/Diary.tsx', name => {
    if (name === 'spacetimedb/react') return { useTable: () => [entries], useReducer: () => async () => {}, useSpacetimeDB: () => ({ isActive: true }) };
    if (name === './module_bindings') return { tables: {}, reducers: {} };
    if (name === './DiaryReview') return { sessionTopics };
    if (name === './DiarySessions') return { diarySessions };
    if (name.includes('/world')) return world;
    if (name.endsWith('.css')) return {};
    return require(name);
  });
  return renderToStaticMarkup(React.createElement(Diary, { mirrorId }));
}

test('legacy topics are retained instead of the opening or generic closing impression, including Chinese', () => {
  assert.equal(diaryTopics(base.text).join('|'), 'We discussed composting coffee grounds and a refill station.');
  assert.equal(diaryTopics('我在咖啡厅遇到了小林。我们讨论了社区花园和堆肥桶。她提到阳台上种的番茄。聊得很轻松。').join('|'),
    '我们讨论了社区花园和堆肥桶。|她提到阳台上种的番茄。');
});

test('legacy model-failure, empty and appraisal-only notes do not invent topics', () => {
  assert.equal(diaryTopics("I was working on my project at the Park, where I talked with Bob. I couldn't put together a fuller diary this time.").length, 0);
  assert.equal(diaryTopics('  ').length, 0);
  assert.equal(diaryTopics('She seemed friendly. I enjoyed the conversation.').length, 0);
});

test('concrete details survive without a conversation keyword, while merged repeats deduplicate', () => {
  assert.equal(diaryTopics('We discussed gardening. Maya grows tomatoes on her balcony.').join('|'),
    'We discussed gardening.|Maya grows tomatoes on her balcony.');
  assert.equal(sessionTopics(['We discussed composting.', 'We discussed composting! We compared refill station designs.']).join('|'),
    'We discussed composting.|We compared refill station designs.');
  assert.equal(diaryTopics('We were talking about balcony herbs. I found a book on small-space gardening.').join('|'),
    'We were talking about balcony herbs.|I found a book on small-space gardening.');
});

test('missing content is shown honestly instead of displaying a fabricated topic', () => {
  const html = render([{ ...base, text: 'She seemed friendly.' }]);
  assert.match(html, /Specific conversation topics weren&#x27;t recorded/);
  assert.ok(!html.includes('She seemed friendly.'));
});

test('person groups show all conversations, newest person first, with dates and venue', () => {
  const html = render([base, { ...base, id: 2n, otherName: 'Alex', createdAt: { microsSinceUnixEpoch: base.createdAt.microsSinceUnixEpoch + 1000000n } },
    { ...base, id: 3n, createdAt: { microsSinceUnixEpoch: base.createdAt.microsSinceUnixEpoch - 1000000n } }]);
  assert.equal((html.match(/<article/g) || []).length, 2);
  assert.ok(html.indexOf('Alex:') < html.indexOf('Maya:'));
  assert.match(html, /Oct 24, 2026/);
  assert.match(html, /Café/);
  assert.match(html, /<ul class="diary-topics"><li>We discussed/);
  assert.ok(!html.includes('I met Maya at the café.'));
  assert.ok(!html.includes('PRIVATE_CONTACT'));
});

test('repeat meetings stay under one name, ordered newest first within the group', () => {
  const html = render([
    { ...base, id: 1n, place: 'park', text: 'The older Maya exchange.' },
    { ...base, id: 2n, otherName: 'Alex', text: 'The Alex exchange.', createdAt: { microsSinceUnixEpoch: base.createdAt.microsSinceUnixEpoch + 1000000n } },
    { ...base, id: 3n, text: 'The latest Maya exchange.', createdAt: { microsSinceUnixEpoch: base.createdAt.microsSinceUnixEpoch + 2000000n } },
  ]);
  assert.equal((html.match(/<h3>Maya:<\/h3>/g) || []).length, 1);
  assert.equal((html.match(/class="diary-person"/g) || []).length, 2);
  assert.ok(html.indexOf('Maya:') < html.indexOf('Alex:'));
  assert.ok(html.indexOf('The latest Maya exchange.') < html.indexOf('The older Maya exchange.'));
  assert.ok(html.indexOf('The older Maya exchange.') < html.indexOf('Alex:'));
  assert.match(html, /2 people.*3 comments/);
});

const minute = 60n * 1_000_000n;
const at = (minutes, props = {}) => ({ ...base, id: BigInt(minutes + 1), ...props,
  createdAt: { microsSinceUnixEpoch: base.createdAt.microsSinceUnixEpoch + BigInt(minutes) * minute } });

test('same-place exchanges merge within 30 minutes, with a bounded total span', () => {
  assert.equal(diarySessions([at(0), at(30)]).length, 1);
  assert.equal(diarySessions([at(0), at(31)]).length, 2);
  const input = [at(0), at(20), at(40)];
  const sessions = diarySessions(input);
  assert.equal(sessions.length, 2);
  assert.equal(sessions[0].entries.map(entry => String(entry.id)).join(','), '41,21');
  assert.equal(input[0].id, 1n);
});

test('venue changes, other people and own mirrors keep independent visits', () => {
  assert.equal(diarySessions([at(0), at(5, { place: 'park' }), at(10)]).length, 3);
  assert.equal(diarySessions([at(0), at(5, { mirrorId: 2n }), at(10)]).length, 2);
  assert.equal(diarySessions([at(0), at(5, { otherName: 'Alex' }), at(10)]).length, 2);
});

test('merged comment retains distinct topics from all exchanges, range and one interest action with fit evidence', () => {
  const html = render([at(0, { text: 'We compared balcony herb planters.', goodFit: true, fitReason: 'Specific shared project.' }),
    at(10, { text: 'We discussed composting coffee grounds.' })], 1n);
  assert.equal((html.match(/<article/g) || []).length, 1);
  assert.equal((html.match(/I&#x27;m interested/g) || []).length, 1);
  assert.match(html, /1 comment/);
  assert.match(html, /2 exchanges/);
  assert.match(html, /We discussed composting coffee grounds/);
  assert.match(html, /We compared balcony herb planters/);
  assert.equal((html.match(/<time /g) || []).length, 2);
  assert.match(html, /Specific shared project/);
  assert.ok(!html.includes('PRIVATE_CONTACT'));
});

test('a close visit across midnight preserves both dates in its range', () => {
  const midnight = BigInt(Date.parse('2026-10-25T07:00:00Z')) * 1000n;
  const html = render([{ ...base, id: 1n, createdAt: { microsSinceUnixEpoch: midnight - minute } },
    { ...base, id: 2n, createdAt: { microsSinceUnixEpoch: midnight + minute } }]);
  assert.equal((html.match(/<article/g) || []).length, 1);
  assert.match(html, /Oct 24, 2026/);
  assert.match(html, /Oct 25, 2026/);
});

test('mirror-specific list excludes another mirror while preserving interest and mutual contacts', () => {
  const html = render([base, { ...base, id: 2n, mirrorId: 2n, otherName: 'Hidden resident' },
    { ...base, id: 3n, otherName: 'Mutual friend', iAmInterested: true, theyAreInterested: true, mutual: true, theirContact: '@mutual_friend' }], 1n);
  assert.ok(!html.includes('Hidden resident'));
  assert.ok(!html.includes('PRIVATE_CONTACT'));
  assert.match(html, /@mutual_friend/);
  assert.match(html, /I&#x27;m interested/);
  assert.match(html, /You both said yes/);
});

test('empty and filtered-empty diaries show the empty state', () => {
  assert.match(render([]), /No conversations yet/);
  assert.match(render([base], 2n), /No conversations yet/);
});
