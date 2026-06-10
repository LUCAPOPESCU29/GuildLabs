import * as React from "react";
import { cn } from "@/lib/utils";

/** Reusable, on-theme empty state for tables, search, and "nothing here yet". */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border bg-muted/20 p-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" />
        </div>
      )}
      <h3 className="mt-3 font-display text-lg text-foreground">{title}</h3>
      {body && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
