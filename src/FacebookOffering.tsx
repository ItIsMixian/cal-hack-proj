import { useEffect, useRef, useState } from 'react';
import { facebookLetter, loadFacebookSdk, readFacebookPosts, type FacebookPost, type FacebookSdk } from './facebook';
import type { WordGift } from './WordOffering';

export default function FacebookOffering({ onBack, onReady, busy }: { onBack: () => void; onReady: (gift: WordGift) => void; busy: boolean }) {
  const appId = String(import.meta.env.VITE_FACEBOOK_APP_ID ?? '').trim();
  const version = String(import.meta.env.VITE_FACEBOOK_GRAPH_VERSION ?? 'v23.0').trim();
  const configured = /^\d+$/.test(appId) && /^v\d+\.0$/.test(version);
  const [sdk, setSdk] = useState<FacebookSdk | null>(null);
  const [working, setWorking] = useState(false);
  const [posts, setPosts] = useState<FacebookPost[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const letter = facebookLetter((posts ?? []).filter(post => selected.includes(post.id)));
  const prepare = async () => {
    setWorking(true); setError('');
    try { const loaded = await loadFacebookSdk(appId, version); if (mounted.current) setSdk(loaded); }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Facebook could not load.'); }
    finally { if (mounted.current) setWorking(false); }
  };
  const connect = () => {
    if (!sdk || working || busy) return;
    controller.current?.abort(); controller.current = new AbortController();
    setPosts(null); setSelected([]); setError(''); setWorking(true);
    // Login is synchronous up to opening the popup; no await between click and FB.login.
    void readFacebookPosts(sdk, controller.current.signal).then(values => {
      if (mounted.current) { setPosts(values); setSelected(values.map(post => post.id)); }
    }).catch(e => { if (mounted.current) setError(e instanceof Error ? e.message : 'Facebook import failed.'); })
      .finally(() => { if (mounted.current) setWorking(false); });
  };
  return <div className="facebook-offering">
    <p className="exchange-line">Bring a few of your Facebook posts to the desk.</p>
    <p className="quiet-note">Only your own text posts from the last 90 days. Choose what to hand over below. Photos, shared links, tagged posts, comments and friends’ feeds stay out.</p>
    {!configured ? <p role="status">Facebook import is not available here yet. You can still paste your own posts or bring a writing file.</p> : <>
      <button disabled={working || busy} onClick={sdk ? connect : () => void prepare()}>{working ? 'Opening Facebook…' : sdk ? posts === null ? 'Connect Facebook & read my posts' : 'Read Facebook again' : 'Prepare Facebook connection'}</button>
      {sdk && posts === null && !working && <p className="quiet-note">The next button opens Facebook’s permission window. This does not change your Mirrorville sign-in.</p>}
      {posts?.length === 0 && <p role="status">No eligible text posts were found in the last 90 days. You can bring your own writing instead.</p>}
      {!!posts?.length && <>
        <p className="quiet-note">{posts.length} eligible posts found. Contact details are covered up here; review for other people’s information before handing over. Dates refer to the posts, not necessarily when an event happened.</p>
        <div className="facebook-posts">{posts.map(post => <div key={post.id} className="facebook-post"><input aria-label={`Include post from ${post.dateLabel}`} type="checkbox" checked={selected.includes(post.id)} disabled={busy || working} onChange={event => setSelected(values => event.target.checked ? [...values, post.id] : values.filter(id => id !== post.id))} /><label><small>{post.dateLabel}</small><textarea aria-label={`Edit post from ${post.dateLabel}`} rows={3} maxLength={4_000} value={post.text} disabled={busy || working} onChange={event => setPosts(values => values?.map(value => value.id === post.id ? { ...value, text: event.target.value } : value) ?? null)} /></label></div>)}</div>
        <p className="quiet-note">Edit out anything about other people. This letter includes {letter.included} of {selected.length} selected posts, up to 29,000 characters, newest first.</p>
        <details className="quiet-note"><summary>Preview the exact letter</summary><pre className="facebook-letter">{letter.text || 'Choose at least one post.'}</pre></details>
        <button className="exchange-primary" disabled={busy || working || letter.characters < 40} onClick={() => onReady({ text: letter.text, latestAt: letter.latestAt, inputKind: 'facts', relation: 'other', source: 'Facebook · own posts' })}>Hand over selected posts ✉</button>
        {selected.length > 0 && letter.characters < 40 && <p className="quiet-note">Choose a little more of your writing — at least 40 characters altogether.</p>}
        <p className="quiet-note">Only the dated letter is sent when you hand it over. Facebook access stays in this browser session. Reading again is manual; there is no background sync.</p>
      </>}
    </>}
    {error && <p role="alert" className="error">{error}</p>}
    <button className="exchange-back" disabled={busy} onClick={onBack}>← Back to my own writing</button>
  </div>;
}
