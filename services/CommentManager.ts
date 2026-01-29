
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
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('request_id', requestId)
        .is('deleted_at', null)
        .order('timestamp', { ascending: true });

      if (error) return [];

      const commentMap: Record<string, Comment> = {};
      const mappedData = (data || []).map((c: any) => ({
        id: c.id,
        requestId: c.request_id,
        authorId: c.author_id,
        authorName: c.author_name,
        text: c.text,
        timestamp: c.timestamp,
        parentId: c.parent_id,
        attachmentId: c.attachment_id,
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

  static async addComment(requestId: string, authorId: string, authorName: string, text: string, parentId?: string, attachmentId?: string): Promise<void> {
    const payload = {
      request_id: requestId,
      author_id: authorId,
      author_name: authorName,
      text,
      parent_id: parentId,
      attachment_id: attachmentId,
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
      .eq('id', commentId);
    if (error) throw error;
  }
}
