
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
      const isNumeric = /^\d+$/.test(requestId);
      const queryId = isNumeric ? parseInt(requestId, 10) : requestId;

      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('request_id', queryId);

      if (error) return [];
      
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

    const isNumeric = /^\d+$/.test(requestId);
    const fileExt = file.name.split('.').pop();
    const fileName = `${requestId}/${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `artifacts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('artifacts')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('artifacts')
      .getPublicUrl(filePath);

    if (!isNumeric) {
      // Return a "virtual" attachment if the request isn't saved yet
      // Production apps would store this in a temporary queue
      return {
        id: "temp_" + Math.random(),
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
      throw new Error("Attachment database sync failed.");
    }
  }

  static async removeAttachment(id: string): Promise<void> {
    try {
      await supabase
        .from('attachments')
        .delete()
        .eq('id', parseInt(id, 10));
    } catch (e) {}
  }
}
