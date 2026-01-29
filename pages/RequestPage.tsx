
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Briefcase, User as UserIcon, DollarSign, Hash, LayoutGrid, X, Loader2, Sparkles, Wallet, Search, AlertCircle, Check, Send, Save, MessageSquare } from 'lucide-react';
import { RequestManager } from '../services/RequestManager';
import { RequestFormManager } from '../services/RequestFormManager';
import { RequestItemManager } from '../services/RequestItemManager';
import { RequestStatus, RequestForm, RequestItem } from '../types';
import { AuthManager } from '../services/AuthManager';
import { AccountManager } from '../services/AccountManager';
import { NotificationManager } from '../services/NotificationManager';
import { DiscussionThread } from '../components/requests/DiscussionThread';
import { FileUploader } from '../components/requests/FileUploader';
import { DataTable } from '../components/common/DataTable';
import { RequestItemEditor } from '../components/requests/RequestItemEditor';
import { ColumnDef } from '@tanstack/react-table';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [tempId] = useState(`TMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
  
  const loadRequests = async () => {
    setIsLoading(true);
    try {
      const data = await RequestManager.getRequests();
      setRequests(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get('id');
    if (requestId && requests.length > 0) {
      const found = requests.find(r => r.id === requestId);
      if (found) {
        setSelectedCategory(found.category);
        setViewingRequest(found);
        setItems(found.items);
        setFormState(found);
      }
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

  const totalCost = useMemo(() => RequestItemManager.calculateTotal(items), [items]);

  const handleAction = async (status: 'draft' | 'submit') => {
    if (!selectedCategory) return;
    setIsSubmitting(true);
    setValidationErrors({});
    
    try {
      await RequestManager.createOrUpdateFromFormAsync(formState, items, selectedCategory, status, viewingRequest?.id, tempId);
      setSelectedCategory(null);
      setViewingRequest(null);
      setActiveSubPage('registry');
      await loadRequests();
      navigate('/requests');
      
      NotificationManager.addNotification({
        userId: user?.id || 'system',
        title: 'Success',
        message: status === 'submit' ? 'Request submitted for audit.' : 'Draft saved successfully.',
      });
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
      setViewingRequest(null);
      await loadRequests();
      navigate('/requests');
      
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
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
            status === RequestStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-200' : 
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
            className="px-3 py-1.5 border theme-border rounded-xl text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all"
          >
            Audit
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
          {(selectedCategory || viewingRequest) && <button onClick={() => { setSelectedCategory(null); setViewingRequest(null); navigate('/requests'); }} className="p-1.5 hover:theme-bg border theme-border rounded transition-all text-slate-500"><ChevronLeft size={18} /></button>}
          <div><h1 className="text-2xl font-extrabold theme-text uppercase tracking-tight">Requests</h1></div>
        </div>
        {!selectedCategory && !viewingRequest && (
          <div className="flex theme-bg border theme-border rounded-xl p-1 shadow-sm">
            <button onClick={() => setActiveSubPage('initiate')} className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest ${activeSubPage === 'initiate' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Initiate</button>
            <button onClick={() => setActiveSubPage('registry')} className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest ${activeSubPage === 'registry' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400'}`}>Registry</button>
          </div>
        )}
      </div>

      {!selectedCategory && !viewingRequest && activeSubPage === 'initiate' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 py-6">
          {categories.map((cat) => (
            <button key={cat.name} onClick={() => setSelectedCategory(cat.name)} className="theme-card p-10 rounded-3xl border theme-border hover:border-slate-900 transition-all text-center group active:scale-95">
              <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">{cat.icon}</div>
              <h3 className="font-bold theme-text text-[13px] uppercase tracking-wider">{cat.name}</h3>
            </button>
          ))}
        </div>
      )}

      {!selectedCategory && !viewingRequest && activeSubPage === 'registry' && (
        <div className="space-y-4">
          <div className="flex justify-end">
             <div className="relative w-full max-sm:max-w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-muted" size={16} />
                <input 
                  type="text" 
                  value={globalFilter} 
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Registry filter (ID, Name)..."
                  className="w-full pl-11 pr-4 py-2 theme-bg border theme-border rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
             </div>
          </div>
          <div className="theme-card rounded-[2rem] border theme-border shadow-xl overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-slate-300" />
              </div>
            ) : (
              <DataTable 
                data={requests} 
                columns={columns} 
                onRowClick={(r) => navigate(`/requests?id=${r.id}`)} 
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
              />
            )}
          </div>
        </div>
      )}

      {(selectedCategory || viewingRequest) && (
        <div className="space-y-8 pb-64 animate-in zoom-in-95 duration-300 max-w-6xl mx-auto">
          <div className="theme-card rounded-[3rem] border theme-border shadow-2xl overflow-hidden">
            <div className="p-8 theme-bg bg-opacity-30 border-b theme-border flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-slate-900 text-white rounded-2xl">
                     <Hash size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black theme-text uppercase tracking-widest">
                      {viewingRequest ? `Protocol Audit: ${viewingRequest.id}` : `New Initiative: ${selectedCategory}`}
                    </h3>
                    {viewingRequest && <p className="text-[10px] theme-text-muted font-bold uppercase tracking-widest mt-1">Status: {viewingRequest.status} • Created {new Date(viewingRequest.createdAt).toLocaleDateString()}</p>}
                  </div>
               </div>
            </div>
            
            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="label-caps">Tactical Initiative Name</label>
                    <input 
                      disabled={!isEditable}
                      value={formState.name}
                      onChange={(e) => setFormState({...formState, name: e.target.value})}
                      className={`w-full px-6 py-4 theme-bg border ${validationErrors.name ? 'border-red-500 bg-red-50/10' : 'theme-border'} rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all theme-text`}
                      placeholder="e.g. Q4 Brand Expansion"
                    />
                    {validationErrors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10}/> {validationErrors.name}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="label-caps">Temporal Window</label>
                      <input 
                        type="date"
                        disabled={!isEditable}
                        value={formState.eventDate}
                        onChange={(e) => setFormState({...formState, eventDate: e.target.value})}
                        className="w-full px-6 py-4 theme-bg border theme-border rounded-2xl font-bold text-xs outline-none theme-text"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="label-caps">Fiscal Source</label>
                      <select 
                        disabled={!isEditable}
                        value={formState.budgetSource}
                        onChange={(e) => setFormState({...formState, budgetSource: e.target.value})}
                        className="w-full px-6 py-4 theme-bg border theme-border rounded-2xl font-bold text-xs outline-none theme-text"
                      >
                        <option>Strategic Fund</option>
                        <option>Operational Reserve</option>
                        <option>Asset Management</option>
                        <option>Corporate Brand Fund</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="theme-bg bg-opacity-30 p-8 rounded-[2rem] border theme-border flex flex-col justify-center text-center">
                   <p className="label-caps mb-4">Total Aggregate Valuation</p>
                   <p className="text-5xl font-black theme-text tracking-tighter">IDR {totalCost.toLocaleString()}</p>
                   
                   <div className="mt-8 pt-6 border-t theme-border border-opacity-20 flex flex-col items-center">
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet size={14} className="text-slate-400" />
                        <label className="label-caps">Cash Advance Request</label>
                      </div>
                      <div className="relative w-full max-w-[240px]">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">IDR</span>
                        <input 
                          type="number"
                          disabled={!isEditable}
                          value={formState.cashAdvance || ''}
                          onChange={(e) => setFormState({...formState, cashAdvance: Number(e.target.value)})}
                          placeholder="0"
                          className="w-full pl-12 pr-4 py-3 bg-white border theme-border rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-center transition-all theme-text"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Standard Provision: 80% Max</p>
                   </div>
                </div>
              </div>

              <RequestItemEditor items={items} onItemsChange={handleItemsChange} onLoadPresets={handleLoadPresets} disabled={!isEditable} />
              
              <div className="flex flex-col gap-12 pt-6">
                <FileUploader requestId={viewingRequest?.id || tempId} />
                <DiscussionThread requestId={viewingRequest?.id || tempId} />
              </div>
            </div>

            <div className="p-10 border-t theme-border theme-bg bg-opacity-50 flex justify-between items-center">
              <button onClick={() => { setSelectedCategory(null); setViewingRequest(null); navigate('/requests'); }} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest theme-text-muted hover:theme-text transition-all">Abort Action</button>
              
              <div className="flex gap-4">
                {isEditable ? (
                  <>
                    <button disabled={isSubmitting} onClick={() => handleAction('draft')} className="px-8 py-4 theme-card border theme-border rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] theme-text hover:bg-white transition-all shadow-sm flex items-center gap-2">
                       <Save size={16} /> Save Manifest
                    </button>
                    <button disabled={isSubmitting} onClick={() => handleAction('submit')} className="px-10 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black shadow-2xl transition-all flex items-center gap-3">
                       {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Deploy for Audit
                    </button>
                  </>
                ) : (
                  AccountManager.hasPermission(user!, 'APPROVE') && viewingRequest?.status === RequestStatus.PENDING && (
                    <div className="flex gap-3">
                      <button onClick={() => handleReview(viewingRequest.id, 'revision')} className="px-8 py-4 bg-amber-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Request Revision</button>
                      <button onClick={() => handleReview(viewingRequest.id, 'deny')} className="px-8 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Deny Access</button>
                      <button onClick={() => handleReview(viewingRequest.id, 'approve')} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><Check size={18}/> Authorize Deployment</button>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestPage;
