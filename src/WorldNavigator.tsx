// Only the shared town has a live database. Other slots can hold device-local
// world previews; switching never changes the database connection.
export const WORLD_SLOTS = [
  { id: 'town', name: 'Mirrorville', exists: true },
  { id: 'world-2', name: 'World 2', exists: false },
  { id: 'world-3', name: 'World 3', exists: false },
  { id: 'world-4', name: 'World 4', exists: false },
  { id: 'world-5', name: 'World 5', exists: false },
] as const;

export default function WorldNavigator({ selected, onChange, worlds = WORLD_SLOTS, busy = false }: {
  selected: number; onChange: (index: number) => void;
  worlds?: readonly { id: string; name: string; exists: boolean }[];
  busy?: boolean;
}) {
  const world = worlds[selected];
  const move = (direction: number) => onChange((selected + direction + worlds.length) % worlds.length);
  return <nav className="world-navigator" aria-label="World navigation">
    <div className="world-navigator-row">
      <button className="world-direction world-direction-previous" aria-label="Previous world" disabled={busy} onClick={() => move(-1)}>
        <span aria-hidden="true" />
      </button>
      <div className="world-nameplate">
        <img src="/assets/ui/world-nameplate.png" alt="" width="2172" height="724" draggable={false} />
        <h1 aria-live="polite" aria-atomic="true"><span className="world-name-label" title={world.name}>{world.name}</span><span className="world-screen-reader">{world.exists ? '' : ', not created'}</span></h1>
      </div>
      <button className="world-direction world-direction-next" aria-label="Next world" disabled={busy} onClick={() => move(1)}>
        <span aria-hidden="true" />
      </button>
    </div>
    <ol className="world-indicators" aria-label="Five world slots">
      {worlds.map((slot, index) => <li key={slot.id} className={`world-indicator${slot.exists ? ' is-existing' : ''}${index === selected ? ' is-current' : ''}`}
        aria-current={index === selected ? 'true' : undefined}>
        <span className="world-screen-reader">{slot.name}: {index === selected ? 'current world' : slot.exists ? 'existing world' : 'not created'}</span>
      </li>)}
    </ol>
  </nav>;
}
