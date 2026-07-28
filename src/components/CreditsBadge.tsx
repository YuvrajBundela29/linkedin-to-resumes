import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCredits } from "@/lib/resume.functions";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function useCreditsQuery() {
  const fn = useServerFn(getCredits);
  return useQuery({ queryKey: ["credits"], queryFn: () => fn({}) });
}

export function CreditsBadge({ className }: { className?: string }) {
  const { data } = useCreditsQuery();
  const credits = data?.credits ?? null;
  const max = data?.dailyAllowance ?? 50;
  const pct = credits === null ? 0 : Math.max(0, Math.min(100, (credits / max) * 100));
  const low = credits !== null && credits <= 5;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "shrink-0 inline-flex items-center gap-2 rounded-full border px-2.5 h-9 text-xs font-medium tabular-nums",
            "bg-card/60 backdrop-blur-sm",
            low ? "border-destructive/50 text-destructive" : "border-border text-foreground",
            className,
          )}
        >
          <Zap className={cn("w-3.5 h-3.5", low ? "text-destructive" : "text-[color:var(--color-brand,currentColor)]")} />
          <span>{credits === null ? "—" : credits}<span className="text-muted-foreground">/{max}</span></span>
          <span className="hidden sm:block h-1.5 w-10 rounded-full bg-muted overflow-hidden">
            <span
              className={cn("block h-full rounded-full transition-all", low ? "bg-destructive" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px]">
        <p className="font-medium">Daily credits</p>
        <p className="text-xs opacity-80 mt-1">
          You get {max} free credits every day (resets at 00:00 UTC). AI chat edit = 1 credit,
          tailor to a job = 3, LinkedIn PDF import = 5.
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
