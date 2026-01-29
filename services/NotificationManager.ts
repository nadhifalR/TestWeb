
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

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.eq.system,role.eq.${role}`)
        .order('timestamp', { ascending: false });

      if (error) return [];
      
      return (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        role: n.role,
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        read: n.read
      }));
    } catch (e) {
      return [];
    }
  }

  static async addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: notif.userId,
          role: notif.role,
          title: notif.title,
          message: notif.message,
          timestamp: new Date().toISOString(),
          read: false
        }])
        .select()
        .single();

      if (!error && data) {
        const mapped = {
          id: data.id,
          userId: data.user_id,
          role: data.role,
          title: data.title,
          message: data.message,
          timestamp: data.timestamp,
          read: data.read
        };
        window.dispatchEvent(new CustomEvent('nexus-notification', { detail: mapped }));
      }
    } catch (e) {
      console.warn('NotificationManager: notifications table missing.');
    }
  }

  static async clearAll() {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .or(`user_id.eq.${user.id},role.eq.${user.role}`);
    } catch (e) {}
  }

  static async markAllAsRead() {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .or(`user_id.eq.${user.id},role.eq.${user.role}`);
    } catch (e) {}
  }
}
