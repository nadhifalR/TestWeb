
import React, { useState, useEffect } from 'react';
import { Bell, X, Info } from 'lucide-react';

export const ToastPortal: React.FC = () => {
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    const handler = (e: any) => {
      const notif = e.detail;
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { ...notif, internalId: id }]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.internalId !== id));
      }, 5000);
    };

    window.addEventListener('nexus-notification', handler);
    return () => window.removeEventListener('nexus-notification', handler);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[300] space-y-3 w-80">
      {toasts.map(t => (
        <div key={t.internalId} className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-2xl text-white flex gap-4 animate-in slide-in-from-right-10 duration-300">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Bell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-1">{t.title}</p>
            <p className="text-[12px] font-medium text-slate-300 leading-tight truncate">{t.message}</p>
          </div>
          <button onClick={() => setToasts(prev => prev.filter(toast => toast.internalId !== t.internalId))} className="text-slate-500 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
