
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
        <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
          {isFabHovered && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200 mb-2">
              <button
                onClick={() => { setGlobalDrawerTab('registry'); setIsGlobalDrawerOpen(true); setIsFabHovered(false); }}
                className="btn btn-secondary shadow-xl group"
              >
                <span className="xs-label theme-text">Request List</span>
                <div className="p-1 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
                  <List size={14} />
                </div>
              </button>
              <button
                onClick={() => { setGlobalDrawerTab('initiate'); setIsGlobalDrawerOpen(true); setIsFabHovered(false); }}
                className="btn btn-secondary shadow-xl group"
              >
                <span className="xs-label theme-text">New Request</span>
                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
                  <FileText size={14} />
                </div>
              </button>
            </div>
          )}
          <button
            onClick={() => setIsFabHovered(!isFabHovered)}
            className={`p-4 btn-primary rounded-full shadow-2xl transition-all ${isFabHovered ? 'rotate-45' : ''}`}
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
