import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createDepartureScene, type DepartureScene } from './DepartureScene';
import './world-journey.css';

export default function WorldJourney({ children, busy, destination, emptyWorld = false, animated = false, onArrival }: {
  children: ReactNode; busy: boolean; destination: string | null; emptyWorld?: boolean; animated?: boolean; onArrival: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<DepartureScene | null>(null);
  const arrived = useRef(onArrival);
  arrived.current = onArrival;
  const [ready, setReady] = useState(!animated);
  const [caption, setCaption] = useState('Getting the shuttle ready…');
  const [artError, setArtError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!animated) { setReady(true); return; }
    setReady(false); setArtError(false);
    try {
      scene.current = createDepartureScene(canvas.current!, {
        onReady: () => setReady(true), onCaption: setCaption,
        onArrival: () => arrived.current(), onError: () => { setArtError(true); setReady(true); },
      });
    } catch { setArtError(true); setReady(true); }
    return () => { scene.current?.dispose(); scene.current = null; };
  }, [attempt, animated]);
  useEffect(() => {
    if (!destination) return;
    if (!animated || artError) arrived.current();
    else scene.current?.depart(destination);
  }, [destination, artError, animated]);
  useEffect(() => { if (ready) panel.current?.focus(); }, [ready]);
  return <main className={`world-journey${!animated || (ready && emptyWorld && !destination) ? ' is-empty-world' : ''}`} aria-label={animated ? 'Journey to a world' : 'Town selection'} aria-busy={busy}>
    <div className="journey-layout">
      <header className="journey-header"><h1>Mirrorville</h1><p>A little journey, from home to somewhere new.</p></header>
      <div className="journey-stage" data-phase={destination ? 'departing' : ready ? 'choosing' : 'boarding'}>
        {animated && <canvas ref={canvas} width="480" height="270" aria-label="Your mirror leaves home and boards a village shuttle" />}
        {animated && caption && !ready && <p className="journey-caption" role="status">{caption}</p>}
        {animated && destination && <p className="journey-caption" role="status">Next stop: {destination}</p>}
        {ready && !destination && <section ref={panel} tabIndex={-1} className="journey-controls" aria-label="Choose a world">
          {artError && <p role="status">The shuttle artwork could not load. You can still choose a world. <button onClick={() => setAttempt(value => value + 1)}>Retry artwork</button></p>}
          {children}
        </section>}
      </div>
      {animated && <footer className="journey-toolbar">
        <p role="status">{destination ? `Travelling to ${destination}…` : busy ? 'Confirming your world…' : ready ? 'Choose a world. Your other mirrors keep living their day.' : 'A new place. A few new faces.'}</p>
        <div>
          {!destination && <button disabled={busy} onClick={() => {
            if (artError) { setAttempt(value => value + 1); return; }
            setReady(false); scene.current?.replay();
          }}>Replay</button>}
          <button disabled={busy} onClick={() => destination ? arrived.current() : (scene.current?.skip(), setReady(true))}>{destination ? 'Arrive now' : 'Skip animation'}</button>
        </div>
      </footer>}
    </div>
  </main>;
}
