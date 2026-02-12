import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import AccountsPage from './pages/AccountsPage';
import RequestPage from './pages/RequestPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportPage from './pages/ReportPage';
import ActivityPage from './pages/ActivityPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { AuthManager } from './services/AuthManager';
import { SettingsManager } from './services/SettingsManager';
import { ThemeManager } from './services/ThemeManager';
import { AccountManager } from './services/AccountManager';
import { Permission } from './types';
import { AlertCircle, RefreshCw } from 'lucide-react';

// Guard component to handle Permission-based routing security
const PermissionGuard: React.FC<{ children: React.ReactNode, permission: Permission }> = ({ children, permission }) => {
  const user = AuthManager.getCurrentUser();

  if (!user) return <Navigate to="/login" replace />;

  const hasAccess = AccountManager.hasPermission(user, permission);
  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try { return AuthManager.checkAuth(); } catch { return false; }
  });
  const [initStatus, setInitStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const user = AuthManager.getCurrentUser();

  useEffect(() => {
    const initApp = async () => {
      try {
        const settings = await SettingsManager.getSettings();
        ThemeManager.applyTheme(settings.theme || 'light');
        setInitStatus('ready');
      } catch (err) {
        console.error("System boot failed:", err);
        setInitStatus('error');
      }
    };

    initApp();

    const interval = setInterval(() => {
      setIsAuthenticated(AuthManager.checkAuth());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (initStatus === 'loading') {
    return (
      <div className="min-h-screen theme-bg flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] theme-text-muted animate-pulse">Initialising System Node...</p>
      </div>
    );
  }

  if (initStatus === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-white text-2xl font-black uppercase mb-2">Protocol Failure</h1>
        <p className="text-slate-400 text-sm max-w-sm mb-8">Critical system nodes failed to initialize. Please check network connectivity or configuration.</p>
        <button onClick={() => window.location.reload()} className="px-10 py-4 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-3"><RefreshCw size={16} /> Retry Boot</button>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={() => setIsAuthenticated(true)} />} />

        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <MainLayout>
                <Routes key={user?.id}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/accounts" element={
                    <PermissionGuard permission="VIEW">
                      <AccountsPage />
                    </PermissionGuard>
                  } />
                  <Route path="/requests" element={<RequestPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/reports" element={
                    <PermissionGuard permission="FINANCIAL_RECON">
                      <ReportPage />
                    </PermissionGuard>
                  } />
                  <Route path="/activity" element={<ActivityPage />} />
                  <Route path="/settings" element={
                    <PermissionGuard permission="SYSTEM_CONFIG">
                      <SettingsPage />
                    </PermissionGuard>
                  } />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;