import { useActivityLearning } from './useActivityLearning';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useReducer, useSpacetimeDB, useTable } from 'spacetimedb/react';
import { reducers, tables, type DbConnection } from './module_bindings';
import { clockLabel, currentEvent, findLandmark, townHour } from '../spacetimedb/src/world';
import WorldCanvas from './WorldCanvas';
import WorldNavigator, { WORLD_SLOTS } from './WorldNavigator';
import WorldSettings, { type WorldSettingsValue } from './WorldSettings';
import { readPreviewWorlds, saveWorldPreview } from './WorldPreview';
import EmptyWorld from './EmptyWorld';
import WorldJourney from './WorldJourney';
import PublicTowns from './PublicTowns';
import CreateMirror from './CreateMirror';
import Diary from './Diary';
import MirrorRoom from './MirrorRoom';
import RoomDialog from './RoomDialog';
import CharacterAvatar from './CharacterAvatar';
import { loadRoomArt } from './roomArt';
import { diaryCutoff, readDiaryHistory } from './DiaryHistory';
import { DIARY_CLOSED_EVENT } from './useDiaryWindow';
import type { CameraMode } from './TownCamera';
import MobileShareReview from './MobileShareReview';
import type { MobileShareDraft } from './mobileShare';
import './pixel-room.css';
import './town-game.css';
import { readRoomTour, roomTourKey } from './roomTour';
import './world-settings.css';
import './empty-world.css';

const ResidentStatusCard = lazy(() => import('./ResidentStatusCard'));
const SERVER_WORLDS = import.meta.env.VITE_BACKEND_WORLDS === 'true';
function newInviteToken() {
  return [...crypto.getRandomValues(new Uint8Array(32))].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function useTownClock() {
  const [hour, setHour] = useState(() => townHour(BigInt(Date.now()) * 1000n));
  useEffect(() => {
    const id = setInterval(() => setHour(townHour(BigInt(Date.now()) * 1000n)), 1000);
    return () => clearInterval(id);
  }, []);
  return hour;
}

export default function App({ sessionLabel, onExit, accountMode = false, onSignIn, mobileShare = null, onDiscardShare = () => {} }: {
  sessionLabel: string; onExit: () => void; accountMode?: boolean; onSignIn?: () => Promise<void>;
  mobileShare?: MobileShareDraft | null; onDiscardShare?: () => void;
}) {
  useActivityLearning();
  const { isActive, identity, getConnection } = useSpacetimeDB();
  const [allMirrors] = useTable(tables.visibleMirrors);
  const liveMirrors = useMemo(() => allMirrors.filter(m => m.active !== false), [allMirrors]);
  const [conversations] = useTable(tables.visibleConversations);
  const [lines] = useTable(tables.visibleLines);
  const [serverWorlds, serverWorldsReady] = useTable(tables.myWorlds);
  const enterServerWorld = useReducer(reducers.enterWorld);
  const createServerWorld = useReducer(reducers.createWorld);
  const updateServerWorld = useReducer(reducers.updateWorld);
  const joinServerWorld = useReducer(reducers.joinWorld);
  const joinOpenServerWorld = useReducer(reducers.joinOpenWorld);
  const [myMirrors, myMirrorsReady] = useTable(tables.myMirrors);
  const [archivedMirrors] = useTable(tables.myArchivedMirrors);
  const setOwnMirrorActive = useReducer(reducers.setOwnMirrorActive);
  const [changingResident, setChangingResident] = useState(false);
  const changeResident = async (mirrorId: bigint, active: boolean) => {
    setChangingResident(true);
    try { await setOwnMirrorActive({ mirrorId, active }); }
    catch (e) { setNotice(e instanceof Error ? e.message : String(e)); }
    finally { setChangingResident(false); }
  };
  useEffect(() => {
    if (!myMirrors.length) return;
    const timer = window.setTimeout(() => { void loadRoomArt().catch(() => {}); }, 5000);
    return () => window.clearTimeout(timer);
  }, [myMirrors.length]);
  const [diary] = useTable(tables.myDiary);
  const [importRows] = useTable(tables.myImports);
  const [learningRows] = useTable(tables.myLearning);
  const activeOwnedIds = new Set(myMirrors.map(row => row.id));
  const pendingImport = importRows.find(row => row.status === 'processing' && activeOwnedIds.has(row.mirrorId));
  const latestImport = importRows.filter(row => activeOwnedIds.has(row.mirrorId)).sort((a, b) => a.createdAt.microsSinceUnixEpoch > b.createdAt.microsSinceUnixEpoch ? -1 : 1)[0];
  const failedImport = latestImport?.status === 'failed' ? latestImport : undefined;
  const needsCheck = learningRows.find(row => !row.reviewed && activeOwnedIds.has(row.mirrorId));
  const [creating, setCreating] = useState(false);
  const pendingTour = readRoomTour(roomTourKey(identity?.toHexString() ?? '', import.meta.env.VITE_SPACETIMEDB_DB_NAME ?? 'mirrorville'));
  const [reviewingShare, setReviewingShare] = useState(false);
  const [selected, setSelected] = useState<bigint | null>(null);
  const [notice, setNotice] = useState('');
  const [roomFor, setRoomFor] = useState<bigint | null>(null);
  const [roomOpen, setRoomOpen] = useState(true);
  const [gamePanel, setGamePanel] = useState<'diary' | 'residents' | 'guide' | 'edit-world' | 'create-world' | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('general');
  const [followedId, setFollowedId] = useState<bigint | null>(null);
  const [worldIndex, setWorldIndex] = useState(0);
  const [worldPreviews, setWorldPreviews] = useState(() => readPreviewWorlds(WORLD_SLOTS.map(slot => slot.id)));
  const [previewRole, setPreviewRole] = useState<'owner' | 'visitor'>('owner');
  const [worldBusy, setWorldBusy] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [journeyAnimated, setJourneyAnimated] = useState(false);
  const [journeySlot, setJourneySlot] = useState<number | null>(null);
  const [journeyCreating, setJourneyCreating] = useState(false);
  const [exploringTowns, setExploringTowns] = useState(false);
  const [discoveryReturnToMap, setDiscoveryReturnToMap] = useState(false);
  const [townEntryInvitation, setTownEntryInvitation] = useState<string | null>(null);
  const [journeyDestination, setJourneyDestination] = useState<string | null>(null);
  const [journeyError, setJourneyError] = useState('');
  const [pendingJourneySlot, setPendingJourneySlot] = useState<number | null>(null);
  const journeyAction = useRef(false);
  const [invitation] = useState(() => new URLSearchParams(location.hash.slice(1)).has('invite') ? location.href : '');
  const invitationOpened = useRef(false);
  const accountMenu = useRef<HTMLDetailsElement>(null);
  const worldSlots = useMemo(() => WORLD_SLOTS.map((slot, index) => {
    if (SERVER_WORLDS) {
      const row = serverWorlds.find(world => world.slot === index);
      return row ? { id: String(row.id), name: row.name, exists: true } : { id: slot.id, name: `World ${index + 1}`, exists: false };
    }
    return worldPreviews[slot.id] ? { ...slot, name: worldPreviews[slot.id].name, exists: true } : slot;
  }), [worldPreviews, serverWorlds]);
  const currentWorld = worldSlots[worldIndex];
  const serverWorld = serverWorlds.find(world => world.slot === worldIndex);
  const serverActive = serverWorlds.find(world => world.isCurrent);
  useEffect(() => {
    if (SERVER_WORLDS && serverActive) {
      setWorldIndex(serverActive.slot);
      setRoomFor(null); setSelected(null); setGamePanel(null); setCreating(false); setFollowedId(null);
    }
  }, [serverActive?.id]);
  useEffect(() => {
    if (!journeyOpen || !SERVER_WORLDS || !invitation || !serverWorlds.length || invitationOpened.current) return;
    invitationOpened.current = true;
    const empty = worldSlots.findIndex(world => !world.exists);
    if (empty >= 0) { setWorldIndex(empty); setJourneySlot(empty); }
  }, [journeyOpen, invitation, serverWorlds, worldSlots]);
  const isLiveWorld = SERVER_WORLDS ? !!serverWorld : currentWorld.id === 'town';
  const mirrors = isLiveWorld ? liveMirrors.filter(mirror => !SERVER_WORLDS || mirror.worldId === serverWorld?.id) : [];
  const worldSettings = SERVER_WORLDS ? serverWorld : worldPreviews[currentWorld.id];
  const canEditWorld = currentWorld.exists && (SERVER_WORLDS ? !!serverWorld?.isOwner : previewRole === 'owner');
  const saveSettings = async (value: WorldSettingsValue) => {
    if (SERVER_WORLDS) {
      if (gamePanel === 'create-world') await createServerWorld({ ...value, slot: worldIndex, inviteToken: newInviteToken() });
      else if (serverWorld?.isOwner) await updateServerWorld({ ...value, worldId: serverWorld.id });
      else throw new Error('Only the world creator can edit this world');
      setGamePanel(null);
      return;
    }
    saveWorldPreview(currentWorld.id, value);
    setWorldPreviews(previous => ({ ...previous, [currentWorld.id]: value }));
    if (gamePanel === 'create-world') setPreviewRole('owner');
    setGamePanel(null);
  };
  // A committed reducer call and the membership-scoped subscription must agree
  // before the visual departure. Never move the original world's residents.
  useEffect(() => {
    if (pendingJourneySlot === null || serverActive?.slot !== pendingJourneySlot) return;
    setJourneyDestination(serverActive.name);
    setPendingJourneySlot(null); setWorldBusy(false); journeyAction.current = false;
  }, [pendingJourneySlot, serverActive?.id, serverActive?.slot, serverActive?.name]);
  const enterForJourney = async (slot: number, action: () => Promise<unknown>, joining = false) => {
    if (journeyAction.current) return;
    journeyAction.current = true; setWorldBusy(true); setJourneyError('');
    try {
      await action();
      // The SDK applies reducer-result transactions before resolving the call.
      // Reusing an invitation may return an existing membership in another slot.
      const confirmed = joining ? [...((getConnection() as DbConnection | null)?.db.myWorlds.iter() ?? [])].find(world => world.isCurrent) : null;
      setPendingJourneySlot(confirmed?.slot ?? slot);
    }
    catch (error) { journeyAction.current = false; setWorldBusy(false); throw error; }
  };
  const chooseJourneyWorld = async (index: number) => {
    if (worldBusy || journeyAction.current) return;
    if (!worldSlots[index].exists) { setJourneySlot(index); setJourneyCreating(false); setJourneyError(''); return; }
    if (SERVER_WORLDS) {
      const target = serverWorlds.find(world => world.slot === index);
      if (!target) { setJourneyError('Worlds are still loading. Please try again.'); return; }
      try { await enterForJourney(index, () => enterServerWorld({ worldId: target.id })); }
      catch (error) { setJourneyError(error instanceof Error ? error.message : 'Could not enter this world'); }
    } else { setWorldIndex(index); setJourneyDestination(worldSlots[index].name); }
  };
  const openNewTown = () => {
    const empty = worldSlots.findIndex((world, index) => index > 0 && !world.exists);
    if (empty < 0) { setJourneyError('Your town list is full. You can keep up to 5 towns, including the public town.'); return; }
    setJourneySlot(empty); setJourneyCreating(false); setJourneyError('');
  };
  const joinPublicTown = async (worldId: bigint) => {
    if (!SERVER_WORLDS || worldBusy || journeyAction.current) return;
    const empty = worldSlots.findIndex((world, index) => index > 0 && !world.exists);
    if (empty < 0) { setJourneyError('Your town list is full. You can keep up to 5 towns.'); return; }
    try { await enterForJourney(empty, () => joinOpenServerWorld({ worldId, slot: empty }), true); }
    catch (error) { setJourneyError(error instanceof Error ? error.message : 'Could not join this town. Please try again.'); }
  };
  const beginJourney = (animated = false) => {
    if (worldBusy) return;
    setJourneySlot(null); setJourneyAnimated(animated);
    setDiscoveryReturnToMap(false); setTownEntryInvitation(null);
    setJourneyCreating(false); setExploringTowns(false); setJourneyDestination(null); setJourneyError(''); setJourneyOpen(true);
    setSelected(null); setRoomFor(null); setRoomOpen(false); setGamePanel(null); setCreating(false); setNotice('');
    if (accountMenu.current) accountMenu.current.open = false;
  };
  const changeMapWorld = async (index: number) => {
    if (worldBusy || journeyAction.current) return;
    setTownEntryInvitation(null);
    setSelected(null); setRoomFor(null); setGamePanel(null); setCreating(false); setFollowedId(null); setNotice('');
    if (SERVER_WORLDS && worldSlots[index].exists) {
      const target = serverWorlds.find(world => world.slot === index);
      if (!target || !isActive) { setNotice('Worlds are still connecting. Please try again.'); return; }
      journeyAction.current = true; setWorldBusy(true);
      try {
        await enterServerWorld({ worldId: target.id });
        setWorldIndex(index);
      } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not enter this world'); }
      finally { journeyAction.current = false; setWorldBusy(false); }
    } else setWorldIndex(index);
  };
  const [, refreshDiaryHistory] = useState(0);
  useEffect(() => {
    const refresh = () => refreshDiaryHistory(value => value + 1);
    window.addEventListener(DIARY_CLOSED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(DIARY_CLOSED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);
  const hour = useTownClock();
  const event = currentEvent(hour);

  const mine = useMemo(() => new Set(myMirrors.map((m) => m.id)), [myMirrors]);
  const followed = isLiveWorld ? myMirrors.find(m => m.id === followedId) ?? [...myMirrors].sort((a, b) => a.id < b.id ? -1 : 1)[0] : undefined;
  const followedMirror = followed ? mirrors.find(m => m.id === followed.id) : undefined;
  const byId = useMemo(() => new Map(mirrors.map((m) => [m.id, m])), [mirrors]);
  const historyScope = SERVER_WORLDS ? `/world/${serverActive?.id ?? 'connecting'}` : '';
  const diaryHistory = readDiaryHistory((identity?.toHexString() ?? '') + historyScope);
  const hasNew = gamePanel !== 'diary' && diary.some(entry => entry.createdAt.microsSinceUnixEpoch > diaryCutoff(diaryHistory, entry.mirrorId));

  // Latest line of each active conversation, shown above whoever said it.
  const bubbles = useMemo(() => {
    const active = new Set(conversations.filter((c) => c.active).map((c) => c.id));
    const latest = new Map<bigint, { speaker: bigint; text: string; at: bigint }>();
    for (const l of lines) {
      if (!active.has(l.conversationId)) continue;
      const prev = latest.get(l.conversationId);
      if (!prev || l.at.microsSinceUnixEpoch > prev.at) {
        latest.set(l.conversationId, { speaker: l.speaker, text: l.text, at: l.at.microsSinceUnixEpoch });
      }
    }
    return new Map([...latest.values()].map((l) => [l.speaker, l.text]));
  }, [conversations, lines]);

  const focus = selected !== null ? byId.get(selected) : undefined;
  const myCard = focus ? myMirrors.find((m) => m.id === focus.id) : undefined;

  if (journeyOpen) {
    const slot = journeySlot;
    const joining = slot !== null && !worldSlots[slot].exists;
    return <WorldJourney animated={journeyAnimated} busy={worldBusy} destination={journeyDestination} emptyWorld={joining || exploringTowns} onArrival={() => {
      setJourneyOpen(false); setJourneyDestination(null); setJourneySlot(null); setJourneyCreating(false); setExploringTowns(false);
    }}>
      <fieldset className="journey-options" disabled={worldBusy}>
        {(slot !== null || exploringTowns) && <button className="journey-back" onClick={() => {
          if (exploringTowns && slot !== null) {
            setExploringTowns(false); setJourneyError('');
            if (discoveryReturnToMap) { setJourneyOpen(false); setJourneySlot(null); setDiscoveryReturnToMap(false); }
            return;
          }
          setJourneySlot(null); setJourneyCreating(false); setExploringTowns(false); setJourneyError('');
        }}>{exploringTowns && slot !== null ? '← Back to create or join' : '← Back to towns'}</button>}
        {exploringTowns ? SERVER_WORLDS ? <PublicTowns connected={isActive} busy={worldBusy}
          hasSpace={worldSlots.some((world, index) => index > 0 && !world.exists)} onJoin={joinPublicTown} />
          : <><h2>Public towns</h2><p>Public town discovery is unavailable in preview mode.</p></>
          : joining ? journeyCreating ? <>
          <h2>Create world</h2>
          <WorldSettings creating preview={!SERVER_WORLDS}
            value={{ name: 'My world', description: '', allowStrangers: false, maxMembers: 20 }}
            onCancel={() => setJourneyCreating(false)} onSave={async value => {
              if (SERVER_WORLDS) await enterForJourney(slot, () => createServerWorld({ ...value, slot, inviteToken: newInviteToken() }));
              else {
                saveWorldPreview(worldSlots[slot].id, value);
                setWorldPreviews(previous => ({ ...previous, [worldSlots[slot].id]: value }));
                setWorldIndex(slot); setPreviewRole('owner'); setJourneyDestination(value.name);
              }
            }} />
        </> : <>
          <h2>Create or join a town</h2>
          <EmptyWorld key={slot} initialInvitation={townEntryInvitation ?? invitation} onCreate={() => setJourneyCreating(true)}
            onExplore={link => { setTownEntryInvitation(link); setDiscoveryReturnToMap(false); setExploringTowns(true); setJourneyError(''); }}
            onJoin={SERVER_WORLDS ? async link => {
              const url = new URL(link);
              const token = new URLSearchParams(url.hash.slice(1)).get('invite') ?? url.searchParams.get('invite') ?? '';
              if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('This link does not contain a valid invitation');
              await enterForJourney(slot, () => joinServerWorld({ slot, inviteToken: token }), true);
              history.replaceState(null, '', location.pathname + location.search);
            } : undefined} />
        </> : <>
          <h2>Choose a town</h2>
          <div className="journey-destinations">
            <button disabled={SERVER_WORLDS && !isActive} onClick={() => { setExploringTowns(true); setJourneyError(''); }}>
              <span>Explore the public town</span><span aria-hidden="true">→</span>
            </button>
            <button disabled={SERVER_WORLDS && !isActive} onClick={openNewTown}>
              <span>Create or join a town</span><span aria-hidden="true">＋</span>
            </button>
            {worldSlots.map((world, index) => world.exists && <button key={world.id}
              disabled={!isActive} onClick={() => void chooseJourneyWorld(index)}>
              <span>{world.name}</span><span aria-hidden="true">→</span>
            </button>)}
          </div>
        </>}
        {journeyError && <p className="journey-error" role="alert">{journeyError}</p>}
      </fieldset>
    </WorldJourney>;
  }

  if (roomOpen || roomFor !== null) {
    const firstMirror = [...myMirrors].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)[0];
    return (
      <div className="app mirror-room-app">
        <MirrorRoom mirrorId={roomFor ?? firstMirror?.id ?? null} historyScope={historyScope}
          loading={!isActive || !myMirrorsReady || (SERVER_WORLDS && !serverWorldsReady)}
          onCreate={() => setCreating(true)} onBack={() => beginJourney(true)} />
        {creating && <CreateMirror onClose={() => setCreating(false)} onCreated={() => setCreating(false)} />}
      </div>
    );
  }

  return (
    <div className={`app town-game${currentWorld.exists ? '' : ' town-empty-world'}`}>
      <WorldNavigator selected={worldIndex} onChange={index => void changeMapWorld(index)} worlds={worldSlots} busy={worldBusy} />
      {currentWorld.exists && <div className="town-clock"><strong>{clockLabel(hour)}</strong><span>{event ? event.label : 'A little time in town'}</span></div>}
      {notice && <button className="town-notice" onClick={() => setNotice('')}>{notice} <span>✕</span></button>}
      {(pendingImport || failedImport || needsCheck) && <button className="town-learning-status" onClick={() => setRoomFor(pendingImport?.mirrorId ?? failedImport?.mirrorId ?? needsCheck!.mirrorId)}>{pendingImport ? 'Your mirror is reading… Visit your room' : failedImport ? 'Import could not finish → Retry in your room' : 'Your mirror is ready to check → Open your room'}</button>}
      <main className="town-stage" aria-label={currentWorld.exists ? `${currentWorld.name} map` : `${currentWorld.name}, not created`}>
        <div className="town-map-shell">
          <div className="town-map-frame">{currentWorld.exists && <WorldCanvas key={currentWorld.id} mirrors={mirrors} bubbles={bubbles} mine={mine} selected={selected} onSelect={setSelected} cameraMode={cameraMode} followed={followed?.id ?? null} />}</div>
        </div>
        {!currentWorld.exists && <EmptyWorld key={currentWorld.id} initialInvitation={townEntryInvitation ?? invitation} onCreate={() => setGamePanel('create-world')}
          onExplore={link => {
            beginJourney(false); setJourneySlot(worldIndex); setTownEntryInvitation(link); setDiscoveryReturnToMap(true); setExploringTowns(true);
          }}
          onJoin={SERVER_WORLDS ? async link => {
            const url = new URL(link);
            const token = new URLSearchParams(url.hash.slice(1)).get('invite') ?? url.searchParams.get('invite') ?? '';
            if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('This link does not contain a valid invitation');
            await joinServerWorld({ slot: worldIndex, inviteToken: token });
            history.replaceState(null, '', location.pathname + location.search);
          } : undefined} />}
      </main>
      {currentWorld.exists && <aside className="town-camera-hud" aria-label="Town camera">
        <div className="town-camera-switch" role="group" aria-label="Camera view">
          <button aria-pressed={cameraMode === 'general' || !followed} onClick={() => setCameraMode('general')}>General</button>
          <button aria-pressed={cameraMode === 'follow' && !!followed} disabled={!followed} onClick={() => setCameraMode('follow')}>Follow</button>
        </div>
        {cameraMode === 'follow' && followedMirror ? <>
          {myMirrors.length > 1 ? <select aria-label="Follow your mirror" value={String(followedMirror.id)} onChange={e => setFollowedId(BigInt(e.target.value))}>
            {myMirrors.map(m => <option key={String(m.id)} value={String(m.id)}>{m.name}</option>)}
          </select> : <strong>Following {followedMirror.name}</strong>}
          <span>{followedMirror.conversationId !== 0n ? 'Talking' : followedMirror.activity} · {findLandmark(followedMirror.place).label}</span>
        </> : <><strong>{mirrors.length} mirrors in town</strong><span>{followed ? 'Tap a mirror for its status card' : 'Make a mirror to follow its day'}</span></>}
      </aside>}
      <nav className="town-dock" aria-label="Town actions">
        {mobileShare && <button onClick={() => setReviewingShare(true)} disabled={!isActive}>Review shared item</button>}
        <button onClick={() => setGamePanel('diary')} disabled={!isLiveWorld}><span className="dock-icon" aria-hidden="true">▤</span>Diary{isLiveWorld && hasNew && <span className="dot" aria-label="new" />}</button>
        <button onClick={() => setGamePanel('residents')} disabled={!isLiveWorld}><span className="dock-icon" aria-hidden="true">♧</span>Residents</button>
        {myMirrors.length > 0 && <button onClick={() => { setSelected(null); setRoomFor(myMirrors[0].id); }}><span className="dock-icon" aria-hidden="true">⌂</span>Mirror Room</button>}
        {myMirrors.length === 0 && <button onClick={() => setCreating(true)} disabled={!isActive || !isLiveWorld}><span className="dock-icon" aria-hidden="true">＋</span>Make your mirror</button>}
        <button onClick={() => setGamePanel('guide')} aria-label="Town guide"><span className="dock-icon" aria-hidden="true">?</span><span>Guide</span></button>
        <details ref={accountMenu} className="town-account-menu" onKeyDown={e => { if (e.key === 'Escape') e.currentTarget.open = false; }}>
          <summary aria-label="Menu" title="Menu"><span className="dock-icon" aria-hidden="true">☰</span><span>Menu</span></summary>
          <div className="town-account"><span className={isActive ? 'status on' : 'status'}>{isActive ? 'Live' : 'Connecting…'}</span>
            <span className="session-label" title={`Sign-in identity: ${sessionLabel}`}>{sessionLabel === 'Guest' ? 'Guest session' : sessionLabel}</span>
            {SERVER_WORLDS && serverWorld && <span className="world-role-label" aria-label="Your role in this world">
              {serverWorld.isOwner ? 'World owner' : 'World member'}
            </span>}
            {!SERVER_WORLDS && <label className="world-preview-role">Preview as
              <select value={previewRole} onChange={event => {
                setPreviewRole(event.target.value as 'owner' | 'visitor');
                setGamePanel(null);
              }}><option value="owner">World owner</option><option value="visitor">Visitor</option></select>
            </label>}
            <button onClick={() => beginJourney()}>Travel to a world</button>
            {canEditWorld && <button className="world-edit-button" onClick={() => {
              if (accountMenu.current) accountMenu.current.open = false;
              setGamePanel('edit-world');
            }}>Edit world</button>}
            {SERVER_WORLDS && serverWorld?.isOwner && <button onClick={() => {
              void navigator.clipboard.writeText(`${location.origin}/#invite=${serverWorld.inviteToken}`)
                .then(() => setNotice('Invitation link copied.')).catch(() => setNotice('Could not copy the invitation link.'));
            }}>Copy invitation link</button>}
            {!accountMode && onSignIn && <button onClick={() => void onSignIn().catch(e => setNotice(String(e)))}>Sign in & keep my mirror</button>}
            <button onClick={onExit}>{accountMode ? 'Sign out' : 'Leave town'}</button>
          </div>
        </details>
      </nav>
      {gamePanel && <RoomDialog title={gamePanel === 'create-world' ? 'Create world' : gamePanel === 'edit-world' ? 'Edit world' : gamePanel === 'diary' ? 'Your diary' : gamePanel === 'residents' ? 'Residents' : 'Welcome to Mirrorville'} onClose={() => setGamePanel(null)}>
        {gamePanel === 'create-world' ? !currentWorld.exists && <WorldSettings creating preview={!SERVER_WORLDS}
          value={{ name: 'My world', description: '', allowStrangers: false, maxMembers: 20 }}
          onCancel={() => setGamePanel(null)} onSave={async value => {
            if (currentWorld.exists) throw new Error('World slot is occupied');
            await saveSettings(value);
          }} /> : gamePanel === 'edit-world' ? canEditWorld && worldSettings && <WorldSettings value={worldSettings} preview={!SERVER_WORLDS}
          onCancel={() => setGamePanel(null)} onSave={async value => {
            if (!canEditWorld) throw new Error('World owner required');
            await saveSettings(value);
          }} /> : gamePanel === 'diary' ? <Diary historyScope={historyScope} /> : gamePanel === 'residents' ? <div className="town-roster">
          {mirrors.map(mirror => <div className="resident-row" key={String(mirror.id)}><button onClick={() => { setGamePanel(null); setSelected(mirror.id); }}>
            <CharacterAvatar look={mirror.look} name={mirror.name} /><span><strong>{mirror.name}</strong><small>{mine.has(mirror.id) ? 'Your mirror · ' : ''}#{String(mirror.id)} · {findLandmark(mirror.place).label}</small></span><span aria-hidden="true">→</span>
          </button>{mine.has(mirror.id) && <button disabled={!isActive || changingResident} onClick={() => void changeResident(mirror.id, false)} aria-label={`Move ${mirror.name} #${mirror.id} out of town`}>Move out</button>}</div>)}
          {archivedMirrors.length > 0 && <p>Your mirrors away from town. Their cards and diaries are saved.</p>}
          {archivedMirrors.map(mirror => <div className="resident-row" key={String(mirror.id)}><span>{mirror.name} · #{String(mirror.id)}</span><button disabled={!isActive || changingResident} onClick={() => void changeResident(mirror.id, true)}>Bring back</button></div>)}
        </div> : <div className="town-guide"><p>Your mirrors meet first. Then you do.</p><ol>
          <li>Make a mirror from your AI's summary or your own writing. If you have nothing to import, choose three words. Check its facts in your room.</li>
          <li>Watch it wander, stop for a coffee, and get to know people in town.</li>
          <li>Open your diary whenever you like. Show interest in someone; when you both say yes, contact details appear.</li>
          <li>Visit your Mirror Room to add your own words and choose what your mirror shares.</li>
        </ol><p className="muted">Character art: Cup Nooble · Sprout Lands</p></div>}
      </RoomDialog>}
      {focus && <RoomDialog key={String(focus.id)} title="Status card" onClose={() => setSelected(null)}>
        <Suspense fallback={<p className="muted">Loading status card…</p>}><ResidentStatusCard mirror={focus} mirrors={mirrors} mine={mine} conversations={conversations} lines={lines} isLive={isActive}
          onOpenRoom={myCard ? () => { setSelected(null); setRoomFor(myCard.id); } : undefined} /></Suspense>
      </RoomDialog>}
      {reviewingShare && mobileShare && <RoomDialog title="Your shared item" onClose={() => setReviewingShare(false)}><MobileShareReview key={JSON.stringify(mobileShare)} draft={mobileShare} onClose={() => setReviewingShare(false)} onDone={() => { onDiscardShare(); setReviewingShare(false); setNotice('Your reviewed shared item is being read by your mirror.'); }} onCreate={() => { setReviewingShare(false); setCreating(true); }} /></RoomDialog>}
      {pendingTour && !creating && <button className="town-tour-resume" disabled={!isActive} onClick={() => setCreating(true)}>Continue your room tour →</button>}
      {creating && <CreateMirror sharedDraft={mobileShare} onSharedConsumed={onDiscardShare} onClose={() => setCreating(false)} onCreated={name => {
        setCreating(false); setNotice(`${name} is walking into Mirrorville. Open your diary later to see how the day went.`);
      }} />}
    </div>
  );
}
