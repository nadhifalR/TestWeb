
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
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('requestId', requestId)
      .is('deletedAt', null)
      .order('timestamp', { ascending: true });

    if (error) return [];

    const commentMap: Record<string, Comment> = {};
    data.forEach((c: Comment) => { commentMap[c.id] = { ...c, replies: [] }; });

    const thread: Comment[] = [];
    data.forEach((c: Comment) => {
      if (c.parentId && commentMap[c.parentId]) commentMap[c.parentId].replies?.push(commentMap[c.id]);
      else thread.push(commentMap[c.id]);
    });
    return thread;
  }

  static async addComment(requestId: string, authorId: string, authorName: string, text: string, parentId?: string, attachmentId?: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .insert([{
        requestId,
        authorId,
        authorName,
        text,
        parentId,
        attachmentId,
        timestamp: new Date().toISOString()
      }]);

    if (error) throw error;
  }

  static async deleteComment(commentId: string): Promise<void> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const { error } = await supabase
      .from('comments')
      .update({ deletedAt: new Date().toISOString() })
      .eq('id', commentId);
    
    if (error) throw error;
  }
}
