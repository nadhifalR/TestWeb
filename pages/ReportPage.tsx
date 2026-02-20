
import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, Download, Filter, ShieldCheck, Check, History, Archive, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ReportManager, ReportFilter } from '../services/ReportManager';
import { DataTable } from '../components/common/DataTable';
import { RequestForm } from '../types';
import { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from '../hooks/useTranslation';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FilterPanel } from '../components/common/FilterPanel';
import { RequestFilters } from '../types';

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
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState<ReportFilter>({
    department: 'All Departments',
    categories: queryParams.get('category') ? [queryParams.get('category')!] : []
  });

  useEffect(() => {
    const fetchFilteredData = async () => {
      setIsLoading(true);
      try {
        const result = await ReportManager.getFilteredData(filters);
        setData(result);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFilteredData();
  }, [filters]);

  const grandTotal = useMemo(() => ReportManager.calculateGrandTotal(data), [data]);

  const loadSnapshots = async () => {
    const snaps = await ReportManager.getSnapshots();
    setSnapshots(snaps);
  };

  useEffect(() => {
    loadSnapshots();
  }, [archiveSuccess, showSnapshots]);

  const columns = useMemo<ColumnDef<RequestForm>[]>(() => [
    {
      header: 'Timestamp',
      accessorKey: 'createdAt',
      size: 150,
      cell: (info) => <span className="theme-text-muted font-mono text-[11px] block">{new Date(info.getValue() as string).toLocaleDateString()}</span>,
      footer: () => <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Cost</span>
    },
    {
      header: 'Request ID',
      accessorKey: 'id',
      size: 120,
      cell: (info) => <span className="font-mono font-black text-blue-500 text-xs block">#{info.getValue() as string}</span>
    },
    {
      header: 'Request Name',
      accessorKey: 'name',
      size: 400,
      cell: (info) => <span className="font-black theme-text uppercase tracking-tight text-xs block min-w-[200px]">{info.getValue() as string}</span>
    },
    {
      header: 'Valuation',
      accessorKey: 'totalCost',
      size: 200,
      cell: (info) => <span className="font-black theme-text text-right tabular-nums text-sm block">IDR {(info.getValue() as number).toLocaleString()}</span>,
      footer: () => <span className="font-black theme-text text-right tabular-nums text-lg block">IDR {grandTotal.toLocaleString()}</span>
    }
  ], [grandTotal]);

  const handleApplyFilters = () => {
    // Logic moved to setFilters and useEffect
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
          <div>
            <h1 className="text-3xl font-black theme-text tracking-tight uppercase">{t('reports.title')}</h1>
            <p className="theme-text-muted text-sm font-medium tracking-tight">Generate and export financial reports.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSnapshots(!showSnapshots)} className="btn btn-secondary btn-md theme-bg theme-text-muted">
            <History size={16} /> Archive
          </button>
          {archiveSuccess ? (
            <div className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest animate-in zoom-in-95">
              <Check size={16} /> Archive: {archiveSuccess.slice(0, 8)}...
            </div>
          ) : (
            <button onClick={executeSnapshot} disabled={isSnapshotting || data.length === 0} className="btn btn-primary btn-md">
              {isSnapshotting ? 'Generating...' : <><ShieldCheck size={16} /> Create Snapshot</>}
            </button>
          )}
          <button onClick={handleExportCSV} disabled={data.length === 0} className="flex items-center gap-2 px-5 py-3 theme-card border theme-border rounded-lg text-[10px] font-black uppercase tracking-widest theme-text-muted hover:theme-bg">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {showSnapshots ? (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="theme-card rounded-lg border theme-border shadow-2xl overflow-hidden mb-10">
            <div className="p-8 theme-bg bg-opacity-50 border-b theme-border flex justify-between items-center">
              <h3 className="label-caps">Archive History</h3>
              <button onClick={() => setShowSnapshots(false)} className="btn btn-ghost btn-sm text-blue-500">Close</button>
            </div>
            <div className="divide-y theme-border">
              {snapshots.length > 0 ? snapshots.map(snap => (
                <div key={snap.id} className="p-8 flex items-center justify-between hover:theme-bg transition-colors">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-blue-600/10 text-blue-600 rounded-lg flex items-center justify-center">
                      <Archive size={20} />
                    </div>
                    <div>
                      <p className="font-mono text-xs font-black theme-text">SNP-{snap.id}</p>
                      <p className="text-[10px] theme-text-muted font-bold uppercase tracking-widest">Checksum: {snap.checksum.slice(0, 12)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black theme-text text-sm">IDR {snap.totalValuation.toLocaleString()}</p>
                    <p className="text-[9px] theme-text-muted font-bold uppercase tracking-widest">{snap.recordCount} Entities • {new Date(snap.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center text-[10px] font-black theme-text-muted uppercase tracking-widest italic opacity-50">No snapshots found.</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {isLoading ? (
            <SkeletonCard height="h-24" className="bg-opacity-30 p-10" />
          ) : (
            <div className="flex flex-col gap-6">
              <div className="theme-card p-6 rounded-lg border theme-border shadow-sm bg-opacity-30">
                <div className="flex flex-wrap gap-8 items-end">
                  <div className="space-y-3">
                    <label className="label-caps">Department Scope</label>
                    <select
                      value={filters.department}
                      onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                      className="block w-64 px-6 py-4 theme-bg border theme-border rounded-lg text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all theme-text"
                    >
                      <option>All Departments</option>
                      <option>Marketing</option>
                      <option>Finance</option>
                      <option>Operations</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <FilterPanel filters={filters} onFiltersChange={(f) => setFilters({ ...filters, ...f })} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="theme-card rounded-lg border theme-border shadow-2xl overflow-hidden mb-20">
            {isLoading ? (
              <LoadingSpinner message="Loading Report Data..." fullPage={false} />
            ) : (
              <DataTable data={data} columns={columns} showFooter={true} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportPage;
