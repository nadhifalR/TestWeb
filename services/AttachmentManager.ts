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
  private static stagedAttachments: Record<string, Attachment[]> = {};

  static async getAttachments(requestId: string): Promise<Attachment[]> {
    if (requestId.startsWith('TMP-')) {
      return this.stagedAttachments[requestId] || [];
    }

    try {
      const isNumeric = /^\d+$/.test(requestId);
      if (!isNumeric) return [];

      const queryId = parseInt(requestId, 10);

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

    const fileExt = file.name.split('.').pop();
    const uniqueName = Math.random().toString(36).substring(2);
    const fileName = `${requestId}/${uniqueName}.${fileExt}`;

    // Upload to Storage (always allowed)
    const { error: uploadError } = await supabase.storage
      .from('artifacts')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw new Error(`STORAGE_UPLOAD_FAILED: ${uploadError.message}`);

    const { data: { publicUrl } } = supabase.storage
      .from('artifacts')
      .getPublicUrl(fileName);

    const attachmentObj: Attachment = {
      id: `staged_${uniqueName}`,
      requestId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl,
      uploadedAt: new Date().toISOString()
    };

    if (requestId.startsWith('TMP-')) {
      if (!this.stagedAttachments[requestId]) this.stagedAttachments[requestId] = [];
      this.stagedAttachments[requestId].push(attachmentObj);
      return attachmentObj;
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
          uploaded_at: attachmentObj.uploadedAt
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

  static async commitStaged(tempId: string, realId: number): Promise<void> {
    const staged = this.stagedAttachments[tempId];
    if (!staged || staged.length === 0) return;

    const payload = staged.map(a => ({
      request_id: realId,
      name: a.name,
      size: a.size,
      type: a.type,
      url: a.url,
      uploaded_at: a.uploadedAt
    }));

    await supabase.from('attachments').insert(payload);
    delete this.stagedAttachments[tempId];
  }

  static async removeAttachment(id: string): Promise<void> {
    if (id.startsWith('staged_')) return;
    try {
      await supabase.from('attachments').delete().eq('id', parseInt(id, 10));
    } catch (e) {}
  }
}