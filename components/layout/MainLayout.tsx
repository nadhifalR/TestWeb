
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastPortal } from '../common/ToastPortal';
import { Plus, List, FileText } from 'lucide-react';
import { Drawer } from '../common/Drawer';
import { RequestPanel } from '../requests/RequestPanel';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isGlobalDrawerOpen, setIsGlobalDrawerOpen] = useState(false);
  const [globalDrawerTab, setGlobalDrawerTab] = useState<'initiate' | 'registry'>('initiate');
  const [isFabHovered, setIsFabHovered] = useState(false);
  const [isFullscreenDrawer, setIsFullscreenDrawer] = useState(false);

  const location = useLocation();
  const isRequestPage = location.pathname === '/requests';

  return (
    <div className="flex min-h-screen theme-bg theme-text transition-all duration-300">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <ToastPortal />

      {/* Floating Action Button (FAB) - Hidden on Requests Page or when Drawer Open */}
      {!isRequestPage && !isGlobalDrawerOpen && (
        <div
          className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3"
          onMouseEnter={() => setIsFabHovered(true)}
          onMouseLeave={() => setIsFabHovered(false)}
        >
          {isFabHovered && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 mb-2">
              <button
                onClick={() => { setGlobalDrawerTab('registry'); setIsGlobalDrawerOpen(true); }}
                className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 border theme-border rounded-lg shadow-xl hover:bg-slate-50 transition-all group"
              >
                <span className="text-xs font-bold uppercase tracking-wider theme-text">Request List</span>
                <div className="p-2 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                  <List size={16} />
                </div>
              </button>
              <button
                onClick={() => { setGlobalDrawerTab('initiate'); setIsGlobalDrawerOpen(true); }}
                className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 border theme-border rounded-lg shadow-xl hover:bg-slate-50 transition-all group"
              >
                <span className="text-xs font-bold uppercase tracking-wider theme-text">New Request</span>
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
                  <FileText size={16} />
                </div>
              </button>
            </div>
          )}
          <button
            className={`p-4 bg-slate-900 text-white rounded-full shadow-2xl hover:bg-slate-800 transition-all ${isFabHovered ? 'rotate-45' : ''}`}
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Global Drawer */}
      <Drawer
        isOpen={isGlobalDrawerOpen}
        onClose={() => setIsGlobalDrawerOpen(false)}
        title={globalDrawerTab === 'initiate' ? 'New Quick Request' : 'Request Registry'}
        width="max-w-4xl"
        isFullscreen={isFullscreenDrawer}
        onToggleFullscreen={() => setIsFullscreenDrawer(!isFullscreenDrawer)}
      >
        <RequestPanel
          initialTab={globalDrawerTab}
          isDrawerMode={true}
          onClose={() => setIsGlobalDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
};

export default MainLayout;
