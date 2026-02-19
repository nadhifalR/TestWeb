
import React, { useState, useEffect } from 'react';
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
  const [drawerTitle, setDrawerTitle] = useState<React.ReactNode>('');
  const [overrideRequestId, setOverrideRequestId] = useState<string | null>(null);
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(null);

  const location = useLocation();
  const isRequestPage = location.pathname === '/requests';

  // Sync sidebar width as a CSS variable for the Drawer's dynamic width calculation
  React.useEffect(() => {
    const sidebarWidth = isSidebarCollapsed ? 64 : 256;
    document.documentElement.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  }, [isSidebarCollapsed]);

  // Handle Global Drawer Triggers (e.g. from Notifications)
  useEffect(() => {
    const handleOpenDrawer = (e: any) => {
      const { requestId, commentId, tab } = e.detail || {};
      if (requestId) {
        setOverrideRequestId(requestId);
        setHighlightCommentId(commentId || null);
        setGlobalDrawerTab('registry'); // Ensure we go to details view
      } else if (tab) {
        setGlobalDrawerTab(tab);
      }
      setIsGlobalDrawerOpen(true);
    };

    window.addEventListener('nexus-open-drawer', handleOpenDrawer);
    return () => window.removeEventListener('nexus-open-drawer', handleOpenDrawer);
  }, []);

  return (
    <div className="flex min-h-screen theme-bg theme-text transition-all duration-300">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-6">
          <div className="max-w-[95%] mx-auto">
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
                className="btn btn-primary shadow-xl group px-6 py-3"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest mr-4">Request List</span>
                <List size={18} className="text-white" />
              </button>
              <button
                onClick={() => { setGlobalDrawerTab('initiate'); setIsGlobalDrawerOpen(true); setIsFabHovered(false); }}
                className="btn btn-primary shadow-xl group px-6 py-3"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest mr-4">New Request</span>
                <FileText size={18} className="text-white" />
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
        onClose={() => { setIsGlobalDrawerOpen(false); setOverrideRequestId(null); setHighlightCommentId(null); }}
        title={drawerTitle}
        width="max-w-4xl"
        isFullscreen={isFullscreenDrawer}
        onToggleFullscreen={() => setIsFullscreenDrawer(!isFullscreenDrawer)}
      >
        <RequestPanel
          initialTab={globalDrawerTab}
          isDrawerMode={true}
          isFullscreen={isFullscreenDrawer}
          onClose={() => { setIsGlobalDrawerOpen(false); setOverrideRequestId(null); setHighlightCommentId(null); }}
          onTitleChange={setDrawerTitle}
          overrideRequestId={overrideRequestId}
          highlightCommentId={highlightCommentId}
        />
      </Drawer>
    </div>
  );
};

export default MainLayout;
