import { useState } from 'react';
import WordOffering, { type WordGift } from './WordOffering';
import GitHubOffering from './GitHubOffering';
import DesktopObservationOffering from './DesktopObservationOffering';
import { MobileShareLetter } from './MobileShareReview';
import type { MobileShareDraft } from './mobileShare';

type Source = 'desktop' | 'github' | 'ai_summary' | 'writing' | 'iphone';
const SOURCES: { id: Source; title: string; detail: string }[] = [
  { id: 'desktop', title: 'Observe my computer', detail: 'Connect a local companion to follow your real activity' },
  { id: 'github', title: 'GitHub projects', detail: 'Bring public projects and your recent activity' },
  { id: 'ai_summary', title: "My AI’s introduction", detail: 'Ask an AI you know to introduce you' },
  { id: 'writing', title: 'My own update', detail: 'A thought, a few messages, or writing you already have' },
];

// All sources hand over the same reviewed letter; no source reads or submits on opening the chooser.
export default function SourceOffering({ onReady, onBack, busy = false, initialGift = null, onDesk = false, sharedDraft = null }: {
  onReady: (gift: WordGift) => void; onBack: () => void; busy?: boolean;
  initialGift?: WordGift | null; onDesk?: boolean;
  sharedDraft?: MobileShareDraft | null;
}) {
  const [source, setSource] = useState<Source | null>(null);
  const [visited, setVisited] = useState<Source[]>([]);
  const [prepared, setPrepared] = useState(initialGift);
  const choose = (next: Source) => {
    setPrepared(null); setSource(next); setVisited(values => values.includes(next) ? values : [...values, next]);
  };
  const back = () => setSource(null);
  const ready = (gift: WordGift) => { setPrepared(gift); onReady(gift); };
  return <div className="source-offering">
    {prepared ? <section aria-label="Your prepared letter">
      <p className="source-heading">Your letter is still here.</p>
      <p className="source-note">From {prepared.source}. Only this reviewed text is handed over.</p>
      <pre className="source-letter">{prepared.text}</pre>
      <button className="exchange-primary" disabled={busy} onClick={() => onReady(prepared)}>Hand over this letter ✉</button>
      <button disabled={busy} onClick={() => { setPrepared(null); setSource(null); }}>Choose another source</button>
    </section> : <>
      {source === null && <section aria-label="Choose what to bring">
        <p className="source-heading">What did you bring today?</p>
        <div className="source-choices">{sharedDraft && <button disabled={busy} onClick={() => choose('iphone')}><span>Shared from my iPhone</span><small>Your waiting item, ready to review</small></button>}{SOURCES.map(item => <button key={item.id} disabled={busy} onClick={() => choose(item.id)}><span>{item.title}</span><small>{item.detail}</small></button>)}</div>
        <p className="source-note">Read and change your letter before giving it to your mirror.</p>
      </section>}
      {source === 'github' && <GitHubOffering busy={busy} onBack={back} onReady={ready} />}
      {source === 'desktop' && <DesktopObservationOffering busy={busy} onBack={back} onReady={ready} />}
      {source === 'iphone' && sharedDraft && <MobileShareLetter key={JSON.stringify(sharedDraft)} draft={sharedDraft} busy={busy} onBack={back} onReady={ready} />}
      {/* Keep only manual drafts mounted when changing sources. Network/file adapters close on Back. */}
      {(['ai_summary', 'writing'] as const).filter(kind => visited.includes(kind)).map(kind => <div key={kind} className="source-panel" hidden={source !== kind}>
        <WordOffering kind={kind} onDesk={onDesk} busy={busy} onBack={back} onReady={ready} />
      </div>)}
    </>}
    {source === null && <button className="exchange-back" disabled={busy} onClick={onBack}>Put the letters away</button>}
  </div>;
}
