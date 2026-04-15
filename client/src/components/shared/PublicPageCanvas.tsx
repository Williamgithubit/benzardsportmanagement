"use client";

import type { ReactNode } from "react";

interface PublicPageCanvasProps {
  children: ReactNode;
  className?: string;
}

export default function PublicPageCanvas({
  children,
  className = "",
}: PublicPageCanvasProps) {
  return (
    <div className={`relative overflow-hidden pb-20 pt-20 ${className}`.trim()}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="dashboard-grid-pattern absolute inset-0 opacity-50" />
        <div className="absolute -left-24 top-6 h-72 w-72 rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/18 blur-3xl" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
