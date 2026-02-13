
import React, { useMemo, useCallback, useState } from 'react';
import { Plus, Trash2, Package, Sparkles } from 'lucide-react';
import { RequestItem } from '../../types';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  ColumnSizingState
} from '@tanstack/react-table';

interface RequestItemEditorProps {
  items: RequestItem[];
  onItemsChange: (updater: (prev: RequestItem[]) => RequestItem[]) => void;
  onLoadPresets?: () => void;
  disabled?: boolean;
}

export const RequestItemEditor: React.FC<RequestItemEditorProps> = ({ items, onItemsChange, onLoadPresets, disabled }) => {
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const addItem = useCallback(() => {
    const newItem: RequestItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      quantity: 1,
      unit: 'Pcs',
      price: 0,
      total: 0
    };
    onItemsChange(prev => [...prev, newItem]);
  }, [onItemsChange]);

  const removeItem = useCallback((id: string) => {
    onItemsChange(prev => prev.filter(i => i.id !== id));
  }, [onItemsChange]);

  const updateItem = useCallback((id: string, key: string, value: any) => {
    onItemsChange(prev => prev.map(i => {
      if (i.id === id) {
        const next = { ...i, [key]: value };
        if (key === 'quantity' || key === 'price') {
          next.total = next.quantity * next.price;
        }
        return next;
      }
      return i;
    }));
  }, [onItemsChange]);

  const columns = useMemo<ColumnDef<RequestItem>[]>(() => [
    {
      header: 'Resource Detail',
      accessorKey: 'name',
      size: 400,
      cell: ({ row }) => (
        <input
          disabled={disabled}
          type="text"
          value={row.original.name}
          placeholder="Item description..."
          onChange={(e) => updateItem(row.original.id, 'name', e.target.value)}
          className="w-full px-3 py-2 bg-transparent outline-none font-bold text-xs theme-text focus:bg-white rounded-lg transition-all truncate"
        />
      ),
    },
    {
      header: 'Qty',
      accessorKey: 'quantity',
      size: 80,
      cell: ({ row }) => (
        <input
          disabled={disabled}
          type="number"
          value={row.original.quantity}
          onChange={(e) => updateItem(row.original.id, 'quantity', Number(e.target.value))}
          className="w-full px-3 py-2 bg-transparent outline-none font-bold text-xs theme-text focus:bg-white rounded-lg transition-all"
        />
      ),
    },
    {
      header: 'Unit',
      accessorKey: 'unit',
      size: 100,
      cell: ({ row }) => (
        <input
          disabled={disabled}
          type="text"
          value={row.original.unit}
          onChange={(e) => updateItem(row.original.id, 'unit', e.target.value)}
          className="w-full px-3 py-2 bg-transparent outline-none font-bold text-xs theme-text focus:bg-white rounded-lg transition-all uppercase truncate"
        />
      ),
    },
    {
      header: 'Unit Price',
      accessorKey: 'price',
      size: 180,
      cell: ({ row }) => (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-black">IDR</span>
          <input
            disabled={disabled}
            type="number"
            value={row.original.price}
            onChange={(e) => updateItem(row.original.id, 'price', Number(e.target.value))}
            className="w-full pl-9 pr-3 py-2 bg-transparent outline-none font-bold text-xs theme-text focus:bg-white rounded-lg transition-all"
          />
        </div>
      ),
    },
    {
      header: 'Total',
      accessorKey: 'total',
      size: 180,
      cell: ({ row }) => (
        <span className="font-black theme-text text-xs block text-right min-w-[100px] truncate">
          {(row.original.total || 0).toLocaleString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 60,
      enableResizing: false,
      cell: ({ row }) => !disabled && (
        <button
          type="button"
          onClick={() => removeItem(row.original.id)}
          className="p-2 text-slate-300 hover:text-red-500 transition-colors mx-auto block"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ], [disabled, updateItem, removeItem]);

  const table = useReactTable({
    data: items,
    columns,
    state: {
      columnSizing,
    },
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={14} className="text-slate-400" />
          <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Line Items</h3>
        </div>
        {!disabled && (
          <div className="flex gap-2">
            {onLoadPresets && (
              <button
                type="button"
                onClick={onLoadPresets}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 border border-blue-600/20 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
              >
                <Sparkles size={14} /> Load Presets
              </button>
            )}
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
            >
              <Plus size={14} /> Add Line Item
            </button>
          </div>
        )}
      </div>

      <div className="theme-card rounded-lg border theme-border overflow-x-auto shadow-sm">
        <table
          className="min-w-full text-left table-fixed border-collapse"
          style={{ width: table.getTotalSize() }}
        >
          <thead className="theme-bg bg-opacity-50 border-b theme-border">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  const isResizing = header.column.getIsResizing();
                  return (
                    <th
                      key={header.id}
                      className="px-6 py-4 label-caps relative group select-none"
                      style={{ width: header.getSize() }}
                    >
                      <span className="truncate">{flexRender(header.column.columnDef.header, header.getContext())}</span>

                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-4 cursor-col-resize select-none touch-none flex justify-center group/resizer z-20"
                        >
                          <div className={`w-[1px] h-full transition-all duration-200 ${isResizing
                            ? 'bg-blue-500 opacity-100 shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                            : 'bg-slate-300 opacity-30 group-hover/resizer:opacity-100 group-hover/resizer:bg-blue-400'
                            }`} />
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y theme-border">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-slate-500/5 transition-colors">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2 truncate" style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-[10px] font-black uppercase tracking-widest theme-text-muted italic opacity-50">
                  No items added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
