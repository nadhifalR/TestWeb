import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { RequestFilters, RequestStatus } from '../../types';

const CATEGORIES = ['Brand', 'Production', 'Activation', 'Entertainment', 'Logistics'];
const STATUSES = Object.values(RequestStatus);
const COST_MODES = [
    { value: 'exact' as const, label: 'Exact' },
    { value: 'range' as const, label: 'Range' },
    { value: 'lt' as const, label: 'Less Than' },
    { value: 'gt' as const, label: 'Greater Than' },
];

interface FilterPanelProps {
    filters: RequestFilters;
    onFiltersChange: (filters: RequestFilters) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dateMode, setDateMode] = useState<'exact' | 'range'>(
        filters.dateExact ? 'exact' : 'range'
    );

    const activeCount = getActiveFilterCount(filters);

    const update = (patch: Partial<RequestFilters>) => {
        onFiltersChange({ ...filters, ...patch });
    };

    const clearAll = () => {
        onFiltersChange({});
        setDateMode('range');
    };

    const toggleChip = <T extends string>(current: T[] | undefined, value: T): T[] => {
        const arr = current || [];
        return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    };

    return (
        <div className="w-full">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCount > 0
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                        : 'theme-card theme-border theme-text-muted hover:theme-text'
                    }`}
            >
                <Filter size={14} />
                Filters
                {activeCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[9px]">{activeCount}</span>
                )}
                {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {/* Filter Panel */}
            {isOpen && (
                <div className="mt-3 theme-card border theme-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-5 space-y-5">

                        {/* Date Filters */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest">Date</p>
                                <div className="flex theme-bg border theme-border rounded-lg p-0.5">
                                    <button
                                        onClick={() => { setDateMode('exact'); update({ dateFrom: undefined, dateTo: undefined }); }}
                                        className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all ${dateMode === 'exact' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-text-muted'}`}
                                    >Specific</button>
                                    <button
                                        onClick={() => { setDateMode('range'); update({ dateExact: undefined }); }}
                                        className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all ${dateMode === 'range' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-text-muted'}`}
                                    >Range</button>
                                </div>
                            </div>
                            {dateMode === 'exact' ? (
                                <input
                                    type="date"
                                    value={filters.dateExact || ''}
                                    onChange={(e) => update({ dateExact: e.target.value || undefined })}
                                    className="w-full px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                />
                            ) : (
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-[8px] font-bold theme-text-muted uppercase tracking-widest mb-1 block">From</label>
                                        <input
                                            type="date"
                                            value={filters.dateFrom || ''}
                                            onChange={(e) => update({ dateFrom: e.target.value || undefined })}
                                            className="w-full px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[8px] font-bold theme-text-muted uppercase tracking-widest mb-1 block">To</label>
                                        <input
                                            type="date"
                                            value={filters.dateTo || ''}
                                            onChange={(e) => update({ dateTo: e.target.value || undefined })}
                                            className="w-full px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Category Chips */}
                        <div>
                            <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-3">Category</p>
                            <div className="flex flex-wrap gap-1.5">
                                {CATEGORIES.map((cat) => {
                                    const isActive = filters.categories?.includes(cat);
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => update({ categories: toggleChip(filters.categories, cat) })}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isActive
                                                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                                                    : 'theme-border theme-text-muted hover:theme-text'
                                                }`}
                                        >{cat}</button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Valuation Filters */}
                        <div>
                            <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-3">Valuation</p>
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {COST_MODES.map((mode) => (
                                    <button
                                        key={mode.value}
                                        onClick={() => update({ costMode: mode.value, costExact: undefined, costMin: undefined, costMax: undefined })}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${filters.costMode === mode.value
                                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                                                : 'theme-border theme-text-muted hover:theme-text'
                                            }`}
                                    >{mode.label}</button>
                                ))}
                            </div>
                            {filters.costMode === 'exact' && (
                                <input
                                    type="number"
                                    placeholder="Exact amount..."
                                    value={filters.costExact ?? ''}
                                    onChange={(e) => update({ costExact: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                />
                            )}
                            {filters.costMode === 'range' && (
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min..."
                                        value={filters.costMin ?? ''}
                                        onChange={(e) => update({ costMin: e.target.value ? Number(e.target.value) : undefined })}
                                        className="flex-1 px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max..."
                                        value={filters.costMax ?? ''}
                                        onChange={(e) => update({ costMax: e.target.value ? Number(e.target.value) : undefined })}
                                        className="flex-1 px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                    />
                                </div>
                            )}
                            {filters.costMode === 'lt' && (
                                <input
                                    type="number"
                                    placeholder="Less than..."
                                    value={filters.costMax ?? ''}
                                    onChange={(e) => update({ costMax: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                />
                            )}
                            {filters.costMode === 'gt' && (
                                <input
                                    type="number"
                                    placeholder="Greater than..."
                                    value={filters.costMin ?? ''}
                                    onChange={(e) => update({ costMin: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                />
                            )}
                        </div>

                        {/* Status Chips */}
                        <div>
                            <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-3">Status</p>
                            <div className="flex flex-wrap gap-1.5">
                                {STATUSES.map((st) => {
                                    const isActive = filters.statuses?.includes(st);
                                    const colorClass = st === RequestStatus.PENDING ? 'bg-amber-500 border-amber-500' :
                                        st === RequestStatus.APPROVED ? 'bg-emerald-500 border-emerald-500' :
                                            st === RequestStatus.DENIED || st === RequestStatus.REJECTED ? 'bg-red-500 border-red-500' :
                                                'bg-slate-900 border-slate-900 dark:bg-blue-600 dark:border-blue-600';
                                    return (
                                        <button
                                            key={st}
                                            onClick={() => update({ statuses: toggleChip(filters.statuses, st) })}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${isActive
                                                    ? `${colorClass} text-white`
                                                    : 'theme-border theme-text-muted hover:theme-text'
                                                }`}
                                        >{st}</button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    {activeCount > 0 && (
                        <div className="px-5 py-3 border-t theme-border flex justify-end">
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <X size={12} /> Clear All Filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

function getActiveFilterCount(filters: RequestFilters): number {
    let count = 0;
    if (filters.dateExact) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.categories && filters.categories.length > 0) count++;
    if (filters.costMode && (filters.costExact !== undefined || filters.costMin !== undefined || filters.costMax !== undefined)) count++;
    if (filters.statuses && filters.statuses.length > 0) count++;
    return count;
}
