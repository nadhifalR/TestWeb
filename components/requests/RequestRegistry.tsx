import React, { useMemo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { DataTable } from '../common/DataTable';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { RequestForm, RequestStatus } from '../../types';

interface RequestRegistryProps {
    requests: RequestForm[];
    isLoading: boolean;
    totalRequests: number;
    pagination: { pageIndex: number; pageSize: number };
    setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
    onSelect: (request: RequestForm) => void;
    globalFilter: string;
    setGlobalFilter: (filter: string) => void;
    sorting: SortingState;
    onSortingChange: (sorting: SortingState) => void;
}

export const RequestRegistry: React.FC<RequestRegistryProps> = ({
    requests,
    isLoading,
    totalRequests,
    pagination,
    setPagination,
    onSelect,
    globalFilter,
    setGlobalFilter,
    sorting,
    onSortingChange
}) => {
    const columns = useMemo<ColumnDef<RequestForm>[]>(() => [
        {
            header: 'ID',
            accessorKey: 'id',
            size: 100,
            cell: (info) => <span className="font-mono text-[11px] font-bold text-slate-400">#{info.getValue() as string}</span>
        },
        {
            header: 'Date',
            accessorKey: 'createdAt',
            size: 120,
            cell: (info) => <span className="text-[12px] font-medium theme-text-muted">{new Date(info.getValue() as string).toLocaleDateString()}</span>
        },
        {
            header: 'Initiative Context',
            accessorKey: 'name',
            size: 400,
            cell: (info) => {
                const r = info.row.original;
                return (
                    <div className="min-w-[250px]">
                        <p className="font-bold theme-text text-[13px]">{r.name}</p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{r.category}</p>
                    </div>
                );
            }
        },
        {
            header: 'Valuation',
            accessorKey: 'totalCost',
            size: 180,
            cell: (info) => <span className="font-bold theme-text text-[13px]">IDR {(info.getValue() as number).toLocaleString()}</span>
        },
        {
            header: 'State',
            accessorKey: 'status',
            size: 140,
            cell: (info) => {
                const status = info.getValue() as RequestStatus;
                return (
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${status === RequestStatus.PENDING ? 'bg-amber-50 text-amber-600 border-amber-200' :
                        status === RequestStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            status === RequestStatus.DENIED ? 'bg-red-50 text-red-600 border-red-200' :
                                'theme-bg theme-text-muted theme-border'
                        }`}>
                        {status}
                    </span>
                );
            }
        },
        {
            id: 'actions',
            header: '',
            size: 100,
            cell: (info) => {
                const r = info.row.original;
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); onSelect(r); }}
                        className="px-3 py-1.5 border theme-border rounded-lg text-[10px] font-black uppercase hover:bg-slate-900 hover:text-white transition-all"
                    >
                        View
                    </button>
                );
            }
        }
    ], [onSelect]);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="flex justify-end">
                <div className="relative w-full max-sm:max-w-full max-w-sm">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-muted" size={16} />
                    <input
                        type="text"
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder="Submitted filter (ID, Name)..."
                        className="w-full pl-11 pr-4 py-2 theme-bg border theme-border rounded-lg text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                    />
                </div>
            </div>
            <div className="theme-card rounded-lg border theme-border shadow-xl overflow-hidden">
                {isLoading && requests.length === 0 ? (
                    <LoadingSpinner message="Loading Request Registry..." fullPage={false} />
                ) : (
                    <DataTable
                        data={requests}
                        columns={columns}
                        onRowClick={(r) => onSelect(r)}
                        globalFilter={globalFilter}
                        setGlobalFilter={setGlobalFilter}
                        pageCount={Math.ceil(totalRequests / pagination.pageSize)}
                        totalCount={totalRequests}
                        onPaginationChange={setPagination}
                        pagination={pagination}
                        sorting={sorting}
                        onSortingChange={onSortingChange}
                    />
                )}
            </div>
        </div>
    );
};
