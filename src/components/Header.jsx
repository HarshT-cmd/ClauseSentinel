import React from 'react';
import { Menu, AlertCircle, Database, Sparkles, RefreshCw } from 'lucide-react';
import { useRecords } from '../store/recordsContext';

export default function Header({ onOpenMobileNav }) {
  const { records, metrics, seedDemoData } = useRecords();

  return (
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-surface-border px-4 lg:px-8 py-3.5 transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Prototype Mode Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-xl text-surface-text hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>

          {/* Persistent "Prototype Mode" badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-xs font-semibold tracking-tight">Prototype Mode</span>
            <span className="hidden sm:inline text-xs text-amber-700/80 font-normal">
              &bull; Explainable Client-Side Heuristics (No External API Keys)
            </span>
          </div>
        </div>

        {/* Right: Live stats & Quick Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {records.length === 0 ? (
            <button
              onClick={seedDemoData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-500 text-white hover:bg-teal-600 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load 30 Demo Records</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs font-medium text-slate-700">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>{records.length} Submissions</span>
              <span className="text-slate-300">|</span>
              <span className="text-emerald-700 font-semibold">{metrics.routed} Routed</span>
              <span className="text-slate-300">|</span>
              <span className="text-amber-700 font-semibold">{metrics.review} In Review</span>
            </div>
          )}

          {records.length > 0 && (
            <button
              onClick={seedDemoData}
              title="Reset and reload 30 demo records"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline text-[11px] font-medium">Re-seed</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
