import { useEffect, useRef, useState } from 'react';
import { clearDesktopObservations, DesktopBridgeError, desktopObservations, desktopStatus, disconnectDesktopObserver, findDesktopObserver, pairDesktopObserver, setDesktopCapture, type DesktopStatus } from './desktopObserver';
import { margloDate, margloLetter, type MargloItem } from './margloPackage';
import type { WordGift } from './WordOffering';

export default function DesktopObservationOffering({ onReady, onBack, busy }: { onReady: (gift: WordGift) => void; onBack: () => void; busy: boolean }) {
  const [found, setFound] = useState(false), [code, setCode] = useState(''), [token, setToken] = useState('');
  const [status, setStatus] = useState<DesktopStatus | null>(null), [items, setItems] = useState<MargloItem[]>([]);
  const [checked, setChecked] = useState<string[]>([]), [browserTopics, setBrowserTopics] = useState(false);
  const [working, setWorking] = useState(false), [error, setError] = useState('');
  const mounted = useRef(true), protectedItems = useRef(new Set<string>()), editedItems = useRef(new Set<string>());
  const pending = useRef<AbortController | null>(null);
  const requestVersion = useRef(0), operating = useRef(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const letter = margloLetter(items, checked);
  const text = letter.text.replace(/^\[Marglo · /gm, '[Mirrorville desktop · ');
  const reset = () => { requestVersion.current++; setToken(''); setStatus(null); setItems([]); setChecked([]); setBrowserTopics(false); protectedItems.current.clear(); editedItems.current.clear(); };
  const fail = (e: unknown) => {
    if (!mounted.current) return;
    if (e instanceof DesktopBridgeError && e.unauthorized) reset();
    setError(e instanceof Error ? e.message : 'Could not reach the desktop companion.');
  };
  const refresh = async (session: string, signal?: AbortSignal) => {
    const version = ++requestVersion.current;
    const nextStatus = await desktopStatus(session, signal);
    const next = await desktopObservations(session, signal);
    if (!mounted.current || signal?.aborted || version !== requestVersion.current) return;
    setStatus(nextStatus);
    if (nextStatus.enabled) setBrowserTopics(nextStatus.browserTopics);
    setItems(previous => next.items.map(item => protectedItems.current.has(item.id) ? previous.find(old => old.id === item.id) ?? item : item));
    setError('');
  };
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; pending.current?.abort(); }; }, []);
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController(); let running = false;
    const poll = async () => {
      if (running || operating.current) return; running = true;
      try { await refresh(token, controller.signal); } catch (e) { if (!controller.signal.aborted) fail(e); }
      finally { running = false; }
    };
    void poll(); const interval = setInterval(() => void poll(), 5_000);
    return () => { controller.abort(); clearInterval(interval); };
  }, [token]);
  const act = async (operation: (signal: AbortSignal) => Promise<void>) => {
    if (working || busy) return;
    pending.current?.abort(); const controller = new AbortController(); pending.current = controller;
    requestVersion.current++; operating.current = true; setWorking(true); setError('');
    try { await operation(controller.signal); } catch (e) { if (!controller.signal.aborted) fail(e); }
    finally { operating.current = false; if (mounted.current) setWorking(false); }
  };
  return <div className="desktop-observation-offering">
    <p className="exchange-line">Let your mirror keep up with what you do on this computer.</p>
    <p className="quiet-note">The optional local companion observes only after you enable it. It makes tentative activity clues here; nothing is sent to the town until you review and hand it over.</p>
    {!token ? <>
      <details className="quiet-note" open={!found}><summary>Start the desktop companion</summary><p>On this Windows computer, run the helper from your Mirrorville folder. It starts paused and shows a pairing code.</p><code>python desktop/observer.py --origin {origin}</code><p>The current code is also in your local Mirrorville observer folder’s pairing-code.txt. It changes after pairing. Keep the helper running. Your browser may ask to allow local-network access. A phone cannot observe another computer.</p></details>
      {!found ? <button disabled={working || busy} onClick={() => void act(async signal => { await findDesktopObserver(signal); if (mounted.current) setFound(true); })}>{working ? 'Looking for companion…' : 'Find my desktop companion'}</button> : <>
        <p role="status">Companion found. Pair this browser to control it.</p>
        <label>Pairing code<input aria-label="Desktop companion pairing code" autoComplete="off" maxLength={64} value={code} disabled={working || busy} onChange={event => setCode(event.target.value)} /></label>
        <button disabled={working || busy || code.trim().length < 6} onClick={() => void act(async signal => { const session = await pairDesktopObserver(code, signal); if (mounted.current) { setToken(session); setCode(''); } })}>{working ? 'Pairing…' : 'Pair this browser'}</button>
      </>}
    </> : <>
      <p role="status">{status ? status.enabled ? 'Connected · observing this computer' : 'Connected · observation paused' : 'Connected · checking observation status…'}</p>
      <label className="source-owner"><input type="checkbox" checked={browserTopics} disabled={working || busy || status?.enabled} onChange={event => setBrowserTopics(event.target.checked)} />Also observe browser page topics. Page titles are interpreted locally and may contain sensitive information; this is off by default.</label>
      <div className="exchange-choices">
        <button disabled={working || busy || !status} onClick={() => void act(async signal => { await setDesktopCapture(token, !status!.enabled, browserTopics, signal); await refresh(token, signal); })}>{status?.enabled ? 'Pause observation' : 'Start observation'}</button>
        <button disabled={working || busy} onClick={() => void act(signal => refresh(token, signal))}>Refresh local clues</button>
        <button disabled={working || busy} onClick={() => void act(async signal => { await clearDesktopObservations(token, signal); setItems([]); setChecked([]); protectedItems.current.clear(); editedItems.current.clear(); await refresh(token, signal); })}>Clear local clues & pause</button>
        <button disabled={working || busy} onClick={() => void act(async signal => { await disconnectDesktopObserver(token, signal); if (mounted.current) { reset(); setFound(false); } })}>Disconnect & pause</button>
      </div>
      <p className="quiet-note">Closing this page leaves the companion running with your chosen setting. Pause here or quit the helper to stop observing. Pairing credentials stay in browser memory; reopening requires pairing again.</p>
      {status && !items.length && <p role="status">No eligible activity clues yet. Enable observation, work normally for a little while, then return here.</p>}
      <div className="source-pieces">{items.map(item => <div className="source-piece" key={item.id}>
        <small>Tentative activity · {margloDate(item.startAt)}{item.endAt !== item.startAt ? ` to ${margloDate(item.endAt)}` : ''}</small>
        <textarea aria-label={`Review desktop clue ${item.id}`} rows={3} maxLength={2_000} value={item.text} disabled={working || busy} onChange={event => { editedItems.current.add(item.id); protectedItems.current.add(item.id); setChecked(values => values.filter(id => id !== item.id)); setItems(values => values.map(value => value.id === item.id ? { ...value, text: event.target.value } : value)); }} />
        <label><input type="checkbox" checked={checked.includes(item.id)} disabled={working || busy || !item.text.trim()} onChange={event => { if (event.target.checked) protectedItems.current.add(item.id); else if (!editedItems.current.has(item.id)) protectedItems.current.delete(item.id); setChecked(values => event.target.checked ? [...values, item.id] : values.filter(id => id !== item.id)); }} />I checked this describes me and may be handed over.</label>
      </div>)}</div>
      {!!items.length && <>
        <p className="quiet-note">App use is not proof of preference, motive or completion. Correct the clue and remove other people’s details. Reviewed or edited pieces stay unchanged while new clues refresh.</p>
        <details className="quiet-note"><summary>Preview the exact letter</summary><pre className="source-letter">{text || 'Review and check a clue first.'}</pre></details>
        <button className="exchange-primary" disabled={working || busy || letter.characters < 40} onClick={() => onReady({ text, latestAt: letter.latestAt, source: 'Desktop · reviewed observations', inputKind: 'facts', relation: 'other' })}>Hand over reviewed clues ✉</button>
        {checked.length > 0 && letter.characters < 40 && <p className="quiet-note">Add a little context — at least 40 characters of reviewed text.</p>}
      </>}
    </>}
    {error && <p role="alert" className="error">{error}</p>}
    <button className="exchange-back" disabled={working || busy} onClick={onBack}>← Back to sources</button>
  </div>;
}
