import { useLibrary, isPublicTestimonial } from '@/lib/store';
import { copy } from '@/content/copy';
import { aboutMarkdown } from '@/content/about';
import { parseSections, MdBlocks } from '@/components/Markdown';

const sections = parseSections(aboutMarkdown);

export default function About() {
  const testimonials = useLibrary((s) => s.testimonials);
  const shared = testimonials
    .filter(isPublicTestimonial)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-4xl">{copy.about.title}</h1>
      {sections.map((s, i) => (
        <section key={i} className="flex flex-col gap-2">
          {s.title && <h2 className="shelf-rule text-xl">{s.title}</h2>}
          <MdBlocks blocks={s.blocks} />
        </section>
      ))}
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
    </div>
  );
}