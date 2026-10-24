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
      <img className="login-landscape" src="/assets/login/village.png" alt="" />
      <div className="login-stage">
        <img className="login-signboard" src="/assets/login/signboard.png" alt="" />
        <h1 className="login-brand"><img src="/assets/login/logo.png" alt="MirrorVille" /></h1>
        <form className="login-form" aria-label={registering ? 'Create your MirrorVille account' : 'Log in to MirrorVille'}
          onSubmit={event => { event.preventDefault(); void onAccount(email.trim()); }}>
          <div className="login-email login-field-art">
            <img src="/assets/login/email.png" alt="" />
            <label className="login-sr-only" htmlFor="login-email">Email address (optional)</label>
            <input id="login-email" name="email" type="email" autoComplete="email" value={email}
              placeholder="Email address" disabled={busy} onChange={event => setEmail(event.target.value)}
              aria-describedby="login-secure-note" />
          </div>
          <div className="login-secure login-field-art" id="login-secure-note">
            <img src="/assets/login/password.png" alt="" />
            <p>{registering ? 'Create your account with a secure email link' : 'Sign in with a secure link sent to your email'}</p>
          </div>
          <button className="login-submit" type="submit" disabled={busy}>
            <img src="/assets/login/button.png" alt="" />
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
