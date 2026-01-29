
import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  VisibilityState,
  ColumnSizingState,
} from '@tanstack/react-table';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Settings2,
  Check
} from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, any>[];
  onRowClick?: (item: T) => void;
  globalFilter?: string;
  setGlobalFilter?: (value: string) => void;
  showFooter?: boolean;
  pageSize?: number;
}

export function DataTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  onRowClick,
  globalFilter,
  setGlobalFilter,
  showFooter = false,
  pageSize = 10
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      columnSizing,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent, item: T) => {
    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onRowClick(item);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* Table Toolbar */}
      <div className="flex justify-end p-4 border-b theme-border bg-opacity-30 theme-bg">
        <div className="relative">
          <button 
            onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
            className="flex items-center gap-2 px-4 py-2 theme-card border theme-border rounded-xl text-[10px] font-black uppercase tracking-widest theme-text-muted hover:theme-text transition-all"
          >
            <Settings2 size={14} /> View Settings
          </button>
          
          {showVisibilityMenu && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setShowVisibilityMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-56 theme-card border theme-border shadow-2xl rounded-2xl overflow-hidden z-[70] p-2 animate-in fade-in slide-in-from-top-2">
                <p className="px-3 py-2 text-[9px] font-black theme-text-muted uppercase tracking-widest border-b theme-border mb-2">Toggle Columns</p>
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                  {table.getAllLeafColumns().map(column => (
                    <button
                      key={column.id}
                      onClick={() => column.toggleVisibility()}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold theme-text hover:theme-bg transition-colors"
                    >
                      <span className="capitalize">{column.id}</span>
                      {column.getIsVisible() && <Check size={12} className="text-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="w-full overflow-x-auto custom-scrollbar relative">
        <table 
          role="table" 
          aria-label="Data Registry"
          className="w-full text-left border-collapse table-fixed"
          style={{ width: table.getCenterTotalSize() }}
        >
          <thead role="rowgroup" className="theme-bg bg-opacity-50 border-b theme-border sticky top-0 z-10">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} role="row">
                {headerGroup.headers.map(header => {
                  const isSorted = header.column.getIsSorted();
                  return (
                    <th 
                      key={header.id} 
                      role="columnheader"
                      aria-sort={isSorted === 'asc' ? 'ascending' : isSorted === 'desc' ? 'descending' : 'none'}
                      className="px-6 py-4 label-caps relative group select-none overflow-hidden"
                      style={{ width: header.getSize() }}
                    >
                      <div 
                        className={`flex items-center gap-2 ${header.column.getCanSort() ? 'cursor-pointer hover:theme-text transition-colors' : ''}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        
                        {header.column.getCanSort() && (
                          <div className="flex flex-col text-slate-400 group-hover:text-blue-500 transition-colors">
                            {isSorted === 'asc' ? (
                              <ChevronUp size={12} aria-hidden="true" />
                            ) : isSorted === 'desc' ? (
                              <ChevronDown size={12} aria-hidden="true" />
                            ) : (
                              <ChevronsUpDown size={12} className="opacity-0 group-hover:opacity-100" aria-hidden="true" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Resizer */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-blue-500/50 transition-colors ${
                          header.column.getIsResizing() ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                      />
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody role="rowgroup" className="divide-y theme-border">
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id} 
                role="row"
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row.original)}
                onKeyDown={(e) => handleKeyDown(e, row.original)}
                className={`${onRowClick ? 'cursor-pointer hover:theme-bg hover:bg-opacity-80 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset' : ''} transition-all duration-150 group animate-in fade-in duration-300`}
              >
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id} 
                    role="cell" 
                    className="px-6 py-4 text-[13px] font-medium theme-text truncate"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr role="row">
                <td role="cell" colSpan={table.getAllLeafColumns().length} className="px-6 py-32 text-center theme-text-muted text-xs font-bold uppercase tracking-widest italic opacity-50">
                  Context is Empty
                </td>
              </tr>
            )}
          </tbody>
          {showFooter && (
            <tfoot role="rowgroup" className="theme-bg bg-opacity-50 border-t theme-border">
              {table.getFooterGroups().map(footerGroup => (
                <tr key={footerGroup.id} role="row">
                  {footerGroup.headers.map(header => (
                    <td key={header.id} role="cell" className="px-6 py-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.footer,
                            header.getContext()
                          )}
                    </td>
                  ))}
                </tr>
              ))}
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t theme-border theme-bg bg-opacity-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest">Rows per page</p>
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="bg-transparent theme-text text-xs font-bold outline-none cursor-pointer"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
          <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest">
            {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
            {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of {data.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 theme-text-muted hover:theme-text disabled:opacity-30 transition-all"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 theme-text-muted hover:theme-text disabled:opacity-30 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="flex items-center gap-1">
            <p className="text-[10px] font-black theme-text uppercase tracking-widest px-2">Page</p>
            <p className="text-[10px] font-black theme-text uppercase tracking-widest px-2 bg-slate-900 text-white dark:bg-blue-600 rounded-md">
              {table.getState().pagination.pageIndex + 1}
            </p>
            <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest px-2">of {table.getPageCount()}</p>
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 theme-text-muted hover:theme-text disabled:opacity-30 transition-all"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 theme-text-muted hover:theme-text disabled:opacity-30 transition-all"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
