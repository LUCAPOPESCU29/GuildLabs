"use client";

/**
 * CodeBlock — a dark, glassy, Discord-windowed code block with a copy button.
 * Generalizes the copy-command pattern already used on the self-host page so
 * the learn page can show real, copyable snippets on-brand.
 */

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function CodeBlock({
  code,
  filename,
  language,
  className,
}: {
  code: string;
  filename?: string;
  language?: string;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Couldn't copy — select it manually.");
    }
  }

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-white/10 bg-[#0b0c10] shadow-xl ring-1 ring-black/40", className)}>
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          {filename && <span className="ml-2 font-mono text-xs text-white/45">{filename}</span>}
        </div>
        <div className="flex items-center gap-3">
          {language && <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-white/30">{language}</span>}
          <button
            onClick={copy}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/55 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Copy code"
          >
            {copied ? <Check className="size-3.5 text-[#34d8b0]" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[0.82rem] leading-relaxed text-[#e6e8f0]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
