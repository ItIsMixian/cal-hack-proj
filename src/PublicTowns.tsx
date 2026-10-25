import { useEffect, useRef, useState } from 'react';
import { useTable } from 'spacetimedb/react';
import { tables } from './module_bindings';

export default function PublicTowns({ connected, busy, hasSpace, onJoin }: {
  connected: boolean; busy: boolean; hasSpace: boolean; onJoin: (worldId: bigint) => Promise<void>;
}) {
  const [worlds, ready] = useTable(tables.discoverableWorlds);
  const heading = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState('');
  useEffect(() => { heading.current?.focus(); }, []);
  const available = worlds.filter(world => world.memberCount < world.maxMembers)
    .sort((a, b) => a.name.localeCompare(b.name) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const search = query.trim().toLocaleLowerCase();
  const matches = available.filter(world => `${world.name}\n${world.description}`.toLocaleLowerCase().includes(search));
  return <section className="public-towns" aria-labelledby="public-towns-heading" aria-busy={!connected || !ready || busy}>
    <h2 ref={heading} tabIndex={-1} id="public-towns-heading">Public towns</h2>
    <p>Meet new people in towns that welcome strangers. Towns you have joined are in your town list.</p>
    <label className="public-town-search">Search public towns
      <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or introduction" />
    </label>
    {!hasSpace && <p role="status">Your town list is full. You can keep up to 5 towns.</p>}
    {!connected ? <p role="status">Reconnecting to towns…</p>
      : !ready ? <p role="status">Loading public towns…</p>
      : available.length === 0 ? <p role="status">No public towns are available to join right now. Check back later or create a town.</p>
      : matches.length === 0 ? <p role="status">No public towns match your search. Try another name or clear the search.</p>
      : <ul className="public-town-list">{matches.map(world => <li key={String(world.id)}>
        <div className="public-town-details"><h3>{world.name}</h3>
          <p>{world.description || 'A town ready for new faces.'}</p>
          <small>{world.memberCount} / {world.maxMembers} people</small>
        </div>
        <button disabled={busy || !hasSpace} aria-label={`Join ${world.name}`} onClick={() => void onJoin(world.id)}>Join town</button>
      </li>)}</ul>}
  </section>;
}
