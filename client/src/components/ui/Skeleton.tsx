import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'rectangular' | 'circular' | 'rounded' | 'text';
}

export function Skeleton({ className = '', variant = 'rounded' }: SkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return 'rounded-none';
      case 'text':
        return 'rounded h-4';
      case 'rounded':
      default:
        return 'rounded-md';
    }
  };

  return (
    <div
      className={`skeleton-shimmer ${getVariantStyles()} ${className}`}
    />
  );
}

// Specialized Skeletons for the dashboard
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number, columns?: number }) {
  return (
    <div className="glass-panel w-full overflow-hidden rounded-3xl">
      <div className="skeleton-shimmer h-14 border-b border-slate-200/70" />
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton variant="circular" className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
