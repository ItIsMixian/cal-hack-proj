import { useState, type FormEvent } from 'react';

export default function EmptyWorld({ onCreate, onJoin, onExplore, initialInvitation = '' }: {
  onCreate: () => void; onJoin?: (link: string) => Promise<void>; onExplore: (invitation: string) => void; initialInvitation?: string;
}) {
  const [invitation, setInvitation] = useState(initialInvitation);
  const [message, setMessage] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [joining, setJoining] = useState(false);
  const join = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (joining) return;
    try {
      const url = new URL(invitation.trim());
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Unsupported link');
      setInvalid(false);
      if (onJoin) {
        setJoining(true);
        await onJoin(invitation.trim());
        return;
      }
      setMessage('Joining by invitation is coming soon. Keep your link for when shared worlds are ready.');
    } catch (error) {
      setInvalid(true);
      setMessage(error instanceof Error && onJoin ? error.message : 'Enter a complete invitation link starting with https:// or http://.');
    } finally { setJoining(false); }
  };
  return <section className="empty-world-window" aria-labelledby="empty-world-title">
    <header className="empty-world-heading"><span className="empty-world-kicker">A WORLD OF POSSIBILITIES</span>
      <h2 id="empty-world-title">Your next little world</h2>
      <p>Find your people, or make a place for them.</p>
    </header>
    <div className="empty-world-choices">
      <section className="empty-world-choice" aria-labelledby="join-world-title">
        <span className="empty-world-icon" aria-hidden="true">↗</span>
        <h3 id="join-world-title">Join a world</h3>
        <p>Have an invitation? Paste the link your host shared with you.</p>
        <form onSubmit={event => void join(event)} noValidate>
          <label htmlFor="world-invitation">Invitation link</label>
          <input id="world-invitation" type="url" required autoComplete="off" spellCheck={false}
            placeholder="https://…" value={invitation} disabled={joining} aria-invalid={invalid || undefined}
            aria-describedby="world-invitation-help" onChange={event => {
              setInvitation(event.target.value); setMessage(''); setInvalid(false);
            }} />
          <button type="submit" disabled={joining || !invitation.trim()}>{joining ? 'Joining…' : 'Join world'} <span aria-hidden="true">→</span></button>
          <p id="world-invitation-help" className={`empty-world-feedback${invalid ? ' is-error' : ''}`} role={invalid ? 'alert' : 'status'}>
            {message || (onJoin ? 'Join with an invitation from the world creator.' : 'Invitation joining is coming soon in this preview.')}
          </p>
        </form>
      </section>
      <section className="empty-world-choice empty-world-create" aria-labelledby="create-world-title">
        <span className="empty-world-icon" aria-hidden="true">＋</span>
        <h3 id="create-world-title">Create a world</h3>
        <p>A fresh little town for your own circle. Pick a name and choose who can join.</p>
        <div className="empty-world-create-action"><button className="primary" onClick={onCreate}>Create new world <span aria-hidden="true">＋</span></button>
          <p className="empty-world-feedback">{onJoin ? 'Your world, your people, your rules.' : 'Create a preview world on this device.'}</p></div>
      </section>
      <section className="empty-world-choice empty-world-public" aria-labelledby="explore-world-title">
        <span className="empty-world-icon" aria-hidden="true">⌕</span>
        <h3 id="explore-world-title">Find a public town</h3>
        <p>Browse available towns and meet people beyond your own circle.</p>
        <div className="empty-world-create-action">
          <button disabled={joining} onClick={() => onExplore(invitation)}>Explore public towns <span aria-hidden="true">→</span></button>
          <p className="empty-world-feedback">No invitation needed.</p>
        </div>
      </section>
    </div>
  </section>;
}
