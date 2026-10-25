export type DiarySource = { id: string; kind: 'card' | 'intent' | 'topic'; text: string };
export const SOURCE_MARKER = '\n\n[mirrorville-source-v1]\n';

// Only attach a source supplied to the model AND still shared unchanged at commit.
export function diaryWithSource(raw: unknown, selected: unknown, offered: DiarySource[], current: DiarySource[]): string {
  const body = typeof raw === 'string' ? raw.split('[mirrorville-source-v1]')[0].split(/\n\s*From their info:/i)[0].trim().slice(0, 1000) : '';
  const source = typeof selected === 'string' ? offered.find(item => item.id === selected) : undefined;
  const checked = source && current.some(item => item.id === source.id && item.kind === source.kind && item.text === source.text);
  return (body || 'Conversation summary unavailable.') + (checked ? SOURCE_MARKER + JSON.stringify(source) : '');
}
