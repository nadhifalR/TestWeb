import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { RequestCategoryGrid } from './RequestCategoryGrid';
import { RequestRegistry } from './RequestRegistry';
import { RequestFormEditor } from './RequestFormEditor';
import { RequestManager } from '../../services/RequestManager';
import { RequestFormManager } from '../../services/RequestFormManager';
import { RequestItemManager } from '../../services/RequestItemManager';
import { AuthManager } from '../../services/AuthManager';
import { NotificationManager } from '../../services/NotificationManager';
import { LogManager } from '../../services/LogManager';
import { RequestForm, RequestItem, RequestStatus } from '../../types';

interface RequestPanelProps {
    initialTab?: 'initiate' | 'registry';
    isDrawerMode?: boolean;
    onClose?: () => void;
    overrideRequestId?: string | null;
}

export const RequestPanel: React.FC<RequestPanelProps> = ({
    initialTab = 'initiate',
    isDrawerMode = false,
    onClose,
    overrideRequestId
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

    // Sync initial tab when prop changes (for global drawer mode switching)
    useEffect(() => {
        setActiveSubPage(initialTab);
    }, [initialTab]);

    const loadRequests = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, total } = await RequestManager.getRequestsPaginated(pagination.pageIndex, pagination.pageSize);
            setRequests(data);
            setTotalRequests(total);
        } finally {
            setIsLoading(false);
        }
    }, [pagination.pageIndex, pagination.pageSize]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    // Handle Override ID (e.g. from URL or direct prop)
    useEffect(() => {
        if (overrideRequestId && requests.length > 0) {
            const found = requests.find(r => r.id === overrideRequestId);
            if (found) {
                handleSelectRequest(found);
            }
        }
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
            await RequestManager.createOrUpdateFromFormAsync(formState, items, selectedCategory || viewingRequest.category, status, viewingRequest?.id, tempId[0]);

            clearSelection();
            setActiveSubPage('registry');
            await loadRequests();

            NotificationManager.addNotification({
                userId: user?.id || 'system',
                title: 'Success',
                message: status === 'submit' ? 'Request submitted successfully.' : 'Draft saved successfully.',
            });

            if (user) {
                LogManager.addLog(user.id, status === 'submit' ? 'SUBMIT_REQUEST' : 'SAVE_DRAFT', `Request ${viewingRequest?.id || tempId[0]} finalized via FastAPI.`);
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
            clearSelection();
            await loadRequests();

            NotificationManager.addNotification({
                userId: user?.id || 'system',
                title: 'Audit Complete',
                message: `Request status updated to ${decision.toUpperCase()}.`,
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

    const isEditable = !viewingRequest || viewingRequest.status === RequestStatus.DRAFT || viewingRequest.status === RequestStatus.REVISION;

    return (
        <div className="space-y-6">
            {/* Header for Page Mode Only - Drawer wraps this component so doesn't need it */}
            {!isDrawerMode && (
                <div className="flex items-center justify-between border-b theme-border pb-6">
                    <div className="flex items-center gap-4">
                        {(selectedCategory || viewingRequest) && <button onClick={clearSelection} className="p-1.5 hover:theme-bg border theme-border rounded transition-all text-slate-500"><ChevronLeft size={18} /></button>}
                        <div><h1 className="text-2xl font-extrabold theme-text uppercase tracking-tight">Requests</h1></div>
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
                        onCancel={isDrawerMode && onClose ? onClose : clearSelection}
                        tempId={tempId[0]}
                    />
                </div>
            ) : (
                /* 2. DASHBOARD VIEW (If nothing selected) */
                <>
                    {activeSubPage === 'initiate' && (
                        <RequestCategoryGrid onSelect={setSelectedCategory} />
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
                        />
                    )}
                </>
            )}
        </div>
    );
};
