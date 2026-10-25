import { useState } from 'react';
import './login.css';

type Props = {
  onAccount: (email: string) => Promise<void>;
  onGuest: () => void;
  busy?: boolean;
  error?: string;
};

// Individual source layers exported from the team's Figma file. Controls and
// labels stay native HTML; the reference screenshot is never used as a UI asset.
export default function LoginScreen({ onAccount, onGuest, busy = false, error = '' }: Props) {
  const [email, setEmail] = useState('');
  const [registering, setRegistering] = useState(false);
  return (
    <main className="login-screen">
      <LoginArt className="login-landscape" name="village" mobile="village-mobile.webp" />
      <div className="login-stage">
        <LoginArt className="login-signboard" name="signboard" />
        <h1 className="login-brand"><LoginArt name="logo" mobile="logo-mobile.webp" alt="MirrorVille" /></h1>
        <form className="login-form" aria-label={registering ? 'Create your MirrorVille account' : 'Log in to MirrorVille'}
          onSubmit={event => { event.preventDefault(); void onAccount(email.trim()); }}>
          <div className="login-email login-field-art">
            <LoginArt name="email" />
            <label className="login-sr-only" htmlFor="login-email">Email address (optional)</label>
            <input id="login-email" name="email" type="email" autoComplete="email" value={email}
              placeholder="Email address" disabled={busy} onChange={event => setEmail(event.target.value)}
              aria-describedby="login-secure-note" />
          </div>
          <div className="login-secure" id="login-secure-note">
            <p>{registering ? 'Create your account with a secure email link' : 'Sign in with a secure link sent to your email'}</p>
          </div>
          <button className="login-submit" type="submit" disabled={busy}>
            <LoginArt name="button" />
            <span>{busy ? 'Opening…' : registering ? 'Sign up' : 'Login'}</span>
          </button>
          <button className="login-switch" type="button" disabled={busy}
            onClick={() => setRegistering(value => !value)}>{registering ? 'back to login' : 'sign up'}</button>
          <div className="login-feedback" aria-live="polite">
            {error ? <p role="alert">{error}</p> : <p>{registering
              ? 'Start with a secure email link.'
              : 'Your mirrors meet first. Then you do.'}</p>}
          </div>
        </form>
        <button className="login-guest" type="button" disabled={busy} onClick={onGuest}>Explore as a guest <span aria-hidden="true">→</span></button>
        <p className="login-guest-note">Guest mirrors stay with this browser.</p>
      </div>
    </main>
  );
}

function LoginArt({ name, className, mobile, alt = '' }: { name: string; className?: string; mobile?: string; alt?: string }) {
  return <picture><source media="(max-width: 600px)" srcSet={mobile ? `/assets/login/${mobile}` : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='} />
    <img className={className} src={`/assets/login/${name}.webp`} alt={alt} fetchPriority={name === 'logo' ? 'high' : 'auto'} /></picture>;
}
