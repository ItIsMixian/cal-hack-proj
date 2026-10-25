const sentences = new Intl.Segmenter(undefined, { granularity: 'sentence' });

const contentCue = /\b(?:discuss\w*|mention\w*|compar\w*|shar\w*|ask\w*|explain\w*|describ\w*|suggest\w*|said|told|cover\w*|explor\w*|ideas?|questions?|examples?|projects?|plans?)\b|\b(?:talk(?:ed|ing)?|chat(?:ted|ting)?|spoke|speaking)\b.*\b(?:about|on)\b|聊到|聊了|聊起|谈到|谈了|讨论|提到|分享|交换|比较|交流了|说起|讲了|问了|问题|例子|计划|项目|介绍|建议/iu;
const setting = /^(?:I|We)\s+(?:met|was|were|sat|went)\b|^(?:我|我们)(?:在|遇到|碰到)/iu;
const appraisal = /^(?:(?:I|We)\s+(?:enjoyed|liked|appreciated|felt)|(?:He|She|They|The conversation|The chat|It)\s+(?:seemed|was|were|felt))\b|\b(?:seemed|was|were|felt|found (?:him|her|them|the conversation))\s+(?:very\s+|really\s+)?(?:friendly|nice|kind|welcoming|relaxed|pleasant|comfortable)\b|聊得很|交流很|感觉很|很友善|很友好|很亲切|很有趣|很轻松/iu;

// Keep actual content verbatim, including factual detail without a "we discussed" prefix.
// Older setting/appraisal-only sentences are omitted; missing topics are never invented.
export function diaryTopics(text: string): string[] {
  const parts = [...sentences.segment(text)].map(part => part.segment.trim())
    .filter(part => part && part !== "I couldn't put together a fuller diary this time."
      && !/^I was .+, where I talked with .+[.!]$/iu.test(part));
  return parts.filter(part => contentCue.test(part) || (!setting.test(part) && !appraisal.test(part)));
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
