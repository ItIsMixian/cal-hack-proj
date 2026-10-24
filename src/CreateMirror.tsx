import { useMemo, useState } from 'react';
import { useReducer } from 'spacetimedb/react';
import { reducers } from './module_bindings';
import { TIPI_ITEMS, buildSelfCard } from '../spacetimedb/src/tipi';
import { LOOK_COLORS, findLandmark, landmarkForIntent } from '../spacetimedb/src/world';
import Modal from './Modal';
import CharacterAvatar from './CharacterAvatar';

export default function CreateMirror(props: { onClose: () => void; onCreated: (name: string) => void }) {
  const createMirror = useReducer(reducers.createMirror);
  const [name, setName] = useState('');
  const [look, setLook] = useState(0);
  const [tipi, setTipi] = useState<(number | null)[]>(Array(10).fill(null));
  const [onMind, setOnMind] = useState('');
  const [intent, setIntent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const answered = tipi.every((a) => a !== null);
  const card = useMemo(() => (answered ? buildSelfCard(tipi as number[], onMind) : null), [answered, tipi, onMind]);
  const place = intent.trim() ? findLandmark(landmarkForIntent(intent)).label : null;
  const canSubmit = answered && name.trim() !== '' && !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await createMirror({ name, look, tipi: Uint8Array.from(tipi as number[]), onMind, intent });
      props.onCreated(name.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Make your mirror" onClose={props.onClose}>
      <p className="muted">
        Your mirror is a clearly fictional AI version of you. It only knows what you put on this card. It walks around
        Mirrorville, chats with other mirrors, and looks for people who want the same thing you do today.
      </p>

      <label className="field">
        <span>Name</span>
        <input maxLength={24} value={name} onChange={(e) => setName(e.target.value)} placeholder="What should your mirror be called?" />
      </label>

      <div className="field">
        <span>Your character & marker color</span>
        <CharacterAvatar look={look} name={name || 'Your mirror'} />
        <div className="looks">
          {LOOK_COLORS.map((color, i) => (
            <button
              key={color}
              type="button"
              className={i === look ? 'look selected' : 'look'}
              style={{ background: color }}
              onClick={() => setLook(i)}
              aria-label={`Color ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="field">
        <span>I see myself as… (1 = disagree strongly, 7 = agree strongly)</span>
        {TIPI_ITEMS.map((item, i) => (
          <div key={item} className="tipi-row">
            <span>{item}</span>
            <div className="scale">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={tipi[i] === n ? 'selected' : ''}
                  onClick={() => setTipi((prev) => prev.map((a, j) => (j === i ? n : a)))}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="field">
        <span>What's been on your mind lately? (optional)</span>
        <textarea
          rows={2}
          maxLength={300}
          value={onMind}
          onChange={(e) => setOnMind(e.target.value)}
          placeholder="A question you keep coming back to, a project, something you miss…"
        />
      </label>

      <label className="field">
        <span>Today's intent (optional)</span>
        <input
          maxLength={300}
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="e.g. Go to the gym tomorrow morning / Find someone to grab dinner with"
        />
        {place && <small className="muted">Your mirror will hang out around the {place}.</small>}
      </label>

      <div className="card-preview">
        <strong>What your mirror will know about you</strong>
        <p>{card ?? 'Answer all ten items to see your card.'}</p>
        {intent.trim() && <p>Today: {intent.trim()}</p>}
      </div>

      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="ghost" onClick={props.onClose}>
          Cancel
        </button>
        <button className="primary" disabled={!canSubmit} onClick={submit}>
          {submitting ? 'Creating…' : 'Send my mirror in'}
        </button>
      </div>
    </Modal>
  );
}
