import React, { useMemo } from 'react';
import { Wallet, AlertCircle, Save, Send, Loader2, Check, Hash } from 'lucide-react';
import { RequestForm, RequestStatus, RequestItem } from '../../types';
import { RequestItemEditor } from './RequestItemEditor';
import { FileUploader } from './FileUploader';
import { DiscussionThread } from './DiscussionThread';
import { RequestItemManager } from '../../services/RequestItemManager';
import { AccountManager } from '../../services/AccountManager';
import { AuthManager } from '../../services/AuthManager';

interface RequestFormEditorProps {
    viewingRequest: RequestForm | null;
    selectedCategory: string | null;
    formState: any;
    setFormState: (state: any) => void;
    items: RequestItem[];
    onItemsChange: (updater: (prev: RequestItem[]) => RequestItem[]) => void;
    onLoadPresets: () => void;
    isEditable: boolean;
    validationErrors: Record<string, string>;
    isSubmitting: boolean;
    onAction: (status: 'draft' | 'submit') => void;
    onReview: (decision: 'approve' | 'deny' | 'revision') => void;
    onCancel: () => void;
    tempId: string;
    isDrawerMode?: boolean;
}

export const RequestFormEditor: React.FC<RequestFormEditorProps> = ({
    viewingRequest,
    selectedCategory,
    formState,
    setFormState,
    items,
    onItemsChange,
    onLoadPresets,
    isEditable,
    validationErrors,
    isSubmitting,
    onAction,
    onReview,
    onCancel,
    tempId,
    isDrawerMode = false
}) => {
    const user = AuthManager.getCurrentUser();
    const totalCost = useMemo(() => RequestItemManager.calculateTotal(items), [items]);

    return (
        <div className="mx-auto relative">
            <div className="theme-card rounded-lg border theme-border shadow-sm overflow-hidden mb-12">
                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="label-caps">Request Name</label>
                                <input
                                    disabled={!isEditable}
                                    value={formState.name}
                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                    className={`w-full px-6 py-4 theme-bg border ${validationErrors.name ? 'border-red-500 bg-red-50/10' : 'theme-border'} rounded-lg font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all theme-text`}
                                    placeholder="e.g. Q4 Brand Expansion"
                                />
                                {validationErrors.name && <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1"><AlertCircle size={10} /> {validationErrors.name}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="label-caps">Date</label>
                                    <input
                                        type="date"
                                        disabled={!isEditable}
                                        value={formState.eventDate}
                                        onChange={(e) => setFormState({ ...formState, eventDate: e.target.value })}
                                        className="w-full px-6 py-4 theme-bg border theme-border rounded-lg font-bold text-xs outline-none theme-text"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="label-caps">Source</label>
                                    <select
                                        disabled={!isEditable}
                                        value={formState.budgetSource}
                                        onChange={(e) => setFormState({ ...formState, budgetSource: e.target.value })}
                                        className="w-full px-6 py-4 theme-bg border theme-border rounded-lg font-bold text-xs outline-none theme-text"
                                    >
                                        <option>Strategic Fund</option>
                                        <option>Operational Reserve</option>
                                        <option>Asset Management</option>
                                        <option>Corporate Brand Fund</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="theme-bg bg-opacity-30 p-8 rounded-lg border theme-border flex flex-col justify-center text-center">
                            <p className="label-caps mb-4">Total Request Cost</p>
                            <p className="text-5xl font-black theme-text tracking-tighter">IDR {totalCost.toLocaleString()}</p>

                            <div className="mt-8 pt-6 border-t theme-border border-opacity-20 flex flex-col items-center">
                                <div className="flex items-center gap-2 mb-3">
                                    <Wallet size={14} className="text-slate-400" />
                                    <label className="label-caps">Advance Request</label>
                                </div>
                                <div className="relative w-full max-w-[240px]">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">IDR</span>
                                    <input
                                        type="number"
                                        disabled={!isEditable}
                                        value={formState.cashAdvance || ''}
                                        onChange={(e) => setFormState({ ...formState, cashAdvance: Number(e.target.value) })}
                                        placeholder="0"
                                        className="w-full pl-12 pr-4 py-3 bg-white border theme-border rounded-lg font-black text-sm outline-none focus:ring-4 focus:ring-blue-500/10 text-center transition-all theme-text"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2 italic">Standard Provision: 80% Max</p>
                            </div>
                        </div>
                    </div>

                    <RequestItemEditor items={items} onItemsChange={onItemsChange} onLoadPresets={onLoadPresets} disabled={!isEditable} />

                    <div className="flex flex-col gap-12 pt-6">
                        <FileUploader requestId={viewingRequest?.id || tempId} />
                        <DiscussionThread requestId={viewingRequest?.id || tempId} />
                    </div>
                </div>
            </div>

            {/* Sticky / Fixed Footer */}
            <div className={`
                ${isDrawerMode
                    ? 'sticky bottom-0 -mx-6 px-6 py-6 border-t mt-auto'
                    : 'fixed bottom-0 right-0 left-[var(--sidebar-width,256px)] z-30 p-6'
                }
                theme-bg bg-opacity-80 backdrop-blur-md theme-border transition-all duration-300
            `}>
                <div className={`grid grid-cols-3 items-center ${isDrawerMode ? '' : 'max-w-[95%] mx-auto'}`}>
                    {/* Left: Close/Cancel */}
                    <div className="flex justify-start">
                        <button onClick={onCancel} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest theme-text-muted hover:theme-text transition-all">Cancel</button>
                    </div>

                    {/* Center: Actions */}
                    <div className="flex justify-center gap-4">
                        {isEditable ? (
                            <>
                                <button
                                    disabled={isSubmitting}
                                    onClick={() => onAction('draft')}
                                    className="flex items-center gap-2 px-6 py-3 theme-card border theme-border rounded-lg text-[10px] font-black uppercase tracking-widest theme-text-muted hover:theme-bg whitespace-nowrap"
                                >
                                    <Save size={16} /> Save to Draft
                                </button>
                                <button
                                    disabled={validationErrors.name !== undefined || isSubmitting || items.length === 0}
                                    onClick={() => onAction('submit')}
                                    className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all disabled:opacity-50 whitespace-nowrap"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />} Submit Request
                                </button>
                            </>
                        ) : (
                            AccountManager.hasPermission(user!, 'APPROVE') && viewingRequest?.status === RequestStatus.PENDING && (
                                <div className="flex gap-3">
                                    <button onClick={() => onReview('revision')} className="px-6 py-3 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Revision</button>
                                    <button onClick={() => onReview('deny')} className="px-6 py-3 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Deny</button>
                                    <button onClick={() => onReview('approve')} className="px-8 py-3 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 whitespace-nowrap"><Check size={18} /> Approve</button>
                                </div>
                            )
                        )}
                    </div>

                    {/* Right: Total Cost Summary */}
                    <div className="flex justify-end items-center gap-4 pr-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black theme-text-muted uppercase tracking-widest">Total Cost</p>
                            <p className="text-xl font-black theme-text tracking-tighter">IDR {totalCost.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
