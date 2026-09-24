import type { ReactNode } from "react";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex min-w-0 flex-col gap-5 border-b border-border/70 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="section-kicker">{eyebrow}</p>
        <h1 className="mt-2 text-balance text-3xl font-extrabold tracking-[-.035em] sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex max-w-full flex-wrap items-center gap-2 sm:shrink-0">{actions}</div> : null}
    </div>
  );
}
