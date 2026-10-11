import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, Send, ShieldCheck } from 'lucide-react';

export default function StatusBadge({ status, className = '' }) {
  if (status === 'Verified / Routed') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Verified / Routed
      </span>
    );
  }

  if (status === 'Forwarded') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 ${className}`}>
        <Send className="w-3.5 h-3.5 text-blue-600" />
        Dispatched to Office
      </span>
    );
  }

  if (status === 'Manually Verified') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 ${className}`}>
        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
        Manually Verified
      </span>
    );
  }

  if (status === 'Needs Review') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        Needs Review
      </span>
    );
  }

  // Fallback: Unmapped / Review Needed or Flagged
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 ${className}`}>
      <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
      Unmapped / Review Needed
    </span>
  );
}
