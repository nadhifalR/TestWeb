import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, DollarSign, Users, Calendar, FilterIcon, X, Loader2 } from 'lucide-react';
import { AnalyticsManager, DashboardStats } from '../services/AnalyticsManager';
import { RequestManager } from '../services/RequestManager';
import { AnalyticsNivo } from '../components/analytics/AnalyticsNivo';
import { AnalyticsTremor } from '../components/analytics/AnalyticsTremor';
import { SkeletonCard } from '../components/common/SkeletonCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

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


  return (
    <div className="space-y-8 pb-20 page-transition">
      <div className="flex items-center justify-between border-b theme-border pb-6">
        <div>
          <h1 className="text-3xl font-black theme-text tracking-tight uppercase">Analytics</h1>
          <p className="theme-text-muted text-sm font-medium tracking-tight">Monitor and analyze spending data across departments.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex theme-bg border theme-border rounded-lg p-1.5 shadow-sm">
            <button
              onClick={() => setViewMode('nivo')}
              className={`btn btn-sm ${viewMode === 'nivo' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'btn-ghost'}`}
            >
              Nivo
            </button>
            <button
              onClick={() => setViewMode('tremor')}
              className={`btn btn-sm ${viewMode === 'tremor' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'btn-ghost'}`}
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
          { icon: <Users size={24} />, label: 'Reviewers', value: '4' },
          { icon: <Calendar size={24} />, label: 'Requests', value: stats?.totalRequests || 0 },
        ].map((stat, i) => (
          <div key={i} className="theme-card p-8 rounded-lg border theme-border flex items-center gap-6">
            {isLoading && !stats ? (
              <SkeletonCard height="h-20" className="w-full" />
            ) : (
              <>
                <div className="w-14 h-14 theme-bg rounded-lg flex items-center justify-center text-slate-400">{stat.icon}</div>
                <div>
                  <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black theme-text tracking-tight">{stat.value}</p>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center animate-in fade-in duration-500">
            <LoadingSpinner message="Calculating Data Clusters..." fullPage={false} />
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 opacity-40">
            <SkeletonCard height="h-[400px]" />
            <SkeletonCard height="h-[400px]" />
          </div>
        ) : viewMode === 'nivo' ? (
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
    </div>
  );
};

export default AnalyticsPage;
