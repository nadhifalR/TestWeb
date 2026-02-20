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
            <div className="flex justify-between items-center mb-1">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeCount > 0
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                        : 'theme-card theme-border theme-text-muted hover:theme-text'
                        }`}
                >
                    <Filter size={14} />
                    {isOpen ? 'Hide Filters' : 'Show Filters'}
                    {activeCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[9px]">{activeCount}</span>
                    )}
                </button>
            </div>

            {/* Filter Panel */}
            {isOpen && (
                <div className="mt-2 theme-card border theme-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 w-full">
                    <div className="p-5 space-y-6">

                        {/* Search Bar - Moved inside */}
                        <div>
                            <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-3">Quick Search</p>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-muted" size={16} />
                                <input
                                    type="text"
                                    value={filters.search || ''}
                                    onChange={(e) => update({ search: e.target.value || undefined })}
                                    placeholder="Search by ID, Name, or details..."
                                    className="w-full pl-11 pr-4 py-3 theme-bg border theme-border rounded-lg text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Date Filters */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest">Date</p>
                                    <div className="flex theme-bg border theme-border rounded-lg p-0.5">
                                        <button
                                            onClick={() => { setDateMode('exact'); update({ dateFrom: undefined, dateTo: undefined }); }}
                                            className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${dateMode === 'exact' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-text-muted'}`}
                                        >Specific</button>
                                        <button
                                            onClick={() => { setDateMode('range'); update({ dateExact: undefined }); }}
                                            className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${dateMode === 'range' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-text-muted'}`}
                                        >Range</button>
                                    </div>
                                </div>
                                {dateMode === 'exact' ? (
                                    <input
                                        type="date"
                                        value={filters.dateExact || ''}
                                        onChange={(e) => update({ dateExact: e.target.value || undefined })}
                                        className="w-full px-4 py-2 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                    />
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={filters.dateFrom || ''}
                                            onChange={(e) => update({ dateFrom: e.target.value || undefined })}
                                            className="w-full px-3 py-2 theme-bg border theme-border rounded-lg text-[10px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                            placeholder="From"
                                        />
                                        <input
                                            type="date"
                                            value={filters.dateTo || ''}
                                            onChange={(e) => update({ dateTo: e.target.value || undefined })}
                                            className="w-full px-3 py-2 theme-bg border theme-border rounded-lg text-[10px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                            placeholder="To"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Category Chips */}
                            <div className="lg:col-span-1">
                                <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-3">Category</p>
                                <div className="flex flex-wrap gap-1">
                                    {CATEGORIES.map((cat) => {
                                        const isActive = filters.categories?.includes(cat);
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => update({ categories: toggleChip(filters.categories, cat) })}
                                                className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${isActive
                                                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                                                    : 'theme-border theme-text-muted hover:theme-text'
                                                    }`}
                                            >{cat}</button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Valuation Filters */}
                            <div className="lg:col-span-1">
                                <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-3">Valuation Mode</p>
                                <div className="flex flex-wrap gap-1 mb-3">
                                    {COST_MODES.map((mode) => (
                                        <button
                                            key={mode.value}
                                            onClick={() => update({ costMode: mode.value, costExact: undefined, costMin: undefined, costMax: undefined })}
                                            className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${filters.costMode === mode.value
                                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                                                : 'theme-border theme-text-muted hover:theme-text'
                                                }`}
                                        >{mode.label}</button>
                                    ))}
                                </div>
                                {filters.costMode === 'exact' && (
                                    <input
                                        type="number"
                                        placeholder="Amount..."
                                        value={filters.costExact ?? ''}
                                        onChange={(e) => update({ costExact: e.target.value ? Number(e.target.value) : undefined })}
                                        className="w-full px-4 py-2 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                    />
                                )}
                                {filters.costMode === 'range' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Min"
                                            value={filters.costMin ?? ''}
                                            onChange={(e) => update({ costMin: e.target.value ? Number(e.target.value) : undefined })}
                                            className="flex-1 px-3 py-2 theme-bg border theme-border rounded-lg text-[10px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Max"
                                            value={filters.costMax ?? ''}
                                            onChange={(e) => update({ costMax: e.target.value ? Number(e.target.value) : undefined })}
                                            className="flex-1 px-3 py-2 theme-bg border theme-border rounded-lg text-[10px] font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                        />
                                    </div>
                                )}
                                {(filters.costMode === 'lt' || filters.costMode === 'gt') && (
                                    <input
                                        type="number"
                                        placeholder={filters.costMode === 'lt' ? "Less than..." : "Greater than..."}
                                        value={(filters.costMode === 'lt' ? filters.costMax : filters.costMin) ?? ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? Number(e.target.value) : undefined;
                                            if (filters.costMode === 'lt') update({ costMax: val });
                                            else update({ costMin: val });
                                        }}
                                        className="w-full px-4 py-2 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 theme-text"
                                    />
                                )}
                            </div>

                            {/* Status Chips */}
                            <div className="lg:col-span-1">
                                <p className="text-[9px] font-black theme-text-muted uppercase tracking-widest mb-3">Status</p>
                                <div className="flex flex-wrap gap-1">
                                    {STATUSES.map((st) => {
                                        const isActive = filters.statuses?.includes(st);
                                        const colorClass = st === RequestStatus.PENDING ? 'bg-amber-500 border-amber-500 shadow-sm shadow-amber-500/20' :
                                            st === RequestStatus.APPROVED ? 'bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/20' :
                                                st === RequestStatus.DENIED || st === RequestStatus.REJECTED ? 'bg-red-500 border-red-500 shadow-sm shadow-red-500/20' :
                                                    'bg-slate-900 border-slate-900 dark:bg-blue-600 dark:border-blue-600';
                                        return (
                                            <button
                                                key={st}
                                                onClick={() => update({ statuses: toggleChip(filters.statuses, st) })}
                                                className={`px-2 py-1 rounded-md text-[9px] font-bold border transition-all ${isActive
                                                    ? `${colorClass} text-white`
                                                    : 'theme-border theme-text-muted hover:theme-text'
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
                        <div className="px-5 py-3 border-t theme-border flex justify-end">
                            <button
                                onClick={clearAll}
                                className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <X size={12} /> Reset All
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

