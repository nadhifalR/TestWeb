
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, Download, Filter, ShieldCheck, Check, History, Archive, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReportManager, ReportFilter } from '../services/ReportManager';
import { DataTable } from '../components/common/DataTable';
import { RequestForm } from '../types';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from '../hooks/useTranslation';

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { t } = useTranslation();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState<string | null>(null);
  const [showSnapshots, setShowSnapshots] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [data, setData] = useState<RequestForm[]>([]);
  
  const [filters, setFilters] = useState<ReportFilter>({
    dateRange: null,
    department: 'All Departments',
    category: queryParams.get('category') || 'All Categories'
  });

  useEffect(() => {
    const fetchFilteredData = async () => {
      const result = await ReportManager.getFilteredData(filters);
      setData(result);
    };
    fetchFilteredData();
  }, [filters]);

  const grandTotal = useMemo(() => ReportManager.calculateGrandTotal(data), [data]);

  useEffect(() => {
    setSnapshots(ReportManager.getSnapshots());
  }, [archiveSuccess]);

  const columns = useMemo<ColumnDef<RequestForm>[]>(() => [
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      size: 150,
      cell: (info) => <span className="theme-text-muted font-mono text-[11px] block">{new Date(info.getValue() as string).toLocaleDateString()}</span>,
      footer: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Valuation</span>
    },
    {
      header: 'Node ID',
      accessorKey: 'id',
      size: 120,
      cell: (info) => <span className="font-mono font-black text-blue-500 text-xs block">#{info.getValue() as string}</span>
    },
    {
      header: 'Tactical Initiative',
      accessorKey: 'name',
      size: 400,
      cell: (info) => <span className="font-black theme-text uppercase tracking-tight text-xs block min-w-[200px]">{info.getValue() as string}</span>
    },
    {
      header: 'Valuation',
      accessorKey: 'totalCost',
      size: 200,
      cell: (info) => <span className="font-black theme-text text-right font-mono text-sm block">IDR {(info.getValue() as number).toLocaleString()}</span>,
      footer: () => <span className="font-black theme-text text-right font-mono text-lg block">IDR {grandTotal.toLocaleString()}</span>
    }
  ], [grandTotal]);

  const handleApplyFilters = () => {
    setFilters({
      ...filters,
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : null
    });
  };

  const handleExportCSV = () => {
    ReportManager.generateCSV(data);
  };

  const executeSnapshot = async () => {
    setIsSnapshotting(true);
    setArchiveSuccess(null);
    try {
      const checksum = await ReportManager.persistSnapshot(data);
      setArchiveSuccess(checksum);
      setTimeout(() => setArchiveSuccess(null), 5000);
    } finally {
      setIsSnapshotting(false);
    }
  };

  return (
    <div className="space-y-8 page-transition">
      <div className="flex items-center justify-between border-b theme-border pb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/analytics')} className="p-2 hover:theme-bg rounded-full transition-colors theme-text-muted"><ChevronLeft size={24} /></button>
          <div>
            <h1 className="text-3xl font-black theme-text tracking-tighter uppercase">{t('reports.title')}</h1>
            <p className="theme-text-muted font-medium text-sm italic">Immutable reconciliation engine for organizational capital.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSnapshots(!showSnapshots)} className="flex items-center gap-2 px-5 py-3 theme-card border theme-border rounded-2xl text-[10px] font-black uppercase tracking-widest theme-text-muted hover:theme-bg">
            <History size={16} /> History
          </button>
          {archiveSuccess ? (
            <div className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest animate-in zoom-in-95">
              <Check size={16} /> Archive: {archiveSuccess.slice(0, 8)}...
            </div>
          ) : (
            <button onClick={executeSnapshot} disabled={isSnapshotting || data.length === 0} className="flex items-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl transition-all disabled:opacity-50">
              {isSnapshotting ? 'Generating...' : <><ShieldCheck size={16} /> Finalize Archive</>}
            </button>
          )}
          <button onClick={handleExportCSV} disabled={data.length === 0} className="flex items-center gap-2 px-5 py-3 theme-card border theme-border rounded-2xl text-[10px] font-black uppercase tracking-widest theme-text-muted hover:theme-bg">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {showSnapshots ? (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
           <div className="theme-card rounded-[3rem] border theme-border shadow-2xl overflow-hidden mb-10">
              <div className="p-8 theme-bg bg-opacity-50 border-b theme-border flex justify-between items-center">
                 <h3 className="label-caps">Institutional Archive Log</h3>
                 <button onClick={() => setShowSnapshots(false)} className="text-[9px] font-black uppercase tracking-widest text-blue-500">Close Browser</button>
              </div>
              <div className="divide-y theme-border">
                {snapshots.length > 0 ? snapshots.map(snap => (
                  <div key={snap.id} className="p-8 flex items-center justify-between hover:theme-bg transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Archive size={20} />
                      </div>
                      <div>
                        <p className="font-mono text-xs font-black theme-text">#{snap.id}</p>
                        <p className="text-[10px] theme-text-muted font-bold uppercase tracking-widest">Checksum: {snap.checksum.slice(0, 12)}...</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="font-black theme-text text-sm">IDR {snap.totalValuation.toLocaleString()}</p>
                       <p className="text-[9px] theme-text-muted font-bold uppercase tracking-widest">{snap.recordCount} Entities • {new Date(snap.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center text-[10px] font-black theme-text-muted uppercase tracking-widest italic opacity-50">Zero snapshots persisted.</div>
                )}
              </div>
           </div>
        </div>
      ) : (
        <>
          <div className="theme-card p-10 rounded-[3rem] border theme-border shadow-sm flex flex-wrap gap-10 items-end bg-opacity-30">
            <div className="space-y-3">
              <label className="label-caps">Institutional Node</label>
              <select value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})} className="block w-64 px-6 py-4 theme-bg border theme-border rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all theme-text">
                <option>All Departments</option>
                <option>Marketing</option>
                <option>Finance</option>
                <option>Operations</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="label-caps">Strategic Category</label>
              <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})} className="block w-64 px-6 py-4 theme-bg border theme-border rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all theme-text">
                <option>All Categories</option>
                <option>Brand</option>
                <option>Production</option>
                <option>Activation</option>
                <option>Entertainment</option>
                <option>Logistics</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="label-caps">Temporal Start</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="block w-48 px-6 py-4 theme-bg border theme-border rounded-2xl text-xs font-bold outline-none theme-text" />
            </div>

            <div className="space-y-3">
              <label className="label-caps">Temporal End</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="block w-48 px-6 py-4 theme-bg border theme-border rounded-2xl text-xs font-bold outline-none theme-text" />
            </div>

            <button onClick={handleApplyFilters} className="px-10 py-4 bg-slate-900 dark:bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-3 shadow-2xl">
               <Filter size={16} /> Synthesize Reports
            </button>
          </div>

          <div className="theme-card rounded-[3.5rem] border theme-border shadow-2xl overflow-hidden mb-20">
            <DataTable data={data} columns={columns} showFooter={true} />
          </div>
        </>
      )}
    </div>
  );
};

export default ReportPage;
