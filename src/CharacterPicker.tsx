import { useEffect, useState } from 'react';
import CharacterAvatar from './CharacterAvatar';
import { CHARACTER_LOOKS, loadCharacterSheets } from './characterSprites';
import './character-picker.css';

export default function CharacterPicker({ look, onChange, onClose, inline = false, disabled = false }: {
  look: number; onChange: (look: number) => void; onClose: () => void; inline?: boolean; disabled?: boolean;
}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void loadCharacterSheets().then(() => { if (active) setStatus('ready'); }, () => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [attempt]);
  return <section className={`character-picker${inline ? ' character-picker-inline' : ''}`} aria-label="Choose your reflection">
    <fieldset disabled={disabled}><legend>Choose your reflection</legend>
      <div className="character-picker-options">{CHARACTER_LOOKS.map(option => <label key={option.id} className="character-picker-option">
        <input type="radio" name="reflection-look" value={option.id} checked={look === option.id} autoFocus={look === option.id}
          disabled={option.id > 0 && status !== 'ready'} onChange={() => onChange(option.id)} />
        <CharacterAvatar look={option.id} name={option.name} /><span>{option.name}</span>
      </label>)}</div>
    </fieldset>
    <div className="character-picker-footer">
      <span role="status">{status === 'loading' ? 'Opening the wardrobe…' : status === 'error' ? 'Character artwork could not load.' : 'A little look of your own.'}</span>
      {status === 'error' && <button disabled={disabled} onClick={() => { setStatus('loading'); setAttempt(n => n + 1); }}>Retry</button>}
      {!inline && <button disabled={disabled} onClick={onClose}>Done ✓</button>}
    </div>
  </section>;
}
