
import React, { useState, useMemo, useEffect } from 'react';
import { AccountManager } from '../services/AccountManager';
import { UserRole, User, Permission } from '../types';
import { UserPlus, ShieldCheck, Trash2, Edit2, X, Check } from 'lucide-react';
import { DataTable } from '../components/common/DataTable';
import { Can } from '../components/common/Can';
import { ColumnDef } from '@tanstack/react-table';

const AccountsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'access'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionMatrix, setPermissionMatrix] = useState<Record<UserRole, Permission[]>>(AccountManager.getPermissionMatrix());
  const [isSyncing, setIsSyncing] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    department: 'Marketing',
    title: '',
    role: UserRole.REQUESTER
  });

  const loadUsers = async () => {
    const data = await AccountManager.getUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await AccountManager.updateUser(editingUser.id, formData);
    } else {
      await AccountManager.createUser(formData);
    }
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({ username: '', email: '', department: 'Marketing', title: '', role: UserRole.REQUESTER });
    loadUsers();
  };

  const togglePermission = (role: UserRole, permission: string) => {
    setIsSyncing(true);
    const current = [...permissionMatrix[role]];
    const next = current.includes(permission as Permission) 
      ? current.filter(p => p !== permission) 
      : [...current, permission as Permission];
    
    const nextMatrix = { ...permissionMatrix, [role]: next } as Record<UserRole, Permission[]>;
    setPermissionMatrix(nextMatrix);
    AccountManager.updatePermissionMatrix(nextMatrix);
    setTimeout(() => setIsSyncing(false), 600);
  };

  const allPermissions = ['VIEW', 'CREATE', 'EDIT', 'DELETE', 'APPROVE', 'SYSTEM_CONFIG', 'FINANCIAL_RECON', 'USER_PROVISION'];

  const columns = useMemo<ColumnDef<User>[]>(() => [
    { 
      header: 'System Identity', 
      accessorKey: 'username',
      cell: (info) => {
        const u = info.row.original;
        return (
          <div className="flex items-center gap-4">
            <img src={u.avatar} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md" alt="" />
            <div>
              <p className="font-black theme-text leading-none mb-1 uppercase text-xs tracking-tight">{u.username}</p>
              <p className="text-[10px] theme-text-muted font-bold">{u.email}</p>
            </div>
          </div>
        );
      }
    },
    { 
      header: 'Org Node', 
      accessorKey: 'department',
      cell: (info) => {
        const u = info.row.original;
        return (
          <div>
            <p className="text-xs font-black theme-text uppercase tracking-tighter">{u.department}</p>
            <p className="text-[10px] theme-text-muted font-bold uppercase">{u.title}</p>
          </div>
        );
      }
    },
    { 
      header: 'Authority', 
      accessorKey: 'role',
      cell: (info) => {
        const role = info.getValue() as UserRole;
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
            role === UserRole.ADMIN ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
            role === UserRole.REVIEWER ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
            'theme-bg theme-text-muted theme-border'
          }`}>
            <ShieldCheck size={10} /> {role}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: (info) => {
        const u = info.row.original;
        return (
          <div className="flex justify-end gap-2">
            <Can perform="EDIT">
              <button onClick={(e) => { e.stopPropagation(); setEditingUser(u); setFormData(u); setIsModalOpen(true); }} className="p-2.5 theme-text-muted hover:theme-text hover:bg-slate-500/5 rounded-xl transition-all"><Edit2 size={16} /></button>
            </Can>
            <Can perform="DELETE">
              <button onClick={async (e) => { e.stopPropagation(); if(confirm('Purge identity?')) { await AccountManager.deleteUser(u.id); loadUsers(); } }} className="p-2.5 theme-text-muted hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all"><Trash2 size={16} /></button>
            </Can>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="space-y-10 page-transition">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b theme-border pb-10">
        <div>
          <h1 className="text-4xl font-black theme-text tracking-tighter uppercase">Accounts</h1>
          <p className="theme-text-muted font-medium text-lg italic opacity-80 font-mono">Institutional identity and permission orchestration.</p>
        </div>
        <div className="flex theme-bg border theme-border rounded-[1.5rem] p-1.5 shadow-sm">
          <button onClick={() => setActiveTab('users')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-text-muted hover:theme-bg'}`}>Registry</button>
          <Can perform="SYSTEM_CONFIG">
            <button onClick={() => setActiveTab('access')} className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'access' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-text-muted hover:theme-bg'}`}>Authority Matrix</button>
          </Can>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Can perform="USER_PROVISION">
              <button onClick={() => { setEditingUser(null); setIsModalOpen(true); }} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 shadow-xl transition-all">
                <UserPlus size={18} /> Create new user
              </button>
            </Can>
          </div>
          <div className="theme-card rounded-[3rem] border theme-border shadow-xl overflow-hidden">
            <DataTable data={users} columns={columns} />
          </div>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="theme-card rounded-[3rem] border theme-border p-10">
            <div className="flex items-center justify-between mb-10">
               <div>
                  <h3 className="font-black theme-text text-xl mb-2 tracking-tight">Granular Permission Routing</h3>
                  <p className="text-sm theme-text-muted font-medium">Map institutional capabilities to system roles. Changes propagate instantly across all active nodes.</p>
               </div>
               {isSyncing && (
                 <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                   Syncing...
                 </div>
               )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b theme-border">
                    <th className="px-6 py-4 label-caps">Security Role</th>
                    {allPermissions.map(p => (
                      <th key={p} className="px-3 py-4 text-[9px] font-black theme-text-muted uppercase tracking-wider text-center">{p.replace('_', ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {Object.values(UserRole).map(role => (
                    <tr key={role} className="hover:theme-bg transition-colors">
                      <td className="px-6 py-6 font-black theme-text text-xs uppercase tracking-widest">{role}</td>
                      {allPermissions.map(p => {
                        const hasPerm = permissionMatrix[role]?.includes(p as Permission);
                        return (
                          <td key={p} className="px-3 py-6 text-center">
                            <button 
                              onClick={() => togglePermission(role, p)}
                              className={`w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center mx-auto ${
                                hasPerm 
                                ? 'bg-blue-600 border-blue-600 text-white' 
                                : 'theme-border hover:border-blue-400'
                              }`}
                            >
                              {hasPerm && <Check size={14} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          <form onSubmit={handleSubmit} className="relative w-full max-w-xl theme-card border theme-border rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b theme-border flex items-center justify-between theme-bg bg-opacity-50">
              <h3 className="text-sm font-black theme-text uppercase tracking-[0.3em]">{editingUser ? 'Update Identity' : 'Create new user'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 theme-bg rounded-2xl transition-all shadow-sm"><X size={20}/></button>
            </div>
            <div className="p-12 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="label-caps">Username</label>
                  <input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} type="text" className="w-full px-6 py-4 theme-bg border theme-border rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all theme-text" />
                </div>
                <div className="space-y-3">
                  <label className="label-caps">Work Email</label>
                  <input required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" className="w-full px-6 py-4 theme-bg border theme-border rounded-2xl font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all theme-text" />
                </div>
              </div>
              <div className="p-10 bg-opacity-50 theme-bg border-t theme-border flex justify-end gap-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-[10px] font-black uppercase tracking-widest theme-text-muted">Abort</button>
                <button type="submit" className="px-12 py-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all flex items-center gap-3">
                  <Check size={18}/> Commit Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AccountsPage;
