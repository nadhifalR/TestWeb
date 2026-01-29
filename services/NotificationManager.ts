
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
        .or(`userId.eq.${user.id},userId.eq.system,role.eq.${role}`)
        .order('timestamp', { ascending: false });

      if (error) return [];
      return (data || []) as Notification[];
    } catch (e) {
      return [];
    }
  }

  static async addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          ...notif,
          timestamp: new Date().toISOString(),
          read: false
        }])
        .select()
        .single();

      // Ensure data is truthy before dispatching event (mock returns empty array or null)
      if (!error && data && !Array.isArray(data)) {
        window.dispatchEvent(new CustomEvent('nexus-notification', { detail: data }));
      }
    } catch (e) {
      console.warn('Notification delivery failed:', e);
    }
  }

  static async clearAll() {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .delete()
        .or(`userId.eq.${user.id},role.eq.${user.role}`);
    } catch (e) {}
  }

  static async markAllAsRead() {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .or(`userId.eq.${user.id},role.eq.${user.role}`);
    } catch (e) {}
  }
}
