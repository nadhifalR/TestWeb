
import { RequestForm, User } from '../types';
import { RequestManager } from './RequestManager';
import { AccountManager } from './AccountManager';
import { TemporaryDatabase } from './TemporaryDatabase';
import { LogManager } from './LogManager';
import { MockApiService } from './MockApiService';

export interface ReportFilter {
  dateRange: { start: string; end: string } | null;
  department: string;
  category: string;
}

export class ReportManager {
  static getFilteredData(filters: ReportFilter): RequestForm[] {
    let requests = RequestManager.getRequests();
    // In production we would fetch users async, but here we use the cached matrix for filtering
    const users = AccountManager.getPermissionMatrix(); // Use matrix as a temporary proxy or fetch users
    
    // For now we assume the filtering logic remains synchronous as it operates on the already-fetched request registry
    if (filters.department && filters.department !== 'All' && filters.department !== 'All Departments') {
      // In a real app we'd map requesterId to department via a lookup table
      // Simplified for mock:
      requests = requests.filter(r => r.budgetSource.includes(filters.department));
    }

    if (filters.category && filters.category !== 'All' && filters.category !== 'All Categories') {
      requests = requests.filter(r => r.category === filters.category);
    }

    if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
      const startDate = new Date(filters.dateRange.start);
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      requests = requests.filter(r => {
        const d = new Date(r.createdAt);
        return d >= startDate && d <= endDate;
      });
    }

    return requests;
  }

  static calculateGrandTotal(data: RequestForm[]): number {
    return data.reduce((sum, item) => sum + item.totalCost, 0);
  }

  static getSnapshots(): any[] {
    const db = TemporaryDatabase.getDB();
    return (db.snapshots || []).sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
  }

  static async generateCSV(data: RequestForm[]): Promise<void> {
    const headers = ['ID', 'Date', 'Name', 'Category', 'Total Cost', 'Status'];
    const rows = data.map(r => [
      r.id,
      new Date(r.createdAt).toLocaleDateString(),
      `"${r.name.replace(/"/g, '""')}"`,
      r.category,
      r.totalCost,
      r.status
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `nexus_audit_report_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static async persistSnapshot(data: RequestForm[]): Promise<string> {
    return MockApiService.request(() => {
      const db = TemporaryDatabase.getDB();
      const checksum = Math.random().toString(36).substr(2, 16).toUpperCase();
      const snapshot = {
        id: `SNP-${Date.now()}`,
        checksum,
        timestamp: new Date().toISOString(),
        recordCount: data.length,
        totalValuation: this.calculateGrandTotal(data)
      };
      
      db.snapshots = [...(db.snapshots || []), snapshot];
      TemporaryDatabase.saveDB(db);
      LogManager.addLog('system', 'ARCHIVE_PERSISTED', `Snapshot ${snapshot.id} committed with checksum ${checksum}`);
      return checksum;
    });
  }
}
