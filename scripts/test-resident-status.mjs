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
const { recentConversations } = load('../src/ResidentConversations.ts');
const { conversationTopics } = load('../src/ConversationTopics.ts', name => name === 'compromise/two' ? { default: require(name) } : require(name));
const now = 1792870200000000n, minute = 60n * 1000000n, day = 24n * 60n * minute;
const chat = (id, a = 1n, b = 2n, at = now, active = false) => ({ id, a, b, place: 'food', turns: 2, maxTurns: 4, active, startedAt: { microsSinceUnixEpoch: at } });
const line = (id, conversationId, speaker, text, at = now) => ({ id, conversationId, speaker, text, at: { microsSinceUnixEpoch: at } });
const mirror = (id, name, extra = {}) => ({ id, name, look: 0, place: 'food', activity: 'eating noodles', intent: '', conversationId: 0n,
  lastChatAt: { microsSinceUnixEpoch: now - minute }, ...extra });

test('history includes only this resident and the owner mirrors, using IDs instead of display names', () => {
  const rows = [chat(1n), chat(2n, 2n, 3n), chat(3n, 1n, 3n), chat(4n, 4n, 2n)];
  assert.equal(recentConversations(2n, new Set([1n, 4n]), rows, [], now).map(c => c.conversation.id).join(','), '4,1');
  assert.equal(recentConversations(2n, new Set(), rows, [], now).length, 0);
  assert.equal(recentConversations(1n, new Set([1n]), rows, [], now).length, 2);
});

test('recent window uses message activity, sorts by time and caps the list at five without mutating inputs', () => {
  const rows = Array.from({ length: 8 }, (_, i) => chat(BigInt(i + 1), 1n, 2n, now - BigInt(i) * minute));
  const before = rows.map(c => c.id).join(',');
  const result = recentConversations(2n, new Set([1n]), rows, [], now);
  assert.equal(result.length, 5);
  assert.equal(result.map(c => c.conversation.id).join(','), '1,2,3,4,5');
  assert.equal(rows.map(c => c.id).join(','), before);
  assert.equal(recentConversations(2n, new Set([1n]), [chat(9n, 1n, 2n, now - 8n * day)], [], now).length, 0);
  assert.equal(recentConversations(2n, new Set([1n]), [chat(9n, 1n, 2n, now - 7n * day)], [], now).length, 1);
  assert.equal(recentConversations(2n, new Set([1n]), [chat(9n, 1n, 2n, now - 8n * day)], [line(1n, 9n, 2n, 'A current update.')], now).length, 1);
});

test('topic tags use both eligible speakers, excluding greetings, end markers and unrelated speakers', () => {
  const rows = [line(1n, 1n, 1n, 'Hi! We discussed a garden with raised beds.', now - 3n * minute),
    line(2n, 1n, 2n, 'I grow tomatoes on my balcony.', now - 2n * minute),
    line(3n, 1n, 1n, 'We discussed a garden with raised beds!', now - minute),
    line(4n, 1n, 2n, 'I also use a small compost bin. [END]'),
    line(5n, 1n, 99n, 'UNRELATED_SPEAKER')];
  const [result] = recentConversations(2n, new Set([1n]), [chat(1n)], rows, now);
  const topics = conversationTopics([result]);
  assert.ok(topics.some(topic => topic.label === 'garden'));
  assert.ok(topics.some(topic => topic.label === 'compost'));
  assert.ok(!topics.some(topic => /^(hi|hello|end|unrelated_speaker)$/i.test(topic.label)));
  assert.ok(topics.every(topic => [...topic.lineIds].every(id => id !== 5n)));
  assert.ok(!result.messages.some(m => m.speaker === 99n));
});

test('greetings and missing messages remain distinct honest empty-summary states', () => {
  const [greeting] = recentConversations(2n, new Set([1n]), [chat(1n)], [line(1n, 1n, 1n, 'Hello!'), line(2n, 1n, 2n, '你好！')], now);
  assert.equal(greeting.messages.length, 2); assert.equal(conversationTopics([greeting]).length, 0);
  const [empty] = recentConversations(2n, new Set([1n]), [chat(1n)], [], now);
  assert.equal(empty.messages.length, 0);
});

const world = load('../spacetimedb/src/world.ts');
const buildings = load('../src/TownBuildings.ts', () => world);
const avatar = load('../src/CharacterAvatar.tsx', name => name.includes('/world') ? world : name === './CharacterSprite'
  ? { default: () => React.createElement('span', { 'data-testid': 'character-sprite' }) } : require(name));
const { default: ResidentStatusCard } = load('../src/ResidentStatusCard.tsx', name => {
  if (name === './ResidentConversations') return { recentConversations };
  if (name === './ConversationTopics') return { conversationTopics };
  if (name === './TownBuildings') return buildings;
  if (name === './CharacterAvatar') return avatar;
  if (name.includes('/world')) return world;
  if (name.endsWith('.css')) return {};
  return require(name);
});
const render = overrides => renderToStaticMarkup(React.createElement(ResidentStatusCard, {
  mirror: mirror(2n, 'Maya', { conversationId: 1n, selfCard: 'PRIVATE_PROFILE', contact: 'PRIVATE_CONTACT' }),
  mirrors: [mirror(1n, 'Your mirror'), mirror(2n, 'Maya'), mirror(3n, 'Maya')], mine: new Set([1n]),
  conversations: [chat(1n, 1n, 2n, now, true), chat(2n, 2n, 3n)],
  lines: [line(1n, 1n, 1n, 'We discussed refill stations.'), line(2n, 1n, 2n, 'I can explain the compost bins.'), line(3n, 2n, 3n, 'UNRELATED_HISTORY')],
  isLive: true, now, ...overrides,
}));

test('status card shows name, activity, authored venue and topic choices without unrelated/private fields', () => {
  const html = render();
  assert.match(html, /Maya/); assert.match(html, /Talking with Your mirror/); assert.match(html, /Restaurant/);
  assert.match(html, /stations/); assert.match(html, /compost/); assert.match(html, /View all exchanges/);
  assert.ok(!html.includes('UNRELATED_HISTORY'));
  assert.ok(!html.includes('PRIVATE_PROFILE')); assert.ok(!html.includes('PRIVATE_CONTACT'));
});

test('guest/no-owner and reconnecting cards do not substitute public histories', () => {
  const html = render({ mine: new Set(), isLive: false });
  assert.match(html, /Last known status/); assert.match(html, /No recent conversations between your mirrors and Maya/);
  assert.ok(!html.includes('refill stations')); assert.ok(!html.includes('UNRELATED_HISTORY'));
});

test('transcript content is escaped as text and owner room entry remains optional', () => {
  let selection = null;
  const { default: InteractiveCard } = load('../src/ResidentStatusCard.tsx', name => {
    if (name === 'react') return { useMemo: fn => fn(), useId: () => 'topic-results', useState: () => [selection, value => { selection = value; }] };
    if (name === './ResidentConversations') return { recentConversations };
    if (name === './ConversationTopics') return { conversationTopics };
    if (name === './TownBuildings') return buildings;
    if (name === './CharacterAvatar') return avatar;
    if (name.includes('/world')) return world;
    if (name.endsWith('.css')) return {};
    return require(name);
  });
  const props = { mirror: mirror(2n, 'Maya'), mirrors: [mirror(1n, 'Mine'), mirror(2n, 'Maya')], mine: new Set([1n]), conversations: [chat(1n)],
    lines: [line(1n, 1n, 1n, '<script>UNTRUSTED</script>')], isLive: true, now, onOpenRoom() {} };
  const find = node => {
    if (!node || typeof node !== 'object') return null;
    if (node.type === 'button' && node.props.children === 'View all exchanges') return node;
    for (const child of [node.props?.children].flat(Infinity)) { const result = find(child); if (result) return result; }
    return null;
  };
  find(InteractiveCard(props)).props.onClick();
  const html = renderToStaticMarkup(InteractiveCard(props));
  assert.ok(!html.includes('<script>')); assert.match(html, /&lt;script&gt;/);
  assert.match(html, /Open Mirror Room/); assert.ok(!render().includes('Open Mirror Room'));
});
