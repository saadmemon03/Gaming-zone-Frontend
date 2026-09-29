import type{ButtonHTMLAttributes, ReactNode,}from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "ghost";

type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-[#7C3AED] text-white hover:bg-[#6D28D9]",
    secondary:
      "border border-[#273449] bg-[#151C2C] text-white hover:bg-[#1D2638]",
    danger:
      "bg-red-600 text-white hover:bg-red-700",
    ghost:
      "text-slate-400 hover:bg-[#151C2C] hover:text-white",
  };

  const sizes = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center
        gap-2 rounded-lg
        font-medium
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <Loader2
          size={16}
          className="animate-spin"
        />
      )}

      {children}
    </button>
  );
}