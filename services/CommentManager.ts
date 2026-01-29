
import { supabase } from './SupabaseClient';
import { AuthManager } from './AuthManager';

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
  static async getComments(requestId: string): Promise<Comment[]> {
    try {
      const isNumeric = /^\d+$/.test(requestId);
      const queryId = isNumeric ? parseInt(requestId, 10) : requestId;

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
      console.error('CommentManager.getComments failure:', e);
      return [];
    }
  }

  static async addComment(requestId: string, authorId: string, authorName: string, text: string, parentId?: string, attachmentId?: string): Promise<void> {
    const isNumericId = /^\d+$/.test(requestId);
    
    // Since request_id is BIGINT, we only save comments for existing database records.
    if (!isNumericId) {
      console.warn("CommentManager: Deferred persistence for unsaved records.");
      return; 
    }

    const payload: any = {
      request_id: parseInt(requestId, 10),
      author_id: authorId, // Matches public.profiles.id (TEXT)
      author_name: authorName,
      text,
      parent_id: parentId ? parseInt(parentId, 10) : null,
      attachment_id: attachmentId ? parseInt(attachmentId, 10) : null,
      timestamp: new Date().toISOString()
    };

    const { error } = await supabase.from('comments').insert([payload]);
    
    if (error) {
      console.error('Comment Post Failure:', error);
      throw new Error(`COMMENT_ERROR: ${error.message}`);
    }
  }

  static async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', parseInt(commentId, 10));
    if (error) throw error;
  }
}
