
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(AuthManager.checkAuth());
  const user = AuthManager.getCurrentUser();

  useEffect(() => {
    const settings = SettingsManager.getSettings();
    ThemeManager.applyTheme(settings.theme);

    const interval = setInterval(() => {
      setIsAuthenticated(AuthManager.checkAuth());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
