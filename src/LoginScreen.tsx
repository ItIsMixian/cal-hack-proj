import './login.css';

type Props = {
  onAccount: () => Promise<void>;
  onGuest: () => void;
  busy?: boolean;
  error?: string;
};

// Individual source layers exported from the team's Figma file. Controls and
// labels stay native HTML; the reference screenshot is never used as a UI asset.
export default function LoginScreen({ onAccount, onGuest, busy = false, error = '' }: Props) {
  return (
    <main className="login-screen">
      <LoginArt className="login-landscape" name="village" mobile="village-mobile.webp" />
      <div className="login-stage">
        <LoginArt className="login-signboard" name="signboard" />
        <h1 className="login-brand"><LoginArt name="logo" mobile="logo-mobile.webp" alt="MirrorVille" /></h1>
        <section className="login-form" aria-label="Enter MirrorVille">
          <div className="login-intro">
            <h2>Your mirrors meet first.<br />Then you do.</h2>
          </div>
          <button className="login-submit login-option" type="button" disabled={busy} onClick={() => void onAccount()}>
            <img src="assets/login/button.webp" alt="" draggable={false} />
            <span>{busy ? 'Opening…' : 'Continue with email'}</span>
          </button>
          <button className="login-guest login-option" type="button" disabled={busy} onClick={onGuest}>
            <img src="assets/login/button.webp" alt="" draggable={false} />
            <span>Explore as a guest</span>
          </button>
          <p className="login-guest-note">Guest mirrors stay with this browser.</p>
          <div className="login-feedback" aria-live="polite">{error && <p role="alert">{error}</p>}</div>
        </section>
      </div>
    </main>
  );
}

function LoginArt({ name, className, mobile, alt = '' }: { name: string; className?: string; mobile?: string; alt?: string }) {
  return <picture><source media="(max-width: 600px)" srcSet={mobile ? `assets/login/${mobile}` : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='} />
    <img className={className} src={`assets/login/${name}.webp`} alt={alt} fetchPriority={name === 'logo' ? 'high' : 'auto'} /></picture>;
}
