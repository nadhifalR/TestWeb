import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
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
    const [isOpen, setIsOpen] = useState(true);
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
            <div className="flex justify-between items-center mb-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-5 py-2.5 border rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeCount > 0
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                        : 'theme-card theme-border theme-text-muted hover:theme-text'
                        }`}
                >
                    <Filter size={16} />
                    {isOpen ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
                    {activeCount > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-white/20 rounded text-[10px]">{activeCount}</span>
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            {isOpen && (
                <div className="mt-3 theme-card border theme-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 w-full">
                    <div className="p-6 space-y-8">

                        {/* Search Bar - Moved inside */}
                        <div>
                            <p className="text-[11px] font-black theme-text-muted uppercase tracking-[0.15em] mb-3">Quick Search</p>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-muted" size={18} />
                                <input
                                    type="text"
                                    value={filters.search || ''}
                                    onChange={(e) => update({ search: e.target.value || undefined })}
                                    placeholder="Search by ID, Name, or items..."
                                    className="w-full pl-12 pr-4 py-3.5 theme-bg border theme-border rounded-lg text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Date Filters */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-black theme-text-muted uppercase tracking-[0.15em]">Date</p>
                                    <div className="flex theme-bg border theme-border rounded-lg p-1">
                                        <button
                                            onClick={() => { setDateMode('exact'); update({ dateFrom: undefined, dateTo: undefined }); }}
                                            className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${dateMode === 'exact' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-text-muted hover:theme-text'}`}
                                        >Specific</button>
                                        <button
                                            onClick={() => { setDateMode('range'); update({ dateExact: undefined }); }}
                                            className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${dateMode === 'range' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-text-muted hover:theme-text'}`}
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
                                        <div className="relative flex-1">
                                            <input
                                                type="date"
                                                value={filters.dateFrom || ''}
                                                onChange={(e) => update({ dateFrom: e.target.value || undefined })}
                                                className="w-full px-3 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                            />
                                            <span className="absolute -top-2 left-2 px-1 theme-bg text-[9px] font-bold theme-text-muted uppercase tracking-wider">From</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                type="date"
                                                value={filters.dateTo || ''}
                                                onChange={(e) => update({ dateTo: e.target.value || undefined })}
                                                className="w-full px-3 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                            />
                                            <span className="absolute -top-2 left-2 px-1 theme-bg text-[9px] font-bold theme-text-muted uppercase tracking-wider">To</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Category Chips */}
                            <div className="lg:col-span-1 space-y-4">
                                <p className="text-[11px] font-black theme-text-muted uppercase tracking-[0.15em]">Category</p>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map((cat) => {
                                        const isActive = filters.categories?.includes(cat);
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => update({ categories: toggleChip(filters.categories, cat) })}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-all ${isActive
                                                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600 shadow-md'
                                                    : 'theme-border theme-text-muted hover:theme-text hover:border-slate-400'
                                                    }`}
                                            >{cat}</button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Valuation Filters */}
                            <div className="lg:col-span-1 space-y-4">
                                <p className="text-[11px] font-black theme-text-muted uppercase tracking-[0.15em]">Valuation Filter</p>
                                <div className="flex flex-wrap gap-1.5 p-1 theme-bg border theme-border rounded-lg">
                                    {COST_MODES.map((mode) => (
                                        <button
                                            key={mode.value}
                                            onClick={() => update({ costMode: mode.value, costExact: undefined, costMin: undefined, costMax: undefined })}
                                            className={`flex-1 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${filters.costMode === mode.value
                                                ? 'bg-slate-900 text-white dark:bg-blue-600'
                                                : 'theme-text-muted hover:theme-text'
                                                }`}
                                        >{mode.label}</button>
                                    ))}
                                </div>
                                {filters.costMode === 'exact' && (
                                    <input
                                        type="number"
                                        placeholder="Enter exact amount..."
                                        value={filters.costExact ?? ''}
                                        onChange={(e) => update({ costExact: e.target.value ? Number(e.target.value) : undefined })}
                                        className="w-full px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                    />
                                )}
                                {filters.costMode === 'range' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min IDR"
                                            value={filters.costMin ?? ''}
                                            onChange={(e) => update({ costMin: e.target.value ? Number(e.target.value) : undefined })}
                                            className="flex-1 px-4 py-2.5 theme-bg border theme-border rounded-lg text-[11px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max IDR"
                                            value={filters.costMax ?? ''}
                                            onChange={(e) => update({ costMax: e.target.value ? Number(e.target.value) : undefined })}
                                            className="flex-1 px-4 py-2.5 theme-bg border theme-border rounded-lg text-[11px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                        />
                                    </div>
                                )}
                                {(filters.costMode === 'lt' || filters.costMode === 'gt') && (
                                    <input
                                        type="number"
                                        placeholder={filters.costMode === 'lt' ? "Less than amount..." : "Greater than amount..."}
                                        value={(filters.costMode === 'lt' ? filters.costMax : filters.costMin) ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? Number(e.target.value) : undefined;
                                            if (filters.costMode === 'lt') update({ costMax: val });
                                            else update({ costMin: val });
                                        }}
                                        className="w-full px-4 py-2.5 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                    />
                                )}
                            </div>

                            {/* Status Chips */}
                            <div className="lg:col-span-1 space-y-4">
                                <p className="text-[11px] font-black theme-text-muted uppercase tracking-[0.15em]">Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {STATUSES.map((st) => {
                                        const isActive = filters.statuses?.includes(st);
                                        const colorClass = st === RequestStatus.PENDING ? 'bg-amber-500 border-amber-500 shadow-md shadow-amber-500/20' :
                                            st === RequestStatus.APPROVED ? 'bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-500/20' :
                                                st === RequestStatus.DENIED || st === RequestStatus.REJECTED ? 'bg-red-500 border-red-500 shadow-md shadow-red-500/20' :
                                                    'bg-slate-900 border-slate-900 dark:bg-blue-600 dark:border-blue-600 shadow-md';
                                        return (
                                            <button
                                                key={st}
                                                onClick={() => update({ statuses: toggleChip(filters.statuses, st) })}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border transition-all ${isActive
                                                    ? `${colorClass} text-white`
                                                    : 'theme-border theme-text-muted hover:theme-text hover:border-slate-400'
                                                    }`}
                                            >{st}</button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    {activeCount > 0 && (
                        <div className="px-6 py-4 border-t theme-border flex justify-end bg-slate-50/30 dark:bg-slate-900/10">
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <X size={14} /> Reset All Filters
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
    if (filters.search) count++;
    if (filters.dateExact) count++;
    if (filters.dateFrom || filters.dateTo) count++;
    if (filters.categories && filters.categories.length > 0) count++;
    if (filters.costMode && (filters.costExact !== undefined || filters.costMin !== undefined || filters.costMax !== undefined)) count++;
    if (filters.statuses && filters.statuses.length > 0) count++;
    return count;
}

