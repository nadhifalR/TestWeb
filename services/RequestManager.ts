
import { RequestForm, RequestStatus, RequestItem } from '../types';
import { LogManager } from './LogManager';
import { NotificationManager } from './NotificationManager';
import { AuthManager } from './AuthManager';
import { RequestItemManager } from './RequestItemManager';
import { RequestFormManager } from './RequestFormManager';
import { supabase } from './SupabaseClient';

export class RequestManager {
  // Renamed from getRequestsAsync to getRequests for system-wide compatibility
  static async getRequests(): Promise<RequestForm[]> {
    const user = AuthManager.getCurrentUser();
    if (!user) return [];

    let query = supabase
      .from('requests')
      .select('*, items:request_items(*)')
      .is('deletedAt', null);

    // Row level security would handle this in production, but we add a client-side filter for safety
    if (user.role === 'REQUESTER') {
      query = query.eq('requesterId', user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Fetch requests error:', error);
      return [];
    }
    return data as RequestForm[];
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

    const requestPayload = {
      ...formData,
      requesterId: user.id,
      category,
      totalCost,
      status: statusType === 'draft' 
        ? (formData.status === RequestStatus.REVISION ? RequestStatus.REVISION : RequestStatus.DRAFT)
        : RequestStatus.PENDING,
      createdAt: formData.createdAt || new Date().toISOString()
    };

    // Remove items from payload as they go to a different table
    delete requestPayload.items;

    let requestId = viewingId;

    if (viewingId) {
      // UPDATE
      const { error: reqError } = await supabase
        .from('requests')
        .update(requestPayload)
        .eq('id', viewingId);
      if (reqError) throw reqError;
      
      // Delete old items and insert new ones (simulated transaction)
      await supabase.from('request_items').delete().eq('requestId', viewingId);
    } else {
      // CREATE
      const { data, error: reqError } = await supabase
        .from('requests')
        .insert([requestPayload])
        .select()
        .single();
      if (reqError) throw reqError;
      requestId = data.id;
    }

    // Insert line items
    const itemsPayload = items.map(item => ({
      ...item,
      requestId,
      id: undefined // Let DB generate UUID or use a standard serial
    }));
    const { error: itemsError } = await supabase.from('request_items').insert(itemsPayload);
    if (itemsError) throw itemsError;

    // Handle temp attachments/comments
    if (tempId && tempId.startsWith('TMP-')) {
      await supabase.from('comments').update({ requestId }).eq('requestId', tempId);
      await supabase.from('attachments').update({ requestId }).eq('requestId', tempId);
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

    const { error } = await supabase
      .from('requests')
      .update({ deletedAt: new Date().toISOString() })
      .eq('id', requestId);

    if (error) throw error;
    LogManager.addLog(user.id, 'DELETE_REQUEST', `Purged ${requestId}`);
  }

  static async processReviewAsync(requestId: string, decision: 'approve' | 'deny' | 'revision'): Promise<void> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const statusMap = { approve: RequestStatus.APPROVED, deny: RequestStatus.DENIED, revision: RequestStatus.REVISION };
    const { data: request, error: updateError } = await supabase
      .from('requests')
      .update({ status: statusMap[decision] })
      .eq('id', requestId)
      .select()
      .single();

    if (updateError) throw updateError;

    LogManager.addLog(user.id, 'REVIEW_DECISION', `${decision.toUpperCase()} ${requestId}`);
    NotificationManager.addNotification({
      userId: request.requesterId,
      title: `Protocol State: ${statusMap[decision]}`,
      message: `Request ${requestId} updated.`
    });
  }
}
