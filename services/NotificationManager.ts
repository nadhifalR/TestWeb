
import { TemporaryDatabase } from './TemporaryDatabase';
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
  static getNotifications(role: string): Notification[] {
    const db = TemporaryDatabase.getDB();
    const user = AuthManager.getCurrentUser();
    
    if (!user) return [];

    return (db.notifications || []).filter((n: Notification) => 
      n.userId === user.id || 
      n.userId === 'system' || 
      (n.role && n.role === role)
    );
  }

  static async requestPermission() {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  static addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const db = TemporaryDatabase.getDB();
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false
    };
    db.notifications = [newNotif, ...(db.notifications || [])];
    TemporaryDatabase.saveDB(db);

    // OS Level Push
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotif.title, { body: newNotif.message });
    }

    // Global event for Toast UI
    window.dispatchEvent(new CustomEvent('nexus-notification', { detail: newNotif }));
  }

  static clearAll() {
    const db = TemporaryDatabase.getDB();
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    db.notifications = (db.notifications || []).filter((n: Notification) => 
      n.userId !== user.id && n.role !== user.role
    );
    TemporaryDatabase.saveDB(db);
  }

  static markAllAsRead() {
    const db = TemporaryDatabase.getDB();
    const user = AuthManager.getCurrentUser();
    if (!user) return;

    db.notifications = (db.notifications || []).map((n: Notification) => {
      if (n.userId === user.id || n.role === user.role) {
        return { ...n, read: true };
      }
      return n;
    });
    TemporaryDatabase.saveDB(db);
  }
}
