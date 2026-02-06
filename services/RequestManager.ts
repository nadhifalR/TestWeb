import { RequestForm, RequestStatus, RequestItem } from '../types';
import { LogManager } from './LogManager';
import { NotificationManager } from './NotificationManager';
import { AuthManager } from './AuthManager';
import { RequestItemManager } from './RequestItemManager';
import { RequestFormManager } from './RequestFormManager';
import { supabase } from './SupabaseClient';
import { CommentManager } from './CommentManager';
import { AttachmentManager } from './AttachmentManager';

export class RequestManager {
  static async getRequests(): Promise<RequestForm[]> {
    const user = AuthManager.getCurrentUser();
    if (!user) return [];

    try {
      let query = supabase
        .from('requests')
        .select('*, items:request_items(*)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

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
        id: r.id.toString(),
        requesterId: r.requester_id,
        eventDate: r.event_date,
        budgetSource: r.budget_source,
        cashAdvance: Number(r.cash_advance || 0),
        totalCost: Number(r.total_cost || 0),
        createdAt: r.created_at,
        deletedAt: r.deleted_at,
        items: (r.items || []).map((i: any) => ({
          ...i,
          id: i.id.toString(),
          requestId: i.request_id?.toString()
        }))
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
      let query = supabase
        .from('requests')
        .select('*, items:request_items(*)', { count: 'exact' })
        .is('deleted_at', null);

      if (user.role === 'REQUESTER') {
        query = query.eq('requester_id', user.id);
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;
      if (error) {
        console.error('RequestManager: Fetch Error', error);
        return { data: [], total: 0 };
      }

      const formattedData = (data || []).map((r: any) => ({
        ...r,
        id: r.id.toString(),
        requesterId: r.requester_id,
        eventDate: r.event_date,
        budgetSource: r.budget_source,
        cashAdvance: Number(r.cash_advance || 0),
        totalCost: Number(r.total_cost || 0),
        createdAt: r.created_at,
        deletedAt: r.deleted_at,
        items: (r.items || []).map((i: any) => ({
          ...i,
          id: i.id.toString(),
          requestId: i.request_id?.toString()
        }))
      })) as RequestForm[];

      return { data: formattedData, total: count || 0 };
    } catch (err) {
      console.error('RequestManager critical failure:', err);
      return { data: [], total: 0 };
    }
  }

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

    const dbPayload: any = {
      name: formData.name,
      requester_id: user.id,
      category,
      total_cost: totalCost,
      status: statusType === 'submit' ? RequestStatus.PENDING : (formData.status || RequestStatus.DRAFT),
      event_date: formData.eventDate,
      budget_source: formData.budgetSource,
      cash_advance: formData.cashAdvance || 0,
      created_at: formData.createdAt || new Date().toISOString()
    };

    let persistentId: string;

    if (viewingId) {
      const { error: updateError } = await supabase
        .from('requests')
        .update(dbPayload)
        .eq('id', parseInt(viewingId, 10));

      if (updateError) throw new Error(`DB_UPDATE_ERROR: ${updateError.message}`);
      persistentId = viewingId;

      await supabase.from('request_items').delete().eq('request_id', parseInt(viewingId, 10));
    } else {
      const { data, error: insertError } = await supabase
        .from('requests')
        .insert([dbPayload])
        .select()
        .single();

      if (insertError) {
        console.error('Request Insert Failed:', insertError);
        throw new Error(`DB_INSERT_ERROR: ${insertError.message}`);
      }
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

    const itemsPayload = items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      request_id: numericId
    }));

    if (itemsPayload.length > 0) {
      const { error: itemsError } = await supabase.from('request_items').insert(itemsPayload);
      if (itemsError) throw new Error(`ITEMS_SYNC_ERROR: ${itemsError.message}`);
    }

    LogManager.addLog(user.id, statusType === 'submit' ? 'SUBMIT_REQUEST' : 'SAVE_DRAFT', `Relational node ${persistentId} finalized.`);
  }

  static async processReviewAsync(requestId: string, decision: 'approve' | 'deny' | 'revision'): Promise<void> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const statusMap = {
      approve: RequestStatus.APPROVED,
      deny: RequestStatus.DENIED,
      revision: RequestStatus.REVISION
    };

    const { error } = await supabase
      .from('requests')
      .update({ status: statusMap[decision] })
      .eq('id', parseInt(requestId, 10));

    if (error) throw error;
    LogManager.addLog(user.id, 'REVIEW_DECISION', `${decision.toUpperCase()} applied to Node ${requestId}`);
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