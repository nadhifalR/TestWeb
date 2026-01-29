
import { RequestForm, RequestStatus, RequestItem } from '../types';
import { LogManager } from './LogManager';
import { NotificationManager } from './NotificationManager';
import { AuthManager } from './AuthManager';
import { RequestItemManager } from './RequestItemManager';
import { RequestFormManager } from './RequestFormManager';
import { supabase } from './SupabaseClient';

export class RequestManager {
  static async getRequests(): Promise<RequestForm[]> {
    const user = AuthManager.getCurrentUser();
    if (!user) return [];

    try {
      let query = supabase
        .from('requests')
        .select('*, items:request_items(*)')
        .is('deleted_at', null);

      if (user.role === 'REQUESTER') {
        query = query.eq('requester_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Fetch requests error:', error);
        return [];
      }

      // Map snake_case from DB to camelCase for UI
      return (data || []).map((r: any) => ({
        ...r,
        requesterId: r.requester_id,
        eventDate: r.event_date,
        budgetSource: r.budget_source,
        totalCost: r.total_cost,
        createdAt: r.created_at,
        deletedAt: r.deleted_at,
        items: (r.items || []).map((i: any) => ({
          ...i,
          requestId: i.request_id
        }))
      })) as RequestForm[];
    } catch (err) {
      console.error('RequestManager.getRequests critical failure:', err);
      return [];
    }
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

  static validateRequest(data: Partial<RequestForm>): void {
    if (!data.name || data.name.trim().length < 3) throw new Error("VALIDATION_ERROR: Name too short.");
    if (!data.eventDate) throw new Error("VALIDATION_ERROR: Date required.");
    if (!data.items || data.items.length === 0) throw new Error("VALIDATION_ERROR: Items required.");
  }

  static async createOrUpdateFromFormAsync(formData: any, items: RequestItem[], category: string, statusType: 'draft' | 'submit', viewingId?: string, tempId?: string): Promise<void> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_ERROR: Session expired.");

    this.validateRequest({ ...formData, items });
    const totalCost = RequestItemManager.calculateTotal(items);

    const dbPayload = {
      name: formData.name,
      requester_id: user.id,
      category,
      total_cost: totalCost,
      status: statusType === 'submit' ? RequestStatus.PENDING : (formData.status || RequestStatus.DRAFT),
      event_date: formData.eventDate,
      budget_source: formData.budgetSource,
      created_at: formData.createdAt || new Date().toISOString()
    };

    let requestId = viewingId;

    if (viewingId) {
      await supabase
        .from('requests')
        .update(dbPayload)
        .eq('id', viewingId);
      
      await supabase.from('request_items').delete().eq('request_id', viewingId);
    } else {
      const { data, error: reqError } = await supabase
        .from('requests')
        .insert([dbPayload])
        .select()
        .single();
        
      if (reqError) throw reqError;
      requestId = data?.id;
    }

    if (!requestId) throw new Error("Database failed to return Request ID.");

    const itemsPayload = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      total: item.total,
      request_id: requestId
    }));
    
    await supabase.from('request_items').insert(itemsPayload);

    if (tempId && tempId.startsWith('TMP-')) {
      await supabase.from('comments').update({ request_id: requestId }).eq('request_id', tempId);
      await supabase.from('attachments').update({ request_id: requestId }).eq('request_id', tempId);
    }

    LogManager.addLog(user.id, statusType === 'submit' ? 'SUBMIT_REQUEST' : 'SAVE_DRAFT', `Protocol ${statusType}: ${requestId}`);
    
    if (statusType === 'submit') {
      NotificationManager.addNotification({
        userId: 'system',
        role: 'REVIEWER',
        title: 'Clearance Required',
        message: `${formData.name} submitted for audit.`
      });
    }
  }

  static async deleteRequest(requestId: string): Promise<void> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    await supabase
      .from('requests')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', requestId);

    LogManager.addLog(user.id, 'DELETE_REQUEST', `Purged ${requestId}`);
  }

  static async processReviewAsync(requestId: string, decision: 'approve' | 'deny' | 'revision'): Promise<void> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const statusMap = { approve: RequestStatus.APPROVED, deny: RequestStatus.DENIED, revision: RequestStatus.REVISION };
    const { data, error } = await supabase
      .from('requests')
      .update({ status: statusMap[decision] })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;

    LogManager.addLog(user.id, 'REVIEW_DECISION', `${decision.toUpperCase()} ${requestId}`);
    
    NotificationManager.addNotification({
      userId: data?.requester_id || 'unknown',
      title: `Protocol State: ${statusMap[decision]}`,
      message: `Request ${requestId} updated.`
    });
  }
}
