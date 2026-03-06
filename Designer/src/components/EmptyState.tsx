import React from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-slate-700 mt-2">{title}</h3>
      <p className="text-slate-500 mt-2 max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
