
import { RequestForm } from '../types';
import { RequestManager } from './RequestManager';
import { AccountManager } from './AccountManager';
import { LogManager } from './LogManager';
import { MockApiService } from './MockApiService';
import { supabase } from './SupabaseClient';

export interface ReportFilter {
  dateRange: { start: string; end: string } | null;
  department: string;
  category: string;
}

export class ReportManager {
  static async getFilteredData(filters: ReportFilter): Promise<RequestForm[]> {
    let requests = await RequestManager.getRequests();
    await AccountManager.getPermissionMatrix();
    
    if (filters.department && filters.department !== 'All' && filters.department !== 'All Departments') {
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

  static async getSnapshots(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('snapshots')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        // Log but don't crash UI - likely table doesn't exist yet
        console.warn('Snapshots table unavailable or unreachable:', error.message);
        return [];
      }
      return (data || []).map((s: any) => ({
        id: s.id,
        checksum: s.checksum,
        timestamp: s.timestamp,
        recordCount: s.record_count,
        totalValuation: s.total_valuation
      }));
    } catch (e) {
      return [];
    }
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
    return MockApiService.request(async () => {
      const checksum = Math.random().toString(36).substr(2, 16).toUpperCase();
      const snapshot = {
        checksum,
        timestamp: new Date().toISOString(),
        record_count: data.length,
        total_valuation: this.calculateGrandTotal(data)
      };
      
      const { data: inserted, error } = await supabase
        .from('snapshots')
        .insert([snapshot])
        .select()
        .single();

      if (error) throw new Error(`SNAPSHOT_PERSIST_FAILED: ${error.message}`);

      LogManager.addLog('system', 'ARCHIVE_PERSISTED', `Snapshot SNP-${inserted.id} committed with checksum ${checksum}`);
      return checksum;
    });
  }
}
