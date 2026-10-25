import type { CSSProperties } from 'react';
import { LOOK_COLORS } from '../spacetimedb/src/world';
import CharacterSprite from './CharacterSprite';

export default function CharacterAvatar({ look, name = 'Your mirror' }: { look: number; name?: string }) {
  return <div className="character-avatar" role="img" aria-label={`${name}'s character`}
    style={{ '--character-color': LOOK_COLORS[look % LOOK_COLORS.length] } as CSSProperties}>
    <CharacterSprite look={look} />
  </div>;
}
