import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import { RequestManager } from '../services/RequestManager';
import { RequestFormManager } from '../services/RequestFormManager';
import { RequestItemManager } from '../services/RequestItemManager';
import { RequestStatus, RequestForm, RequestItem } from '../types';
import { AuthManager } from '../services/AuthManager';
import { NotificationManager } from '../services/NotificationManager';
import { LogManager } from '../services/LogManager';
import { DataTable } from '../components/common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Drawer } from '../components/common/Drawer';
import { RequestFormEditor } from '../components/requests/RequestFormEditor';

const RequestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = AuthManager.getCurrentUser();

  const [activeSubPage, setActiveSubPage] = useState<'initiate' | 'registry'>('initiate');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewingRequest, setViewingRequest] = useState<RequestForm | any>(null);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [requests, setRequests] = useState<RequestForm[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [tempId] = useState(`TMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFullscreenDrawer, setIsFullscreenDrawer] = useState(false);

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, total } = await RequestManager.getRequestsPaginated(pagination.pageIndex, pagination.pageSize);
      setRequests(data);
      setTotalRequests(total);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get('id');

    // Only process ID if requests are loaded, to find the item
    // OR if we implement a backend fetch single item. Since we usually load all for the table, this works.
    // Ideally we should fetch the single item if not found in table.
    if (requestId) {
      // Just triggering drawer based on ID param presence
      const found = requests.find(r => r.id === requestId);
      if (found) {
        setViewingRequest(found);
        setIsDrawerOpen(true);
        setActiveSubPage('registry'); // Ensure table is behind
        setItems(found.items);
        setFormState(found);
      } else if (requests.length > 0) {
        // If requests are loaded but ID not found, maybe handle cleanup or fetch
        // For now, assuming standard flow
      }
    } else {
      setIsDrawerOpen(false);
      setViewingRequest(null);
    }
  }, [location.search, requests]);

  const currentSchema = useMemo(() => selectedCategory ? RequestFormManager.getSchemaByCategory(selectedCategory) : null, [selectedCategory]);

  const handleLoadPresets = () => {
    if (selectedCategory) {
      const presets = RequestManager.getPresetsForCategory(selectedCategory);
      setItems(presets);
    }
  };

  useEffect(() => {
    if (selectedCategory && !viewingRequest) {
      handleLoadPresets();
      setFormState({
        name: '',
        eventDate: new Date().toISOString().split('T')[0],
        budgetSource: currentSchema?.defaultValues.budgetSource || 'Strategic Fund',
        cashAdvance: currentSchema?.defaultValues.cashAdvance || 0,
        ...currentSchema?.defaultValues
      });
      setValidationErrors({});
    }
  }, [selectedCategory, viewingRequest, currentSchema]);

  const handleAction = async (status: 'draft' | 'submit') => {
    if (!selectedCategory && !viewingRequest) return;
    setIsSubmitting(true);
    setValidationErrors({});

    try {
      await RequestManager.createOrUpdateFromFormAsync(formState, items, selectedCategory || viewingRequest.category, status, viewingRequest?.id, tempId);

      // Cleanup for Create New
      if (!viewingRequest) {
        setSelectedCategory(null);
        setActiveSubPage('registry');
      } else {
        // Cleanup for Drawer Update
        setIsDrawerOpen(false);
        navigate('/requests');
      }

      setViewingRequest(null);
      await loadRequests();

      NotificationManager.addNotification({
        userId: user?.id || 'system',
        title: 'Success',
        message: status === 'submit' ? 'Request submitted successfully.' : 'Draft saved successfully.',
      });

      if (user) {
        LogManager.addLog(user.id, status === 'submit' ? 'SUBMIT_REQUEST' : 'SAVE_DRAFT', `Request ${viewingRequest?.id || tempId} finalized via FastAPI.`);
      }
    } catch (e: any) {
      const errorMsg = e.message || 'System error occurred.';
      NotificationManager.addNotification({
        userId: user?.id || 'system',
        title: 'Action Failed',
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (id: string, decision: 'approve' | 'deny' | 'revision') => {
    setIsSubmitting(true);
    try {
      await RequestManager.processReviewAsync(id, decision);
      setIsDrawerOpen(false);
      setViewingRequest(null);
      navigate('/requests');
      await loadRequests();

      NotificationManager.addNotification({
        userId: user?.id || 'system',
        title: 'Audit Complete',
        message: `Request status updated to ${decision.toUpperCase()}.`,
      });
    } catch (e: any) {
      NotificationManager.addNotification({
        userId: user?.id || 'system',
        title: 'Review Failed',
        message: e.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditable = !viewingRequest || viewingRequest.status === RequestStatus.DRAFT || viewingRequest.status === RequestStatus.REVISION;

  const handleItemsChange = useCallback((updater: (prev: RequestItem[]) => RequestItem[]) => {
    setItems(updater);
  }, []);

  const columns = useMemo<ColumnDef<RequestForm>[]>(() => [
    {
      header: 'ID',
      accessorKey: 'id',
      size: 100,
      cell: (info) => <span className="font-mono text-[11px] font-bold text-slate-400">#{info.getValue() as string}</span>
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      size: 120,
      cell: (info) => <span className="text-[12px] font-medium theme-text-muted">{new Date(info.getValue() as string).toLocaleDateString()}</span>
    },
    {
      header: 'Initiative Context',
      accessorKey: 'name',
      size: 400,
      cell: (info) => {
        const r = info.row.original;
        return (
          <div className="min-w-[250px]">
            <p className="font-bold theme-text text-[13px]">{r.name}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{r.category}</p>
          </div>
        );
      }
    },
    {
      header: 'Valuation',
      accessorKey: 'totalCost',
      size: 180,
      cell: (info) => <span className="font-bold theme-text text-[13px]">IDR {(info.getValue() as number).toLocaleString()}</span>
    },
    {
      header: 'State',
      accessorKey: 'status',
      size: 140,
      cell: (info) => {
        const status = info.getValue() as RequestStatus;
        return (
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${status === RequestStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-200' :
            status === RequestStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
              status === RequestStatus.DENIED ? 'bg-red-50 text-red-600 border-red-200' :
                'theme-bg theme-text-muted theme-border'
            }`}>
            {status}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: (info) => {
        const r = info.row.original;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/requests?id=${r.id}`); }}
            className="px-3 py-1.5 border theme-border rounded-lg text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all"
          >
            View
          </button>
        );
      }
    }
  ], [navigate]);

  const categories = [
    { name: 'Brand', icon: '🎨' },
    { name: 'Production', icon: '⚙️' },
    { name: 'Activation', icon: '⚡' },
    { name: 'Entertainment', icon: '🎭' },
    { name: 'Logistics', icon: '📦' },
  ];

  return (
    <div className="space-y-6 page-transition">
      <div className="flex items-center justify-between border-b theme-border pb-6">
        <div className="flex items-center gap-4">
          {(selectedCategory) && <button onClick={() => { setSelectedCategory(null); }} className="p-1.5 hover:theme-bg border theme-border rounded transition-all text-slate-500"><ChevronLeft size={18} /></button>}
          <div>
            <h1 className="text-3xl font-black theme-text uppercase tracking-tight">Requests</h1>
            <p className="theme-text-muted text-sm font-medium tracking-tight">Manage and track all service requests.</p>
          </div>
        </div>
        {!selectedCategory && (
          <div className="flex theme-bg border theme-border rounded-lg p-1.5 shadow-sm">
            <button onClick={() => setActiveSubPage('initiate')} className={`btn btn-sm ${activeSubPage === 'initiate' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'btn-ghost'}`}>Create new</button>
            <button onClick={() => setActiveSubPage('registry')} className={`btn btn-sm ${activeSubPage === 'registry' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'btn-ghost'}`}>Submitted</button>
          </div>
        )}
      </div>

      {/* CREATE NEW: Category Selection */}
      {!selectedCategory && activeSubPage === 'initiate' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 py-6">
          {categories.map((cat) => (
            <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className="theme-card p-10 rounded-lg border theme-border hover:border-slate-900 transition-all text-center group active:scale-95">
              <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">{cat.icon}</div>
              <h3 className="font-bold theme-text text-[13px] uppercase tracking-wider">{cat.name}</h3>
            </button>
          ))}
        </div>
      )}

      {/* REGISTRY: DataTable */}
      {(!selectedCategory && activeSubPage === 'registry') || (isDrawerOpen) ? (
        <div className="space-y-4">
          {activeSubPage === 'registry' && (
            <>
              <div className="flex justify-end">
                <div className="relative w-full max-sm:max-w-full max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-muted" size={16} />
                  <input
                    type="text"
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Submitted filter (ID, Name)..."
                    className="w-full pl-11 pr-4 py-2 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>
              <div className="theme-card rounded-lg border theme-border shadow-xl overflow-hidden">
                {isLoading && requests.length === 0 ? (
                  <LoadingSpinner message="Loading Request Registry..." fullPage={false} />
                ) : (
                  <DataTable
                    data={requests}
                    columns={columns}
                    onRowClick={(r) => navigate(`/requests?id=${r.id}`)}
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                    pageCount={Math.ceil(totalRequests / pagination.pageSize)}
                    onPaginationChange={setPagination}
                    pagination={pagination}
                  />
                )}
              </div>
            </>
          )}
        </div>
      ) : null}

      {/* CREATE NEW: Full Page Editor */}
      {selectedCategory && (
        <div className="animate-in zoom-in-95 duration-300">
          <RequestFormEditor
            viewingRequest={null}
            selectedCategory={selectedCategory}
            formState={formState}
            setFormState={setFormState}
            items={items}
            onItemsChange={handleItemsChange}
            onLoadPresets={handleLoadPresets}
            isEditable={true}
            validationErrors={validationErrors}
            isSubmitting={isSubmitting}
            onAction={handleAction}
            onReview={(decision) => viewingRequest && handleReview(viewingRequest.id, decision)}
            onCancel={() => setSelectedCategory(null)}
            tempId={tempId[0]}
          />
        </div>
      )}

      {/* VIEW DETAILS: Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => { navigate('/requests'); setIsDrawerOpen(false); setViewingRequest(null); }}
        title="Request Details"
        width="max-w-4xl"
        isFullscreen={isFullscreenDrawer}
        onToggleFullscreen={() => setIsFullscreenDrawer(!isFullscreenDrawer)}
      >
        {viewingRequest && (
          <RequestFormEditor
            viewingRequest={viewingRequest}
            selectedCategory={viewingRequest.category}
            formState={formState}
            setFormState={setFormState}
            items={items}
            onItemsChange={handleItemsChange}
            onLoadPresets={handleLoadPresets}
            isEditable={isEditable}
            validationErrors={validationErrors}
            isSubmitting={isSubmitting}
            onAction={handleAction}
            onReview={(decision) => viewingRequest && handleReview(viewingRequest.id, decision)}
            onCancel={() => { navigate('/requests'); setIsDrawerOpen(false); setViewingRequest(null); }}
            tempId={tempId[0]}
            isDrawerMode={true}
          />
        )}
      </Drawer>
    </div>
  );
};

export default RequestPage;
