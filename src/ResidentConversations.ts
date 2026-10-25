import type { ConversationStorage as Conversation, LineStorage as Line } from './module_bindings/types';

export const RECENT_CHAT_LIMIT = 5;
const RECENT_WINDOW_US = 7n * 24n * 60n * 60n * 1_000_000n;
export type RecentConversation = { conversation: Conversation; messages: Line[]; at: bigint };

export function recentConversations(subjectId: bigint, mine: ReadonlySet<bigint>, conversations: readonly Conversation[],
  lines: readonly Line[], now: bigint): RecentConversation[] {
  const eligible = conversations.filter(c => (c.a === subjectId || c.b === subjectId) && (mine.has(c.a) || mine.has(c.b)));
  const byConversation = new Map<bigint, Line[]>();
  const eligibleIds = new Map(eligible.map(c => [c.id, c]));
  for (const line of lines) {
    const c = eligibleIds.get(line.conversationId);
    if (!c || (line.speaker !== c.a && line.speaker !== c.b)) continue;
    const messages = byConversation.get(c.id);
    if (messages) messages.push(line);
    else byConversation.set(c.id, [line]);
  }
  return eligible.map(conversation => {
    const messages = (byConversation.get(conversation.id) ?? []).sort((a, b) => a.at.microsSinceUnixEpoch < b.at.microsSinceUnixEpoch ? -1
      : a.at.microsSinceUnixEpoch > b.at.microsSinceUnixEpoch ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    const at = messages.reduce((latest, line) => line.at.microsSinceUnixEpoch > latest ? line.at.microsSinceUnixEpoch : latest,
      conversation.startedAt.microsSinceUnixEpoch);
    return { conversation, messages, at };
  }).filter(c => c.at >= now - RECENT_WINDOW_US)
    .sort((a, b) => a.at > b.at ? -1 : a.at < b.at ? 1 : a.conversation.id > b.conversation.id ? -1 : a.conversation.id < b.conversation.id ? 1 : 0)
    .slice(0, RECENT_CHAT_LIMIT);
}
