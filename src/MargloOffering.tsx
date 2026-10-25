import { useState } from 'react';
import { margloDate, margloLetter, parseMargloPackage, type MargloPackage } from './margloPackage';
import type { WordGift } from './WordOffering';

export default function MargloOffering({ onReady, onBack, busy }: { onReady: (gift: WordGift) => void; onBack: () => void; busy: boolean }) {
  const [pack, setPack] = useState<MargloPackage | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(false);
  const letter = margloLetter(pack?.items ?? [], checked);
  const read = async (file: File) => {
    setPack(null); setChecked([]); setError(''); setReading(true);
    try {
      if (file.size > 256_000) throw new Error('Keep the near-term package under 256 KB.');
      setPack(parseMargloPackage(await file.text()));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not read this package.'); }
    finally { setReading(false); }
  };
  return <div className="marglo-offering">
    <p className="exchange-line">Bring a recent-activity package from your computer.</p>
    <p className="quiet-note">Marglo brings clues, not a finished personality. Review each piece, remove other people’s information, and check only what is true about you. Nothing is sent until you hand over.</p>
    <label className="file-gift">Choose Marglo package<input aria-label="Choose Marglo recent-activity package" type="file" accept=".json,application/json" disabled={busy || reading} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void read(file); }} /></label>
    <details className="quiet-note"><summary>How do I make a package?</summary><p>Run the local export tool with your Marglo data folder. It makes a JSON file from recent activity, without copying raw window titles, URLs or Marglo’s own thoughts.</p><code>python scripts/export-marglo-package.py --data-dir YOUR_MARGLO_DATA_FOLDER --out recent.marglo.json --days 7</code><p>Optional: add --include-context current_projects this_week to bring selected context sections. If you do not use Marglo, use the AI summary or your own words instead.</p></details>
    {reading && <p role="status">Opening the package in your browser…</p>}
    {pack && <>
      <p className="quiet-note">Package prepared {margloDate(pack.generatedAt)}. This is not the date of undated background.</p>
      {!pack.items.length && <p role="status">No activity was available in this package. Bring another source or a sentence about your week.</p>}
      {pack.items.map(item => <div className="marglo-item" key={item.id}>
        <small>{item.kind} · {margloDate(item.startAt)}{item.endAt !== item.startAt ? ` to ${margloDate(item.endAt)}` : ''} · {item.status === 'tentative' ? 'Needs your review' : 'Package says owner-confirmed; please check'}</small>
        <textarea aria-label={`Review Marglo item ${item.id}`} rows={3} maxLength={2_000} value={item.text} disabled={busy} onChange={event => { setChecked(values => values.filter(id => id !== item.id)); setPack(value => value ? { ...value, items: value.items.map(i => i.id === item.id ? { ...i, text: event.target.value } : i) } : null); }} />
        <label><input type="checkbox" checked={checked.includes(item.id)} disabled={busy || !item.text.trim()} onChange={event => setChecked(values => event.target.checked ? [...values, item.id] : values.filter(id => id !== item.id))} />I checked this is about me and may be handed over</label>
      </div>)}
      <p className="quiet-note">{letter.included} reviewed pieces fit in this letter, up to 29,000 characters. App activity does not prove a preference, motive or completed event.</p>
      <details className="quiet-note"><summary>Preview the exact letter</summary><pre>{letter.text || 'Review and check a piece first.'}</pre></details>
      <button className="exchange-primary" disabled={busy || reading || letter.characters < 40} onClick={() => onReady({ text: letter.text, latestAt: letter.latestAt, source: 'Marglo · reviewed package', inputKind: 'facts', relation: 'other' })}>Hand over reviewed pieces ✉</button>
      {checked.length > 0 && letter.characters < 40 && <p className="quiet-note">A little more context would help — at least 40 characters of your reviewed text.</p>}
    </>}
    {error && <p role="alert" className="error">{error}</p>}
    <button className="exchange-back" disabled={busy || reading} onClick={onBack}>← Bring something else</button>
  </div>;
}
