import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

type Props = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}: Props) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-6 py-10 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 text-morey-mid flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-sm font-medium text-morey-deep">{title}</div>
      {description && (
        <p className="text-xs text-morey-mid mt-1 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
