interface SectionHeadingProps {
  title: string
  eyebrow?: string
  description?: string
  actions?: React.ReactNode
}

/**
 * Encabezado firmado del sistema: título con la doble regla (membrete) y,
 * opcionalmente, un eyebrow de 11px y acciones a la derecha.
 */
export default function SectionHeading({ title, eyebrow, description, actions }: SectionHeadingProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <p className="text-[11px] text-muted-text uppercase tracking-widest font-semibold mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">{title}</h1>
        <div className="flex items-center gap-3 mt-2.5" aria-hidden>
          <span className="h-px flex-1 max-w-[120px] bg-border" />
          <span className="h-px flex-1 max-w-[120px] bg-border" />
        </div>
        {description && (
          <p className="text-sm text-muted-text mt-3 leading-relaxed max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  )
}
