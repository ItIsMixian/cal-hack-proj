// Turns an export into just the owner's own words, entirely in the browser.
import { redact } from '../spacetimedb/src/redact';

// Covers the common WhatsApp export layouts:
//   12/31/23, 9:41 PM - Name: message
//   [31/12/2023, 21:41:05] Name: message
const WHATSAPP_LINE =
  /^‎?\[?(\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}),?\s+(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s?[APap]\.?[Mm]\.?)?)\]?\s*(?:-|–)?\s*([^:]{1,60}):\s?(.*)$/;

const SKIP = /<media omitted>|image omitted|video omitted|sticker omitted|this message was deleted|messages and calls are end-to-end encrypted/i;

export type ParsedChat = {
  // Speaker name -> how many messages they sent.
  speakers: Map<string, number>;
  lines: { speaker: string; text: string }[];
};

export function parseWhatsApp(text: string): ParsedChat | null {
  const lines: { speaker: string; text: string }[] = [];
  const speakers = new Map<string, number>();
  let matched = 0;
  for (const raw of text.split(/\r?\n/)) {
    const m = WHATSAPP_LINE.exec(raw);
    if (m) {
      matched++;
      const speaker = m[3].trim();
      const body = m[4].trim();
      if (!body || SKIP.test(body)) continue;
      lines.push({ speaker, text: body });
      speakers.set(speaker, (speakers.get(speaker) ?? 0) + 1);
    } else if (lines.length && raw.trim()) {
      // Continuation of a multi-line message.
      lines[lines.length - 1].text += ' ' + raw.trim();
    }
  }
  return matched >= 3 ? { speakers, lines } : null;
}

export function ownWords(chat: ParsedChat, me: string): string {
  return redact(
    chat.lines
      .filter((l) => l.speaker === me)
      .map((l) => l.text)
      .join('\n'),
  );
}
