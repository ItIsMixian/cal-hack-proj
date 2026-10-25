import { useState, type FormEvent } from 'react';

export type WorldSettingsValue = {
  name: string;
  description: string;
  allowStrangers: boolean;
  maxMembers: number;
};

export default function WorldSettings({ value, onSave, onCancel, preview = false, creating = false }: {
  value: WorldSettingsValue;
  onSave: (value: WorldSettingsValue) => void | Promise<void>;
  onCancel: () => void;
  preview?: boolean;
  creating?: boolean;
}) {
  const [draft, setDraft] = useState<WorldSettingsValue>(() => ({ name: value.name, description: value.description,
    allowStrangers: value.allowStrangers, maxMembers: value.maxMembers }));
  const [capacity, setCapacity] = useState(String(value.maxMembers));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const maxMembers = Number(capacity);
    if (!draft.name.trim()) { setError('Give your world a name.'); return; }
    if (!Number.isSafeInteger(maxMembers) || maxMembers < 1 || maxMembers > 100) {
      setError('Choose a whole number between 1 and 100 people.'); return;
    }
    setSaving(true); setError('');
    try {
      await onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim(), maxMembers });
    } catch (error) {
      setError(error instanceof Error ? error.message : creating ? 'Could not create your world. Please try again.' : 'Could not save your world settings. Please try again.');
      setSaving(false);
    }
  };
  return <form className="world-settings" onSubmit={event => void submit(event)}>
    <div className="world-settings-intro"><span className="world-owner-badge">{creating ? 'A new beginning' : 'World owner'}</span>
      <p>{creating ? 'Give your little town a name and make it your own.' : 'A little space, with your own rules.'}</p>
      {preview && <p className="world-preview-note">Preview · Changes apply on this device only.</p>}
    </div>
    <fieldset disabled={saving}>
      <label htmlFor="world-name">World name</label>
      <input id="world-name" required maxLength={40} autoComplete="off" value={draft.name}
        onChange={event => setDraft({ ...draft, name: event.target.value })} />
      <label htmlFor="world-description">About this world <span className="world-field-optional">optional</span></label>
      <textarea id="world-description" rows={3} maxLength={240} placeholder="A place for friends, new ideas, and little encounters…"
        value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
      <div className="world-setting-rule">
        <div><label htmlFor="world-strangers">Allow strangers to join</label>
          <p id="world-strangers-help">{draft.allowStrangers ? 'New people can discover and join your world.' : 'Only people with an invitation can join your world.'}</p></div>
        <input id="world-strangers" type="checkbox" role="switch" aria-describedby="world-strangers-help" checked={draft.allowStrangers}
          onChange={event => setDraft({ ...draft, allowStrangers: event.target.checked })} />
      </div>
      <div className="world-setting-rule world-capacity-rule">
        <div><label htmlFor="world-capacity">Maximum people</label><p id="world-capacity-help">Including you. Choose between 1 and 100 people.</p></div>
        <input id="world-capacity" type="number" min={1} max={100} step={1} required inputMode="numeric" aria-describedby="world-capacity-help"
          value={capacity} onChange={event => setCapacity(event.target.value)} />
      </div>
    </fieldset>
    {error && <p className="world-settings-error" role="alert">{error}</p>}
    <div className="world-settings-actions">
      <button type="button" onClick={onCancel} disabled={saving}>Cancel</button>
      <button type="submit" className="primary" disabled={saving}>{saving ? (creating ? 'Creating…' : 'Saving…') : creating ? 'Create world' : 'Save changes'}</button>
    </div>
  </form>;
}
