
import { RequestForm, RequestStatus } from '../types';
import { RequestManager } from './RequestManager';
import { MockApiService } from './MockApiService';

export interface DashboardStats {
  pendingCount: number;
  approvedCount: number;
  totalSpend: number;
  totalRequests: number;
}

export class AnalyticsManager {
  static async getDashboardStats(): Promise<DashboardStats> {
    return MockApiService.request(() => {
      const requests = RequestManager.getRequests();
      return {
        pendingCount: requests.filter(r => r.status === RequestStatus.PENDING).length,
        approvedCount: requests.filter(r => r.status === RequestStatus.APPROVED).length,
        totalSpend: requests.reduce((acc, curr) => acc + curr.totalCost, 0),
        totalRequests: requests.length
      };
    });
  }

  static async getCategoryDistribution(filteredRequests?: RequestForm[]) {
    return MockApiService.request(() => {
      const requests = filteredRequests || RequestManager.getRequests();
      const categories: Record<string, number> = {};
      
      requests.forEach(req => {
        categories[req.category] = (categories[req.category] || 0) + req.totalCost;
      });

      return Object.keys(categories).map(cat => ({
        id: cat,
        label: cat,
        value: categories[cat],
      }));
    });
  }

  static async getVelocityData(requests: RequestForm[]) {
    return MockApiService.request(() => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const velocityMap: Record<string, { val: number, vol: number }> = days.reduce((acc, day) => {
        acc[day] = { val: 0, vol: 0 };
        return acc;
      }, {} as any);

      requests.forEach(req => {
        const d = new Date(req.createdAt);
        const day = days[d.getDay()];
        velocityMap[day].val += 1;
        velocityMap[day].vol += req.totalCost;
      });

      return days.map(day => ({
        label: day,
        val: velocityMap[day].val,
        vol: `IDR ${(velocityMap[day].vol / 1000000).toFixed(1)}M`
      }));
    });
  }

  static async getWeeklyVolume(requests: RequestForm[]) {
    return MockApiService.request(() => {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data = days.map(day => ({
        x: day,
        y: requests.filter(r => new Date(r.createdAt).toLocaleDateString('en-US', { weekday: 'short' }) === day).length
      }));
      return [{ id: 'Volume', data }];
    });
  }

  static async getMonthlySpendTrend(requests?: RequestForm[]) {
    return MockApiService.request(() => {
      const data = requests || RequestManager.getRequests();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const now = new Date();
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        last6Months.push({
          month: months[d.getMonth()],
          index: d.getMonth(),
          year: d.getFullYear(),
          spend: 0,
          budget: 5000000000
        });
      }

      data.forEach(req => {
        const d = new Date(req.createdAt);
        const mIdx = d.getMonth();
        const y = d.getFullYear();
        
        const target = last6Months.find(m => m.index === mIdx && m.year === y);
        if (target && req.status !== RequestStatus.DENIED) {
          target.spend += req.totalCost;
        }
      });

      return last6Months;
    });
  }
}
