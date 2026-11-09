import { useTranslation } from "react-i18next";

/** Renders prose sections from an i18n object array: [{ title, body }] or [{ title, paragraphs }]. */
export function LegalSections({ nsKey }: { nsKey: string }) {
  const { t } = useTranslation();
  const raw = t(nsKey, { returnObjects: true });
  const sections = Array.isArray(raw) ? raw : [];

  return (
    <>
      {sections.map((section, i) => {
        if (!section || typeof section !== "object") return null;
        const row = section as {
          title?: string;
          body?: string;
          paragraphs?: string[];
          items?: string[];
        };
        const paragraphs =
          Array.isArray(row.paragraphs) && row.paragraphs.length > 0
            ? row.paragraphs
            : row.body
              ? [row.body]
              : [];
        const items = Array.isArray(row.items) ? row.items : [];
        return (
          <section key={`${row.title ?? "s"}-${i}`}>
            {row.title ? <h2 className="text-base font-bold">{row.title}</h2> : null}
            {paragraphs.map((p) => (
              <p key={p.slice(0, 48)} className="mt-2 text-sm leading-relaxed text-white/70">
                {p}
              </p>
            ))}
            {items.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-white/70">
                {items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
