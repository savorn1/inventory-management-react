import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "cancel" | "edit" | "delete";
type Size = "sm" | "md";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantCls: Record<Variant, string> = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white border-0",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200",
  cancel:
    "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200",
  edit: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-0",
  delete: "bg-red-50 hover:bg-red-100 text-red-600 border-0",
};

const sizeCls: Record<Size, string> = {
  md: "h-9 px-4 text-sm",
  sm: "h-7 px-3 text-xs",
};

export function AppButton({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      {...props}
      className={`font-semibold rounded-lg cursor-pointer transition-colors ${variantCls[variant]} ${sizeCls[size]} disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
