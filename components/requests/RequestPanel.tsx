import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Hash } from 'lucide-react';
import { RequestCategoryGrid } from './RequestCategoryGrid';
import { RequestRegistry } from './RequestRegistry';
import { RequestFormEditor } from './RequestFormEditor';
import { RequestManager } from '../../services/RequestManager';
import { RequestFormManager } from '../../services/RequestFormManager';
import { RequestItemManager } from '../../services/RequestItemManager';
import { AuthManager } from '../../services/AuthManager';
import { NotificationManager } from '../../services/NotificationManager';
import { LogManager } from '../../services/LogManager';
import { RequestForm, RequestItem, RequestStatus, RequestFilters } from '../../types';
import { SortingState } from '@tanstack/react-table';
interface RequestPanelProps {
    initialTab?: 'initiate' | 'registry';
    isDrawerMode?: boolean;
    isFullscreen?: boolean;
    onClose?: () => void;
    overrideRequestId?: string | null;
    highlightCommentId?: string | null;
    onTitleChange?: (title: React.ReactNode) => void;
}

export const RequestPanel: React.FC<RequestPanelProps> = ({
    initialTab = 'initiate',
    isDrawerMode = false,
    isFullscreen = false,
    onClose,
    overrideRequestId,
    highlightCommentId,
    onTitleChange
}) => {
    const navigate = useNavigate();
    const user = AuthManager.getCurrentUser();

    const [activeSubPage, setActiveSubPage] = useState<'initiate' | 'registry'>(initialTab);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [viewingRequest, setViewingRequest] = useState<RequestForm | any>(null);
    const [items, setItems] = useState<RequestItem[]>([]);
    const [formState, setFormState] = useState<Record<string, any>>({});
    const [requests, setRequests] = useState<RequestForm[]>([]);
    const [totalRequests, setTotalRequests] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [tempId] = useState(`TMP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [sorting, setSorting] = useState<SortingState>([]);
    const [filters, setFilters] = useState<RequestFilters>({});
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Sync initial tab when prop changes (for global drawer mode switching)
    useEffect(() => {
        setActiveSubPage(initialTab);
    }, [initialTab]);

    // Handle Title Updates for Drawer Mode
    useEffect(() => {
        if (onTitleChange) {
            if (viewingRequest) {
                onTitleChange(
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 text-white rounded-lg">
                            <Hash size={18} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-black theme-text uppercase tracking-widest leading-none">
                                Request Details: {formState.name || viewingRequest.name}
                            </h3>
                            <p className="text-[10px] theme-text-muted font-bold uppercase tracking-widest mt-1.5 leading-none">
                                Status: {viewingRequest.status} • {viewingRequest.category} • Created {new Date(viewingRequest.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                );
            } else if (selectedCategory) {
                onTitleChange(
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-900 text-white rounded-lg">
                            <Hash size={18} />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-black theme-text uppercase tracking-widest leading-none">
                                New Request
                            </h3>
                            <p className="text-[10px] theme-text-muted font-bold uppercase tracking-widest mt-1.5 leading-none">
                                {selectedCategory} • {formState.name || 'Untitled'}
                            </p>
                        </div>
                    </div>
                );
            } else {
                onTitleChange(activeSubPage === 'initiate' ? 'New Quick Request' : 'Request Registry');
            }
        }
    }, [viewingRequest, selectedCategory, activeSubPage, onTitleChange, formState.name]);

    // Debounce globalFilter -> debouncedSearch
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearch(globalFilter);
        }, 400);
        return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, [globalFilter]);

    // Reset page when sort, search or filters change
    useEffect(() => {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, [sorting, debouncedSearch, filters]);

    const loadRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const sortBy = sorting.length > 0 ? sorting[0].id : 'created_at';
            const sortOrder = sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc';
            // Map frontend accessor keys to backend column names
            const columnMap: Record<string, string> = { createdAt: 'created_at', totalCost: 'total_cost' };
            const mappedSortBy = columnMap[sortBy] || sortBy;
            const { data, total } = await RequestManager.getRequestsPaginated(
                pagination.pageIndex,
                pagination.pageSize,
                mappedSortBy,
                sortOrder,
                debouncedSearch,
                filters
            );
            setRequests(data);
            setTotalRequests(total);
        } finally {
            setIsLoading(false);
        }
    }, [pagination.pageIndex, pagination.pageSize, sorting, debouncedSearch, filters]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    // Handle Override ID (e.g. from URL or direct prop)
    useEffect(() => {
        const checkAndFetch = async () => {
            if (overrideRequestId) {
                const found = requests.find(r => r.id === overrideRequestId);
                if (found) {
                    handleSelectRequest(found);
                } else {
                    // Fetch directly if not in currently loaded paginated list
                    setIsLoading(true);
                    const direct = await RequestManager.getRequestById(overrideRequestId);
                    if (direct) {
                        handleSelectRequest(direct);
                    }
                    setIsLoading(false);
                }
            }
        };
        checkAndFetch();
    }, [overrideRequestId, requests]);

    const currentSchema = useMemo(() => selectedCategory ? RequestFormManager.getSchemaByCategory(selectedCategory) : null, [selectedCategory]);

    const handleLoadPresets = () => {
        if (selectedCategory) {
            const presets = RequestManager.getPresetsForCategory(selectedCategory);
            setItems(presets);
        }
    };

    useEffect(() => {
        if (selectedCategory && !viewingRequest) {
            handleLoadPresets();
            setFormState({
                name: '',
                eventDate: new Date().toISOString().split('T')[0],
                budgetSource: currentSchema?.defaultValues.budgetSource || 'Strategic Fund',
                cashAdvance: currentSchema?.defaultValues.cashAdvance || 0,
                ...currentSchema?.defaultValues
            });
            setValidationErrors({});
        }
    }, [selectedCategory, viewingRequest, currentSchema]);

    const handleSelectRequest = (request: RequestForm) => {
        setSelectedCategory(request.category);
        setViewingRequest(request);
        setItems(request.items);
        setFormState(request);
        if (!isDrawerMode) {
            // In page mode, update URL
            navigate(`/requests?id=${request.id}`);
        }
    };

    const clearSelection = () => {
        setSelectedCategory(null);
        setViewingRequest(null);
        if (!isDrawerMode) navigate('/requests');
    };

    const handleAction = async (status: 'draft' | 'submit') => {
        if (!selectedCategory && !viewingRequest) return;
        setIsSubmitting(true);
        setValidationErrors({});

        try {
            const persistentId = await RequestManager.createOrUpdateFromFormAsync(formState, items, selectedCategory || viewingRequest.category, status, viewingRequest?.id, tempId);

            clearSelection();
            setActiveSubPage('registry');
            await loadRequests();

            const reqName = formState.name || 'New Request';

            // 1. Notify Admins
            NotificationManager.addNotification({
                userId: 'system',
                role: 'ADMIN',
                title: status === 'submit' ? 'New Request Activity' : 'Draft Saved',
                message: status === 'submit' ? `Request "${reqName}" submitted by ${user?.username}.` : `Draft "${reqName}" updated.`,
                requestId: persistentId
            });

            // 2. Notify Reviewers (only on submit)
            if (status === 'submit') {
                NotificationManager.addNotification({
                    userId: 'system',
                    role: 'REVIEWER',
                    title: 'New Request for Review',
                    message: `Request "${reqName}" requires your evaluation.`,
                    requestId: persistentId
                });
            }

            // 3. Notify Creator (confirmation)
            NotificationManager.addNotification({
                userId: user?.id || 'system',
                title: 'Success',
                message: status === 'submit' ? 'Request submitted successfully.' : 'Draft saved successfully.',
                requestId: persistentId
            });

            if (user) {
                LogManager.addLog(user.id, status === 'submit' ? 'SUBMIT_REQUEST' : 'SAVE_DRAFT', `Request ${persistentId} finalized via FastAPI.`);
            }
            if (onClose) onClose();

        } catch (e: any) {
            const errorMsg = e.message || 'System error occurred.';
            NotificationManager.addNotification({
                userId: user?.id || 'system',
                title: 'Action Failed',
                message: errorMsg,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReview = async (id: string, decision: 'approve' | 'deny' | 'revision') => {
        setIsSubmitting(true);
        try {
            await RequestManager.processReviewAsync(id, decision);

            // Get the creator ID from the current viewing request
            const creatorId = viewingRequest?.requesterId;
            const reqName = viewingRequest?.name || 'Request';

            clearSelection();
            await loadRequests();

            // 1. Notify Admins
            NotificationManager.addNotification({
                userId: 'system',
                role: 'ADMIN',
                title: 'Review Decision Applied',
                message: `Request "${reqName}" was ${decision.toUpperCase()} by ${user?.username}.`,
                requestId: id
            });

            // 2. Notify Creator
            if (creatorId) {
                NotificationManager.addNotification({
                    userId: creatorId,
                    title: 'Request Update',
                    message: `Your request "${reqName}" has been ${decision.toUpperCase()}.`,
                    requestId: id
                });
            }

            NotificationManager.addNotification({
                userId: user?.id || 'system',
                title: 'Audit Complete',
                message: `Request status updated to ${decision.toUpperCase()}.`,
                requestId: id
            });
            if (onClose) onClose();
        } catch (e: any) {
            NotificationManager.addNotification({
                userId: user?.id || 'system',
                title: 'Review Failed',
                message: e.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string, name: string, requesterId: string) => {
        setIsSubmitting(true);
        try {
            await RequestManager.deleteRequestAsync(id);

            // 1. Notify Admins
            NotificationManager.addNotification({
                userId: 'system',
                role: 'ADMIN',
                title: 'Request Deleted',
                message: `The request "${name}" was permanently deleted by ${user?.username}.`
            });

            // 2. Notify Creator (if not the one who deleted it)
            if (requesterId && requesterId !== user?.id) {
                NotificationManager.addNotification({
                    userId: requesterId,
                    title: 'Request Deleted',
                    message: `Your request "${name}" has been deleted by an administrator.`
                });
            } else if (requesterId === user?.id) {
                // Confirm to the user themselves
                NotificationManager.addNotification({
                    userId: user.id,
                    title: 'Request Deleted',
                    message: `You have successfully deleted the request "${name}".`
                });
            }

            clearSelection();
            await loadRequests();
            if (onClose) onClose();
        } catch (e: any) {
            NotificationManager.addNotification({
                userId: user?.id || 'system',
                title: 'Deletion Failed',
                message: e.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEditable = !viewingRequest || viewingRequest.status === RequestStatus.DRAFT || viewingRequest.status === RequestStatus.REVISION;

    return (
        <div className="space-y-6">
            {/* Header for Page Mode Only - Drawer wraps this component so doesn't need it */}
            {!isDrawerMode && !selectedCategory && !viewingRequest && (
                <div className="flex items-center justify-between border-b theme-border pb-6">
                    <div className="flex items-center gap-4">
                        {(selectedCategory || viewingRequest) && <button onClick={clearSelection} className="p-1.5 hover:theme-bg border theme-border rounded transition-all text-slate-500"><ChevronLeft size={18} /></button>}
                        <div>
                            <h1 className="text-3xl font-black theme-text uppercase tracking-tight">Requests</h1>
                            <p className="theme-text-muted text-sm font-medium tracking-tight">Manage and track all service requests.</p>
                        </div>
                    </div>
                    {!selectedCategory && !viewingRequest && (
                        <div className="flex theme-bg border theme-border rounded-lg p-1.5 shadow-sm">
                            <button onClick={() => setActiveSubPage('initiate')} className={`btn btn-sm ${activeSubPage === 'initiate' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'btn-ghost'}`}>Create new</button>
                            <button onClick={() => setActiveSubPage('registry')} className={`btn btn-sm ${activeSubPage === 'registry' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'btn-ghost'}`}>Submitted</button>
                        </div>
                    )}
                </div>
            )}

            {/* MAIN CONTENT AREA */}

            {/* 1. SELECTION & FORM (If selected) */}
            {(selectedCategory) ? (
                <div className="animate-in zoom-in-95 duration-300">
                    <RequestFormEditor
                        viewingRequest={viewingRequest}
                        selectedCategory={selectedCategory}
                        formState={formState}
                        setFormState={setFormState}
                        items={items}
                        onItemsChange={setItems}
                        onLoadPresets={handleLoadPresets}
                        isEditable={isEditable}
                        validationErrors={validationErrors}
                        isSubmitting={isSubmitting}
                        onAction={handleAction}
                        onReview={(decision) => viewingRequest && handleReview(viewingRequest.id, decision)}
                        onDelete={() => viewingRequest && handleDelete(viewingRequest.id, viewingRequest.name, viewingRequest.requesterId)}
                        onCancel={isDrawerMode && onClose ? onClose : clearSelection}
                        tempId={tempId}
                        isDrawerMode={isDrawerMode}
                        highlightCommentId={highlightCommentId}
                    />
                </div>
            ) : (
                /* 2. DASHBOARD VIEW (If nothing selected) */
                <>
                    {activeSubPage === 'initiate' && (
                        <RequestCategoryGrid
                            onSelect={setSelectedCategory}
                            isDrawerMode={isDrawerMode}
                            isFullscreen={isFullscreen}
                        />
                    )}

                    {activeSubPage === 'registry' && (
                        <RequestRegistry
                            requests={requests}
                            isLoading={isLoading}
                            totalRequests={totalRequests}
                            pagination={pagination}
                            setPagination={setPagination}
                            onSelect={handleSelectRequest}
                            globalFilter={globalFilter}
                            setGlobalFilter={setGlobalFilter}
                            sorting={sorting}
                            onSortingChange={setSorting}
                            filters={filters}
                            onFiltersChange={setFilters}
                        />
                    )}
                </>
            )}
        </div>
    );
};
