// Turns an export into just the owner's own words, entirely in the browser.
import { redact } from '../spacetimedb/src/redact';

export type WeChatImport = { text: string; total: number; kept: number; dropped: number; latestAt: string };

// RFC-style comma/quote handling, including embedded newlines and escaped quotes.
// Reject ambiguous files instead of treating a failed chat export as own writing.
function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false, closed = false;
  const input = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"') {
        if (input[i + 1] === '"') { cell += '"'; i++; }
        else { quoted = false; closed = true; }
      } else cell += ch;
    } else if (ch === ',') {
      row.push(cell); cell = ''; closed = false;
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++;
      row.push(cell);
      if (row.some(value => value.trim())) rows.push(row);
      row = []; cell = ''; closed = false;
    } else if (ch === '"') {
      if (cell || closed) throw new Error('Invalid CSV quoting. Please export it again.');
      quoted = true;
    } else {
      if (closed) throw new Error('Invalid CSV quoting. Please export it again.');
      cell += ch;
    }
  }
  if (quoted) throw new Error('Incomplete CSV quoted field. Please export it again.');
  row.push(cell);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

export function looksLikeWeChatCsv(text: string): boolean {
  return /(?:is_sender|MsgSvrID|type_name)/i.test(text.split(/\r?\n/, 1)[0]);
}

export function parseWeChatCsv(text: string): WeChatImport {
  const [header, ...rows] = csvRows(text);
  const columns = header?.map(value => value.trim()) ?? [];
  if (new Set(columns).size !== columns.length || !['is_sender', 'type_name', 'msg'].every(key => columns.includes(key))) {
    throw new Error('This CSV is not a supported PyWxDump export. It needs is_sender, type_name and msg columns.');
  }
  const sender = columns.indexOf('is_sender'), type = columns.indexOf('type_name'), body = columns.indexOf('msg');
  const own: string[] = [];
  const time = columns.findIndex(column => /^(CreateTime|create_time|SendTime|timestamp|datetime|time|date|时间|消息时间)$/i.test(column));
  let latestAt = "";
  for (const row of rows) {
    if (row.length !== columns.length) throw new Error('CSV columns do not match. Please export it again.');
    const flag = row[sender].trim();
    if (flag !== '0' && flag !== '1') throw new Error('Unrecognized is_sender value. Cannot safely identify your messages.');
    // Plain text only: quote replies and forwarded chats can include others' words.
    if (flag !== '1' || row[type].trim() !== '文本') continue;
    const message = row[body].trim();
    if (message) { own.push(message); if (time >= 0) latestAt = newestDate(latestAt, messageDate(row[time])); }
  }
  return { text: redact(own.join('\n')), total: rows.length, kept: own.length, dropped: rows.length - own.length, latestAt };
}

export function decodeImportFile(bytes: ArrayBuffer): string {
  const data = new Uint8Array(bytes);
  const encoding = data[0] === 0xff && data[1] === 0xfe ? 'utf-16le'
    : data[0] === 0xfe && data[1] === 0xff ? 'utf-16be' : 'utf-8';
  try { return new TextDecoder(encoding, { fatal: true }).decode(data); }
  catch { throw new Error('Please export this file as UTF-8 CSV or text. Its encoding could not be read safely.'); }
}

// Covers the common WhatsApp export layouts:
//   12/31/23, 9:41 PM - Name: message
//   [31/12/2023, 21:41:05] Name: message
const WHATSAPP_LINE =
  /^‎?\[?(\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4}),?\s+(\d{1,2}[:.]\d{2}(?:[:.]\d{2})?(?:\s?[APap]\.?[Mm]\.?)?)\]?\s*(?:-|–)?\s*([^:]{1,60}):\s?(.*)$/;

const SKIP = /<media omitted>|image omitted|video omitted|sticker omitted|this message was deleted|messages and calls are end-to-end encrypted/i;

export type ParsedChat = {
  // Speaker name -> how many messages they sent.
  speakers: Map<string, number>;
  lines: { speaker: string; text: string; at: string }[];
  latestAt: string;
};

export function parseWhatsApp(text: string): ParsedChat | null {
  const lines: { speaker: string; text: string; at: string }[] = [];
  const speakers = new Map<string, number>();
  let matched = 0;
  for (const raw of text.split(/\r?\n/)) {
    const m = WHATSAPP_LINE.exec(raw);
    if (m) {
      matched++;
      const speaker = m[3].trim();
      const body = m[4].trim();
      if (!body || SKIP.test(body)) continue;
      lines.push({ speaker, text: body, at: messageDate(m[1]) });
      speakers.set(speaker, (speakers.get(speaker) ?? 0) + 1);
    } else if (lines.length && raw.trim()) {
      // Continuation of a multi-line message.
      lines[lines.length - 1].text += ' ' + raw.trim();
    }
  }
  return matched >= 3 ? { speakers, lines, latestAt: lines.reduce((date, line) => newestDate(date, line.at), '') } : null;
}

export function ownWords(chat: ParsedChat, me: string): string {
  return redact(
    chat.lines
      .filter((l) => l.speaker === me)
      .map((l) => l.text)
      .join('\n'),
  );
}

// UTC midnight avoids relying on the machine's timezone for date-only exports.
export function messageDate(value: string): string {
  const input = value.trim();
  if (/^\d{10}(?:\d{3})?$/.test(input)) {
    const date = new Date(Number(input) * (input.length === 10 ? 1000 : 1));
    return Number.isFinite(date.getTime()) ? date.toISOString() : '';
  }
  const match = /^(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4})/.exec(input);
  if (!match) return '';
  const a = Number(match[1]), b = Number(match[2]), c = Number(match[3]);
  const yearFirst = match[1].length === 4;
  let year = yearFirst ? a : c;
  if (year < 100) year += year >= 70 ? 1900 : 2000;
  const month = yearFirst ? b : a > 12 ? b : a;
  const day = yearFirst ? c : a > 12 ? a : b;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date.toISOString() : '';
}
export function newestDate(...dates: string[]): string { return dates.filter(Boolean).sort().slice(-1)[0] ?? ''; }
export function sourceScene(text: string): 'ai' | 'friends' | 'other' {
  const marker = /^# Mirrorville scene: (ai|friends)\s*$/m.exec(text.replace(/^\uFEFF/, '').split(/\r?\n/).slice(0, 4).join('\n'));
  return marker?.[1] === 'ai' ? 'ai' : marker?.[1] === 'friends' ? 'friends' : 'other';
}
export function sourceDate(text: string): string {
  const match = /^# Mirrorville latestAt: (.+)$/m.exec(text.split(/\r?\n/).slice(0, 5).join('\n'));
  if (!match || !Number.isFinite(Date.parse(match[1]))) return '';
  return new Date(match[1]).toISOString();
}
export function sampleFiles(texts: string[], limit = 30_000): string {
  if (!texts.length) return '';
  const budget = Math.floor((limit - texts.length + 1) / texts.length);
  return texts.map(text => text.slice(0, budget)).join('\n');
}
