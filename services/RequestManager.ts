
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
        console.error('RequestManager: Fetch Error', error);
        return [];
      }

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
      return [];
    }
  }

  // Fix: Added tempId parameter to handle migration of attachments/comments from temporary IDs to the new persistent request ID
  static async createOrUpdateFromFormAsync(
    formData: any, 
    items: RequestItem[], 
    category: string, 
    statusType: 'draft' | 'submit', 
    viewingId?: string,
    tempId?: string
  ): Promise<void> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_SESSION_EXPIRED");

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
      const { error: updateError } = await supabase.from('requests').update(dbPayload).eq('id', viewingId);
      if (updateError) {
        console.error('Request Update Failed:', updateError);
        throw new Error(`DB_UPDATE_ERROR: ${updateError.message}`);
      }
      await supabase.from('request_items').delete().eq('request_id', viewingId);
    } else {
      const { data, error: insertError } = await supabase.from('requests').insert([dbPayload]).select().single();
      if (insertError) {
        console.error('Request Insert Failed:', insertError);
        throw new Error(`DB_INSERT_ERROR: ${insertError.message}`);
      }
      requestId = data?.id;
    }

    if (!requestId) throw new Error("INTERNAL_ID_FAILURE");

    // Fix: Migrate orphaned comments and attachments that were created using a temporary ID
    if (!viewingId && tempId && requestId) {
      await supabase.from('comments').update({ request_id: requestId }).eq('request_id', tempId);
      await supabase.from('attachments').update({ request_id: requestId }).eq('request_id', tempId);
    }

    const itemsPayload = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      total: item.total,
      request_id: requestId
    }));
    
    const { error: itemsError } = await supabase.from('request_items').insert(itemsPayload);
    if (itemsError) console.error('Items Insertion Warning:', itemsError);

    LogManager.addLog(user.id, statusType === 'submit' ? 'SUBMIT_REQUEST' : 'SAVE_DRAFT', `Node ${requestId} persistence complete.`);
  }

  static async processReviewAsync(requestId: string, decision: 'approve' | 'deny' | 'revision'): Promise<void> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const statusMap = { approve: RequestStatus.APPROVED, deny: RequestStatus.DENIED, revision: RequestStatus.REVISION };
    const { error } = await supabase
      .from('requests')
      .update({ status: statusMap[decision] })
      .eq('id', requestId);

    if (error) throw error;
    LogManager.addLog(user.id, 'REVIEW_DECISION', `${decision.toUpperCase()} applied to ${requestId}`);
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
