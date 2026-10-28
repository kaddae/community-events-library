import type { ReactNode } from 'react';

// A small markdown reader for the About page: ## headings, paragraphs,
// - and 1. lists, **bold**, [links](url) and bare email addresses.
// No raw HTML runs. Anything else shows as plain text.

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul' | 'ol'; items: string[] };
export interface MdSection { title: string; blocks: Block[] }

export function parseSections(md: string): MdSection[] {
  const sections: MdSection[] = [{ title: '', blocks: [] }];
  let para: string[] = [];
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null;
  const cur = () => sections[sections.length - 1];
  const flush = () => {
    if (para.length) cur().blocks.push({ kind: 'p', text: para.join(' ') });
    if (list) cur().blocks.push(list);
    para = []; list = null;
  };

  for (const raw of md.split('\n')) {
    const line = raw.trim();
    const h = line.match(/^#{1,3}\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (!line) { flush(); continue; }
    if (h) { flush(); sections.push({ title: h[1], blocks: [] }); continue; }
    if (ul || ol) {
      const kind = ul ? 'ul' : 'ol';
      if (para.length || (list && list.kind !== kind)) flush();
      list = list ?? { kind, items: [] };
      list.items.push((ul ?? ol)![1]);
      continue;
    }
    if (list) flush();
    para.push(line);
  }
  flush();
  return sections.filter((s) => s.title || s.blocks.length);
}

const linkCls = 'font-semibold text-secondary underline underline-offset-4';
const safeUrl = (u: string) => /^(https?:|mailto:)/i.test(u);

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = m.index;
    if (m[1] && safeUrl(m[2])) {
      const ext = /^https?:/i.test(m[2]);
      out.push(<a key={k} href={m[2]} className={linkCls} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{m[1]}</a>);
    } else if (m[1]) {
      out.push(m[1]);
    } else if (m[3]) {
      out.push(<strong key={k}>{m[3]}</strong>);
    } else {
      out.push(<a key={k} href={`mailto:${m[4]}`} className={linkCls}>{m[4]}</a>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MdBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.kind === 'p' ? <p key={i}>{inline(b.text)}</p>
        : b.kind === 'ul' ? <ul key={i} className="flex list-disc flex-col gap-1 pl-6">{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>
        : <ol key={i} className="flex list-decimal flex-col gap-1 pl-6">{b.items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol>
      )}
    </>
  );
}