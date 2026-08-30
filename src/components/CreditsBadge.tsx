import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { getCredits } from "@/lib/resume.functions";
import { Zap, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export function useCreditsQuery() {
  const fn = useServerFn(getCredits);
  return useQuery({ queryKey: ["credits"], queryFn: () => fn({}) });
}

export function CreditsBadge({ className }: { className?: string }) {
  const { data } = useCreditsQuery();
  const credits = data?.credits ?? null;
  const max = data?.dailyAllowance ?? 20;
  const daily = data?.daily ?? null;
  const purchased = data?.purchased ?? 0;
  const pct = daily === null ? 0 : Math.max(0, Math.min(100, (daily / max) * 100));
  const low = credits !== null && credits <= 5;

  return (
    <TooltipProvider delayDuration={200}><Tooltip>
      <TooltipTrigger asChild>
        <Link
          to="/upgrade"
          className={cn(
            "shrink-0 inline-flex items-center gap-2 rounded-full border px-2.5 h-9 text-xs font-medium tabular-nums transition-colors",
            "bg-card/60 backdrop-blur-sm hover:bg-card",
            low ? "border-destructive/50 text-destructive" : "border-border text-foreground",
            className,
          )}
        >
          <Zap className={cn("w-3.5 h-3.5", low ? "text-destructive" : "text-[color:var(--color-brand,currentColor)]")} />
          <span>
            {daily === null ? "—" : daily}
            <span className="text-muted-foreground">/{max}</span>
            {purchased > 0 && <span className="ml-1 text-[color:var(--color-brand,currentColor)]">+{purchased}</span>}
          </span>
          <span className="hidden sm:block h-1.5 w-10 rounded-full bg-muted overflow-hidden">
            <span
              className={cn("block h-full rounded-full transition-all", low ? "bg-destructive" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </span>
          <Plus className="w-3 h-3 opacity-70" />
        </Link>
      </TooltipTrigger>
      <TooltipContent className="max-w-[250px]">
        <p className="font-medium">Credits</p>
        <p className="text-xs opacity-80 mt-1">
          {max} free credits every day (resets at 00:00 UTC)
          {purchased > 0 ? `, plus ${purchased} purchased credits that never expire` : ""}. AI chat edit = 1 credit,
          tailor to a job = 3, import = 5.
        </p>
        <p className="text-xs opacity-80 mt-1">Tap to open the credit store.</p>
      </TooltipContent>
    </Tooltip></TooltipProvider>
  );
}
