import { InfoSection } from "./info-page";

/** Bloque de un texto legal: párrafos y listas en el orden en que los escribió el dueño. */
export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export function LegalText({
  updated,
  lead,
  sections,
  closing,
  children,
}: {
  updated: string;
  lead?: string;
  sections: LegalSection[];
  closing: string;
  /** Secciones con enlaces que van después de las de texto, antes de la frase de cierre. */
  children?: React.ReactNode;
}) {
  return (
    <>
      <p className="text-sm text-text-muted">ZorzTech – Guatemala · Última actualización: {updated}</p>
      {lead && <p className="text-text-muted">{lead}</p>}
      {sections.map((section) => (
        <InfoSection key={section.title} title={section.title}>
          {section.blocks.map((block, i) =>
            typeof block === "string" ? (
              <p key={i}>{block}</p>
            ) : (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {block.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ),
          )}
        </InfoSection>
      ))}
      {children}
      <p className="font-medium text-text-on-light">{closing}</p>
    </>
  );
}
