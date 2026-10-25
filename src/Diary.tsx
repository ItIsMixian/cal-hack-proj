import { useState } from 'react';
import { useReducer, useSpacetimeDB, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { DiaryItem } from './module_bindings/types';
import { findLandmark } from '../spacetimedb/src/world';
import { sessionSummary } from './DiaryReview';
import { diarySessions, type DiarySession } from './DiarySessions';
import { diaryCutoff } from './DiaryHistory';
import { useDiaryWindow } from './useDiaryWindow';
import './diary.css';

const dateFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium' });
const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' });
const dateOf = (entry: DiaryItem) => new Date(Number(entry.createdAt.microsSinceUnixEpoch / 1000n));

export default function Diary({ mirrorId, historyScope = '' }: { mirrorId?: bigint; historyScope?: string } = {}) {
  const [entries] = useTable(tables.myDiary);
  const { identity } = useSpacetimeDB();
  const history = useDiaryWindow(identity ? identity.toHexString() + historyScope : undefined, mirrorId);
  const sorted = [...entries].filter(entry => (mirrorId === undefined || entry.mirrorId === mirrorId)
    && entry.createdAt.microsSinceUnixEpoch > diaryCutoff(history, entry.mirrorId)).sort((a, b) => a.createdAt.microsSinceUnixEpoch > b.createdAt.microsSinceUnixEpoch ? -1
    : a.createdAt.microsSinceUnixEpoch < b.createdAt.microsSinceUnixEpoch ? 1 : 0);
  const notesByPerson = new Map<string, DiaryItem[]>();
  for (const entry of sorted) {
    const notes = notesByPerson.get(entry.otherName);
    if (notes) notes.push(entry);
    else notesByPerson.set(entry.otherName, [entry]);
  }
  const people = [...notesByPerson].map(([name, notes]) => ({ name, sessions: diarySessions(notes) }));
  const commentCount = people.reduce((count, person) => count + person.sessions.length, 0);
  if (!sorted.length) return <div className="diary-comments diary-empty">
    <h3>No new conversations</h3>
    <p>New conversation summaries will appear here after you last closed your diary.</p>
  </div>;
  return <div className="diary-comments">
    <div className="diary-comments-heading"><h3>Since your last visit</h3><span>{people.length} {people.length === 1 ? 'person' : 'people'} · {commentCount} {commentCount === 1 ? 'comment' : 'comments'}</span></div>
    <ol className="diary-person-list" aria-label="People, latest conversation first">
      {people.map(({ name, sessions }) => <li key={name}>
        <section className="diary-person" aria-label={`Conversations with ${name}`}>
          <div className="diary-person-heading"><h3>{name}:</h3><span>{sessions.length} {sessions.length === 1 ? 'comment' : 'comments'}</span></div>
          <ol className="diary-comment-list" aria-label={`${name}'s comments, newest first`}>
            {sessions.map(session => <li key={String(session.entries[session.entries.length - 1].id)}><DiaryEntry session={session} showMirror={mirrorId === undefined} /></li>)}
          </ol>
        </section>
      </li>)}
    </ol>
  </div>;
}

function DiaryEntry({ session, showMirror }: { session: DiarySession; showMirror: boolean }) {
  const e = session.entries[0];
  const oldest = session.entries[session.entries.length - 1];
  const start = dateOf(oldest), end = dateOf(e);
  const hasRange = oldest.createdAt.microsSinceUnixEpoch !== e.createdAt.microsSinceUnixEpoch;
  const fit = session.entries.find(entry => entry.goodFit);
  const summary = sessionSummary(session.entries.map(entry => entry.text));
  const showInterest = useReducer(reducers.showInterest);
  const { isActive } = useSpacetimeDB();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setBusy(true);
    setError('');
    try { await showInterest({ diaryEntryId: e.id }); }
    catch { setError('Could not save your interest. Try again whenever you like.'); }
    finally { setBusy(false); }
  };
  return <article className="diary-entry diary-comment" aria-label={`Conversation with ${e.otherName}`}>
    {fit && <span className="tag gold">good fit</span>}
    {summary ? <p className="diary-summary">{summary}</p>
      : <p className="diary-missing-topics">Specific conversation topics weren't recorded for this exchange.</p>}
    <p className="diary-comment-meta"><time dateTime={start.toISOString()}>{dateFormat.format(start)} · {timeFormat.format(start)}</time>
      {hasRange && <> – <time dateTime={end.toISOString()}>{dateFormat.format(start) !== dateFormat.format(end) ? `${dateFormat.format(end)} · ` : ''}{timeFormat.format(end)}</time></>}
      <span aria-hidden="true"> · </span><span>{findLandmark(e.place).label}</span>
      {session.entries.length > 1 && <span> · {session.entries.length} exchanges</span>}
      {showMirror && <span className="diary-comment-author"> · {e.myMirror}'s note</span>}
    </p>
    {fit?.fitReason && <details className="diary-fit"><summary>Why this feels like a fit</summary><p>{fit.fitReason}</p></details>}
    {e.theyAreInterested && <p className="small">{e.otherName} is interested in you{e.iAmInterested ? ' too' : ''}.</p>}
    {e.iAmInterested ? <p className="muted small">You're interested in {e.otherName}.</p>
      : <button disabled={!isActive || busy} onClick={() => void submit()}>{busy ? 'Saving…' : "I'm interested"}</button>}
    {error && <p className="error small">{error}</p>}
    {e.mutual && <div className="diary-contact"><strong>You both said yes</strong>
      <p>{e.theirContact || `${e.otherName} hasn't added contact details yet. They'll appear here when saved.`}</p>
    </div>}
    {e.otherDemo && <p className="muted small">{e.otherName} is a demo mirror and always shows interest back. Its contact is a placeholder.</p>}
  </article>;
}
