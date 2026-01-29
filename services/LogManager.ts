
import { TemporaryDatabase } from './TemporaryDatabase';
import { SystemLog } from '../types';

export class LogManager {
  static getLogs(): SystemLog[] {
    const db = TemporaryDatabase.getDB();
    return db.logs || [];
  }

  static addLog(userId: string, action: string, details: string) {
    const db = TemporaryDatabase.getDB();
    const newLog: SystemLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      action,
      details,
      timestamp: new Date().toISOString()
    };
    db.logs = [newLog, ...(db.logs || [])];
    TemporaryDatabase.saveDB(db);
  }
}
