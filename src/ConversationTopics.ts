import nlp from 'compromise/two';
import type { RecentConversation } from './ResidentConversations';

export type ConversationTopic = { key: string; label: string; conversationIds: Set<bigint>; lineIds: Set<bigint> };
const generic = new Set('thing things stuff something anything everything nothing someone anyone everyone people person time times day days morning afternoon evening night today tomorrow yesterday way ways lot bit kind kinds part parts idea ideas question questions conversation conversations chat chats hello hi hey thanks goodbye'.split(' '));

// Tags come only from nouns present in the eligible transcripts, never from the venue or profile.
// The English POS tagger does not support every language: unrecognised text remains readable via View all.
export function conversationTopics(exchanges: readonly RecentConversation[]): ConversationTopic[] {
  const topics = new Map<string, ConversationTopic>();
  for (const { conversation, messages } of exchanges) {
    for (const line of messages) {
      const text = line.text.replace(/\[END\]/gu, '').trim();
      const nouns = nlp(text).match('#Noun').not('#Pronoun').not('#Possessive').not('#Person').not('#Date').not('#Value');
      for (const sentence of nouns.json() as { terms: { normal: string; tags: string[] }[] }[]) {
        for (const term of sentence.terms) {
          const key = term.normal.normalize('NFKC').toLocaleLowerCase('en-US');
          if (!/^[a-z][a-z'’-]{1,29}$/iu.test(key) || generic.has(key)) continue;
          const topic = topics.get(key) ?? { key, label: key, conversationIds: new Set<bigint>(), lineIds: new Set<bigint>() };
          topic.conversationIds.add(conversation.id);
          topic.lineIds.add(line.id);
          topics.set(key, topic);
        }
      }
    }
  }
  // Repeated subjects come first; ties retain first appearance in newest-first exchanges.
  return [...topics.values()].sort((a, b) => b.lineIds.size - a.lineIds.size).slice(0, 12);
}
