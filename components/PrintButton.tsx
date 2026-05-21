"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs text-morey-deep hover:bg-slate-50 transition"
      type="button"
    >
      <Printer className="w-3.5 h-3.5" />
      Print this page
    </button>
  );
}
