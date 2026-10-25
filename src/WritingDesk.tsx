import { useEffect, useState } from 'react';
import { useReducer } from 'spacetimedb/react';
import { reducers } from './module_bindings';
import type { WordGift } from './WordOffering';
import SourceOffering from './SourceOffering';
import { DailyConversation } from './MirrorExchanges';

export default function WritingDesk({ mirrorId, status, initial = 'choose', dailyAvailable, dailyCount, onReview }: {
  mirrorId: bigint; status?: { status: string; source: string; message: string }; initial?: 'choose' | 'writing' | 'daily';
  dailyAvailable: boolean; dailyCount: number; onReview: () => void;
}) {
  const read = useReducer(reducers.importWriting);
  const [beat, setBeat] = useState<'choose' | 'writing' | 'daily' | 'reading'>(initial);
  const [gift, setGift] = useState<WordGift | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (status?.status === 'done') setGift(null); }, [status]);
  const give = async (value: WordGift) => {
    setSending(true); setError(''); setGift(value);
    try { await read({ mirrorId, ...value }); setBeat('reading'); }
    catch (e) { setError(e instanceof Error ? e.message : 'I could not read the letter. Try again?'); }
    finally { setSending(false); }
  };
  if (beat === 'daily' && dailyAvailable) return <DailyConversation mirrorId={mirrorId} count={dailyCount} onDone={() => setBeat('choose')} />;
  if (status?.status === 'processing' || sending) return <div className="mirror-exchange"><div className="letter-reading" aria-hidden="true">✉<span>· · ·</span></div><p role="status" className="exchange-line">Let me get to know these words a little.<br />You can watch the town while I read.</p></div>;
  if (beat === 'reading') return <div className="mirror-exchange">
    <div className="sealed-note" aria-hidden="true">{status?.status === 'failed' ? '↶' : '✉'}</div>
    <p role="status" className="exchange-line">{status?.status === 'failed' ? 'I could not quite read that letter. The pieces I already knew are safe.' : 'I found a few little pieces of you. Shall we look at them together?'}</p>
    <div className="exchange-choices">{status?.status === 'failed' ? <button className="exchange-primary" disabled={!gift} onClick={() => { if (gift) void give(gift); }}>Try reading it again</button> : <button className="exchange-primary" onClick={onReview}>Show me what you learned →</button>}<button onClick={() => setBeat('choose')}>Bring another letter</button></div>
    {error && <p role="alert">{error}</p>}
  </div>;
  if (beat === 'writing') return <><SourceOffering onBack={() => setBeat('choose')} busy={sending} onReady={value => void give(value)} />{error && <p role="alert">{error}</p>}</>;
  return <div className="mirror-exchange"><p className="exchange-line">Pull up a chair.<br />What did you bring today?</p><div className="exchange-choices exchange-responses">
    <button onClick={() => setBeat('writing')}><span aria-hidden="true">✉</span><span>Bring a letter<small>Computer activity, GitHub, my AI, or my own update</small></span><span aria-hidden="true">→</span></button>
    {dailyAvailable && <button onClick={() => setBeat('daily')}><span aria-hidden="true">?</span><span>Ask me something<small>One quiet question for today</small></span><span aria-hidden="true">→</span></button>}
    {status?.status === 'done' && <button className="exchange-back" onClick={onReview}>Let's look at what you already learned</button>}
  </div></div>;
}
