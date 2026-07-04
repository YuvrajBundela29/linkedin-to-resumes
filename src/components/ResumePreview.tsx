import { useEffect, useRef, useState } from "react";
import type { Resume, TemplateId } from "@/lib/resume-schema";
import { HtmlFor } from "@/templates";

/**
 * Renders the HTML resume at A4 dimensions and scales it to fit its container.
 */
export function ResumePreview({ resume, template }: { resume: Resume; template: TemplateId }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const RESUME_WIDTH = 794;
    const observe = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, (w - 24) / RESUME_WIDTH));
    };
    observe();
    const ro = new ResizeObserver(observe);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="w-full overflow-auto p-3 bg-[color:var(--color-muted)] rounded-lg border">
      <div className="mx-auto" style={{ width: 794 * scale, minHeight: 1123 * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", width: 794 }} className="shadow-sm">
          <HtmlFor template={template} resume={resume} />
        </div>
      </div>
    </div>
  );
}
