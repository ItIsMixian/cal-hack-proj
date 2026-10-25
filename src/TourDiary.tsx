import { useState } from 'react';
import './diary.css';

/** A local teaching page, never a stored encounter or an interest signal. */
export default function TourDiary() {
  const [opened, setOpened] = useState(false);
  return <section className={`diary-spread tour-book ${opened ? 'has-selection' : ''}`} aria-label="Diary example">
    <span className="diary-ribbon" aria-hidden="true">❧</span>
    <section className="diary-leaf diary-left">
      <header className="diary-leaf-heading"><h3>Your first page</h3><small>Example · not a saved conversation</small></header>
      <p className="tour-arrival">Today, I arrived in Mirrorville.</p>
      <button className="diary-encounter" aria-pressed={opened} onClick={() => setOpened(true)}>
        <span aria-hidden="true">❧</span><span className="diary-encounter-copy"><strong>A future encounter</strong><span>Who I met, and one short thought to remember.</span></span>
      </button>
      <p>Choose a person to read what came up. Your real encounters will appear here after they happen.</p>
    </section>
    <section className="diary-leaf diary-right" aria-live="polite">
      <header className="diary-leaf-heading"><h3>{opened ? 'A closer look' : 'Room for new stories'}</h3><small>Diary guide</small></header>
      {opened ? <><button className="diary-mobile-back" onClick={() => setOpened(false)}>← Back to the page</button><p>Here you will find what your mirrors discussed, with the time and source available to check.</p><p><span className="diary-interest-mark">♡ Interested in you</span></p><p>This label means the other person expressed interest. If you both do, shared contact details become available.</p><small>This label is an example, not a real notification.</small></> : <p>A short overview first. Open an encounter only when you want to know more.</p>}
    </section>
  </section>;
}
