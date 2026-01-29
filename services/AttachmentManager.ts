
import { TemporaryDatabase } from './TemporaryDatabase';
import { SettingsManager } from './SettingsManager';
import { AuthManager } from './AuthManager';
import { AccountManager } from './AccountManager';

export interface Attachment {
  id: string;
  requestId: string;
  name: string;
  size: number;
  type: string;
  url: string; // Now contains Base64 data for persistence
  uploadedAt: string;
  deletedAt?: string;
}

export class AttachmentManager {
  static getAttachments(requestId: string): Attachment[] {
    const db = TemporaryDatabase.getDB();
    return (db.attachments || []).filter((a: Attachment) => a.requestId === requestId && !a.deletedAt);
  }

  static async uploadFile(requestId: string, file: File): Promise<Attachment> {
    const settings = SettingsManager.getSettings();
    if (file.size > (settings.maxFileUploadSize || 10) * 1024 * 1024) {
      throw new Error("FILE_TOO_LARGE");
    }

    // Convert to Base64 for persistent "Mock" storage
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const db = TemporaryDatabase.getDB();
    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      requestId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: base64,
      uploadedAt: new Date().toISOString()
    };

    db.attachments = [...(db.attachments || []), newAttachment];
    TemporaryDatabase.saveDB(db);
    return newAttachment;
  }

  static removeAttachment(id: string): void {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const db = TemporaryDatabase.getDB();
    const attachment = db.attachments?.find((a: any) => a.id === id);
    if (!attachment) return;

    const request = db.requests?.find((r: any) => r.id === attachment.requestId);
    if (!AccountManager.hasPermission(user, 'DELETE', request?.requesterId)) {
      throw new Error("ACCESS_DENIED");
    }

    const idx = db.attachments.findIndex((a: any) => a.id === id);
    if (idx !== -1) {
      db.attachments[idx].deletedAt = new Date().toISOString();
      TemporaryDatabase.saveDB(db);
    }
  }
}
