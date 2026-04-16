"use client";

import { cn } from "@/lib/utils";
import { ReactNode, ButtonHTMLAttributes } from "react";

export function Card({ children, className, glow }: { children: ReactNode; className?: string; glow?: boolean; }) {
  return <div className={cn("card", glow && "glow-blue", className)}>{children}</div>;
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string; }) {
  return (
    <div className={cn("px-6 py-5 flex items-center justify-between", className)}
      style={{ borderBottom: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[15px] font-semibold tracking-tight">{children}</h3>;
}

export function CardBody({ children, className }: { children: ReactNode; className?: string; }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

type BadgeVariant = "green" | "amber" | "blue" | "red" | "gray";
const badgeStyles: Record<BadgeVariant, string> = {
  green: "bg-green-500/10 text-green-400",
  amber: "bg-amber-500/10 text-amber-400",
  blue: "bg-blue-500/10 text-blue-400",
  red: "bg-red-500/10 text-red-400",
  gray: "bg-white/5 text-slate-400",
};

export function Badge({ children, variant = "gray", className }: { children: ReactNode; variant?: BadgeVariant; className?: string; }) {
  return (
    <span className={cn("inline-block px-2.5 py-1 rounded-full text-[12px] font-medium", badgeStyles[variant], className)}>
      {children}
    </span>
  );
}

export function Button({ children, variant = "primary", size = "md", className, ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger"; size?: "sm" | "md" | "lg"; }) {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white border-0",
    ghost: "bg-transparent border text-slate-300 hover:border-blue-500 hover:text-blue-400",
    danger: "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20",
  };
  const sizes = {
    sm: "px-3.5 py-2 text-[13px]",
    md: "px-5 py-2.5 text-[14px]",
    lg: "px-7 py-3.5 text-[15px]",
  };
  return (
    <button className={cn(base, variants[variant], sizes[size], className)}
      style={variant === "ghost" ? { borderColor: "var(--border)" } : undefined} {...props}>
      {children}
    </button>
  );
}

export function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <span style={{ fontSize: size, color: "var(--amber)", letterSpacing: 2 }}>
      {"★".repeat(Math.floor(rating))}{"☆".repeat(5 - Math.floor(rating))}
    </span>
  );
}

export function ProgressBar({ value, color = "blue", className }: { value: number; color?: string; className?: string; }) {
  const colorMap: Record<string, string> = {
    blue: "linear-gradient(90deg, #3b82f6, #06b6d4)",
    green: "#10b981", amber: "#f59e0b", red: "#ef4444",
  };
  return (
    <div className={cn("h-1.5 rounded-full overflow-hidden", className)} style={{ background: "var(--border)" }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: colorMap[color] || color }} />
    </div>
  );
}

export function AIPulse({ label = "Claude AI" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px] tracking-wide mb-3" style={{ color: "var(--accent2)" }}>
      <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: "var(--accent2)" }} />
      {label}
    </div>
  );
}

export function StatCard({ label, value, delta, deltaPositive = true, accent = "blue" }:
  { label: string; value: string | number; delta?: string; deltaPositive?: boolean; accent?: "blue" | "green" | "amber" | "red"; }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{
        background: accent === "blue" ? "linear-gradient(90deg,#3b82f6,#06b6d4)"
          : accent === "green" ? "#10b981" : accent === "amber" ? "#f59e0b" : "#ef4444",
      }} />
      <div className="text-[12px] uppercase tracking-wider mb-3 font-medium" style={{ color: "var(--muted)" }}>{label}</div>
      <div className="font-mono text-[32px] font-semibold tracking-tight leading-none">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {delta && (
        <div className="text-[13px] mt-2 font-medium" style={{ color: deltaPositive ? "var(--green)" : "var(--red)" }}>
          {delta}
        </div>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div className="mb-8 flex items-start justify-between">
      <div>
        <h1 className="font-mono text-[28px] font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-[15px] mt-1.5" style={{ color: "var(--muted2)" }}>{subtitle}</p>}
      </div>
      {badge && (
        <span
          className="mt-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
          style={{
            background: badge === "Supabase" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
            border: `1px solid ${badge === "Supabase" ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`,
            color: badge === "Supabase" ? "var(--green)" : "var(--amber)",
          }}
        >
          {badge === "Supabase" ? "🟢 DB接続済" : "🟡 " + badge}
        </span>
      )}
    </div>
  );
}

export function AIOutput({ children, loading, minHeight = 120, className }:
  { children: ReactNode; loading?: boolean; minHeight?: number; className?: string; }) {
  return (
    <div className={cn("rounded-xl p-5 text-[14px] leading-relaxed whitespace-pre-wrap relative", className)}
      style={{ background: "var(--surface2)", border: "1px solid var(--border)", minHeight, color: "#f1f5f9" }}>
      {children}
      {loading && <span className="inline-block w-2 h-2 rounded-full ml-1 align-middle animate-pulse" style={{ background: "var(--accent)" }} />}
    </div>
  );
}
