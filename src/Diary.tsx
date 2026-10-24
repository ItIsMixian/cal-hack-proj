import { useState } from 'react';
import { useReducer, useSpacetimeDB, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { DiaryItem } from './module_bindings/types';
import { findLandmark } from '../spacetimedb/src/world';

const dateFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'full' });
const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' });
const dateOf = (entry: DiaryItem) => new Date(Number(entry.createdAt.microsSinceUnixEpoch / 1000n));

export default function Diary() {
  const [entries] = useTable(tables.myDiary);
  const sorted = [...entries].sort((a, b) => a.createdAt.microsSinceUnixEpoch > b.createdAt.microsSinceUnixEpoch ? -1
    : a.createdAt.microsSinceUnixEpoch < b.createdAt.microsSinceUnixEpoch ? 1 : 0);
  const days = new Map<string, DiaryItem[]>();
  for (const entry of sorted) {
    const day = dateFormat.format(dateOf(entry));
    days.set(day, [...(days.get(day) ?? []), entry]);
  }
  if (!sorted.length) return <div className="diary-empty">
    <p>Your mirror's day is just beginning.</p>
    <p className="muted small">After each conversation, it writes home about where it was and who it met. Read whenever you like.</p>
  </div>;
  return <div className="diary">{[...days].map(([day, group]) => <section key={day}>
    <h2 className="diary-day">{day}</h2>
    {group.map(entry => <DiaryEntry key={String(entry.id)} entry={entry} />)}
  </section>)}</div>;
}

function DiaryEntry({ entry: e }: { entry: DiaryItem }) {
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
  return <article className="diary-entry">
    <p className="diary-meta">{findLandmark(e.place).label} · <time dateTime={dateOf(e).toISOString()}>{timeFormat.format(dateOf(e))}</time></p>
    <h3>{e.myMirror} · with {e.otherName}</h3>
    <p className="diary-text">{e.text}</p>
    {e.goodFit && <div className="diary-fit"><span className="tag gold">good fit</span><span className="small">{e.fitReason}</span></div>}
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
