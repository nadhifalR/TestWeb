
import { RequestForm, RequestStatus, UserRole, RequestItem } from '../types';
import { TemporaryDatabase } from './TemporaryDatabase';
import { LogManager } from './LogManager';
import { NotificationManager } from './NotificationManager';
import { AuthManager } from './AuthManager';
import { AccountManager } from './AccountManager';
import { RequestItemManager } from './RequestItemManager';
import { RequestFormManager } from './RequestFormManager';
import { MockApiService } from './MockApiService';

export class RequestManager {
  static getRequests(): RequestForm[] {
    const db = TemporaryDatabase.getDB();
    const user = AuthManager.getCurrentUser();
    if (!user) return [];
    
    return (db.requests || [])
      .filter((r: any) => !r.deletedAt)
      .filter((r: RequestForm) => AccountManager.hasPermission(user, 'VIEW', r.requesterId));
  }

  static async getRequestsAsync(): Promise<RequestForm[]> {
    return MockApiService.request(() => this.getRequests());
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
    return MockApiService.request(() => {
      const user = AuthManager.getCurrentUser();
      if (!user) throw new Error("AUTH_ERROR: Session expired.");

      this.validateRequest({ ...formData, items });

      const totalCost = RequestItemManager.calculateTotal(items);
      const id = viewingId || `REQ-${Math.floor(Math.random() * 90000) + 10000}`;
      
      const requestData: RequestForm = {
        ...formData,
        id,
        requesterId: user.id,
        category,
        items,
        totalCost,
        status: statusType === 'draft' 
          ? (formData.status === RequestStatus.REVISION ? RequestStatus.REVISION : RequestStatus.DRAFT)
          : RequestStatus.PENDING,
        createdAt: formData.createdAt || new Date().toISOString()
      };

      if (statusType === 'draft') {
        this.saveDraft(requestData);
      } else {
        this.submitRequest(requestData, viewingId ? undefined : tempId);
      }
    });
  }

  private static saveDraft(request: RequestForm): void {
    const db = TemporaryDatabase.getDB();
    if (!db.requests) db.requests = [];
    
    const idx = db.requests.findIndex((r: RequestForm) => r.id === request.id);
    if (idx > -1) db.requests[idx] = request;
    else db.requests.push(request);
    
    TemporaryDatabase.saveDB(db);
    LogManager.addLog(request.requesterId, 'SAVE_DRAFT', `Draft persisted: ${request.id}`);
  }

  private static submitRequest(request: RequestForm, tempId?: string): void {
    const db = TemporaryDatabase.getDB();
    if (!db.requests) db.requests = [];
    
    const idx = db.requests.findIndex((r: RequestForm) => r.id === request.id);
    if (idx > -1) db.requests[idx] = request;
    else db.requests.push(request);

    if (tempId && tempId.startsWith('TMP-')) {
      db.comments = (db.comments || []).map((c: any) => c.requestId === tempId ? { ...c, requestId: request.id } : c);
      db.attachments = (db.attachments || []).map((a: any) => a.requestId === tempId ? { ...a, requestId: request.id } : a);
    }
    
    TemporaryDatabase.saveDB(db);

    LogManager.addLog(request.requesterId, 'SUBMIT_REQUEST', `Request submitted: ${request.id}`);
    NotificationManager.addNotification({
      userId: 'system',
      role: UserRole.REVIEWER,
      title: 'Clearance Required',
      message: `${request.name} submitted for audit.`
    });
  }

  static async deleteRequest(requestId: string): Promise<void> {
    return MockApiService.request(() => {
      const user = AuthManager.getCurrentUser();
      const db = TemporaryDatabase.getDB();
      const request = db.requests?.find((r: any) => r.id === requestId);
      
      if (!user || !request || !AccountManager.hasPermission(user, 'DELETE', request.requesterId)) {
        throw new Error("ACCESS_DENIED: Lacks authority to purge record.");
      }

      const now = new Date().toISOString();
      const idx = db.requests.findIndex((r: any) => r.id === requestId);
      if (idx !== -1) {
        db.requests[idx].deletedAt = now;
        db.comments = (db.comments || []).map((c: any) => c.requestId === requestId ? { ...c, deletedAt: now } : c);
        db.attachments = (db.attachments || []).map((a: any) => a.requestId === requestId ? { ...a, deletedAt: now } : a);
        TemporaryDatabase.saveDB(db);
        LogManager.addLog(user.id, 'DELETE_REQUEST', `Purged ${requestId}`);
      }
    });
  }

  static async processReviewAsync(requestId: string, decision: 'approve' | 'deny' | 'revision'): Promise<void> {
    return MockApiService.request(() => {
      const user = AuthManager.getCurrentUser();
      if (!user || !AccountManager.hasPermission(user, 'APPROVE')) {
        throw new Error("ACCESS_DENIED: Lacks APPROVE authority.");
      }

      const db = TemporaryDatabase.getDB();
      const idx = db.requests.findIndex((r: RequestForm) => r.id === requestId);
      
      if (idx !== -1) {
        const statusMap = { approve: RequestStatus.APPROVED, deny: RequestStatus.DENIED, revision: RequestStatus.REVISION };
        db.requests[idx].status = statusMap[decision];
        TemporaryDatabase.saveDB(db);
        
        LogManager.addLog(user.id, 'REVIEW_DECISION', `${decision.toUpperCase()} ${requestId}`);
        NotificationManager.addNotification({
          userId: db.requests[idx].requesterId,
          title: `Protocol State: ${statusMap[decision]}`,
          message: `Request ${requestId} updated.`
        });
      }
    });
  }
}
