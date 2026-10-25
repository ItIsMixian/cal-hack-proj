import { useEffect, useState } from 'react';
import CharacterAvatar from './CharacterAvatar';
import scene from './homeScene.json';
import { loadRoomArt, roomArtUrl } from './roomArt';

export type RoomObject = 'mirror' | 'diary' | 'cards' | 'desk' | 'contacts';
const objects: { id: RoomObject; node?: string; label: string; hint: string }[] = [
  { id: 'mirror', node: 'Mirror', label: 'Mirror', hint: 'See yourself through your mirror’s eyes.' },
  { id: 'cards', node: 'Carddesk', label: 'Card collection', hint: 'Little pieces of you. Choose what comes along.' },
  { id: 'desk', node: 'Bookshelf', label: 'Your words', hint: 'Bring your own words. Let your mirror get to know you.' },
  { id: 'diary', node: 'Diary', label: 'Diary', hint: 'Where I went, who I met. Open a page from my day.' },
  { id: 'contacts', label: 'Address book', hint: 'Leave a way to say hello, shared only when you both say yes.' },
];
// Camera around the authored composition, including the bookshelf's slight overhang.
const BOUNDS = { x: -395, y: -390, width: 830, height: 800 };
function placement(node: typeof scene.nodes[number]) {
  const width = node.size[0] * node.scale[0], height = node.size[1] * node.scale[1];
  return { left: `${(node.position[0] - width / 2 - BOUNDS.x) / BOUNDS.width * 100}%`,
    top: `${(node.position[1] - height / 2 - BOUNDS.y) / BOUNDS.height * 100}%`,
    width: `${width / BOUNDS.width * 100}%`, height: `${height / BOUNDS.height * 100}%` };
}

export default function PixelRoom({ name, look, onOpen, welcome = false }: { name: string; look: number; welcome?: boolean; onOpen: (object: RoomObject) => void }) {
  const [hover, setHover] = useState<RoomObject | null>(null);
  const [art, setArt] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setArt('loading');
    loadRoomArt().then(() => { if (active) setArt('ready'); }, () => { if (active) setArt('error'); });
    return () => { active = false; };
  }, [attempt]);
  const background = scene.nodes.find(node => node.name === 'Background')!;
  const interactive = scene.nodes.filter(node => node.name !== 'Background');
  return <div className="room-world room-world-authored" aria-busy={art === 'loading'}>
    {art !== 'ready' && <div className="room-art-loading" role="status">
      <p>{art === 'error' ? 'The room artwork could not load.' : 'Opening your Mirror Room…'}</p>
      {art === 'error' && <button onClick={() => setAttempt(n => n + 1)}>Retry</button>}
    </div>}
    <div className="room-scene room-scene-authored" style={{ visibility: art === 'ready' ? 'visible' : 'hidden' }} aria-label="Your pixel room. Choose an object to explore.">
      <img className="home-background" style={placement(background)} src={roomArtUrl(background.file)} alt="" draggable={false} />
      {interactive.map(node => {
        const object = objects.find(object => object.node === node.name)!;
        if (welcome && object.id !== 'mirror' && object.id !== 'desk') return <img key={object.id} className="welcome-furniture" style={placement(node)} src={roomArtUrl(node.file)} alt="" draggable={false} />;
        return <button key={object.id} className={`room-object home-object home-object-${object.id}`} style={placement(node)}
          aria-label={`Open ${object.id === 'desk' ? 'Writing desk' : object.label}`} onClick={() => onOpen(object.id)}
          onMouseEnter={() => setHover(object.id)} onMouseLeave={() => setHover(null)}
          onFocus={() => setHover(object.id)} onBlur={() => setHover(null)}>
          <img src={roomArtUrl(node.file)} alt="" draggable={false} /><span>{welcome ? object.id === 'desk' ? 'Your letters' : 'Your reflection' : object.label}</span>
        </button>;
      })}
      {!welcome && <button className="room-object home-contacts" aria-label="Open Address book" onClick={() => onOpen('contacts')}
        onMouseEnter={() => setHover('contacts')} onMouseLeave={() => setHover(null)}
        onFocus={() => setHover('contacts')} onBlur={() => setHover(null)}><span>✉ Address book</span></button>}
      <button className="room-resident home-resident" aria-label={`Talk to ${name}'s mirror`} onClick={() => onOpen('mirror')}
        onFocus={() => setHover('mirror')} onBlur={() => setHover(null)}>
        <CharacterAvatar name={name} look={look} /><span>{name}</span>
      </button>
    </div>
    {!welcome && <div className="room-dialogue"><span className="room-dialogue-mark" aria-hidden="true">✦</span>
      <div><strong>{hover ? objects.find(object => object.id === hover)?.label : 'A little place to be yourself.'}</strong>
        <p>{hover ? objects.find(object => object.id === hover)?.hint : 'Make yourself at home. Click an object to take a closer look.'}</p></div>
      <span className="room-key-hint">Tab · Enter</span>
    </div>}
  </div>;
}
