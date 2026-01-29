
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, Users, Calendar, Download, ArrowRight, BarChart as BarIcon, PieChart as PieIcon, Activity, Filter as FilterIcon, X, Loader2 } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { AnalyticsManager, DashboardStats } from '../services/AnalyticsManager';
import { RequestManager } from '../services/RequestManager';

const AnalyticsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [themeTick, setThemeTick] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [velocityData, setVelocityData] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);

  useEffect(() => {
    const handler = () => setThemeTick(t => t + 1);
    window.addEventListener('nexus-theme-change', handler);

    const fetchData = async () => {
      setIsLoading(true);
      const raw = RequestManager.getRequests();
      try {
        const [s, t, v, d] = await Promise.all([
          AnalyticsManager.getDashboardStats(),
          AnalyticsManager.getMonthlySpendTrend(raw),
          AnalyticsManager.getWeeklyVolume(raw),
          AnalyticsManager.getCategoryDistribution(raw)
        ]);
        setStats(s);
        setTrendData(t);
        setVelocityData(v);
        setDistribution(d);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    return () => window.removeEventListener('nexus-theme-change', handler);
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
        border: "1px solid var(--border-color)"
      }
    }
  }), [themeTick]);

  if (isLoading && !stats) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-6 theme-text-muted">
         <Loader2 className="animate-spin" size={48} />
         <p className="text-xs font-black uppercase tracking-[0.3em] italic">Synthesizing Institutional Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 page-transition">
      <div className="flex items-center justify-between border-b theme-border pb-6">
        <div>
          <h1 className="text-3xl font-black theme-text tracking-tighter uppercase">Analytics</h1>
          <p className="theme-text-muted font-medium text-sm">Real-time visibility into budget allocation metrics.</p>
        </div>
        {selectedCategory && (
          <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
            <FilterIcon size={12} /> {selectedCategory} <X size={12} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: <DollarSign size={24} />, label: 'Total Volume', value: `IDR ${((stats?.totalSpend || 0) / 1000000).toFixed(1)}M` },
          { icon: <TrendingUp size={24} />, label: 'Growth', value: '+14.2%' },
          { icon: <Users size={24} />, label: 'Auditors', value: '4' },
          { icon: <Calendar size={24} />, label: 'Contexts', value: stats?.totalRequests || 0 },
        ].map((stat, i) => (
          <div key={i} className="theme-card p-8 rounded-[2rem] border theme-border flex items-center gap-6">
            <div className="w-14 h-14 theme-bg rounded-2xl flex items-center justify-center text-slate-400">{stat.icon}</div>
            <div>
              <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black theme-text tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="theme-card p-10 rounded-[3rem] border theme-border flex flex-col h-[500px]">
          <h3 className="font-black theme-text uppercase tracking-widest text-[11px] mb-8 text-center">Spend Velocity</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveBar
              data={trendData.map(d => ({ month: d.month, Spend: d.spend, Budget: d.budget }))}
              keys={['Spend', 'Budget']}
              indexBy="month"
              margin={{ top: 10, right: 30, bottom: 50, left: 60 }}
              padding={0.4}
              groupMode="grouped"
              colors={['#2563eb', '#cbd5e1']}
              theme={nivoTheme}
              enableLabel={false}
              axisLeft={{ format: v => `${(Number(v) / 1000000).toFixed(1)}M` }}
            />
          </div>
        </div>

        <div className="theme-card p-10 rounded-[3rem] border theme-border flex flex-col h-[500px]">
          <h3 className="font-black theme-text uppercase tracking-widest text-[11px] mb-8 text-center">Daily Audit Volume</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveLine
              data={velocityData}
              margin={{ top: 10, right: 30, bottom: 50, left: 60 }}
              xScale={{ type: 'point' }}
              theme={nivoTheme}
              colors={['#3b82f6']}
              curve="monotoneX"
              enableArea={true}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="theme-card p-10 rounded-[3rem] border theme-border flex flex-col h-[400px]">
          <h3 className="font-black theme-text uppercase tracking-widest text-[10px] mb-6 text-center">Asset Saturation</h3>
          <div className="flex-1 min-h-0">
            <ResponsivePie
              data={distribution}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.7}
              padAngle={2}
              cornerRadius={4}
              onClick={(node) => setSelectedCategory(String(node.id))}
              theme={nivoTheme}
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900 p-12 rounded-[3.5rem] text-white flex flex-col justify-between shadow-2xl h-[400px]">
          <div className="relative z-10">
            <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Strategic Audit<br/>Archive</h3>
            <p className="text-slate-400 text-sm font-medium max-w-md">Export comprehensive telemetry of institutional expenditure for immutable compliance trails.</p>
          </div>
          <div className="flex gap-4 relative z-10">
            <button onClick={() => navigate('/reports')} className="px-10 py-5 bg-white text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-3">Reports <ArrowRight size={18} /></button>
            <button onClick={() => navigate('/activity')} className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest">Activity</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
