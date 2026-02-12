
import React, { useState, useMemo, useEffect } from 'react';
import { LogManager } from '../services/LogManager';
import { NotificationManager, Notification } from '../services/NotificationManager';
import { AuthManager } from '../services/AuthManager';
import { SystemLog } from '../types';
import { Clock, Terminal, Bell, Search, Trash2, CheckSquare } from 'lucide-react';
import { Can } from '../components/common/Can';
import { DataTable } from '../components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const ActivityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'logs'>('notifications');
  const [refreshKey, setRefreshKey] = useState(0);
  const [globalFilter, setGlobalFilter] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const user = AuthManager.getCurrentUser();
  
  useEffect(() => {
    if (user?.role) {
      NotificationManager.getNotifications(user.role).then(setNotifications);
    }
  }, [user, refreshKey]);

  useEffect(() => {
    LogManager.getLogs().then(setLogs);
  }, [refreshKey]);

  const logColumns = useMemo<ColumnDef<SystemLog>[]>(() => [
    {
      header: 'Timestamp',
      accessorKey: 'timestamp',
      size: 150,
      cell: (info) => (
        <span className="font-mono text-[10px] theme-text-muted font-bold min-w-[120px] block">
          {new Date(info.getValue() as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      )
    },
    {
      header: 'Action',
      accessorKey: 'action',
      size: 180,
      cell: (info) => (
        <span className="inline-block px-2 py-0.5 theme-bg theme-text-muted border theme-border rounded text-[9px] font-black uppercase tracking-widest">
          {info.getValue() as string}
        </span>
      )
    },
    {
      header: 'Details',
      accessorKey: 'details',
      size: 500,
      cell: (info) => <span className="text-sm font-bold tracking-tight theme-text block whitespace-normal">{info.getValue() as string}</span>
    },
    {
      header: 'Principal',
      accessorKey: 'userId',
      size: 120,
      cell: (info) => <span className="text-[10px] font-black theme-text-muted uppercase">ID: {info.getValue() as string}</span>
    }
  ], []);

  const handleClearAll = async () => {
    await NotificationManager.clearAll();
    setRefreshKey(prev => prev + 1);
  };

  const handleMarkRead = async () => {
    await NotificationManager.markAllAsRead();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black theme-text tracking-tight uppercase">Activity</h1>
          <p className="theme-text-muted font-medium">Immutable tracking of all system-wide events and state transitions.</p>
        </div>
        <div className="flex theme-bg border theme-border rounded-lg p-1 shadow-sm">
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'theme-text-muted hover:bg-slate-500/5'}`}
          >
            <Bell size={14} /> Alerts
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-8 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'logs' ? 'bg-slate-900 text-white dark:bg-blue-600 shadow-xl' : 'theme-text-muted hover:bg-slate-500/5'}`}
          >
            <Terminal size={14} /> System Logs
          </button>
        </div>
      </div>

      <div className="theme-card rounded-lg border theme-border shadow-xl overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-6 theme-bg bg-opacity-30 border-b theme-border flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Filter events..." 
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-11 pr-4 py-3 theme-bg border theme-border rounded-lg text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all theme-text"
            />
          </div>
          <div className="flex gap-4">
             {activeTab === 'notifications' && notifications.length > 0 && (
               <>
                 <button onClick={handleMarkRead} className="flex items-center gap-2 px-4 py-2 theme-text-muted font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500/10 hover:text-emerald-500 rounded-lg transition-all">
                    <CheckSquare size={14} /> Mark Read
                 </button>
                 <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 theme-text-muted font-black text-[9px] uppercase tracking-widest hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-all">
                    <Trash2 size={14} /> Purge All
                 </button>
               </>
             )}
          </div>
        </div>

        <div className="flex-1 divide-y theme-border overflow-hidden flex flex-col">
          {activeTab === 'notifications' ? (
            <div className="flex-1 overflow-y-auto divide-y theme-border">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.id} className={`p-8 flex items-start gap-6 transition-colors ${n.read ? 'opacity-50' : 'hover:theme-bg hover:bg-opacity-50'}`}>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${n.read ? 'theme-bg theme-text-muted' : 'bg-blue-500/10 text-blue-500'}`}>
                      <Bell size={24} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-black theme-text tracking-tight uppercase text-sm">{n.title}</p>
                        {!n.read && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>}
                      </div>
                      <p className="text-sm theme-text-muted font-medium leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-2 mt-3 text-[10px] font-black theme-text-muted uppercase tracking-widest">
                        <Clock size={12} /> {new Date(n.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center theme-text-muted p-20 opacity-30">
                  <Bell size={48} className="mb-4" />
                  <p className="font-black uppercase tracking-[0.2em] text-xs">No active notifications</p>
                </div>
              )}
            </div>
          ) : (
            <Can perform="SYSTEM_CONFIG" fallback={
              <div className="h-full flex flex-col items-center justify-center p-20 theme-bg bg-opacity-20 flex-1">
                <div className="w-20 h-20 theme-card border theme-border rounded-lg flex items-center justify-center mb-6 shadow-xl">
                  <Terminal size={32} className="theme-text-muted" />
                </div>
                <h3 className="text-lg font-black theme-text mb-2 uppercase tracking-tight">Access Restricted</h3>
                <p className="max-w-xs text-center theme-text-muted text-sm font-medium leading-relaxed">System logs contain sensitive institutional data and are reserved for authorized clearance.</p>
              </div>
            }>
              <DataTable 
                data={logs} 
                columns={logColumns} 
                globalFilter={globalFilter} 
                setGlobalFilter={setGlobalFilter} 
              />
            </Can>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityPage;
