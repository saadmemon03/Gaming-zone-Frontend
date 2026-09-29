import type{ ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  title = "No data found",
  description = "There is no data available at the moment.",
  action,
}: EmptyStateProps) {
  return (
    <div
      className="
        flex flex-col items-center
        justify-center
        rounded-xl
        border border-dashed border-[#273449]
        bg-[#151C2C]/50
        px-6 py-16
        text-center
      "
    >
      <div
        className="
          mb-4 flex h-12 w-12
          items-center justify-center
          rounded-full
          bg-[#7C3AED]/10
          text-[#7C3AED]
        "
      >
        <Inbox size={22} />
      </div>

      <h3 className="text-base font-semibold text-white">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {description}
      </p>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  );
}