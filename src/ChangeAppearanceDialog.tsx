import { useState } from 'react';
import { useReducer } from 'spacetimedb/react';
import { reducers } from './module_bindings';
import CharacterAvatar from './CharacterAvatar';
import CharacterPicker from './CharacterPicker';
import RoomDialog from './RoomDialog';
import './change-appearance.css';

export default function ChangeAppearanceDialog({ mirrorId, name, savedLook, onClose }: {
  mirrorId: bigint; name: string; savedLook: number; onClose: () => void;
}) {
  const save = useReducer(reducers.setAppearance);
  const [look, setLook] = useState(savedLook);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const close = () => { if (!busy) onClose(); };
  const submit = async () => {
    if (busy || look === savedLook) return;
    setBusy(true); setError('');
    try { await save({ mirrorId, look }); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save your appearance. Try again.'); }
    finally { setBusy(false); }
  };
  return <RoomDialog title="Change appearance" onClose={close}>
    <div className="appearance-preview"><CharacterAvatar look={look} name={name} />
      <div><h3>{name}</h3><p>Preview your new look.</p></div></div>
    <CharacterPicker inline look={look > 4 ? 0 : look} onChange={setLook} onClose={close} disabled={busy} />
    <p className="appearance-note">Your new look follows you around town. Your memories and conversations stay with you.</p>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="appearance-actions">
      <button disabled={busy} onClick={close}>Cancel</button>
      <button disabled={busy || look === savedLook} onClick={() => void submit()}>{busy ? 'Saving…' : 'Save appearance'}</button>
    </div>
  </RoomDialog>;
}
