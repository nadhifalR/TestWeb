import { supabase } from './SupabaseClient';
import { AuthManager } from './AuthManager';

export interface Attachment {
  id: string;
  requestId: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  deletedAt?: string;
}

export class AttachmentManager {
  static async getAttachments(requestId: string): Promise<Attachment[]> {
    try {
      // Short-circuit: BIGINT columns in Supabase throw 400 when queried with strings like 'TMP-...'
      const isNumeric = /^\d+$/.test(requestId);
      if (!isNumeric || requestId.startsWith('TMP')) return [];

      const queryId = parseInt(requestId, 10);

      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('request_id', queryId);

      if (error) {
        console.error('AttachmentManager: Fetch failed', error);
        return [];
      }
      
      return data.map((a: any) => ({
        id: a.id.toString(),
        requestId: a.request_id?.toString(),
        name: a.name,
        size: a.size,
        type: a.type,
        url: a.url,
        uploadedAt: a.uploaded_at,
        deletedAt: a.deleted_at
      })) as Attachment[];
    } catch (e) {
      return [];
    }
  }

  static async uploadFile(requestId: string, file: File): Promise<Attachment> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    // Clean check for numeric ID to avoid 400 errors on BIGINT columns
    const isNumeric = /^\d+$/.test(requestId) && !requestId.startsWith('TMP');
    const fileExt = file.name.split('.').pop();
    const uniqueName = Math.random().toString(36).substring(2);
    // Use requestId as a folder to keep artifacts organized
    const fileName = `${requestId}/${uniqueName}.${fileExt}`;

    // Upload to Storage (always allowed if RLS policies permit)
    const { error: uploadError } = await supabase.storage
      .from('artifacts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      throw new Error(`STORAGE_UPLOAD_FAILED: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('artifacts')
      .getPublicUrl(fileName);

    // If request isn't persisted yet, return a local representation
    if (!isNumeric) {
      return {
        id: "temp_" + uniqueName,
        requestId: requestId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploadedAt: new Date().toISOString()
      };
    }

    try {
      const { data, error: dbError } = await supabase
        .from('attachments')
        .insert([{
          request_id: parseInt(requestId, 10),
          name: file.name,
          size: file.size,
          type: file.type,
          url: publicUrl,
          uploaded_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        id: data.id.toString(),
        requestId: data.request_id.toString(),
        name: data.name,
        size: data.size,
        type: data.type,
        url: data.url,
        uploadedAt: data.uploaded_at
      } as Attachment;
    } catch (e) {
      throw new Error("ATTACHMENT_DB_SYNC_FAILED");
    }
  }

  static async removeAttachment(id: string): Promise<void> {
    try {
      const isNumeric = /^\d+$/.test(id);
      if (isNumeric) {
        await supabase
          .from('attachments')
          .delete()
          .eq('id', parseInt(id, 10));
      }
    } catch (e) {}
  }
}