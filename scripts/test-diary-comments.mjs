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
const { diaryTopics, sessionTopics, sessionSummary } = load('../src/DiaryReview.ts');
const { diarySessions } = load('../src/DiarySessions.ts');
const { diaryCutoff, closeDiary, readDiaryHistory } = load('../src/DiaryHistory.ts');
const world = load('../spacetimedb/src/world.ts');
const base = { id: 1n, mirrorId: 1n, myMirror: 'My mirror', otherName: 'Maya', otherDemo: false,
  place: 'cafe', text: 'I met Maya at the café. We discussed composting coffee grounds and a refill station. The conversation felt relaxed.',
  goodFit: false, fitReason: '', createdAt: { microsSinceUnixEpoch: 1792870200000000n },
  iAmInterested: false, theyAreInterested: false, mutual: false, theirContact: 'PRIVATE_CONTACT' };

function render(entries, mirrorId, history = { all: 0n, mirrors: new Map() }, person = null, peoplePage = 0, visitIndex = 0) {
  const { default: Diary } = load('../src/Diary.tsx', name => {
    if (name === 'react') { let call = 0; return { ...React, useState: initial => [++call === 2 ? person : call === 3 ? peoplePage : call === 4 ? visitIndex : initial, () => {}] }; }
    if (name === './CharacterSprite') return { default: () => null };
    if (name === 'spacetimedb/react') return { useTable: table => [table === 'mirrors' ? [] : entries], useReducer: () => async () => {}, useSpacetimeDB: () => ({ isActive: true }) };
    if (name === './module_bindings') return { tables: { mirror: 'mirrors' }, reducers: {} };
    if (name === './DiaryReview') return { diaryTopics, sessionSummary };
    if (name === './DiarySessions') return { diarySessions };
    if (name === './DiaryHistory') return { diaryCutoff };
    if (name === './useDiaryWindow') return { useDiaryWindow: () => history };
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

test('daily overview shows people ordered by recency, without expanded conversations', () => {
  const html = render([base, { ...base, id: 2n, otherName: 'Alex', createdAt: { microsSinceUnixEpoch: base.createdAt.microsSinceUnixEpoch + 1000000n } }]);
  assert.ok(html.indexOf('Read conversations with Alex') < html.indexOf('Read conversations with Maya'));
  assert.match(html, /2.*people/);
  assert.match(html, /We discussed composting/);
  assert.ok(!html.includes('Time and source'));
  assert.ok(!html.includes('PRIVATE_CONTACT'));
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
    at(10, { text: 'We discussed composting coffee grounds.' })], 1n, undefined, 'Maya');
  assert.equal((html.match(/<article/g) || []).length, 1);
  assert.equal((html.match(/I&#x27;m interested/g) || []).length, 1);
  assert.match(html, /2 exchanges/);
  assert.match(html, /We discussed composting coffee grounds/);
  assert.match(html, /We compared balcony herb planters/);
  assert.equal((html.match(/<time /g) || []).length, 2);
  assert.match(html, /Specific shared project/);
  assert.ok(!html.includes('PRIVATE_CONTACT'));
});

test('midnight starts a separate daily page rather than merging two real dates', () => {
  const midnight = BigInt(Date.parse('2026-10-25T07:00:00Z')) * 1000n;
  const html = render([{ ...base, id: 1n, createdAt: { microsSinceUnixEpoch: midnight - minute } },
    { ...base, id: 2n, createdAt: { microsSinceUnixEpoch: midnight + minute } }]);
  assert.equal((html.match(/diary-encounter"/g) || []).length, 1);
  assert.match(html, /Oct 25, 2026/);
  assert.match(html, /Earlier/);
  assert.match(html, /Earlier/);
});

test('mirror-specific list excludes another mirror while preserving interest and mutual contacts', () => {
  const html = render([base, { ...base, id: 2n, mirrorId: 2n, otherName: 'Hidden resident' },
    { ...base, id: 3n, otherName: 'Mutual friend', iAmInterested: true, theyAreInterested: true, mutual: true, theirContact: '@mutual_friend' }], 1n, undefined, 'Mutual friend');
  assert.ok(!html.includes('Hidden resident'));
  assert.ok(!html.includes('PRIVATE_CONTACT'));
  assert.match(html, /@mutual_friend/);
  assert.ok(!html.includes('I&#x27;m interested'));
  assert.match(html, /You both said yes/);
});

test('empty and filtered-empty diaries show the empty state', () => {
  assert.match(render([]), /A page waiting to be written/);
  assert.match(render([base], 2n), /A page waiting to be written/);
});

test('closing the diary marks old pages read but never removes their content', () => {
  const entries = [at(0, { text: 'We discussed old history.' }), at(40, { text: 'We discussed new topics.' })];
  const history = { all: entries[1].createdAt.microsSinceUnixEpoch, mirrors: new Map() };
  const html = render(entries, undefined, history, 'Maya');
  assert.ok(!html.includes('old history'));
  assert.match(html, /Next conversation/);
  assert.match(html, /new topics/);
  assert.ok(!html.includes('New since your last visit'));
});

test('town diary separates each mirror into its own page and opens an unread one', () => {
  const history = { all: 0n, mirrors: new Map([[1n, base.createdAt.microsSinceUnixEpoch]]) };
  const html = render([base, { ...base, id: 2n, mirrorId: 2n, myMirror: 'Second mirror', otherName: 'Unread friend' }], undefined, history);
  assert.match(html, /Unread friend/);
  assert.ok(!html.includes('I talked with Maya'));
  assert.match(html, /Second mirror/);
});

test('simulation actions and AI decisions are omitted even when they contain topic keywords', () => {
  const text = 'I smiled and nodded. Maya waved goodbye. I walked back to my project. I decided to ask another question. The café was bustling. I thought about my next project. We discussed balcony tomatoes. Then I returned to coding.';
  assert.equal(diaryTopics(text).join('|'), 'We discussed balcony tomatoes.');
  assert.equal(diaryTopics('我们走向咖啡厅。她微笑着点头。我们讨论了阳台番茄的种植。随后我回到座位。').join('|'),
    '我们讨论了阳台番茄的种植。');
});

test('mixed clauses keep speech while dropping scene actions and stage directions', () => {
  assert.equal(diaryTopics('I smiled, and we discussed balcony tomatoes. We compared planters while sipping coffee.').join('|'),
    'we discussed balcony tomatoes.|We compared planters.');
  assert.equal(diaryTopics('I waved and we discussed composting.').join('|'), 'we discussed composting.');
  assert.equal(diaryTopics('[I nod] We discussed gardening.').join('|'), 'We discussed gardening.');
  assert.equal(diaryTopics('我们聊了阳台番茄，随后我挥手道别。').join('|'), '我们聊了阳台番茄。');
  assert.equal(diaryTopics('We discussed tomatoes and then I walked away.').join('|'), 'We discussed tomatoes.');
});

test('actions that are the subject of speech remain available as chat content', () => {
  assert.equal(diaryTopics('We discussed walking routes. Maya said she was coding an accessible map.').join('|'),
    'We discussed walking routes.|Maya said she was coding an accessible map.');
});

test('summaries deduplicate and stay within two sentences, 50 words and 280 characters across merged exchanges', () => {
  assert.equal(sessionSummary(['We discussed composting. We compared planters.', 'We discussed composting! We shared seed varieties.']),
    'We discussed composting. We compared planters.');
  const long = sessionSummary([`We discussed ${'tomato varieties '.repeat(60)}.`]);
  assert.ok(long.length <= 280);
  assert.ok(long.split(/\s+/u).length <= 50);
  assert.ok(long.endsWith('…'));
  const chinese = sessionSummary([`我们讨论了${'阳台种植的番茄品种'.repeat(60)}。`]);
  assert.ok(chinese.length <= 280);
  assert.equal(sessionSummary(['I smiled and nodded.', 'Conversation summary unavailable.']), '');
  assert.equal(sessionSummary(['We exchanged greetings.']), 'We exchanged greetings.');
});

test('Diary displays a compact chat summary instead of scene narration or an unbounded topic list', () => {
  const html = render([at(0, { text: 'We discussed tomatoes. We compared planters. We shared seed varieties.' }),
    at(10, { text: 'I smiled and waved. We discussed composting. We discussed tomatoes.' })], undefined, undefined, 'Maya');
  assert.match(html, /diary-summary/);
  assert.match(html, /We discussed composting\. We discussed tomatoes\./);
  assert.ok(!html.includes('I smiled'));
  assert.ok(!html.includes('We compared planters'));
  assert.ok(!html.includes('diary-topics'));
});

test('overview merges visits, prioritizes interest and limits initial people', () => {
 const html = render([at(0), at(40), ...Array.from({length: 8}, (_, i) => at(i, {otherName: `Person ${i}`, mutual: i === 0, theyAreInterested: i === 1}))]);
 assert.equal((html.match(/diary-encounter"/g) || []).length, 3);
 assert.match(html, /Next people/);
 assert.match(html, /9 people/);
 assert.ok(html.indexOf('Read conversations with Person 0') < html.indexOf('Read conversations with Person 1'));
 assert.ok(!html.includes('Time and source'));
});

test('people page two keeps later residents reachable without expanding a long list', () => {
 const entries = Array.from({length: 7}, (_, i) => at(i, {otherName: `Resident ${i}`}));
 const html = render(entries, undefined, undefined, null, 1);
 assert.equal((html.match(/class="diary-encounter"/g) || []).length, 3);
 assert.match(html, /Read conversations with Resident 3/);
 assert.ok(!html.includes('Read conversations with Resident 6'));
});
test('selected visit changes independently while the people index stays visible', () => {
 const html = render([at(0, {text: 'We discussed old history.'}), at(40, {text: 'We discussed newer ideas.'})], undefined, undefined, 'Maya', 0, 1);
 assert.match(html, /old history/);
 assert.match(html, /Read conversations with Maya/);
 assert.equal((html.match(/<article/g) || []).length, 1);
 assert.match(html, /Conversation 2 \/ 2/);
});

test('interest is visible beside people before opening a conversation', () => {
 const html = render([at(0, {otherName: 'Inbound', theyAreInterested: true}), at(1, {otherName: 'Both', mutual: true, theyAreInterested: true, iAmInterested: true}), at(2, {otherName: 'Quiet'})]);
 assert.equal((html.match(/class="diary-interest-mark/g) || []).length, 2);
 assert.match(html, /Interested in you/);
 assert.match(html, /Mutual interest/);
 assert.ok(!html.includes('PRIVATE_CONTACT'));
 assert.ok(!html.includes('Time and source'));
});
