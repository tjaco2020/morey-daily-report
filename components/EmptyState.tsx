import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

/**
 * Friendly empty-state used when a list has no items. Branded yellow halo
 * around the icon to feel warmer than a plain gray tile.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-12 ${className}`}
    >
      <div className="relative mb-4">
        {/* Soft yellow halo behind the icon */}
        <div className="absolute inset-0 rounded-full bg-morey-yellow/25 blur-2xl scale-150" />
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-morey-yellow/40 to-morey-orange/30 border border-morey-yellow/60 text-morey-deep flex items-center justify-center shadow-sm">
          <Icon className="w-6 h-6" strokeWidth={1.8} />
        </div>
      </div>
      <div className="text-base font-semibold text-morey-deep">{title}</div>
      {description && (
        <p className="text-sm text-morey-mid mt-1.5 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
