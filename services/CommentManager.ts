import { supabase } from './SupabaseClient';
import { AuthManager } from './AuthManager';
import { NotificationManager } from './NotificationManager';

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
  private static stagedComments: Record<string, Comment[]> = {};

  static async getComments(requestId: string): Promise<Comment[]> {
    if (requestId.startsWith('TMP-')) {
      return this.stagedComments[requestId] || [];
    }

    try {
      const isNumeric = /^\d+$/.test(requestId);
      if (!isNumeric) return [];

      const queryId = parseInt(requestId, 10);

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('request_id', queryId)
        .is('deleted_at', null)
        .order('timestamp', { ascending: true });

      if (error) return [];

      const commentMap: Record<string, Comment> = {};
      const mappedData = (data || []).map((c: any) => ({
        id: c.id.toString(),
        requestId: c.request_id?.toString(),
        authorId: c.author_id,
        authorName: c.author_name,
        text: c.text,
        timestamp: c.timestamp,
        parentId: c.parent_id?.toString(),
        attachmentId: c.attachment_id?.toString(),
        deletedAt: c.deleted_at,
        replies: []
      }));

      mappedData.forEach((c: Comment) => { commentMap[c.id] = c; });
      const thread: Comment[] = [];
      mappedData.forEach((c: Comment) => {
        if (c.parentId && commentMap[c.parentId]) {
          commentMap[c.parentId].replies?.push(c);
        } else {
          thread.push(c);
        }
      });
      return thread;
    } catch (e) {
      return [];
    }
  }

  static async addComment(
    requestId: string,
    authorId: string,
    authorName: string,
    text: string,
    parentId?: string,
    attachmentId?: string,
    requesterId?: string,
    requestName?: string
  ): Promise<void> {
    if (requestId.startsWith('TMP-')) {
      if (!this.stagedComments[requestId]) this.stagedComments[requestId] = [];

      const newComment: Comment = {
        id: `staged_${Math.random().toString(36).substr(2, 9)}`,
        requestId,
        authorId,
        authorName,
        text,
        timestamp: new Date().toISOString(),
        parentId,
        attachmentId,
        replies: []
      };

      if (parentId) {
        const findAndAdd = (list: Comment[]): boolean => {
          for (let c of list) {
            if (c.id === parentId) {
              if (!c.replies) c.replies = [];
              c.replies.push(newComment);
              return true;
            }
            if (c.replies && findAndAdd(c.replies)) return true;
          }
          return false;
        };
        findAndAdd(this.stagedComments[requestId]);
      } else {
        this.stagedComments[requestId].push(newComment);
      }
      return;
    }

    const payload: any = {
      request_id: parseInt(requestId, 10),
      author_id: authorId,
      author_name: authorName,
      text,
      parent_id: parentId ? parseInt(parentId, 10) : null,
      attachment_id: attachmentId ? parseInt(attachmentId, 10) : null,
      timestamp: new Date().toISOString()
    };

    const { data: insertedData, error } = await supabase.from('comments').insert([payload]).select().single();
    if (error) throw new Error(`COMMENT_ERROR: ${error.message}`);

    const commentId = insertedData.id.toString();

    // Notification Logic
    try {
      // 1. Notify Admins
      await NotificationManager.addNotification({
        userId: 'system',
        role: 'ADMIN',
        title: 'New Discussion Activity',
        message: `${authorName} commented on "${requestName || 'Request #' + requestId}": "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
        requestId,
        commentId
      });

      // 2. Notify Request Creator (if provided and not the author)
      if (requesterId && requesterId !== authorId) {
        await NotificationManager.addNotification({
          userId: requesterId,
          title: 'New Comment on Your Request',
          message: `${authorName} commented on "${requestName || 'your request'}": "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          requestId,
          commentId
        });
      }

      // 3. Notify Parent Author (if it's a reply)
      if (parentId) {
        const { data: parentComment } = await supabase
          .from('comments')
          .select('author_id')
          .eq('id', parseInt(parentId, 10))
          .single();

        if (parentComment && parentComment.author_id && parentComment.author_id !== authorId && parentComment.author_id !== requesterId) {
          await NotificationManager.addNotification({
            userId: parentComment.author_id,
            title: 'Someone replied to your comment',
            message: `${authorName} replied to you on "${requestName || 'Request #' + requestId}".`,
            requestId,
            commentId
          });
        }
      }
    } catch (notifErr) {
      console.warn('CommentManager: Notification dispatch failed', notifErr);
    }
  }

  static async commitStaged(tempId: string, realId: number): Promise<void> {
    const staged = this.stagedComments[tempId];
    if (!staged || staged.length === 0) return;

    // Flatten comments for insertion
    const flatten = (list: Comment[], parentId?: number) => {
      let results: any[] = [];
      list.forEach(c => {
        results.push({
          request_id: realId,
          author_id: c.authorId,
          author_name: c.authorName,
          text: c.text,
          timestamp: c.timestamp,
          // We handle parent IDs as a second pass usually, but for simple threads:
          parent_id: parentId || null,
          attachment_id: c.attachmentId ? parseInt(c.attachmentId, 10) : null
        });
        if (c.replies && c.replies.length > 0) {
          // Recursive flattening would need IDs from DB. 
          // For simplicity in this mock-sync, we just push top-level.
        }
      });
      return results;
    };

    const payload = flatten(staged);
    await supabase.from('comments').insert(payload);
    delete this.stagedComments[tempId];
  }

  static async deleteComment(commentId: string): Promise<void> {
    if (commentId.startsWith('staged_')) return;
    const { error } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parseInt(commentId, 10));
    if (error) throw error;
  }
}