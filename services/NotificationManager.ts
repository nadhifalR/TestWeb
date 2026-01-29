
import { supabase } from './SupabaseClient';
import { AuthManager } from './AuthManager';

export interface Notification {
  id: string;
  userId: string;
  role?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export class NotificationManager {
  static async getNotifications(role: string): Promise<Notification[]> {
    const user = AuthManager.getCurrentUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`userId.eq.${user.id},userId.eq.system,role.eq.${role}`)
      .order('timestamp', { ascending: false });

    if (error) return [];
    return data as Notification[];
  }

  static async addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        ...notif,
        timestamp: new Date().toISOString(),
        read: false
      }])
      .select()
      .single();

    if (!error && data) {
      window.dispatchEvent(new CustomEvent('nexus-notification', { detail: data }));
    }
  }

  static async clearAll() {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .delete()
      .or(`userId.eq.${user.id},role.eq.${user.role}`);
  }

  static async markAllAsRead() {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    await supabase
      .from('notifications')
      .update({ read: true })
      .or(`userId.eq.${user.id},role.eq.${user.role}`);
  }
}
