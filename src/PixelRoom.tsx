import { useState } from 'react';
import CharacterAvatar from './CharacterAvatar';

export type RoomObject = 'mirror' | 'diary' | 'cards' | 'desk' | 'contacts';
const objects: { id: RoomObject; label: string; hint: string }[] = [
  { id: 'mirror', label: 'Mirror', hint: 'See yourself through your mirror’s eyes.' },
  { id: 'cards', label: 'Card collection', hint: 'Little pieces of you. Choose what comes along.' },
  { id: 'desk', label: 'Writing desk', hint: 'Bring your own words. Let your mirror get to know you.' },
  { id: 'diary', label: 'Diary', hint: 'Where I went, who I met. Open a page from my day.' },
  { id: 'contacts', label: 'Address book', hint: 'Leave a way to say hello, shared only when you both say yes.' },
];

export default function PixelRoom({ name, look, onOpen }: { name: string; look: number; onOpen: (object: RoomObject) => void }) {
  const [hover, setHover] = useState<RoomObject | null>(null);
  return <div className="room-world">
    <div className="room-scene" aria-label="Your pixel room. Choose an object to explore.">
      <svg className="room-interior" viewBox="0 0 720 460" preserveAspectRatio="none" fill="none" aria-hidden="true" shapeRendering="crispEdges">
        <path fill="#594d41" d="M12 12H708V448H12z" />
        <path fill="#eadcbb" d="M20 20H700V172H20z" />
        <path fill="#b6c5a1" d="M20 20H700V52H20z" />
        {Array.from({ length: 17 }, (_, i) => <path key={i} fill="#d7c9a9" d={`M${28 + i * 40} 56h2v104h-2z`} />)}
        <path fill="#a78863" d="M20 160H700V182H20z" />
        <path fill="#d4ab7f" d="M20 182H700V436H20z" />
        {Array.from({ length: 8 }, (_, i) => <g key={i}>
          <path stroke="#b98e65" strokeWidth="2" d={`M20 ${190 + i * 32}H700`} />
          {Array.from({ length: 5 }, (_, j) => <path key={j} stroke="#b98e65" strokeWidth="2" d={`M${(i % 2 ? 65 : 125) + j * 144} ${190 + i * 32}v32`} />)}
        </g>)}
        <path fill="#8b6b50" d="M20 436H700V442H20z" />
        <path fill="#c59b70" d="M20 182H700V191H20z" />
        {/* Window, curtains and a patch of afternoon light. */}
        <path fill="#9c7858" d="M84 64h120v91H84z" />
        <path fill="#a3c9c0" d="M90 70h108v76H90z" />
        <path fill="#d7e6cf" d="M94 110h100v32H94z" />
        <path fill="#f9f0d4" d="M103 85h28v6h-28zM164 95h24v6h-24z" />
        <path fill="#f4e8ca" d="M140 70h6v76h-6zM90 108h108v5H90z" />
        <path fill="#7f9b7b" d="M76 60h20v82H76zM192 60h20v82h-20z" />
        <path fill="#d7b88b" d="M88 195h124l54 104H130z" opacity=".55" />
        {/* Shelves with books and keepsakes. */}
        <path fill="#927050" d="M494 63h154v9H494zM494 117h154v9H494z" />
        <path fill="#ddad82" d="M508 35h12v28h-12z" /><path fill="#a2b899" d="M522 30h14v33h-14z" />
        <path fill="#b87c6b" d="M540 39h10v24h-10z" /><path fill="#f4e7c9" d="M554 35h12v28h-12z" />
        <path fill="#789977" d="M601 40h26v14h-26zM609 31h10v30h-10z" /><path fill="#be8b6d" d="M605 53h19v10h-19z" />
        {/* Woven rug and a soft seat. */}
        <path fill="#bc966e" d="M264 256h204v117H264z" />
        <path fill="#7e9875" d="M256 248h208v117H256z" />
        <path stroke="#bdc39b" strokeWidth="5" d="M266 258h188v97H266z" />
        <path stroke="#99ac88" strokeWidth="3" d="M278 270h164v73H278z" />
        <path fill="#a5b491" d="M351 288h18v18h-18zM342 306h36v9h-36zM351 315h18v18h-18z" />
        <path fill="#b28a66" d="M555 257h95v64h-95z" /><path fill="#e4c3a0" d="M550 238h100v58H550z" />
        <path fill="#efe0bb" d="M557 244h86v32h-86z" /><path fill="#b9c1a0" d="M562 248h28v24h-28z" />
        <path fill="#927052" d="M556 297h7v31h-7zM636 297h7v31h-7z" />
        {/* Plant beside the doorway. */}
        <path fill="#ad795d" d="M54 357h30v28H54z" /><path fill="#d9a77d" d="M50 350h38v9H50z" />
        <path fill="#78976a" d="M65 304h8v48h-8zM45 317h24v13H45zM70 309h24v13H70zM52 337h20v11H52zM72 328h21v11H72z" />
        <path fill="#6c865d" d="M45 317h9v13h-9zM84 309h10v13H84z" />
        <path fill="#907153" d="M320 420h80v16h-80z" /><path fill="#e7cc99" d="M328 424h64v8h-64z" />
      </svg>
      {objects.map(object => <button key={object.id} className={`room-object room-object-${object.id}`}
        aria-label={`Open ${object.label}`} onClick={() => onOpen(object.id)}
        onMouseEnter={() => setHover(object.id)} onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(object.id)} onBlur={() => setHover(null)}>
        <ObjectArt object={object.id} /><span>{object.label}</span>
      </button>)}
      <button className="room-resident" aria-label={`Talk to ${name}'s mirror`} onClick={() => onOpen('mirror')}
        onFocus={() => setHover('mirror')} onBlur={() => setHover(null)}>
        <CharacterAvatar name={name} look={look} /><span>{name}</span>
      </button>
    </div>
    <div className="room-dialogue"><span className="room-dialogue-mark" aria-hidden="true">✦</span>
      <div><strong>{hover ? objects.find(object => object.id === hover)?.label : 'A little place to be yourself.'}</strong>
        <p>{hover ? objects.find(object => object.id === hover)?.hint : 'Make yourself at home. Click an object to take a closer look.'}</p></div>
      <span className="room-key-hint">Tab · Enter</span>
    </div>
  </div>;
}

function ObjectArt({ object }: { object: RoomObject }) {
  return <svg viewBox="0 0 96 96" aria-hidden="true" fill="none" shapeRendering="crispEdges">
    {object === 'mirror' && <>
      <path fill="#795b44" d="M24 8h48v8h8v68H16V16h8z" /><path fill="#cda776" d="M28 12h40v8h8v60H20V20h8z" />
      <path fill="#75938c" d="M30 20h36v8h6v44H24V28h6z" /><path fill="#c0d9ce" d="M34 24h28v8h6v36H28V32h6z" />
      <path fill="#e7efda" d="M34 37h5v26h-5zM40 31h5v20h-5z" /><path fill="#ad855b" d="M12 80h72v8H12z" />
      <path fill="#f9e8ad" d="M70 28h4v4h4v4h-4v4h-4v-4h-4v-4h4z" />
    </>}
    {object === 'desk' && <>
      <path fill="#846044" d="M8 49h80v16H8zM14 65h9v27h-9zM73 65h9v27h-9z" /><path fill="#cf9f6c" d="M4 40h88v13H4z" />
      <path fill="#e1b784" d="M9 43h78v5H9z" /><path fill="#b58458" d="M53 56h28v17H53z" /><path fill="#eed099" d="M64 61h8v4h-8z" />
      <path fill="#f4e7c5" d="M22 31h27v12H22z" /><path stroke="#b59c77" strokeWidth="2" d="M27 35h16M27 39h12" />
      <path fill="#597b65" d="M66 9h6v26h-6zM60 33h20v6H60z" /><path fill="#e5c384" d="M58 7h22v12H58zM54 15h30v7H54z" />
      <path fill="#7b5d45" d="M29 66h26v7H29zM33 73h5v20h-5zM49 73h5v20h-5z" />
    </>}
    {object === 'cards' && <>
      <path fill="#795e48" d="M8 39h80v44H8z" /><path fill="#a77d55" d="M12 35h72v39H12z" />
      <path fill="#e7dbc2" d="M18 15h24v34H18z" /><path fill="#a7b493" d="M23 21h14v5H23z" />
      <path fill="#f7e9c9" d="M35 10h26v39H35z" /><path fill="#b68870" d="M40 16h16v5H40z" />
      <path fill="#e0cfb2" d="M57 20h20v29H57z" /><path fill="#829b91" d="M61 26h12v5H61z" />
      <path fill="#c69d6f" d="M8 47h80v31H8z" /><path fill="#f1dfb4" d="M35 56h26v12H35z" /><path fill="#927354" d="M42 60h12v4H42z" />
      <path fill="#86664d" d="M4 78h88v7H4z" />
    </>}
    {object === 'diary' && <>
      <path fill="#967354" d="M8 66h80v13H8zM16 79h7v14h-7zM73 79h7v14h-7z" />
      <path fill="#644e40" d="M14 20h68v44H14z" /><path fill="#c4d1ab" d="M17 17h29v43H17z" />
      <path fill="#eee4c6" d="M49 17h30v43H49z" /><path fill="#7c936d" d="M43 17h7v47h-7z" />
      <path stroke="#adab8a" strokeWidth="2" d="M24 27h13M24 34h13M24 41h9M56 27h16M56 34h16M56 41h11" />
      <path fill="#c48269" d="M62 48h7v24l-4-4-3 4z" />
    </>}
    {object === 'contacts' && <>
      <path fill="#967354" d="M8 66h80v13H8zM16 79h7v14h-7zM73 79h7v14h-7z" />
      <path fill="#795641" d="M25 9h47v55H25z" /><path fill="#bd806a" d="M28 6h40v53H28z" />
      <path fill="#e0a089" d="M32 10h32v5H32z" /><path fill="#e4cca3" d="M39 22h17v17H39z" />
      <path fill="#bd806a" d="M44 24h7v6h-7zM42 32h11v6H42z" /><path fill="#f6e6c6" d="M23 14h7v4h-7zM23 29h7v4h-7zM23 44h7v4h-7zM68 17h7v8h-7zM68 32h7v8h-7z" />
    </>}
  </svg>;
}
