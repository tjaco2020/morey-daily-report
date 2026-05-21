"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  push: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, variant }]);
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue["push"] {
  const ctx = useContext(ToastContext);
  // Falls back to a no-op if there's no provider (shouldn't happen, but
  // prevents crashing during tests / standalone renders).
  if (!ctx) return () => {};
  return ctx.push;
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  // Auto-dismiss timer
  useEffect(() => {
    const id = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [onDismiss]);

  const cfg: Record<
    ToastVariant,
    { Icon: typeof CheckCircle2; classes: string; iconColor: string }
  > = {
    success: {
      Icon: CheckCircle2,
      classes: "border-green-200 bg-green-50",
      iconColor: "text-green-600",
    },
    error: {
      Icon: AlertCircle,
      classes: "border-red-200 bg-red-50",
      iconColor: "text-red-600",
    },
    info: {
      Icon: Info,
      classes: "border-slate-200 bg-white",
      iconColor: "text-morey-ocean",
    },
  };
  const { Icon, classes, iconColor } = cfg[toast.variant];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-lg border shadow-panel px-4 py-3 animate-slide-up ${classes}`}
    >
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
      <div className="text-sm text-morey-deep flex-1 break-words">
        {toast.message}
      </div>
      <button
        onClick={onDismiss}
        className="text-morey-mid hover:text-morey-deep p-0.5 -m-0.5"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
