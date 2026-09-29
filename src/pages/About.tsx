import { TodoText } from '@/components/Bits';
import { useLibrary, isPublicTestimonial } from '@/lib/store';
import { copy } from '@/content/copy';

export default function About() {
  const testimonials = useLibrary((s) => s.testimonials);
  const shared = testimonials
    .filter(isPublicTestimonial)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-4xl">{copy.about.title}</h1>
      <section className="flex flex-col gap-2">
        <h2 className="shelf-rule text-xl">{copy.about.howTitle}</h2>
        <ol className="flex flex-col gap-2">
          {[copy.about.borrow, copy.about.giveBack].map((line, i) => (
            <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-2">
              <span className="font-display text-lg text-secondary">{i + 1}.</span>
              <TodoText text={line} />
            </li>
          ))}
        </ol>
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="shelf-rule text-xl">Civic Works Department</h2>
        <TodoText text={copy.about.cwd} />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="shelf-rule text-xl">GROUP PROJECT</h2>
        <TodoText text={copy.about.groupProject} />
      </section>
      {shared.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="shelf-rule text-xl">{copy.about.testimonialsTitle}</h2>
          <ul className="flex flex-col">
            {shared.map((t) => (
              <li key={t.id} className="hairline-soft border-l-4 border-l-secondary py-3 pl-4">
                <p className="text-lg">“{t.text}”</p>
                <p className="text-muted-foreground">
                  — {t.firstName}, {t.eventName}{t.example && ' (example)'}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="flex flex-col gap-2">
        <h2 className="shelf-rule text-xl">Help keep the shelf</h2>
        <TodoText text={copy.about.getInvolved} />
        <a href={`mailto:${copy.shared.librarianEmail}`} className="font-semibold text-secondary underline underline-offset-4">{copy.shared.librarianEmail}</a>
      </section>
    </div>
  );
}