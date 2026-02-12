import React, { useMemo, useState, useEffect } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { DashboardStats } from '../../services/AnalyticsManager';
import { ArrowRight, Filter as FilterIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalyticsNivoProps {
    trendData: any[];
    velocityData: any[];
    distribution: any[];
    onCategorySelect?: (category: string | null) => void;
    selectedCategory?: string | null;
}

export const AnalyticsNivo: React.FC<AnalyticsNivoProps> = ({
    trendData,
    velocityData,
    distribution,
    onCategorySelect,
    selectedCategory
}) => {
    const navigate = useNavigate();
    const [themeTick, setThemeTick] = useState(0);

    useEffect(() => {
        const handler = () => setThemeTick(t => t + 1);
        window.addEventListener('nexus-theme-change', handler);
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

    return (
        <div className="space-y-8">
            {selectedCategory && (
                <div className="flex justify-end">
                    <button onClick={() => onCategorySelect?.(null)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                        <FilterIcon size={12} /> {selectedCategory} <X size={12} />
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="theme-card p-10 rounded-lg border theme-border flex flex-col h-[500px]">
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

                <div className="theme-card p-10 rounded-lg border theme-border flex flex-col h-[500px]">
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
                <div className="theme-card p-10 rounded-lg border theme-border flex flex-col h-[400px]">
                    <h3 className="font-black theme-text uppercase tracking-widest text-[10px] mb-6 text-center">Asset Saturation</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsivePie
                            data={distribution}
                            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                            innerRadius={0.7}
                            padAngle={2}
                            cornerRadius={4}
                            onClick={(node) => onCategorySelect?.(String(node.id))}
                            theme={nivoTheme}
                        />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-slate-900 p-12 rounded-lg text-white flex flex-col justify-between shadow-2xl h-[400px]">
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black uppercase tracking-tighter mb-4">Strategic Audit<br />Archive</h3>
                        <p className="text-slate-400 text-sm font-medium max-w-md">Export comprehensive telemetry of institutional expenditure for immutable compliance trails.</p>
                    </div>
                    <div className="flex gap-4 relative z-10">
                        <button onClick={() => navigate('/reports')} className="px-10 py-5 bg-white text-slate-900 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center gap-3">Reports <ArrowRight size={18} /></button>
                        <button onClick={() => navigate('/activity')} className="px-10 py-5 bg-white/5 border border-white/10 rounded-lg text-[11px] font-black uppercase tracking-widest">Activity</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
