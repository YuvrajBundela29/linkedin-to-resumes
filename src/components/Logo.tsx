import logoSrc from "@/assets/logo-mark.png";
import { cn } from "@/lib/utils";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={cn("group inline-flex items-center gap-2.5 min-w-0", className)}>
      <span className="relative shrink-0 grid place-items-center h-8 w-8 rounded-[10px] bg-white/[0.04] ring-1 ring-white/10 shadow-[0_2px_10px_-2px_rgba(34,211,238,0.45)] transition-transform duration-300 group-hover:scale-105">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[10px] opacity-60 blur-md bg-[radial-gradient(circle_at_50%_60%,rgba(34,211,238,0.55),transparent_70%)]"
        />
        <img src={logoSrc} alt="" width={512} height={512} className="relative h-6 w-6 object-contain" />
      </span>
      <span className="truncate font-semibold tracking-tight">
        ResumeForge <span className="text-[color:var(--color-brand)]">AI</span>
      </span>
    </div>
  );
}
