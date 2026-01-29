
import { User, RequestForm, SystemLog, RequestStatus, UserRole } from '../types';

export class TemporaryDatabase {
  private static STORAGE_KEY = 'nexus_global_db_v8_pro';

  static getDB() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (!data) {
      const now = new Date();
      
      const generateDate = (daysAgo: number) => new Date(now.getTime() - 86400000 * daysAgo).toISOString();
      
      const getRandomDateInRange = (start: Date, end: Date) => {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
      };

      const requests: RequestForm[] = [];
      const categories = ['Brand', 'Production', 'Activation', 'Logistics', 'Entertainment'];
      const statuses = [RequestStatus.APPROVED, RequestStatus.PENDING, RequestStatus.DRAFT, RequestStatus.DENIED, RequestStatus.REVISION];
      const budgetSources = ['Strategic Fund', 'Operational Reserve', 'Asset Management', 'Corporate Brand Fund', 'Emergency Capital'];

      // Batch 1: 125 requests in the last 30 days (Relative to "Now")
      for (let i = 1; i <= 125; i++) {
        const cat = categories[i % categories.length];
        const status = i <= 8 ? RequestStatus.PENDING : statuses[i % statuses.length];
        const price = Math.floor(Math.random() * 8000000) + 250000;
        const qty = Math.floor(Math.random() * 35) + 1;
        
        requests.push({
          id: `REQ-${10000 + i}`,
          requesterId: (Math.floor(Math.random() * 3) + 2).toString(),
          name: `${cat} Strategic Phase ${i}`,
          category: cat,
          eventDate: generateDate(Math.floor(Math.random() * 30)),
          budgetSource: budgetSources[i % budgetSources.length],
          items: [{ 
            id: `item-${i}`, 
            name: `Standard ${cat} Operational Unit`, 
            quantity: qty, 
            unit: 'Units', 
            price: price, 
            total: price * qty 
          }],
          totalCost: price * qty,
          cashAdvance: i % 8 === 0 ? price * 0.15 : 0,
          status: status,
          createdAt: generateDate(Math.floor(Math.random() * 30))
        });
      }

      // Batch 2: 125 additional requests specifically for Aug 2025 - Nov 2025
      const targetStart = new Date(2025, 7, 1); // August 1, 2025
      const targetEnd = new Date(2025, 10, 30); // November 30, 2025

      for (let i = 126; i <= 250; i++) {
        const cat = categories[i % categories.length];
        const status = statuses[i % statuses.length];
        const price = Math.floor(Math.random() * 12000000) + 1000000; // Higher prices for Q3/Q4 surge
        const qty = Math.floor(Math.random() * 50) + 5;
        const date = getRandomDateInRange(targetStart, targetEnd);
        
        requests.push({
          id: `REQ-${10000 + i}`,
          requesterId: (Math.floor(Math.random() * 3) + 2).toString(),
          name: `Q3-Q4 2025: ${cat} Scaling - Node ${i}`,
          category: cat,
          eventDate: date,
          budgetSource: budgetSources[i % budgetSources.length],
          items: [{ 
            id: `item-${i}`, 
            name: `Enterprise ${cat} Resource Bundle`, 
            quantity: qty, 
            unit: 'Batch', 
            price: price, 
            total: price * qty 
          }],
          totalCost: price * qty,
          cashAdvance: i % 5 === 0 ? price * 0.20 : 0,
          status: status,
          createdAt: date
        });
      }

      const initial = {
        requests,
        logs: [
          { id: 'l1', userId: '1', action: 'CORE_BOOT', details: 'System kernel initialized with production seed v8.2', timestamp: generateDate(31) },
          { id: 'l2', userId: '1', action: 'SECURITY_SYNC', details: 'Global permission matrix synchronized with LDAP secondary node', timestamp: generateDate(30) },
          { id: 'l3', userId: '2', action: 'PROVISION_USER', details: 'Automated cleanup of stale guest tokens completed', timestamp: generateDate(15) },
          { id: 'l4', userId: 'system', action: 'ARCHIVE_PERSISTED', details: 'Snapshot SNP-1710000000 committed with checksum SHA256-NX88', timestamp: generateDate(5) }
        ],
        notifications: [
          { id: 'n1', userId: '2', role: UserRole.REVIEWER, title: 'Context Awaiting Clearance', message: 'REQ-10001 requires immediate financial review.', timestamp: now.toISOString(), read: false },
          { id: 'n2', userId: 'system', role: UserRole.ADMIN, title: 'System Latency Alert', message: 'Minor degradation detected in regional API node AP-SOUTHEAST-1.', timestamp: generateDate(1), read: true }
        ],
        settings: {
          currency: 'IDR',
          fiscalYearStart: '2024-01-01',
          theme: 'light',
          language: 'en',
          maxFileUploadSize: 10
        },
        comments: [
          {
            id: 'c1',
            requestId: 'REQ-10001',
            authorId: '2',
            authorName: 'jane_reviewer',
            text: 'Initial budget exceeds operational buffer by 12%. Please provide justification or re-allocate from Strategic Fund.',
            timestamp: generateDate(2),
          },
          {
            id: 'c2',
            requestId: 'REQ-10001',
            authorId: '3',
            authorName: 'bob_requester',
            text: 'Understood. The excess is due to specialized equipment requirements. Will upload technical specs for reference.',
            timestamp: generateDate(1),
            parentId: 'c1'
          },
          {
            id: 'c3',
            requestId: 'REQ-10002',
            authorId: '4',
            authorName: 'alice_supervisor',
            text: 'Verified logistics route for Phase 2. Proceeding with caution on fuel estimates.',
            timestamp: generateDate(1),
          }
        ],
        attachments: [],
        snapshots: [
          {
            id: 'SNP-1715000000',
            checksum: 'BFDA9922100AABBC4',
            timestamp: generateDate(10),
            recordCount: 84,
            totalValuation: 450000000
          },
          {
            id: 'SNP-1712000000',
            checksum: 'EFA883311CCBBDDE5',
            timestamp: generateDate(25),
            recordCount: 42,
            totalValuation: 215000000
          }
        ]
      };
      this.saveDB(initial);
      return initial;
    }
    return JSON.parse(data);
  }

  static saveDB(data: any) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}
