import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export default function Card({
  children,
  className = "",
  padding = true,
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        border border-[#273449]
        bg-[#151C2C]
        ${padding ? "p-5" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}