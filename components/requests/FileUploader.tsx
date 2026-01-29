
import React, { useState, useEffect } from 'react';
import { Upload, File, X, CheckCircle, Loader2, Eye, Download } from 'lucide-react';
import { AttachmentManager, Attachment } from '../../services/AttachmentManager';

export const FileUploader: React.FC<{ requestId?: string }> = ({ requestId = 'temp_id' }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<Attachment | null>(null);

  useEffect(() => {
    setAttachments(AttachmentManager.getAttachments(requestId));
  }, [requestId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await AttachmentManager.uploadFile(requestId, file);
      setAttachments(AttachmentManager.getAttachments(requestId));
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (id: string) => {
    AttachmentManager.removeAttachment(id);
    setAttachments(AttachmentManager.getAttachments(requestId));
  };

  return (
    <section className="space-y-4 w-full">
      <div className="flex items-center gap-2">
        <Upload size={14} className="text-slate-400" />
        <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Protocol Artifacts</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        <label className="group relative border border-dashed theme-border rounded p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-all cursor-pointer min-h-[140px]">
          <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          </div>
          <p className="text-[10px] font-bold theme-text uppercase tracking-widest">Provision Artifact</p>
          <p className="text-[9px] text-slate-400 mt-1 font-medium uppercase">Max Payload: 10MB</p>
        </label>

        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar w-full">
          {attachments.map(file => (
            <div key={file.id} className="flex items-center gap-4 p-3 theme-bg border theme-border rounded hover:border-slate-400 transition-all group">
              <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                <File size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold theme-text truncate leading-none mb-1">{file.name}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setPreviewFile(file)}
                  className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                  title="Preview"
                >
                  <Eye size={16} />
                </button>
                <a 
                  href={file.url} 
                  download={file.name}
                  className="p-1.5 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                  title="Download"
                >
                  <Download size={16} />
                </a>
                <button 
                  onClick={() => removeFile(file.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
          {attachments.length === 0 && !isUploading && (
            <div className="h-full flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-widest italic border border-dashed theme-border rounded min-h-[140px]">
              No artifacts archived
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-12">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={() => setPreviewFile(null)}></div>
          <div className="relative w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[85vh]">
            <div className="p-6 border-b theme-border flex justify-between items-center bg-slate-50">
               <div>
                 <h4 className="font-black theme-text uppercase tracking-widest text-xs">{previewFile.name}</h4>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Artifact Type: {previewFile.type} • Created {new Date(previewFile.uploadedAt).toLocaleString()}</p>
               </div>
               <button onClick={() => setPreviewFile(null)} className="p-2 hover:bg-white rounded-xl shadow-sm transition-all"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-auto p-12 bg-slate-100 flex items-center justify-center">
               {previewFile.type.startsWith('image/') ? (
                 <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
               ) : (
                 <div className="flex flex-col items-center gap-6 text-slate-400">
                    <File size={120} strokeWidth={1} />
                    <p className="font-black uppercase tracking-widest text-xs">Preview not available for this MIME type</p>
                    <a href={previewFile.url} download={previewFile.name} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Download Artifact</a>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
