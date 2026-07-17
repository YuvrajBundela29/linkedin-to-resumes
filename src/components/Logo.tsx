import logoSrc from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-2 min-w-0", className)}>
      <img src={logoSrc} alt="" className="h-7 w-7 shrink-0" />
      <span className="truncate font-semibold tracking-tight">ResumeForge <span className="text-[color:var(--color-brand)]">AI</span></span>
    </div>
  );
}
