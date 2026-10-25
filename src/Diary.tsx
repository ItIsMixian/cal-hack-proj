import { useState } from 'react';
import { useReducer, useSpacetimeDB, useTable } from 'spacetimedb/react';
import { reducers, tables } from './module_bindings';
import type { DiaryItem } from './module_bindings/types';
import { findLandmark } from '../spacetimedb/src/world';
import { diaryTopics, sessionSummary } from './DiaryReview';
import { diarySessions, type DiarySession } from './DiarySessions';
import { diaryCutoff } from './DiaryHistory';
import { useDiaryWindow } from './useDiaryWindow';
import CharacterSprite from './CharacterSprite';
import './diary.css';

const dateFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'medium' });
const timeFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' });
const dateOf = (entry: DiaryItem) => new Date(Number(entry.createdAt.microsSinceUnixEpoch / 1000n));

export default function Diary({ mirrorId }: { mirrorId?: bigint } = {}) {
  const [entries] = useTable(tables.myDiary);
  const [mirrors] = useTable(tables.mirror);
  const { identity } = useSpacetimeDB();
  const history = useDiaryWindow(identity?.toHexString(), mirrorId);
  const sorted = [...entries].filter(entry => mirrorId === undefined || entry.mirrorId === mirrorId)
    .sort((a, b) => a.createdAt.microsSinceUnixEpoch > b.createdAt.microsSinceUnixEpoch ? -1 : 1);
  const groups = new Map<string, DiaryItem[]>();
  for (const entry of sorted) {
    const key = `${entry.mirrorId}:${dateFormat.format(dateOf(entry))}`;
    const group = groups.get(key);
    if (group) group.push(entry); else groups.set(key, [entry]);
  }
  const pages = [...groups].map(([key, notes]) => ({ key, notes, sessions: diarySessions(notes),
    unread: notes.some(entry => entry.createdAt.microsSinceUnixEpoch > diaryCutoff(history, entry.mirrorId)) }));
  const [selected, setSelected] = useState<string | null>(null);
  const page = pages.find(item => item.key === selected) ?? pages.find(item => item.unread) ?? pages[0];
  const [person, setPerson] = useState<string | null>(null);
  const [peoplePage, setPeoplePage] = useState(0);
  const [visitIndex, setVisitIndex] = useState(0);
  const index = pages.indexOf(page);
  const changePage = (key: string) => { setSelected(key); setPerson(null); setPeoplePage(0); setVisitIndex(0); };
  const people = new Map<string, DiarySession[]>();
  for (const session of page?.sessions ?? []) {
    const name = session.entries[0].otherName;
    const visits = people.get(name) ?? [];
    visits.push(session); people.set(name, visits);
  }
  const rank = (visits: DiarySession[]) => visits.some(v => v.entries[0].mutual) ? 2 : visits.some(v => v.entries[0].theyAreInterested) ? 1 : 0;
  const residents = [...people].sort((a, b) => rank(b[1]) - rank(a[1]) || (a[1][0].entries[0].createdAt.microsSinceUnixEpoch > b[1][0].entries[0].createdAt.microsSinceUnixEpoch ? -1 : 1));
  const visits = person ? people.get(person) : undefined;
  if (!page) return <div className="diary-comments diary-empty">
    <h3>A page waiting to be written</h3>
    <p>When I have a conversation, I'll keep what we actually talked about here.</p>
  </div>;
  const slice = Math.min(peoplePage, Math.max(0, Math.ceil(residents.length / 3) - 1));
  const visit = visits?.[Math.min(visitIndex, visits.length - 1)];
  return <div className={`diary-comments diary-book diary-spread ${visits ? 'has-selection' : ''}`}>
    <span className="diary-ribbon" aria-hidden="true">❧</span>
    <section className="diary-leaf diary-left" aria-label={`Diary for ${dateFormat.format(dateOf(page.notes[0]))}`}>
      <header className="diary-leaf-heading"><span className="diary-botanical" aria-hidden="true">❧</span>
        <h3>{dateFormat.format(dateOf(page.notes[0]))}</h3><p>People I met today</p>
        {mirrorId === undefined && <small>{page.notes[0].myMirror}'s diary</small>}
        {page.unread && <small className="diary-unread">New since your last visit</small>}
      </header>
      <div className="diary-encounters">{residents.slice(slice * 3, slice * 3 + 3).map(([name, sessions]) => {
        const topics = sessions.flatMap(visit => visit.entries.flatMap(entry => diaryTopics(entry.text)));
        const topic = topics.find(text => /discuss|compar|asked|said|mention|explain|working on|building|struggl|讨论|聊到|提到|问|正在/u.test(text))
          ?? topics.find(text => !/^(got talking|chatted with|talked with|we exchanged greetings)|spotted an open table/iu.test(text));
        const teaser = topic ? topic.length > 110 ? `${topic.slice(0, 107)}…` : topic : "Specific conversation topics weren't recorded.";
        const matches = mirrors.filter(m => m.name === name && m.id !== page.notes[0].mirrorId);
        return <button className="diary-encounter" key={name} aria-pressed={person === name}
          onClick={() => { setPerson(name); setVisitIndex(0); }} aria-label={`Read conversations with ${name}`}>
          <span className="diary-portrait" aria-hidden="true">{matches.length === 1 ? <CharacterSprite look={matches[0].look} /> : <span className="diary-monogram">{Array.from(name)[0]}</span>}</span>
          <span className="diary-encounter-copy"><span className="diary-name-line"><strong>{name}</strong>
            {rank(sessions) > 0 && <span className={`diary-interest-mark ${rank(sessions) === 2 ? 'mutual' : ''}`}><span aria-hidden="true">♥</span> {rank(sessions) === 2 ? 'Mutual interest' : 'Interested in you'}</span>}
          </span><span className="diary-teaser">{teaser}</span></span>
          <span className="diary-selection-mark" aria-hidden="true">❧</span>
        </button>;
      })}</div>
      {residents.length > 3 && <nav className="diary-people-pages" aria-label="People pages">
        <button disabled={slice === 0} onClick={() => setPeoplePage(slice - 1)} aria-label="Previous people">←</button>
        <small>{slice + 1} / {Math.ceil(residents.length / 3)} · {residents.length} people</small>
        <button disabled={(slice + 1) * 3 >= residents.length} onClick={() => setPeoplePage(slice + 1)} aria-label="Next people">→</button>
      </nav>}
      <footer className="diary-leaf-footer"><button disabled={index >= pages.length - 1} onClick={() => changePage(pages[index + 1].key)} aria-label="Earlier">← Earlier</button><span>❧　{index * 2 + 1}</span><button className="diary-mobile-date" disabled={index === 0} onClick={() => changePage(pages[index - 1].key)}>Later →</button></footer>
    </section>
    <section className="diary-leaf diary-right" aria-label="Conversation page">
      {visits && visit ? <>
        <header className="diary-leaf-heading"><button className="diary-mobile-back" onClick={() => setPerson(null)}>← People I met</button>
          <h3>A conversation with {person}</h3>
          {rank(visits) > 0 && <span className={`diary-interest-mark ${rank(visits) === 2 ? 'mutual' : ''}`}><span aria-hidden="true">♥</span> {rank(visits) === 2 ? 'Mutual interest' : 'Interested in you'}</span>}
          <p>{findLandmark(visit.entries[0].place).label} · {timeFormat.format(dateOf(visit.entries[0]))}</p>
        </header>
        <div className="diary-leaf-body" key={`${person}:${visitIndex}`}><DiaryEntry session={visit} showMirror={false} /></div>
        {visits.length > 1 && <nav className="diary-visit-pages" aria-label="Conversations with this person">
          <button disabled={visitIndex === 0} onClick={() => setVisitIndex(visitIndex - 1)} aria-label="Previous conversation">←</button>
          <small>Conversation {visitIndex + 1} / {visits.length}</small>
          <button disabled={visitIndex >= visits.length - 1} onClick={() => setVisitIndex(visitIndex + 1)} aria-label="Next conversation">→</button>
        </nav>}
      </> : <div className="diary-unopened"><span aria-hidden="true">❧</span><h3>A few conversations to keep</h3>
        <p>Today, I talked with {residents.length} {residents.length === 1 ? 'person' : 'people'}.</p><p>Choose someone on the facing page<br />to revisit what we talked about.</p></div>}
      <footer className="diary-leaf-footer"><button className="diary-mobile-date" disabled={index >= pages.length - 1} onClick={() => changePage(pages[index + 1].key)}>← Earlier</button><span>{index * 2 + 2}　❧</span><button disabled={index === 0} onClick={() => changePage(pages[index - 1].key)} aria-label="Later">Later →</button></footer>
    </section>
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


    {summary ? <p className="diary-summary">{summary}</p>
      : <p className="diary-missing-topics">Specific conversation topics weren't recorded for this exchange.</p>}
    <details className="diary-source"><summary>Time and source</summary><p className="diary-comment-meta"><time dateTime={start.toISOString()}>{dateFormat.format(start)} · {timeFormat.format(start)}</time>
      {hasRange && <> – <time dateTime={end.toISOString()}>{dateFormat.format(start) !== dateFormat.format(end) ? `${dateFormat.format(end)} · ` : ''}{timeFormat.format(end)}</time></>}
      <span aria-hidden="true"> · </span><span>{findLandmark(e.place).label}</span>
      {session.entries.length > 1 && <span> · {session.entries.length} exchanges</span>}
      {showMirror && <span className="diary-comment-author"> · {e.myMirror}'s note</span>}
    </p><p className="muted small">Based on this mirror conversation. The date records our meeting, not when someone's real-life update happened.</p></details>
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
