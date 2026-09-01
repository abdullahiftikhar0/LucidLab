import React from 'react';

type StatusType = 'draft' | 'published' | 'active' | 'pending' | 'graded' | 'correct' | 'incorrect' | 'needs_revision' | 'ended' | 'inactive';

const statusConfig: Record<StatusType, { bg: string; text: string; dot: string; label: string }> = {
  draft: { bg: 'bg-slate-100', text: 'text-slate-500', dot: 'bg-slate-400', label: 'Draft' },
  published: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Published' },
  active: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Active' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending' },
  graded: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Graded' },
  correct: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Correct' },
  incorrect: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Incorrect' },
  needs_revision: { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500', label: 'Needs Revision' },
  ended: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Ended' },
  inactive: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Inactive' },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/\s+/g, '_') as StatusType;
  const config = statusConfig[key] || statusConfig.draft;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} px-2.5 py-0.5 text-xs font-bold ${config.text} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`}></span>
      {config.label}
    </span>
  );
}
