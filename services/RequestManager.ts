import { RequestForm, RequestStatus, RequestItem } from '../types';
import { LogManager } from './LogManager';
import { NotificationManager } from './NotificationManager';
import { AuthManager } from './AuthManager';
import { RequestItemManager } from './RequestItemManager';
import { RequestFormManager } from './RequestFormManager';
import { supabase } from './SupabaseClient';
import { CommentManager } from './CommentManager';
import { AttachmentManager } from './AttachmentManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class RequestManager {
  static async getRequests(): Promise<RequestForm[]> {
    const user = AuthManager.getCurrentUser();
    if (!user) return [];

    try {
      const response = await fetch(`${API_URL}/api/requests?page_size=1000&requester_id=${user.role === 'REQUESTER' ? user.id : ''}`);
      if (!response.ok) throw new Error('API_FETCH_ERROR');

      const { data } = await response.json();
      return (data || []).map((r: any) => ({
        ...r,
        requesterId: r.requester_id,
        eventDate: r.event_date,
        budgetSource: r.budget_source,
        cashAdvance: Number(r.cash_advance || 0),
        totalCost: Number(r.total_cost || 0),
        createdAt: r.created_at,
        items: (r.items || []).map((i: any) => {
          const qty = Number(i.quantity || 0);
          const prc = Number(i.price || 0);
          return {
            ...i,
            quantity: qty,
            price: prc,
            total: qty * prc,
            requestId: i.request_id
          };
        })
      })) as RequestForm[];
    } catch (err) {
      console.error('RequestManager critical failure:', err);
      return [];
    }
  }

  static async getRequestsPaginated(page: number = 0, pageSize: number = 1000): Promise<{ data: RequestForm[], total: number }> {
    const user = AuthManager.getCurrentUser();
    if (!user) return { data: [], total: 0 };

    try {
      const response = await fetch(`${API_URL}/api/requests?page=${page}&page_size=${pageSize}&requester_id=${user.role === 'REQUESTER' ? user.id : ''}`);
      if (!response.ok) throw new Error('API_FETCH_ERROR');

      const { data, total } = await response.json();
      const formattedData = (data || []).map((r: any) => ({
        ...r,
        requesterId: r.requester_id,
        eventDate: r.event_date,
        budgetSource: r.budget_source,
        cashAdvance: Number(r.cash_advance || 0),
        totalCost: Number(r.total_cost || 0),
        createdAt: r.created_at,
        items: (r.items || []).map((i: any) => {
          const qty = Number(i.quantity || 0);
          const prc = Number(i.price || 0);
          return {
            ...i,
            quantity: qty,
            price: prc,
            total: qty * prc,
            requestId: i.request_id
          };
        })
      })) as RequestForm[];

      return { data: formattedData, total };
    } catch (err) {
      console.error('RequestManager critical failure:', err);
      return { data: [], total: 0 };
    }
  }

  static async getRequestById(id: string): Promise<RequestForm | null> {
    try {
      const response = await fetch(`${API_URL}/api/requests?id=${id}`);
      if (!response.ok) return null;

      const { data } = await response.json();
      if (!data || data.length === 0) return null;

      const r = data[0];
      return {
        ...r,
        requesterId: r.requester_id,
        eventDate: r.event_date,
        budgetSource: r.budget_source,
        cashAdvance: Number(r.cash_advance || 0),
        totalCost: Number(r.total_cost || 0),
        createdAt: r.created_at,
        items: (r.items || []).map((i: any) => {
          const qty = Number(i.quantity || 0);
          const prc = Number(i.price || 0);
          return {
            ...i,
            quantity: qty,
            price: prc,
            total: qty * prc,
            requestId: i.request_id
          };
        })
      } as RequestForm;
    } catch (err) {
      console.error(`RequestManager: Failed to fetch request ${id}`, err);
      return null;
    }
  }

  static async createOrUpdateFromFormAsync(
    formData: any,
    items: RequestItem[],
    category: string,
    statusType: 'draft' | 'submit',
    viewingId?: string,
    tempId?: string
  ): Promise<string> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_SESSION_EXPIRED");

    const payload = {
      name: formData.name,
      category,
      budget_source: formData.budgetSource,
      cash_advance: formData.cashAdvance || 0,
      event_date: formData.eventDate,
      status: statusType === 'submit' ? RequestStatus.PENDING : (formData.status || RequestStatus.DRAFT),
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        price: item.price
      }))
    };

    let persistentId: string;

    if (viewingId) {
      const response = await fetch(`${API_URL}/api/requests/${viewingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`API_UPDATE_ERROR: ${response.statusText}`);
      persistentId = viewingId;
    } else {
      const response = await fetch(`${API_URL}/api/requests/?requester_id=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error(`API_INSERT_ERROR: ${response.statusText}`);
      const data = await response.json();
      persistentId = data.id.toString();
    }

    const numericId = parseInt(persistentId, 10);

    // Persist staged records if this was a new request using a temporary ID
    if (!viewingId && tempId) {
      try {
        await Promise.all([
          CommentManager.commitStaged(tempId, numericId),
          AttachmentManager.commitStaged(tempId, numericId)
        ]);
      } catch (err) {
        console.warn("Staged data persistence partial failure:", err);
      }
    }

    LogManager.addLog(user.id, statusType === 'submit' ? 'SUBMIT_REQUEST' : 'SAVE_DRAFT', `Relational node ${persistentId} finalized via FastAPI.`);
    return persistentId;
  }

  static async processReviewAsync(requestId: string, decision: 'approve' | 'deny' | 'revision'): Promise<void> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const response = await fetch(`${API_URL}/api/requests/${requestId}/review?decision=${decision}&reviewer_id=${user.id}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error(`API_REVIEW_ERROR: ${response.statusText}`);

    LogManager.addLog(user.id, 'REVIEW_DECISION', `${decision.toUpperCase()} applied to Node ${requestId} via FastAPI`);
  }

  static getPresetsForCategory(category: string): RequestItem[] {
    const schema = RequestFormManager.getSchemaByCategory(category);
    return (schema.presets || []).map(p => ({
      id: Math.random().toString(36).substr(2, 9),
      name: p.name || '',
      quantity: p.quantity || 1,
      unit: p.unit || 'Units',
      price: p.price || 0,
      total: (p.quantity || 1) * (p.price || 0)
    }));
  }
}