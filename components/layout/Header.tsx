
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Bell, HelpCircle, FileText, User as UserIcon } from 'lucide-react';
import { SearchManager } from '../../services/SearchManager';
import { useNavigate } from 'react-router-dom';
import { 
  useReactTable, 
  getCoreRowModel, 
  flexRender, 
  ColumnDef 
} from '@tanstack/react-table';

const Header: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{requests: any[], accounts: any[]}>({requests: [], accounts: []});
  const [showResults, setShowResults] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  const flatResults = useMemo(() => [
    ...results.requests.map(r => ({ ...r, type: 'request' })), 
    ...results.accounts.map(a => ({ ...a, type: 'account' }))
  ], [results]);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Result',
      size: 400, // Large base size to ensure full width
      cell: ({ row }) => {
        const item = row.original;
        const isSelected = activeIndex === row.index;
        return (
          <div className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${isSelected ? 'bg-blue-600/10 border-blue-500/20 border' : 'hover:bg-blue-500/5'}`}>
            {item.type === 'request' ? <FileText size={16} className="text-blue-500" /> : <UserIcon size={16} className="text-emerald-500" />}
            <div>
              <p className="text-xs font-bold theme-text">{item.name || item.username}</p>
              <p className="text-[9px] theme-text-muted font-medium uppercase">
                {item.type === 'request' ? `ID: ${item.id} • ${item.status}` : `${item.department} • ${item.role}`}
              </p>
            </div>
          </div>
        );
      }
    }
  ], [activeIndex]);

  const table = useReactTable({
    data: flatResults,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Updated to handle asynchronous globalSearch call
  useEffect(() => {
    const fetchResults = async () => {
      if (query.length > 0) {
        const res = await SearchManager.globalSearch(query);
        setResults(res);
        setShowResults(true);
      } else {
        setResults({ requests: [], accounts: [] });
        setShowResults(false);
      }
      setActiveIndex(-1);
    };
    fetchResults();
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenItem = (item: any) => {
    if (item.type === 'request') {
      navigate(`/requests?id=${item.id}`);
    } else {
      navigate(`/accounts?id=${item.id}`);
    }
    setShowResults(false);
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    if (e.key === 'ArrowDown') {
      setActiveIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setActiveIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      handleOpenItem(flatResults[activeIndex]);
    } else if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 theme-bg bg-opacity-80 backdrop-blur-md border-b theme-border px-6 flex items-center justify-between">
      <div className="max-w-md w-full relative" ref={searchRef}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 theme-text-muted" size={18} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="System search (REQ#, Identity)..." 
          className="w-full pl-12 pr-4 py-2 bg-opacity-50 theme-bg border theme-border rounded-xl text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all outline-none theme-text placeholder:theme-text-muted placeholder:opacity-50"
        />

        {showResults && flatResults.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 theme-card border theme-border shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="max-h-[400px] overflow-y-auto p-2">
              <table className="w-full border-collapse">
                <tbody className="w-full">
                  {table.getRowModel().rows.map(row => (
                    <tr 
                      key={row.id} 
                      onClick={() => handleOpenItem(row.original)}
                      className="cursor-pointer w-full"
                    >
                      <td className="w-full p-0">
                        {flexRender(row.getVisibleCells()[0].column.columnDef.cell, row.getVisibleCells()[0].getContext())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2.5 theme-text-muted hover:bg-slate-500/10 rounded-xl transition-all relative">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full border-2 theme-bg"></span>
        </button>
        <button className="p-2.5 theme-text-muted hover:bg-slate-500/10 rounded-xl transition-all">
          <HelpCircle size={18} />
        </button>
      </div>
    </header>
  );
};

export default Header;
