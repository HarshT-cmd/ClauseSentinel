import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  FileSpreadsheet,
  Database,
  Network,
  CheckCheck,
  BookOpen,
  X,
  Compass,
  Cpu
} from 'lucide-react';
import { useRecords } from '../store/recordsContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/single', label: 'Single Analysis', icon: Sparkles },
  { path: '/bulk', label: 'Bulk CSV Processing', icon: FileSpreadsheet },
  { path: '/records', label: 'Record Management', icon: Database, showBadge: true },
  { path: '/clusters', label: 'Region Clusters', icon: Network },
  { path: '/evaluation', label: 'Evaluation', icon: CheckCheck },
  { path: '/methodology', label: 'Problem & Methodology', icon: BookOpen },
];

export default function Sidebar({ isOpen, onClose }) {
  const { records } = useRecords();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#16324F] text-slate-200 select-none">
      {/* Brand & Logo Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-900/30">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">JanSetu</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide">Grassroots Dialect Router</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Navigation
        </div>
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose && onClose()}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-teal-500 text-white shadow-sm shadow-teal-900/20 font-semibold'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.showBadge && records.length > 0 && (
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-teal-700 text-white' : 'bg-white/10 text-slate-300'
                    }`}>
                      {records.length}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Engine Status Card */}
      <div className="p-4 m-3 rounded-xl bg-navy-900/50 border border-white/10">
        <div className="flex items-center gap-2 mb-1.5">
          <Cpu className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-semibold text-white">Client-side Engine</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          10 Dialect Zones &bull; Devanagari &amp; Roman NLP &bull; Zero Cloud Leakage
        </p>
      </div>

      {/* Version Tag */}
      <div className="px-5 py-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
        <span>JanSetu Prototype v1.0</span>
        <span className="text-teal-400 font-semibold">Ready</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 z-30 shadow-md">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden animate-in fade-in"
        />
      )}

      {/* Mobile Sliding Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 md:hidden transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
}
