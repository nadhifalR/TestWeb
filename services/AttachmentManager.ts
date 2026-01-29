
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
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('requestId', requestId)
      .is('deletedAt', null);

    if (error) return [];
    return data as Attachment[];
  }

  static async uploadFile(requestId: string, file: File): Promise<Attachment> {
    const user = AuthManager.getCurrentUser();
    if (!user) throw new Error("AUTH_REQUIRED");

    const fileExt = file.name.split('.').pop();
    const fileName = `${requestId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `artifacts/${fileName}`;

    // 1. Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('artifacts')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('artifacts')
      .getPublicUrl(filePath);

    // 3. Save metadata to DB
    const { data, error: dbError } = await supabase
      .from('attachments')
      .insert([{
        requestId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        uploadedAt: new Date().toISOString()
      }])
      .select()
      .single();

    if (dbError) throw dbError;
    return data as Attachment;
  }

  static async removeAttachment(id: string): Promise<void> {
    const { error } = await supabase
      .from('attachments')
      .update({ deletedAt: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  }
}
