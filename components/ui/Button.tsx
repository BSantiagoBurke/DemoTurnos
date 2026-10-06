import type { ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export const buttonClasses = (variant: ButtonVariant = "primary", block = false) =>
  cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-base font-semibold transition",
    "disabled:cursor-not-allowed disabled:opacity-50",
    variant === "primary" && "bg-primary text-on-primary shadow-sm hover:brightness-110 active:brightness-95",
    variant === "secondary" && "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
    variant === "ghost" && "text-slate-700 hover:bg-slate-100",
    variant === "danger" && "border border-red-200 bg-white text-red-700 hover:bg-red-50",
    block && "w-full",
  );

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  block?: boolean;
};

export function Button({ variant = "primary", block = false, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonClasses(variant, block), className)} {...props} />;
}
