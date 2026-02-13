
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldAlert,
  Hexagon,
  RefreshCw,
  X,
  FileSearch
} from 'lucide-react';
import { AuthManager } from '../../services/AuthManager';
import { AccountManager } from '../../services/AccountManager';
import { useTranslation } from '../../hooks/useTranslation';
import { User, Permission } from '../../types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const user = AuthManager.getCurrentUser();
  const navigate = useNavigate();
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);
  // Fix: Added state for available accounts to handle async loading
  const [availableAccounts, setAvailableAccounts] = useState<User[]>([]);
  const { t } = useTranslation();

  // Fix: Added useEffect to fetch available accounts when the modal is shown
  useEffect(() => {
    if (showSwitcherModal) {
      AccountManager.getUsers().then(setAvailableAccounts).catch(console.error);
    }
  }, [showSwitcherModal]);

  const navItems: { name: string; path: string; icon: any; permission?: Permission }[] = [
    { name: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { name: t('nav.accounts'), path: '/accounts', icon: Users, permission: 'VIEW' },
    { name: t('nav.requests'), path: '/requests', icon: FileText },
    { name: t('nav.analytics'), path: '/analytics', icon: BarChart3 },
    { name: t('nav.reports'), path: '/reports', icon: FileSearch, permission: 'FINANCIAL_RECON' },
    { name: t('nav.activity'), path: '/activity', icon: Activity },
    { name: t('nav.settings'), path: '/settings', icon: Settings, permission: 'SYSTEM_CONFIG' },
  ];

  const handleLogout = () => {
    AuthManager.logout();
    navigate('/login');
  };

  const switchAccount = (acc: User) => {
    AuthManager.login(acc);
    setShowSwitcherModal(false);
    navigate('/', { replace: true });
  };

  return (
    <>
      <aside className={`bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 z-40 sticky top-0 h-screen shrink-0 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <Hexagon size={24} className="text-blue-500 fill-blue-500/20" />
              <span className="font-extrabold text-lg tracking-tight text-white uppercase">Nexus</span>
            </div>
          )}
          <button onClick={onToggle} className="p-1.5 hover:bg-white/10 rounded transition-colors text-slate-500">
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            if (item.permission && user && !AccountManager.hasPermission(user, item.permission)) return null;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-150 group ${isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon size={18} className={`${isCollapsed ? 'mx-auto' : ''}`} />
                {!isCollapsed && <span className="text-[13px] tracking-tight">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 bg-slate-900/50 shrink-0">
          <button
            onClick={() => setShowSwitcherModal(true)}
            className={`w-full flex items-center gap-3 p-2 rounded transition-all border border-transparent hover:bg-white/5 hover:border-slate-800`}
          >
            <img src={user?.avatar} className="w-8 h-8 rounded border border-slate-700 object-cover" alt="" />
            {!isCollapsed && (
              <div className="text-left flex-1 min-w-0">
                <p className="text-[12px] font-bold text-white truncate">{user?.username}</p>
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{user?.role}</p>
              </div>
            )}
            {!isCollapsed && <RefreshCw size={12} className="text-slate-600" />}
          </button>
        </div>
      </aside>

      {showSwitcherModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowSwitcherModal(false)}></div>
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em]">Switch User</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Select an account</p>
              </div>
              <button onClick={() => setShowSwitcherModal(false)} className="p-2 hover:bg-white/5 rounded-lg transition-all text-slate-500"><X size={20} /></button>
            </div>

            <div className="p-8 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {availableAccounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => switchAccount(acc)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all border ${user?.id === acc.id ? 'bg-blue-600/10 border-blue-500/30' : 'bg-slate-950/50 border-slate-800 hover:border-slate-600 hover:bg-slate-800'}`}
                >
                  <img src={acc.avatar} className="w-12 h-12 rounded-lg object-cover border border-slate-700 shadow-md" alt="" />
                  <div className="text-left flex-1 min-w-0">
                    <p className={`text-[13px] font-bold ${user?.id === acc.id ? 'text-blue-400' : 'text-white'}`}>{acc.username}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{acc.role} — {acc.department}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-8 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-amber-500">
                <ShieldAlert size={14} />
                <span className="text-[9px] font-bold uppercase tracking-widest">System Session Active</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2.5 bg-red-900/20 text-red-400 border border-red-900/40 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-900/40 transition-all flex items-center gap-2"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
