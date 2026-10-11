import React from 'react';
import { useRecords } from '../store/recordsContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, removeToast } = useRecords();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map(toast => {
        let bg = 'bg-[#16324F] text-white border-navy-700';
        let Icon = CheckCircle;

        if (toast.type === 'error' || toast.type === 'warning') {
          bg = 'bg-rose-900 text-white border-rose-700';
          Icon = AlertCircle;
        } else if (toast.type === 'info') {
          bg = 'bg-[#1E4369] text-white border-blue-600';
          Icon = Info;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border shadow-lg transition-all animate-in slide-in-from-bottom-2 ${bg}`}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="w-4 h-4 text-teal-400 shrink-0" />
              <p className="text-sm font-medium pr-2">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
