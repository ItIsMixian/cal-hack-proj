import { useId, useMemo, useState } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { BUILDING_PINS } from './TownBuildings';
import { findLandmark } from '../spacetimedb/src/world';
import { recentConversations } from './ResidentConversations';
import { conversationTopics } from './ConversationTopics';
import type { ConversationStorage as Conversation, LineStorage as Line, MirrorStorage as Mirror } from './module_bindings/types';
import './resident-status-card.css';

const format = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short' });
const date = (micros: bigint) => new Date(Number(micros / 1000n));
const venue = (place: string) => BUILDING_PINS[place]?.label ?? findLandmark(place).label;

export default function ResidentStatusCard({ mirror, mirrors, mine, conversations, lines, isLive, onOpenRoom, now = BigInt(Date.now()) * 1000n }: {
  mirror: Mirror; mirrors: readonly Mirror[]; mine: ReadonlySet<bigint>; conversations: readonly Conversation[]; lines: readonly Line[];
  isLive: boolean; onOpenRoom?: () => void; now?: bigint;
}) {
  const byId = new Map(mirrors.map(m => [m.id, m]));
  const name = (id: bigint) => byId.get(id)?.name ?? 'Another mirror';
  const active = conversations.find(c => c.id === mirror.conversationId && c.active && (c.a === mirror.id || c.b === mirror.id));
  const partner = active ? name(active.a === mirror.id ? active.b : active.a) : null;
  const recencyMinute = now / 60_000_000n;
  const recent = useMemo(() => recentConversations(mirror.id, mine, conversations, lines, recencyMinute * 60_000_000n),
    [mirror.id, mine, conversations, lines, recencyMinute]);
  const topics = useMemo(() => conversationTopics(recent), [recent]);
  const [selected, setSelected] = useState<string | null>(null);
  const topic = topics.find(item => item.key === selected);
  const shown = selected === '*' ? recent : topic ? recent.filter(item => topic.conversationIds.has(item.conversation.id)) : [];
  const resultsId = useId();
  return <div className="resident-status-card">
    <div className="resident-card-identity"><CharacterAvatar look={mirror.look} name={mirror.name} />
      <div><h3>{mirror.name}</h3><span className="resident-card-connection">{isLive ? 'Live status' : 'Last known status'}</span></div>
    </div>
    <section className="resident-current-status" aria-label="Current status">
      <h3>Current status</h3>
      <p className="resident-activity">{partner ? `Talking with ${partner}` : mirror.conversationId !== 0n ? 'Talking' : mirror.activity || 'Spending time in town'}</p>
      <p className="resident-place">{venue(mirror.place)}{partner && mirror.activity ? ` · ${mirror.activity}` : ''}</p>
      {mirror.lastChatAt.microsSinceUnixEpoch > 0n && <p className="resident-last-chat">Last completed chat: <time dateTime={date(mirror.lastChatAt.microsSinceUnixEpoch).toISOString()}>{format.format(date(mirror.lastChatAt.microsSinceUnixEpoch))}</time></p>}
    </section>
    {mirror.intent && <p className="resident-intent"><strong>Today:</strong> {mirror.intent}</p>}
    {onOpenRoom && <button onClick={onOpenRoom}>Open Mirror Room</button>}
    <section className="resident-chat-history" aria-label="Your recent conversations">
      <h3>{mine.has(mirror.id) ? 'Recent conversations' : 'Your recent conversations'}</h3>
      <p className="resident-history-scope">Past 7 days · Up to 5 exchanges</p>
      {!recent.length && <p className="resident-history-empty">{mine.has(mirror.id) ? 'No recent conversations have been recorded for this mirror.'
        : `No recent conversations between your mirrors and ${mirror.name} have been recorded yet.`}</p>}
      {recent.length > 0 && <>
        <p className="resident-topic-hint">Choose a topic to read your exchanges.</p>
        <div className="resident-topic-tags" role="group" aria-label="Conversation topics">{topics.map(item => <button type="button" key={item.key}
          aria-pressed={selected === item.key} aria-controls={resultsId} onClick={() => setSelected(selected === item.key ? null : item.key)}>
          {item.label}{item.conversationIds.size > 1 && <span aria-label={`${item.conversationIds.size} exchanges`}>{item.conversationIds.size}</span>}
        </button>)}</div>
        {!topics.length && <p className="resident-history-empty">No topic tags identified yet. You can still read your exchanges.</p>}
        <button type="button" className="resident-view-all" aria-pressed={selected === '*'} aria-controls={resultsId}
          onClick={() => setSelected(selected === '*' ? null : '*')}>View all exchanges</button>
      </>}
      <div id={resultsId} className="resident-topic-results">
      {shown.length > 0 && <h4>{topic ? `${topic.label} · ${shown.length} ${shown.length === 1 ? 'exchange' : 'exchanges'}` : 'All recent exchanges'}</h4>}
      <ol className="resident-conversation-list">{shown.map(({ conversation: c, messages, at }) => <li key={String(c.id)}>
        <article className="resident-conversation" aria-label={`Conversation with ${name(c.a === mirror.id ? c.b : c.a)}`}>
          <div className="resident-conversation-heading"><strong>{name(c.a)} &amp; {name(c.b)}</strong>{c.active && <span>Talking now</span>}</div>
          <p className="resident-conversation-meta"><time dateTime={date(at).toISOString()}>{format.format(date(at))}</time> · {venue(c.place)}</p>
          {!messages.length && <p className="resident-history-empty">No messages have been recorded for this exchange yet.</p>}
          <div className="town-transcript">{messages.map(line => <p key={String(line.id)} className={topic?.lineIds.has(line.id) ? 'resident-topic-match' : undefined}>
            <strong>{name(line.speaker)}:</strong> {line.text.replace(/\[END\]/gu, '').trim()}</p>)}</div>
        </article>
      </li>)}</ol>
      </div>
    </section>
  </div>;
}
