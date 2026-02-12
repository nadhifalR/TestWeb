
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthManager } from '../services/AuthManager';
import { User } from '../types';
import { Hexagon, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const dummyAccounts = AuthManager.getDummyAccounts();

  const handleQuickLogin = (user: User) => {
    AuthManager.login(user);
    onLogin();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center theme-bg p-6 transition-colors duration-500">
      <div className="max-w-md w-full space-y-8 theme-card p-10 rounded-lg shadow-2xl border theme-border animate-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Hexagon size={32} className="text-white fill-white/20" />
            </div>
          </div>
          <h2 className="text-3xl font-black theme-text tracking-tighter uppercase">Nexus Enterprise</h2>
          <p className="mt-2 theme-text-muted font-medium text-sm">Sign in to your architectural workspace</p>
        </div>
        
        <form className="mt-10 space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="label-caps">Institutional Email</label>
              <input 
                type="email" 
                defaultValue="admin@nexus.com" 
                className="w-full px-5 py-4 theme-bg border theme-border rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all theme-text font-bold text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="label-caps">Security Key</label>
              <input 
                type="password" 
                defaultValue="password123" 
                className="w-full px-5 py-4 theme-bg border theme-border rounded-lg focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all theme-text font-bold text-sm"
              />
            </div>
          </div>

          <button 
            onClick={() => handleQuickLogin(dummyAccounts[0])}
            className="w-full py-4 px-4 bg-slate-900 dark:bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-lg transition-all shadow-xl hover:scale-[1.02] active:scale-95"
          >
            Authenticate Node
          </button>
        </form>

        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t theme-border"></div>
          <span className="flex-shrink mx-4 theme-text-muted text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Identity Presets</span>
          <div className="flex-grow border-t theme-border"></div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {dummyAccounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => handleQuickLogin(acc)}
              className="group flex items-center gap-4 p-4 theme-bg border theme-border rounded-lg hover:border-blue-500 transition-all text-left"
            >
              <img src={acc.avatar} className="w-10 h-10 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
              <div className="flex-1">
                <p className="text-xs font-black theme-text uppercase tracking-tight">{acc.username}</p>
                <p className="text-[10px] theme-text-muted font-bold uppercase tracking-widest">{acc.role}</p>
              </div>
              <ShieldCheck size={16} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
