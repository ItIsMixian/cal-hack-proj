import { useEffect, useState } from 'react';
import { FACING_X, characterSheetUrl, loadCharacterSheets, type CharacterFacing } from './characterSprites';

export default function CharacterSprite({ look, facing = 'down', frame = 1, className = 'character-avatar-sprite' }: {
  look: number; facing?: CharacterFacing; frame?: number; className?: string;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void loadCharacterSheets().then(() => { if (alive) setReady(true); }).catch(() => { /* Original atlas remains visible. */ });
    return () => { alive = false; };
  }, []);
  return <span className={className} aria-hidden="true" data-character-ready={ready}
    style={{ backgroundImage: `url("${characterSheetUrl(look)}")`, backgroundPosition: `${-FACING_X[facing]}px ${-frame * 32}px` }} />;
}
