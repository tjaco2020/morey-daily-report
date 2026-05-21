"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareDialog } from "./ShareDialog";

type Props = {
  reportId: string;
  caseNumber?: string;
  variant?: "button" | "icon";
};

export function ShareButton({
  reportId,
  caseNumber,
  variant = "button",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === "icon" ? (
        <button
          onClick={() => setOpen(true)}
          className="text-morey-ocean hover:text-morey-deep p-1 transition"
          title="Share report"
          aria-label="Share report"
        >
          <Share2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-white border border-slate-200 hover:border-morey-yellow hover:bg-morey-yellowSoft text-sm font-medium text-morey-deep transition"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      )}
      {open && (
        <ShareDialog
          reportIds={[reportId]}
          caseNumber={caseNumber}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
