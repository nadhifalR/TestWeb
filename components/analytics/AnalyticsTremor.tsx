import React from 'react';
import { BarChart, AreaChart, DonutChart } from '@tremor/react';
import { ArrowRight, Filter as FilterIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AnalyticsTremorProps {
    trendData: any[];
    velocityData: any[];
    distribution: any[];
    onCategorySelect?: (category: string | null) => void;
    selectedCategory?: string | null;
}

export const AnalyticsTremor: React.FC<AnalyticsTremorProps> = ({
    trendData,
    velocityData,
    distribution,
    onCategorySelect,
    selectedCategory
}) => {
    const navigate = useNavigate();

    // Prepare data for Spend Velocity (BarChart)
    const spendData = trendData.map(d => ({
        month: d.month,
        Spend: d.spend,
        Budget: d.budget
    }));

    // Prepare data for Daily Audit Volume (AreaChart)
    // velocityData format from Nivo: [{ id: 'series1', data: [{x: '...', y: ...}, ...] }]
    // Tremor expects: [{ x: '...', series1: ... }]
    // We need to transform Mapping
    const volumeData = velocityData[0]?.data.map((point: any) => ({
        date: point.x,
        Requests: point.y
    })) || [];

    // Prepare data for Asset Saturation (DonutChart)
    // distribution format from Nivo: [{ id: '...', label: '...', value: ... }]
    // Tremor expects same structure works or just name/value
    const categoryData = distribution.map(d => ({
        name: d.id,
        value: d.value
    }));

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
                        <BarChart
                            className="h-full"
                            data={spendData}
                            index="month"
                            categories={['Spend', 'Budget']}
                            colors={['blue', 'slate']}
                            valueFormatter={(number) => `IDR ${(number / 1000000).toFixed(1)}M`}
                            yAxisWidth={60}
                            onValueChange={(v) => console.log(v)}
                        />
                    </div>
                </div>

                <div className="theme-card p-10 rounded-lg border theme-border flex flex-col h-[500px]">
                    <h3 className="font-black theme-text uppercase tracking-widest text-[11px] mb-8 text-center">Daily Audit Volume</h3>
                    <div className="flex-1 min-h-0">
                        <AreaChart
                            className="h-full"
                            data={volumeData}
                            index="date"
                            categories={['Requests']}
                            colors={['blue']}
                            valueFormatter={(number) => number.toString()}
                            showAnimation={true}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="theme-card p-10 rounded-lg border theme-border flex flex-col h-[400px]">
                    <h3 className="font-black theme-text uppercase tracking-widest text-[10px] mb-6 text-center">Asset Saturation</h3>
                    <div className="flex-1 min-h-0 flex items-center justify-center">
                        <DonutChart
                            className="h-[240px]"
                            data={categoryData}
                            category="value"
                            index="name"
                            colors={['blue', 'cyan', 'indigo', 'violet', 'fuchsia']}
                            valueFormatter={(number) => `IDR ${(number / 1000000).toFixed(1)}M`}
                            onValueChange={(v) => v && onCategorySelect?.(v.name)}
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
