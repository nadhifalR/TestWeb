
import { TemporaryDatabase } from './TemporaryDatabase';
import { AuthManager } from './AuthManager';
import { AccountManager } from './AccountManager';

export interface Comment {
  id: string;
  requestId: string;
  authorId: string;
  authorName: string;
  text: string;
  timestamp: string;
  parentId?: string;
  attachmentId?: string;
  deletedAt?: string;
  replies?: Comment[] | any;
}

export class CommentManager {
  static getComments(requestId: string): Comment[] {
    const db = TemporaryDatabase.getDB();
    const requestComments = (db.comments || [])
      .filter((c: Comment) => c.requestId === requestId && !c.deletedAt)
      .sort((a: Comment, b: Comment) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const commentMap: Record<string, Comment> = {};
    requestComments.forEach((c: Comment) => { commentMap[c.id] = { ...c, replies: [] }; });

    const thread: Comment[] = [];
    requestComments.forEach((c: Comment) => {
      if (c.parentId && commentMap[c.parentId]) commentMap[c.parentId].replies?.push(commentMap[c.id]);
      else thread.push(commentMap[c.id]);
    });
    return thread;
  }

  static addComment(requestId: string, authorId: string, authorName: string, text: string, parentId?: string, attachmentId?: string): void {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const db = TemporaryDatabase.getDB();
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      requestId,
      authorId,
      authorName,
      text,
      timestamp: new Date().toISOString(),
      parentId,
      attachmentId
    };
    
    db.comments = [...(db.comments || []), newComment];
    TemporaryDatabase.saveDB(db);
  }

  static deleteComment(commentId: string): void {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const db = TemporaryDatabase.getDB();
    const idx = db.comments.findIndex((c: any) => c.id === commentId);
    if (idx === -1) return;

    const comment = db.comments[idx];
    if (user.id !== comment.authorId && user.role !== 'ADMIN') {
      throw new Error("ACCESS_DENIED");
    }

    db.comments[idx].deletedAt = new Date().toISOString();
    TemporaryDatabase.saveDB(db);
  }
}
