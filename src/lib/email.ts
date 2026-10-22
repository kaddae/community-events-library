import { format, parseISO } from 'date-fns';
import { env } from '@/env';
import { copy } from '@/content/copy';
import { isConfigured } from '@/lib/supabase';
import {
  useLibrary, availableFor, depositsFor, describeDeposits, reflectToken, dollars,
  type EmailKind, type Item, type RequestGroup, type RequestLine,
} from '@/lib/store';

// Every email goes to the host and the library inbox, under the same subject,
// so each request stays in one thread. Reply goes to the library inbox (the
// email service takes one reply-to address). Reply all from the library inbox
// still reaches the host, since they're on the To: line.

// TEST MODE. While this has an address, every email (request, checkout,
// thank-you, late) goes ONLY here, with this one address as the reply-to.
// The host and the library inbox get nothing. '' means live: real recipients.
export const TEST_RECIPIENT = '';

const slot = (text: string, vars: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
const tidy = (s: string) => s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
const day = (iso: string) => {
  try { return format(parseISO(iso), 'EEE, MMM d'); } catch { return iso; }
};

export const threadSubject = (g: RequestGroup) =>
  slot(copy.email.subject, { eventName: g.eventName, eventDate: day(g.eventDate) });

export const recipients = (g: RequestGroup) =>
  TEST_RECIPIENT
    ? [TEST_RECIPIENT]
    : [...new Set([g.host.email.trim().toLowerCase(), copy.email.threadAddress])].filter(Boolean);

const itemList = (lines: RequestLine[], items: Item[], flagShort = false) =>
  lines.map((l) => {
    const item = items.find((i) => i.id === l.itemId);
    const short = flagShort && item ? Math.max(0, l.quantity - availableFor(item, useLibrary.getState().lines)) : 0;
    return `- ${l.quantity} × ${item?.name ?? 'Item'}${short > 0 ? slot(copy.email.outNow, { count: String(short) }) : ''}`;
  }).join('\n');

const depositText = (template: string, lines: RequestLine[], items: Item[]) => {
  const { list } = depositsFor(lines, items);
  return list.length ? slot(template, { deposits: describeDeposits(list) }) : '';
};

//Create one reflection link used for emails and librarian page. Empty means request has no code yet.
export function reflectionUrl(g: RequestGroup) {
  const token = isConfigured ? g.reflectionToken : reflectToken(g.id);
  return token ? `${location.href.split('#')[0]}#/reflect/${token}` : '';
}

const baseVars = (g: RequestGroup) => ({
  firstName: g.host.firstName,
  eventName: g.eventName,
  eventDate: day(g.eventDate),
  neededFrom: day(g.neededFrom),
  pickupWindow: g.pickupWindow ? ` (${g.pickupWindow})` : '',
  returnBy: day(g.returnBy),
  pickupAddress: copy.email.pickupAddress,
  signoff: copy.email.signoff,
});

export function requestEmail(g: RequestGroup, lines: RequestLine[], items: Item[]) {
  return {
    subject: threadSubject(g),
    text: tidy(slot(copy.email.request, {
      ...baseVars(g),
      items: itemList(lines, items, true),
      deposit: depositText(copy.email.depositLine, lines, items),
      pledge: g.donationPledge ? slot(copy.email.pledgeLine, { amount: dollars(g.donationPledge) }) : '',
    })),
  };
}

// Starting drafts for the librarians' desk. Librarians edit the text before sending.
export function draftEmail(kind: EmailKind, g: RequestGroup, lines: RequestLine[], items: Item[]) {
  const vars = baseVars(g);
  const subject = threadSubject(g);
  if (kind === 'checkout') {
    const out = lines.filter((l) => l.status === 'checked_out' || l.status === 'returned');
    return {
      subject,
      text: tidy(slot(copy.email.checkout, {
        ...vars, items: itemList(out, items),
        deposit: depositText(copy.email.depositHeld, out, items), policy: copy.email.policy,
      })),
    };
  }
  if (kind === 'returned') {
    return {
      subject,
      text: tidy(slot(copy.email.returned, { ...vars, reflectionLink: reflectionUrl(g) })),
    };
  }
  const late = lines.filter((l) => l.status === 'checked_out');
  return { subject, text: tidy(slot(copy.email.late, { ...vars, items: itemList(late, items) })) };
}

export async function sendEmail(to: string[], subject: string, text: string) {
  const e = env as unknown as Record<string, string | undefined>;
  const url = e.COMMUNITY_CAPABILITIES_URL ?? e.COMMUNITY_CLOUD_URL?.replace(/app-data$/, 'app-capabilities');
  if (!url || !e.APP_ID || !e.APP_KEY) throw new Error('Email isn’t connected yet.');
  const dest = TEST_RECIPIENT ? [TEST_RECIPIENT] : to;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'send_email', app_id: e.APP_ID, app_key: e.APP_KEY,
      to: dest, subject, text, reply_to: TEST_RECIPIENT ? TEST_RECIPIENT : copy.email.threadAddress,
    }),
  });
  let data: { ok?: boolean; error?: string } = {};
  try { data = await res.json(); } catch { /* handled below */ }
  if (!res.ok || data.error) throw new Error(data.error ?? `The email service answered ${res.status}.`);
}

export async function sendRequestEmail(g: RequestGroup, lines: RequestLine[], items: Item[]) {
  const { subject, text } = requestEmail(g, lines, items);
  await sendEmail(recipients(g), subject, text);
}
