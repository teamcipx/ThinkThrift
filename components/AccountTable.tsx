import React, { useState, useEffect, useMemo } from 'react';
import { UserAccount, ActivityLog } from '../types';
import { 
  Search, ChevronLeft, ChevronRight, XCircle, Plus, Lock, Globe, Phone, Mail, User,
  ArrowUpDown, Download, Star, MapPin, Tag, Archive, RefreshCw, Briefcase, Calendar, 
  Users, Clock, MoreVertical, Edit2, Trash2, Copy, Check, Filter
} from 'lucide-react';

interface AccountTableProps {
  data: UserAccount[];
  onAddAccount: (account: Omit<UserAccount, 'id'>) => Promise<void>;
  onUpdateAccount: (id: string, updates: Partial<UserAccount>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onBulkAction: (ids: string[], action: 'archive' | 'restore' | 'delete') => Promise<void>;
}

type SortConfig = { key: keyof UserAccount; direction: 'asc' | 'desc' } | null;

const AccountTable: React.FC<AccountTableProps> = ({ 
  data, onAddAccount, onUpdateAccount, onDeleteAccount, onBulkAction 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialFormState = {
    username: '', platform: 'Twitter' as const, followers: 0, engagementRate: 0,
    status: 'Active' as const, bio: '', category: '', realName: '', email: '',
    password: '', twoFactorSecret: '', phone: '', website: '', country: '',
    tags: [] as string[], accountManager: '', targetAudience: '', lastPostedDate: '',
    creationDate: '', notes: ''
  };

  const [formState, setFormState] = useState(initialFormState);
  const [tagsInput, setTagsInput] = useState('');

  const ITEMS_PER_PAGE = 10;
  
  const filteredData = useMemo(() => {
    let result = data.filter(item => viewMode === 'active' ? !item.isArchived : item.isArchived);
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(item => 
            item.username.toLowerCase().includes(lower) || 
            item.platform.toLowerCase().includes(lower) ||
            (item.realName && item.realName.toLowerCase().includes(lower)) ||
            (item.email && item.email.toLowerCase().includes(lower)) ||
            (item.accountManager && item.accountManager.toLowerCase().includes(lower))
        );
    }
    if (showFavoritesOnly) result = result.filter(item => item.isFavorite);
    if (sortConfig) {
        result.sort((a, b) => {
            const aVal = a[sortConfig.key] ?? '';
            const bVal = b[sortConfig.key] ?? '';
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }
    return result;
  }, [data, searchTerm, showFavoritesOnly, viewMode, sortConfig]);

  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(d => d.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSort = (key: keyof UserAccount) => {
    setSortConfig({ key, direction: sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormState(initialFormState);
    setTagsInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (account: UserAccount) => {
    setModalMode('edit');
    setFormState({ ...initialFormState, ...account });
    setTagsInput(account.tags?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this account? This cannot be undone.")) {
      await onDeleteAccount(id);
    }
  };

  const handleBulk = async (action: 'archive' | 'restore' | 'delete') => {
    if (selectedIds.size === 0) return;
    if (action === 'delete' && !window.confirm(`Delete ${selectedIds.size} accounts permanently?`)) return;
    await onBulkAction(Array.from(selectedIds), action);
    setSelectedIds(new Set());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const username = formState.username.startsWith('@') ? formState.username : `@${formState.username}`;
    
    try {
      if (modalMode === 'add') {
        await onAddAccount({ 
          ...formState, 
          username, 
          tags,
          avatar: `https://ui-avatars.com/api/?name=${username.replace('@','')}&background=random&color=fff`,
          history: [{ date: new Date().toISOString(), action: 'Account Created', details: 'Initial entry' }]
        });
      } else {
        const id = (formState as any).id;
        const currentAccount = data.find(d => d.id === id);
        const historyEntry: ActivityLog = { date: new Date().toISOString(), action: 'Profile Updated' };
        await onUpdateAccount(id, { ...formState, username, tags, history: [...(currentAccount?.history || []), historyEntry] });
      }
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCountryFlag = (country?: string) => {
    const map: Record<string, string> = { USA: '🇺🇸', UK: '🇬🇧', Canada: '🇨🇦', Japan: '🇯🇵', Brazil: '🇧🇷', Germany: '🇩🇪', France: '🇫🇷', India: '🇮🇳' };
    return map[country || ''] || '🏳️';
  };

  const handleExport = () => {
    const source = selectedIds.size > 0 ? data.filter(d => selectedIds.has(d.id)) : filteredData;
    const headers = ['ID', 'Username', 'Platform', 'Followers', 'Manager', 'Status', 'Email'];
    const csv = [headers.join(','), ...source.map(u => [u.id, u.username, u.platform, u.followers, u.accountManager, u.status, u.email].join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `socialbase_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-500" />
            <input
              type="text" placeholder="Search database..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={openAddModal} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"><Plus className="w-4 h-4" /> Add Entry</button>
            <button onClick={handleExport} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-all"><Download className="w-5 h-5" /></button>
            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`p-2 rounded-lg border transition-all ${showFavoritesOnly ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}><Star className={`w-5 h-5 ${showFavoritesOnly ? 'fill-yellow-500' : ''}`} /></button>
          </div>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
           <button onClick={() => setViewMode('active')} className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'active' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Operational</button>
           <button onClick={() => setViewMode('archived')} className={`px-6 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'archived' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}><Archive className="w-4 h-4" /> Cold Storage</button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-indigo-600/10 border border-indigo-500/30 p-3 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-bold text-indigo-300 ml-2">{selectedIds.size} accounts selected</span>
          <div className="flex gap-2">
            {viewMode === 'active' ? (
              <button onClick={() => handleBulk('archive')} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded flex items-center gap-1"><Archive className="w-3 h-3" /> Archive</button>
            ) : (
              <button onClick={() => handleBulk('restore')} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Restore</button>
            )}
            <button onClick={() => handleBulk('delete')} className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 flex-1 overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/90 text-slate-300 uppercase text-[10px] font-black tracking-widest sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 w-4">
                  <input type="checkbox" checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length} onChange={toggleSelectAll} className="rounded border-slate-700 bg-slate-800 text-indigo-600" />
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('username')}>
                  <div className="flex items-center gap-1">Identity <ArrowUpDown className="w-3 h-3 opacity-30" /></div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('accountManager')}>
                  <div className="flex items-center gap-1">Custodian <ArrowUpDown className="w-3 h-3 opacity-30" /></div>
                </th>
                <th className="px-6 py-4">Network</th>
                <th className="px-6 py-4">Reach</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Commands</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {paginatedData.length > 0 ? paginatedData.map((user) => (
                <tr key={user.id} className={`hover:bg-slate-700/30 transition-colors group ${selectedIds.has(user.id) ? 'bg-indigo-600/5' : ''}`}>
                  <td className="px-6 py-4">
                    <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelectOne(user.id)} className="rounded border-slate-700 bg-slate-800 text-indigo-600" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                          <img src={user.avatar} className="w-10 h-10 rounded-full bg-slate-700 object-cover ring-2 ring-slate-700" />
                          <span className="absolute -bottom-1 -right-1 text-lg leading-none">{getCountryFlag(user.country)}</span>
                      </div>
                      <div>
                        <div className="font-bold text-white flex items-center gap-1">
                            {user.username} {user.isFavorite && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">{user.email || 'NO_EMAIL_RECORDED'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300 font-medium text-xs flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3 text-indigo-400" /> {user.accountManager || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">{user.platform}</td>
                  <td className="px-6 py-4">
                      <div className="text-white font-mono font-bold">{(user.followers > 1000000 ? (user.followers/1000000).toFixed(1) + 'M' : (user.followers/1000).toFixed(1) + 'k')}</div>
                      <div className="text-[10px] text-slate-500">{user.engagementRate}% engagement</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelectedAccount(user)} className="p-2 hover:bg-slate-700 rounded-lg text-indigo-400" title="Full Details"><MoreVertical className="w-4 h-4" /></button>
                      <button onClick={() => openEditModal(user)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300" title="Edit Entry"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-slate-700 rounded-lg text-red-400" title="Delete Entry"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-6 py-32 text-center text-slate-500 italic">No matching entries found in {viewMode} database.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="mt-auto border-t border-slate-700 p-4 flex items-center justify-between bg-slate-900/50 backdrop-blur">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Page {currentPage} of {totalPages || 1} — {filteredData.length} Entries</span>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-20 transition-all"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))} disabled={currentPage >= totalPages} className="p-2 bg-slate-800 hover:bg-slate-700 rounded disabled:opacity-20 transition-all"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {/* Slide-over Details Panel */}
      {selectedAccount && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-slate-900 border-l border-slate-700 shadow-3xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
            <h3 className="font-black text-xs uppercase tracking-widest text-indigo-400">Vault Access: Details</h3>
            <button onClick={() => setSelectedAccount(null)} className="text-slate-500 hover:text-white"><XCircle className="w-6 h-6" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="flex items-center gap-5">
               <img src={selectedAccount.avatar} className="w-20 h-20 rounded-2xl ring-4 ring-slate-800 shadow-2xl" />
               <div>
                 <h2 className="text-2xl font-black text-white">{selectedAccount.username}</h2>
                 <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest">{selectedAccount.platform} Network</p>
                 <div className="flex items-center gap-2 mt-2">
                   <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold text-slate-400 border border-slate-700">{selectedAccount.category}</span>
                   <button onClick={() => onUpdateAccount(selectedAccount.id, { isFavorite: !selectedAccount.isFavorite })} className={selectedAccount.isFavorite ? 'text-yellow-500' : 'text-slate-600'}><Star className={`w-4 h-4 ${selectedAccount.isFavorite ? 'fill-yellow-500' : ''}`} /></button>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Custodian</p>
                    <p className="text-sm font-bold text-white">{selectedAccount.accountManager || 'Unassigned'}</p>
                 </div>
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Last Posted</p>
                    <p className="text-sm font-bold text-white">{selectedAccount.lastPostedDate || '---'}</p>
                 </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Lock className="w-3 h-3" /> Secure Access Layer</h4>
                <div className="bg-slate-950/50 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                    <div className="p-4 flex justify-between items-center group">
                        <div>
                          <p className="text-[9px] font-bold text-slate-600 uppercase">System Email</p>
                          <p className="text-xs font-mono text-slate-300">{selectedAccount.email || 'None'}</p>
                        </div>
                        {selectedAccount.email && (
                          <button onClick={() => handleCopy(selectedAccount.email!, 'email')} className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-all">
                            {copiedId === 'email' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                    </div>
                    <div className="p-4 flex justify-between items-center group">
                        <div>
                          <p className="text-[9px] font-bold text-slate-600 uppercase">System Password</p>
                          <p className="text-xs font-mono text-slate-300 tracking-tighter">••••••••••••</p>
                        </div>
                        {selectedAccount.password && (
                          <button onClick={() => handleCopy(selectedAccount.password!, 'pass')} className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-all">
                            {copiedId === 'pass' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                    </div>
                    <div className="p-4 flex justify-between items-center group">
                        <div>
                          <p className="text-[9px] font-bold text-slate-600 uppercase">2FA OTP Seed</p>
                          <p className="text-xs font-mono text-slate-300">{selectedAccount.twoFactorSecret || 'Disabled'}</p>
                        </div>
                        {selectedAccount.twoFactorSecret && (
                          <button onClick={() => handleCopy(selectedAccount.twoFactorSecret!, 'otp')} className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-all">
                            {copiedId === 'otp' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Clock className="w-3 h-3" /> Audit Log</h4>
                 <div className="space-y-4 border-l-2 border-slate-800 ml-2 pl-6 py-2">
                     {(selectedAccount.history || []).slice().reverse().map((log, i) => (
                         <div key={i} className="relative">
                             <div className="absolute -left-[31px] top-1 w-2 h-2 rounded-full bg-slate-700 ring-4 ring-slate-900"></div>
                             <p className="text-xs font-bold text-slate-200">{log.action}</p>
                             <p className="text-[10px] text-slate-500 font-mono">{new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                             {log.details && <p className="text-[10px] text-slate-400 mt-1 italic leading-relaxed">{log.details}</p>}
                         </div>
                     ))}
                 </div>
            </div>
          </div>
          <div className="p-6 border-t border-slate-800 bg-slate-800/30 flex gap-4">
            <button onClick={() => openEditModal(selectedAccount)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"><Edit2 className="w-4 h-4" /> Edit Entry</button>
            <button onClick={() => handleDelete(selectedAccount.id)} className="p-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* Entry Modal (Add/Edit) */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-4xl flex flex-col max-h-[90vh] overflow-hidden scale-in-center">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                    <h3 className="text-lg font-black text-white uppercase tracking-widest">{modalMode === 'add' ? 'Secure Entry: Initialize' : 'Secure Entry: Modifier'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><XCircle className="w-7 h-7" /></button>
                </div>
                <div className="overflow-y-auto p-8 flex-1 custom-scrollbar space-y-8">
                    <form id="entryForm" onSubmit={handleSubmit} className="space-y-10">
                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b border-slate-800 pb-2">Core Identity</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Primary Username</label>
                                    <input type="text" required value={formState.username} onChange={(e) => setFormState({...formState, username: e.target.value})} placeholder="@handle" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Network Layer</label>
                                    <select value={formState.platform} onChange={(e) => setFormState({...formState, platform: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold">
                                        <option value="Twitter">Twitter</option><option value="Instagram">Instagram</option><option value="LinkedIn">LinkedIn</option><option value="TikTok">TikTok</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Reach (Followers)</label>
                                    <input type="number" required min="0" value={formState.followers} onChange={(e) => setFormState({...formState, followers: parseInt(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Engagement Rate (%)</label>
                                    <input type="number" required min="0" max="100" step="0.1" value={formState.engagementRate} onChange={(e) => setFormState({...formState, engagementRate: parseFloat(e.target.value) || 0})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest border-b border-slate-800 pb-2">Vault Credentials</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Recovery Email</label>
                                    <input type="email" value={formState.email} onChange={(e) => setFormState({...formState, email: e.target.value})} placeholder="vault@system.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Master Password</label>
                                    <input type="text" value={formState.password} onChange={(e) => setFormState({...formState, password: e.target.value})} placeholder="SECURE_PHRASE" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Custodian (Manager)</label>
                                    <input type="text" value={formState.accountManager} onChange={(e) => setFormState({...formState, accountManager: e.target.value})} placeholder="Operator Name" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">2FA Secret Key</label>
                                    <input type="text" value={formState.twoFactorSecret} onChange={(e) => setFormState({...formState, twoFactorSecret: e.target.value})} placeholder="JBSW..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono" />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Environmental Data</h4>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Geo-Location (Country)</label>
                                    <select value={formState.country} onChange={(e) => setFormState({...formState, country: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold">
                                        <option value="">N/A</option><option value="USA">USA</option><option value="UK">UK</option><option value="Canada">Canada</option><option value="India">India</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Operational Status</label>
                                    <select value={formState.status} onChange={(e) => setFormState({...formState, status: e.target.value as any})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold">
                                        <option value="Active">Active</option><option value="Suspended">Suspended</option><option value="Verified">Verified</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Internal Notes</label>
                                <textarea rows={3} value={formState.notes} onChange={(e) => setFormState({...formState, notes: e.target.value})} placeholder="Strategic directives..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all font-medium" />
                            </div>
                        </section>
                    </form>
                </div>
                <div className="p-8 border-t border-slate-800 bg-slate-800/30 flex justify-end gap-4">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-400 hover:text-white transition-all font-bold uppercase tracking-widest text-xs">Abord</button>
                    <button type="submit" form="entryForm" disabled={isSubmitting} className="px-10 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs transition-all disabled:opacity-50 shadow-2xl shadow-indigo-600/30">
                        {isSubmitting ? 'Syncing...' : modalMode === 'add' ? 'Initialize Record' : 'Commit Changes'}
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default AccountTable;