
import { supabase } from './SupabaseClient';
import { SystemLog } from '../types';

export class LogManager {
  static async getLogs(): Promise<SystemLog[]> {
    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) return [];
      return (data || []).map((l: any) => ({
        id: l.id,
        userId: l.user_id,
        action: l.action,
        details: l.details,
        timestamp: l.timestamp
      })) as SystemLog[];
    } catch (e) {
      return [];
    }
  }

  static async addLog(userId: string, action: string, details: string) {
    try {
      await supabase
        .from('system_logs')
        .insert([{
          user_id: userId,
          action,
          details,
          timestamp: new Date().toISOString()
        }]);
    } catch (e) {}
  }
}
