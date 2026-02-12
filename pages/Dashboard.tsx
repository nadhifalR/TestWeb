
import React, { useMemo, useState, useEffect } from 'react';
import { AuthManager } from '../services/AuthManager';
import { AnalyticsManager, DashboardStats } from '../services/AnalyticsManager';
import { RequestManager } from '../services/RequestManager';
import { TrendingUp, CheckCircle, Clock, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '@tremor/react';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = AuthManager.getCurrentUser();

  const [themeTick, setThemeTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [velocityData, setVelocityData] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    const themeHandler = () => setThemeTick(t => t + 1);
    window.addEventListener('nexus-theme-change', themeHandler);

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const requests = await RequestManager.getRequests();
        setRecentRequests(requests || []);

        const [s, v] = await Promise.all([
          AnalyticsManager.getDashboardStats(),
          AnalyticsManager.getVelocityData(requests || [])
        ]);
        setStats(s);
        setVelocityData(v || []);
      } catch (error) {
        console.error("Analytics synchronization failure:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
    return () => window.removeEventListener('nexus-theme-change', themeHandler);
  }, []);

  const nivoTheme = useMemo(() => ({
    text: {
      fill: "var(--text-secondary)",
      fontSize: 10,
    },
    axis: {
      domain: { line: { stroke: "var(--border-color)" } },
      ticks: { line: { stroke: "var(--border-color)" }, text: { fill: "var(--text-secondary)" } },
    },
    grid: { line: { stroke: "var(--border-color)", strokeWidth: 1 } },
    tooltip: {
      container: {
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        fontSize: 11,
        borderRadius: 8,
        border: "1px solid var(--border-color)",
        fontWeight: "bold" as const
      }
    }
  }), [themeTick]);

  if (isLoading && !stats) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4 theme-text-muted">
        <div className="relative">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Synchronizing Nexus Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-transition">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b theme-border pb-6">
        <div>
          <h1 className="text-2xl font-extrabold theme-text tracking-tight uppercase">Executive Control</h1>
          <p className="theme-text-muted text-sm font-medium tracking-tight">Active session for {user?.username} • {user?.department}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 theme-card rounded-lg flex items-center gap-2 border shadow-sm">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold theme-text-muted uppercase tracking-wider">Interface: Latency Optimized</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Audits', value: stats?.pendingCount || 0, desc: 'Awaiting Authorization', icon: Clock, color: 'text-amber-500' },
          { label: 'Deployed Value', value: `IDR ${((stats?.totalSpend || 0) / 1000000).toFixed(1)}M`, desc: 'Capital Allocation', icon: TrendingUp, color: 'text-blue-500' },
          { label: 'Registry Nodes', value: stats?.totalRequests || 0, desc: 'Operational Contexts', icon: Zap, color: 'text-indigo-500' },
          { label: 'Success Protocols', value: stats?.approvedCount || 0, desc: 'Finalized Clearances', icon: CheckCircle, color: 'text-emerald-500' },
        ].map((s, idx) => (
          <div key={idx} className="theme-card p-6 rounded-lg flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <s.icon size={64} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <span className="label-caps font-black">{s.label}</span>
              <s.icon size={16} className={`${s.color} transition-colors`} />
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-black theme-text tracking-tighter">{s.value}</p>
              <p className="text-[10px] font-bold theme-text-muted mt-1 uppercase tracking-widest opacity-60">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 theme-card rounded-lg p-10 shadow-sm flex flex-col h-[450px] relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xs font-black theme-text uppercase tracking-[0.3em] mb-1">Financial Velocity</h3>
              <p className="text-[10px] theme-text-muted font-bold uppercase tracking-widest opacity-50">Intra-week capital deployment</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                <span className="text-[9px] font-black uppercase tracking-widest theme-text-muted">Node Volume</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full opacity-20">
                <Loader2 size={32} className="animate-spin" />
              </div>
            ) : velocityData.length > 0 ? (
              <BarChart
                className="h-full"
                data={velocityData}
                index="label"
                categories={['val']}
                colors={['blue']}
                valueFormatter={(number) => Intl.NumberFormat('us').format(number).toString()}
                yAxisWidth={48}
                showAnimation={true}
                showLegend={false}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-400">
                <AlertCircle size={32} className="mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">Insufficient Velocity Data</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-lg p-10 text-white flex flex-col shadow-2xl h-[450px]">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-slate-500">Telemetry Stream</h3>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Real-time</span>
          </div>
          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {(recentRequests || []).slice(0, 10).map((req, i) => (
              <button
                key={req.id}
                onClick={() => navigate(`/requests?id=${req.id}`)}
                className="w-full text-left flex gap-4 items-start border-l-2 border-slate-800 hover:border-blue-500 pl-4 py-1.5 transition-all group active:scale-95 animate-in slide-in-from-right-2 duration-300"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] text-white font-black leading-tight group-hover:text-blue-400 transition-colors uppercase tracking-tight truncate">#{req.id} • {req.name}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                      req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                      {req.status}
                    </span>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tabular-nums">IDR {req.totalCost.toLocaleString()}</p>
                  </div>
                </div>
              </button>
            ))}
            {(recentRequests || []).length === 0 && (
              <div className="flex flex-col items-center justify-center h-full opacity-30 text-slate-400">
                <AlertCircle size={24} className="mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No Stream Available</p>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/requests')}
            className="mt-10 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 transition-all active:scale-95"
          >
            Access Full Registry
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
