import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, Users, Calendar, FilterIcon, X, Loader2 } from 'lucide-react';
import { AnalyticsManager, DashboardStats } from '../services/AnalyticsManager';
import { RequestManager } from '../services/RequestManager';
import { AnalyticsNivo } from '../components/analytics/AnalyticsNivo';
import { AnalyticsTremor } from '../components/analytics/AnalyticsTremor';

const AnalyticsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'nivo' | 'tremor'>('nivo');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [velocityData, setVelocityData] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const raw = await RequestManager.getRequests();
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
  }, []);

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
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full">
            <button
              onClick={() => setViewMode('nivo')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'nivo' ? 'bg-white dark:bg-slate-700 shadow-sm theme-text' : 'theme-text-muted hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              Nivo
            </button>
            <button
              onClick={() => setViewMode('tremor')}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'tremor' ? 'bg-white dark:bg-slate-700 shadow-sm theme-text' : 'theme-text-muted hover:text-slate-900 dark:hover:text-slate-200'
                }`}
            >
              Tremor
            </button>
          </div>
          {selectedCategory && (
            <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
              <FilterIcon size={12} /> {selectedCategory} <X size={12} />
            </button>
          )}
        </div>
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

      {viewMode === 'nivo' ? (
        <AnalyticsNivo
          trendData={trendData}
          velocityData={velocityData}
          distribution={distribution}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      ) : (
        <AnalyticsTremor
          trendData={trendData}
          velocityData={velocityData}
          distribution={distribution}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      )}
    </div>
  );
};

export default AnalyticsPage;
