export const CHARACTER_LOOKS = [
  { id: 0, name: 'Original' },
  { id: 1, name: 'Rust' },
  { id: 2, name: 'Sage' },
  { id: 3, name: 'Honey' },
  { id: 4, name: 'Coral' },
] as const;
export const FACING_X = { up: 0, right: 32, down: 64, left: 96 };
export type CharacterFacing = keyof typeof FACING_X;
export const originalCharacterUrl = `${import.meta.env.BASE_URL}assets/characters/cup-nooble-character.png`;
const sheets = new Map<number, HTMLImageElement>();
let loading: Promise<void> | undefined;
const files = ['rust', 'sage', 'honey', 'coral'];

export function loadCharacterSheets() {
  return loading ??= Promise.all(files.map((name, index) => new Promise<[number, HTMLImageElement]>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      if (image.naturalWidth !== 128 || image.naturalHeight !== 96) { reject(new Error('Invalid character atlas')); return; }
      resolve([index + 1, image]);
    };
    image.onerror = () => reject(new Error('Character artwork could not load'));
    image.src = `${import.meta.env.BASE_URL}assets/characters/mirrorville-${name}.png`;
  }))).then(images => { for (const [id, image] of images) sheets.set(id, image); })
    .catch(error => { loading = undefined; throw error; });
}

export function characterSheet(look: number, original: HTMLImageElement): CanvasImageSource {
  return sheets.get(look) ?? original;
}
export function characterSheetUrl(look: number) { return sheets.get(look)?.src ?? originalCharacterUrl; }
