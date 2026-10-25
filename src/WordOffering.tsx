import { useEffect, useRef, useState } from 'react';
import { ASK_YOUR_AI } from './onboarding';
import FacebookOffering from './FacebookOffering';
import MargloOffering from './MargloOffering';
import { redact } from '../spacetimedb/src/redact';
import { decodeImportFile, looksLikeWeChatCsv, newestDate, ownWords, parseWeChatCsv, parseWhatsApp, sampleFiles, sourceDate, sourceScene, type ParsedChat } from './importers';

export type WordGift = { text: string; inputKind: string; relation: string; source: string; latestAt: string };

// A single material exchange, used both at the first meeting and at the room's desk.
export default function WordOffering({ kind, onReady, onBack, busy = false, initialGift = null, onPrompt, onDesk = false }: {
  kind: 'ai_summary' | 'writing'; onReady: (gift: WordGift) => void; onBack: () => void; busy?: boolean; initialGift?: WordGift | null; onPrompt?: (text: string) => void; onDesk?: boolean;
}) {
  const exchange = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'note' | 'receive' | 'envelope'>(initialGift ? 'envelope' : kind === 'ai_summary' ? 'note' : 'receive');
  const [draft, setDraft] = useState(initialGift?.text ?? '');
  const [chat, setChat] = useState<ParsedChat | null>(null);
  const [speaker, setSpeaker] = useState('');
  const [inputKind, setInputKind] = useState<string>(initialGift?.inputKind ?? kind);
  const [relation, setRelation] = useState(initialGift?.relation ?? 'other');
  const [latestAt, setLatestAt] = useState(initialGift?.latestAt ?? '');
  const [reading, setReading] = useState(false);
  const [needsAuthorship, setNeedsAuthorship] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [facebook, setFacebook] = useState(false);
  const [marglo, setMarglo] = useState(false);
  const text = chat ? speaker ? ownWords(chat, speaker) : '' : looksLikeWeChatCsv(draft) ? '' : redact(draft);
  const at = chat ? newestDate(...chat.lines.filter(line => line.speaker === speaker).map(line => line.at)) : latestAt;
  const source = inputKind === 'ai_summary' ? "Your AI's summary" : inputKind === 'ai_chat' ? 'AI assistant · ai' : chat ? 'WhatsApp · friends' : relation === 'friends' ? 'Your messages · friends' : 'Your own messages';
  const ready = text.trim().length >= 40 && !reading && !needsAuthorship && !busy;

  const prompt = phase === 'note' ? 'Your AI might already know a little about you. Take it this note, then bring me its answer.' : phase === 'receive' ? kind === 'ai_summary' ? 'Put its answer on the desk. We will check what is true together.' : 'Tell me what has been happening, or bring words you already wrote.' : 'This is the letter I will read. Contact details are covered up; your original pages stay here.';
  useEffect(() => { onPrompt?.(prompt); }, [onPrompt, prompt]);
  useEffect(() => { exchange.current?.querySelector<HTMLElement>('textarea:not([readonly]), button:not(:disabled)')?.focus(); }, [phase]);

  const chooseFiles = async (files: File[]) => {
    setReading(true); setError(''); setNotice(''); setDraft(''); setChat(null); setSpeaker(''); setLatestAt(''); setNeedsAuthorship(false);
    try {
      if (files.length > 20 || files.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) throw new Error('Choose up to 20 files, under 10 MB altogether.');
      const values = await Promise.all(files.map(async file => decodeImportFile(await file.arrayBuffer())));
      const isCsv = files.map((file, i) => /\.csv$/i.test(file.name) || looksLikeWeChatCsv(values[i]));
      if (isCsv.some(Boolean)) {
        if (!isCsv.every(Boolean)) throw new Error('Give me chat CSVs separately from other writing.');
        const parsed = values.map(parseWeChatCsv);
        setDraft(sampleFiles(parsed.map(value => value.text))); setLatestAt(newestDate(...parsed.map(value => value.latestAt)));
        setInputKind('writing'); setRelation('friends');
        setNotice(`I kept ${parsed.reduce((sum, value) => sum + value.kept, 0)} of your messages. Everyone else's words stay here.`);
      } else {
        const parsed = files.length === 1 ? parseWhatsApp(values[0]) : null;
        if (parsed) { setChat(parsed); setInputKind('writing'); setRelation('friends'); }
        else {
          setDraft(sampleFiles(values)); setLatestAt(newestDate(...values.map(sourceDate)));
          if (values.every(value => sourceScene(value) === 'ai')) { setInputKind('ai_chat'); setRelation('ai'); }
          else { setInputKind('facts'); setRelation('other'); setNeedsAuthorship(true); }
        }
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'I could not open that file. Try again.'); }
    finally { setReading(false); }
  };
  const receive = async () => {
    setPhase('receive'); setError(''); setChat(null); setSpeaker(''); setLatestAt(''); setInputKind(kind); setRelation('other'); setNeedsAuthorship(false);
    try { setDraft((await navigator.clipboard.readText()).slice(0, 30_000)); }
    catch { setNotice('You can paste directly into the paper below.'); }
  };

  if (facebook) return <div className={`word-offering ${onPrompt || onDesk ? 'in-scene' : ''} ${onDesk ? 'on-desk' : ''}`}><FacebookOffering busy={busy} onReady={onReady} onBack={() => setFacebook(false)} /></div>;
  if (marglo) return <div className={`word-offering ${onPrompt || onDesk ? 'in-scene' : ''} ${onDesk ? 'on-desk' : ''}`}><MargloOffering busy={busy} onReady={onReady} onBack={() => setMarglo(false)} /></div>;
  return <div className={`word-offering ${onPrompt || onDesk ? "in-scene" : ""} ${onDesk ? "on-desk" : ""}`} ref={exchange}>
    {phase === 'note' ? <>
      <p className="exchange-line">An AI you already talk to might know a little about you. Take it this note, then bring me its answer.</p>
      <div className="sealed-note" aria-hidden="true"><span>✉</span><small>A note for your AI</small></div>
      <div className="exchange-choices">
        <button className="exchange-primary" disabled={busy} onClick={async () => {
          try { await navigator.clipboard.writeText(ASK_YOUR_AI); setNotice('Copied. Paste the note into ChatGPT, Claude, or an AI that knows you.'); }
          catch { setNotice('Open the note below and copy it by hand.'); }
        }}>{onDesk ? 'Copy this note ↗' : 'Take the note ↗'}</button>
        <button onClick={() => void receive()}>{onDesk ? 'Bring the reply' : 'I brought the answer'}</button>
      </div>
      <details className="quiet-note"><summary>Unfold the note</summary><textarea aria-label="Note for your AI" readOnly rows={5} value={ASK_YOUR_AI} /></details>
    </> : phase === 'receive' ? <>
      <p className="exchange-line">{kind === 'ai_summary' ? 'Put its answer on the desk. We will check what is true together.' : 'Tell me what has been happening, or bring words you already wrote.'}</p>
      {chat ? <div className="speaker-choice"><p>Which voice is yours?</p>{[...chat.speakers.keys()].map(name => <button key={name} aria-pressed={speaker === name} onClick={() => setSpeaker(name)}>{name}</button>)}</div> :
        <textarea className="writing-paper" autoFocus aria-label={kind === 'ai_summary' ? 'Answer from your AI' : 'Messages you wrote'} rows={4} maxLength={30_000} value={draft}
          placeholder={kind === 'ai_summary' ? 'Put your AI’s answer here…' : 'Something happening lately, or your own writing. Include when it happened; leave out other people’s details…'}
          onChange={event => { setDraft(event.target.value); setLatestAt(''); setNeedsAuthorship(false); setInputKind(kind); setRelation('other'); setNotice(''); }} />}
      <div className="paper-tools">
        <button disabled={reading || busy} onClick={() => void receive()}>Paste from clipboard</button>
        <label className="file-gift">Choose a file<input aria-label="Hand over a writing file" type="file" accept=".csv,.txt,text/plain,text/csv" multiple disabled={reading || busy} onChange={event => {
          const files = Array.from(event.target.files ?? []); event.target.value = ''; if (files.length) void chooseFiles(files);
        }} /></label>
      </div>
      {kind === 'writing' && <details className="other-writing-sources"><summary>Other sources</summary><button disabled={reading || busy} onClick={() => setMarglo(true)}>Import an existing Marglo package</button><button disabled={reading || busy} onClick={() => setFacebook(true)}>Bring Facebook posts</button></details>}
      {needsAuthorship && <div className="speaker-choice"><p>What did you bring?</p><button onClick={() => { setInputKind('writing'); setNeedsAuthorship(false); }}>Messages I wrote</button><button onClick={() => { setInputKind('ai_summary'); setNeedsAuthorship(false); }}>A summary about me</button></div>}
      {looksLikeWeChatCsv(draft) && <p role="alert">Choose that CSV as a file so I can separate your words from everyone else's.</p>}
      {reading && <p role="status">Opening the pages here in your browser…</p>}
      <div className="exchange-choices"><button className="exchange-primary" disabled={!ready} onClick={() => setPhase('envelope')}>{onDesk ? 'Fold & check →' : 'Fold this into a letter →'}</button></div>
      {draft.length > 0 && text.trim().length < 40 && !reading && <p className="quiet-note">A little more to go on would help — at least 40 characters.</p>}
    </> : <>
      <p className="exchange-line">This is what I will read. Contact details have been covered up. Your original pages stay here.</p>
      <div className="gift-envelope"><span aria-hidden="true">✉</span><blockquote>{text.slice(0, 30_000)}</blockquote></div>
      {!onDesk && <p className="quiet-note">{inputKind === 'writing' ? 'I will learn facts and, with enough of your writing, a little of your voice.' : 'I will learn facts from this, not pretend it is your voice.'} The text is discarded after reading.</p>}
      {onDesk && <small className="letter-privacy">Redacted here. Original pages stay with you.</small>}
      <div className="exchange-choices"><button className="exchange-primary" disabled={!ready} onClick={() => onReady({ text: text.slice(0, 30_000), inputKind, relation, source, latestAt: at })}>{busy ? 'Reading…' : onDesk ? 'Hand over ✉' : 'Give this to my mirror'}</button><button disabled={busy} onClick={() => setPhase('receive')}>{onDesk ? 'Unfold & edit' : 'Change the letter'}</button></div>
    </>}
    {notice && <p role="status" className="quiet-note">{notice}</p>}
    {error && <p role="alert" className="error">{error}</p>}
    <button className="exchange-back" disabled={reading || busy} onClick={onBack}>{onDesk ? 'Put the pages away' : '← Bring something else'}</button>
  </div>;
}
