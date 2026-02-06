
import { RequestManager } from './RequestManager';
import { AccountManager } from './AccountManager';
import { RequestStatus } from '../types';

export class SearchManager {
  // Fixed: Correctly awaiting all async data fetches
  static async globalSearch(query: string) {
    const q = query.toLowerCase();
    if (!q) return { requests: [], accounts: [] };

    // COMMAND HANDLING (Actionable Search)
    if (q.startsWith('/')) {
      const command = q.slice(1);
      if (command === 'pending') {
        return {
          requests: (await RequestManager.getRequests()).filter(r => r.status === RequestStatus.PENDING),
          accounts: []
        };
      }
      if (command === 'audit' || command === 'approved') {
        return {
          requests: (await RequestManager.getRequests()).filter(r => r.status === RequestStatus.APPROVED),
          accounts: []
        };
      }
      if (command === 'admin') {
        return {
          requests: [],
          accounts: (await AccountManager.getUsers()).filter(u => u.role === 'ADMIN')
        };
      }
    }

    const requests = (await RequestManager.getRequests()).filter(r => 
      !r.deletedAt && (
        r.id.toLowerCase().includes(q) || 
        r.name.toLowerCase().includes(q) || 
        r.category.toLowerCase().includes(q)
      )
    );

    const accounts = (await AccountManager.getUsers()).filter(u => 
      !u.deletedAt && (
        u.username.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q) || 
        u.department.toLowerCase().includes(q)
      )
    );

    return { requests, accounts };
  }
}
