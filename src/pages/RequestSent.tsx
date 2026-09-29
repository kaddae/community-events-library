import { Link, useParams } from 'react-router-dom';
import { useLibrary, latestReflection } from '@/lib/store';
import { TodoText } from '@/components/Bits';
import { copy } from '@/content/copy';

export default function RequestSent() {
  const { groupId } = useParams();
  const groups = useLibrary((s) => s.groups);
  const allLines = useLibrary((s) => s.lines);
  const items = useLibrary((s) => s.items);
  const reflections = useLibrary((s) => s.reflections);
  const group = groups.find((g) => g.id === groupId);
  const lines = allLines.filter((l) => l.groupId === groupId);
  const handoff = latestReflection(lines.map((l) => l.itemId), reflections);
  const handoffItem = handoff && items.find((i) => i.id === handoff.itemId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-4xl">{copy.request.sentTitle}</h1>
      <p className="text-lg">{copy.request.sentBody}</p>
      <TodoText text={copy.request.responseTime} className="text-lg" />

      {group && (
        <section className="stamp-border">
          <p className="hairline label-caps px-3 py-2 text-secondary">{group.eventName} · {group.eventDate}</p>
          <ul className="p-3">
            {lines.map((l) => (
              <li key={l.id}>{l.quantity} × {items.find((i) => i.id === l.itemId)?.name}</li>
            ))}
          </ul>
          <p className="border-t px-3 py-2 text-muted-foreground" style={{ borderTop: 'var(--rule-soft)' }}>
            Pickup {group.neededFrom} ({group.pickupWindow}) · back by {group.returnBy}
          </p>
        </section>
      )}

      {handoff && handoffItem && (
        <section className="flex flex-col gap-1 border-l-4 border-secondary pl-4">
          <p className="label-caps text-secondary">{copy.request.handoffLead}</p>
          <p className="text-lg">
            {handoff.firstName} used the {handoffItem.name.toLowerCase()} at the {handoff.eventName} — her tip: “{handoff.tip}”
          </p>
        </section>
      )}

      <TodoText text={copy.request.careAgreement} />

      <p>
        Questions before then? Write the librarians at{' '}
        <a href={`mailto:${copy.shared.librarianEmail}`} className="font-semibold text-secondary underline underline-offset-4">{copy.shared.librarianEmail}</a>.
      </p>
      <Link to="/" className="font-semibold text-secondary underline underline-offset-4">Back to the library</Link>
    </div>
  );
}