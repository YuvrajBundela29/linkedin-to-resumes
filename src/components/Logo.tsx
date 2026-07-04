import logoSrc from "@/assets/logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img src={logoSrc} alt="" className="h-7 w-7" />
      <span className="font-semibold tracking-tight">ResumeForge <span className="text-[color:var(--color-brand)]">AI</span></span>
    </div>
  );
}
