import { TodoText } from '@/components/Bits';
import { copy } from '@/content/copy';

export default function About() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <h1 className="text-4xl">{copy.about.title}</h1>
      <section className="flex flex-col gap-2">
        <h2 className="shelf-rule text-xl">Civic Works Department</h2>
        <TodoText text={copy.about.cwd} />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="shelf-rule text-xl">GROUP PROJECT</h2>
        <TodoText text={copy.about.groupProject} />
      </section>
      <section className="flex flex-col gap-2">
        <h2 className="shelf-rule text-xl">Help keep the shelf</h2>
        <TodoText text={copy.about.getInvolved} />
        <a href={`mailto:${copy.shared.librarianEmail}`} className="font-semibold text-secondary underline underline-offset-4">{copy.shared.librarianEmail}</a>
      </section>
    </div>
  );
}