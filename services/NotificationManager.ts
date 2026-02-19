
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
  requestId?: string;
  commentId?: string;
}

export class NotificationManager {
  static async getNotifications(role: string): Promise<Notification[]> {
    const user = AuthManager.getCurrentUser();
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null,role.eq.${role}`)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('NotificationManager: Fetch failed', error);
        return [];
      }

      return (data || []).map((n: any) => ({
        id: n.id.toString(),
        userId: n.user_id,
        role: n.role,
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        read: n.read,
        requestId: n.request_id?.toString(),
        commentId: n.comment_id?.toString()
      }));
    } catch (e) {
      return [];
    }
  }

  static async addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    try {
      const dbUserId = notif.userId === 'system' ? null : notif.userId;

      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: dbUserId, // Correctly references profiles.id (TEXT)
          role: notif.role,
          title: notif.title,
          message: notif.message,
          timestamp: new Date().toISOString(),
          read: false,
          request_id: notif.requestId ? parseInt(notif.requestId, 10) : null,
          comment_id: notif.commentId ? parseInt(notif.commentId, 10) : null
        }])
        .select()
        .single();

      if (!error && data) {
        const mapped = {
          id: data.id.toString(),
          userId: data.user_id,
          role: data.role,
          title: data.title,
          message: data.message,
          timestamp: data.timestamp,
          read: data.read,
          requestId: data.request_id?.toString(),
          commentId: data.comment_id?.toString()
        };
        window.dispatchEvent(new CustomEvent('nexus-notification', { detail: mapped }));
      }
    } catch (e) {
      console.warn('NotificationManager: Persistence failure.');
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
    } catch (e) { }
  }

  static async markAllAsRead() {
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .or(`user_id.eq.${user.id},role.eq.${user.role}`);
    } catch (e) { }
  }
}
