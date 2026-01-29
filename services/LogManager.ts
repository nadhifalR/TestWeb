
import { supabase } from './SupabaseClient';
import { SystemLog } from '../types';

export class LogManager {
  static async getLogs(): Promise<SystemLog[]> {
    const { data, error } = await supabase
      .from('system_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) return [];
    return data as SystemLog[];
  }

  static async addLog(userId: string, action: string, details: string) {
    await supabase
      .from('system_logs')
      .insert([{
        userId,
        action,
        details,
        timestamp: new Date().toISOString()
      }]);
  }
}
