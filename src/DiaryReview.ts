const sentences = new Intl.Segmenter(undefined, { granularity: 'sentence' });

const contentCue = /\b(?:discuss\w*|mention\w*|compar\w*|shar\w*|ask\w*|explain\w*|describ\w*|suggest\w*|said|told|cover\w*)\b|\b(?:talk(?:ed|ing)?|chat(?:ted|ting)?|spoke|speaking)\b.*\b(?:about|on)\b|聊到|聊了|聊起|谈到|谈了|讨论|提到|分享|交换|比较|交流了|说起|讲了|问了|介绍|建议/iu;
const setting = /^(?:I|We)\s+(?:met|was|were|sat|went)\b|^(?:我|我们)(?:在|遇到|碰到)/iu;
const appraisal = /^(?:(?:I|We)\s+(?:enjoyed|liked|appreciated|felt)|(?:He|She|They|The conversation|The chat|It)\s+(?:seemed|was|were|felt))\b|\b(?:seemed|was|were|felt|found (?:him|her|them|the conversation))\s+(?:very\s+|really\s+)?(?:friendly|nice|kind|welcoming|relaxed|pleasant|comfortable)\b|聊得很|交流很|感觉很|很友善|很友好|很亲切|很有趣|很轻松/iu;

const action = String.raw`(?:smil\w*|nod\w*|wav\w*|walk\w*|wander\w*|stroll\w*|head\w*|arriv\w*|depart\w*|sat|sit\w*|stood|stand\w*|sipp\w*|drank|drink\w*|laugh\w*|chuckl\w*|gestur\w*|look\w*|glanc\w*|watch\w*|turn\w*|return\w*|resum\w*|continu\w*|work\w*|cod\w*|debug\w*|stretch\w*|paus\w*|wait\w*|decid\w*|tried|try\w*|chose|thought|wonder\w*|notic\w*|mov\w*|settled)`;
const actor = String.raw`(?:I|we|he|she|they|(?:my|the)\s+mirror|[\p{L}'’-]+(?:\s+and\s+(?:I|[\p{L}'’-]+))?)`;
const narrative = new RegExp(String.raw`^(?:(?:then|afterwards|later|finally|meanwhile|while|as|when)\s*,?\s*)?(?:${actor}\s+(?:(?:was|were|am|is|are|had been)\s+)?(?:quietly\s+|back\s+|still\s+)?${action}\b|${action}\b)|^(?:(?:然后|随后|接着|最后|当时|一边|当)\s*)?(?:我|我们|他|她|他们|分身|[\p{Script=Han}]{1,4})(?:正在|继续|又|正|在)?(?:微笑|笑了|点头|挥手|走向|走到|走进|离开|回到|坐在|坐下|站在|站起|喝了|喝着|看向|看了|环顾|转身|伸懒腰|敲着|写代码|调试|决定|尝试)`, 'iu');
const speechAfterAction = /\b(?:and|then)\s+((?:I|we|he|she|they|[\p{L}'’-]+)\s+(?:discussed|mentioned|compared|shared|asked|explained|said|talked about)\b.*)$/iu;
const missing = /^(?:Conversation summary unavailable\.?|I couldn't put together a fuller diary this time\.)$/iu;
const scene = /^(?:the\s+(?:caf[eé]|park|room|sun|sky|air|breeze|weather|fountain)\s+(?:was|were|felt)|(?:咖啡厅|公园|房间|阳光|微风|天气|周围)(?:里|中|的)?(?:很|十分|非常|洒|吹|显得))/iu;
const incidentalAction = new RegExp(String.raw`\s+(?:while|whilst|and then)\s+(?:${actor}\s+)?(?:(?:was|were)\s+)?${action}\b[^.!?。！？]*`, 'giu');

function contentSentence(sentence: string): string {
  if (/^I was .+, where I talked with .+[.!]$/iu.test(sentence)) return '';
  // Drop stage directions and narrative clauses independently, so mixed sentences can
  // retain their spoken topic. Topic words never override a detected action clause.
  const plain = sentence.replace(/\*([^*\n]+)\*/gu, (whole, inner: string) => narrative.test(inner.trim()) ? '' : whole)
    .replace(/\[([^\]\n]+)\]/gu, (whole, inner: string) => narrative.test(inner.trim()) ? '' : whole)
    .replace(incidentalAction, '');
  const clauses = plain.split(/[,;，；]\s*/u).map(clause => {
    let part = clause.trim().replace(/^(?:and|then)\s+/iu, '');
    if (narrative.test(part)) part = part.match(speechAfterAction)?.[1] ?? '';
    if (!part || missing.test(part) || /^[.!?。！？]+$/u.test(part)) return '';
    if (scene.test(part) || (!contentCue.test(part) && (setting.test(part) || appraisal.test(part)))) return '';
    return part;
  }).filter(Boolean);
  const content = clauses.join(/[\p{Script=Han}]/u.test(plain) ? '，' : ', ');
  const end = sentence.match(/[.!?。！？]$/u)?.[0];
  return content && end && !/[.!?。！？]$/u.test(content) ? content + end : content;
}

// Extract only available conversation content; never reconstruct absent topics.
// Legacy prose filtering is heuristic. New notes must follow the server's stricter prompt.
export function diaryTopics(text: string): string[] {
  return [...sentences.segment(text)].map(part => contentSentence(part.segment.trim())).filter(Boolean);
}

const SUMMARY_CHAR_LIMIT = 280;
const SUMMARY_WORD_LIMIT = 50;

// A visit has one compact extractive summary, even when many exchanges were merged.
export function sessionSummary(texts: readonly string[]): string {
  const chosen: string[] = [];
  for (const topic of sessionTopics(texts)) {
    const next = [...chosen, topic].join(' ');
    if (next.length > SUMMARY_CHAR_LIMIT || next.split(/\s+/u).length > SUMMARY_WORD_LIMIT) {
      if (!chosen.length) {
        const words = topic.split(/\s+/u).slice(0, SUMMARY_WORD_LIMIT).join(' ');
        let short = Array.from(words).slice(0, SUMMARY_CHAR_LIMIT - 1).join('');
        // Avoid cutting an English word in half; Chinese can be cut at a character boundary.
        if (short.length < words.length && /[a-z]$/iu.test(short)) short = short.replace(/\s+\S*$/u, '');
        chosen.push(short.replace(/[\s,.!?，。！？]+$/u, '') + '…');
      }
      break;
    }
    chosen.push(topic);
    if (chosen.length === 2) break;
  }
  return chosen.join(' ');
}

export function sessionTopics(texts: readonly string[]): string[] {
  const seen = new Set<string>();
  return texts.flatMap(diaryTopics).filter(topic => {
    const key = topic.normalize('NFKC').toLocaleLowerCase().replace(/\s+/gu, ' ').replace(/[.!?。！？]+$/u, '').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
