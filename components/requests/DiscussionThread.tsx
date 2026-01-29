
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Reply, ChevronDown, ChevronUp, Send, FileText, Trash2, Paperclip, Loader2 } from 'lucide-react';
import { CommentManager, Comment } from '../../services/CommentManager';
import { AttachmentManager, Attachment } from '../../services/AttachmentManager';
import { AuthManager } from '../../services/AuthManager';

const CommentItem: React.FC<{ 
  comment: Comment; 
  depth: number; 
  onReply: (id: string, text: string, file?: File) => void;
  onDelete: (id: string) => void;
  allAttachments: Attachment[];
}> = ({ comment, depth, onReply, onDelete, allAttachments }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = AuthManager.getCurrentUser();
  const linkedAttachment = allAttachments.find(a => a.id === comment.attachmentId);

  const handleReplySubmit = () => {
    if (!replyText.trim()) return;
    onReply(comment.id, replyText, replyFile || undefined);
    setReplyText('');
    setReplyFile(null);
    setShowReply(false);
  };

  return (
    <div className={`mt-4 ${depth > 0 ? 'ml-6 border-l theme-border pl-4' : ''}`}>
      <div className="flex items-start gap-3 group">
        <div className="w-7 h-7 rounded bg-slate-100 border theme-border shrink-0 flex items-center justify-center text-[10px] font-bold theme-text uppercase">
          {comment.authorName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold theme-text uppercase tracking-tight">{comment.authorName}</span>
            <span className="text-[9px] text-slate-400 font-medium">{new Date(comment.timestamp).toLocaleTimeString()}</span>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-0.5 hover:theme-bg rounded transition-colors">
              {isCollapsed ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronUp size={12} className="text-slate-400" />}
            </button>
            {currentUser?.id === comment.authorId && (
              <button onClick={() => onDelete(comment.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-red-500 transition-all">
                <Trash2 size={12} />
              </button>
            )}
          </div>
          
          {!isCollapsed && (
            <>
              <div className="space-y-2">
                <p className="text-[12px] theme-text-muted leading-relaxed font-medium">{comment.text}</p>
                {linkedAttachment && (
                  <a 
                    href={linkedAttachment.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition-all"
                  >
                    <FileText size={10} />
                    <span className="text-[9px] font-black uppercase tracking-widest">{linkedAttachment.name}</span>
                  </a>
                )}
              </div>
              
              <div className="flex items-center gap-4 mt-2">
                <button 
                  onClick={() => setShowReply(!showReply)}
                  className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest"
                >
                  <Reply size={10} /> Reply
                </button>
              </div>

              {showReply && (
                <div className="mt-2 p-3 bg-slate-50/50 rounded-xl border theme-border animate-in fade-in slide-in-from-top-1 duration-200">
                  <textarea 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Input reply text..."
                    className="w-full p-3 text-[12px] theme-bg border theme-border rounded-lg outline-none focus:border-slate-900 font-medium min-h-[60px]"
                  />
                  
                  {replyFile && (
                    <div className="mt-2 flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-600">
                        <FileText size={12} />
                        <span className="text-[10px] font-bold truncate max-w-[150px]">{replyFile.name}</span>
                      </div>
                      <button onClick={() => setReplyFile(null)} className="text-blue-400 hover:text-blue-600"><Trash2 size={12}/></button>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        className="hidden" 
                        ref={replyFileInputRef}
                        onChange={(e) => setReplyFile(e.target.files?.[0] || null)}
                      />
                      <button 
                        onClick={() => replyFileInputRef.current?.click()}
                        className="p-2 theme-bg border theme-border rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all"
                        title="Provision Artifact"
                      >
                        <Paperclip size={14} />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowReply(false)} className="px-3 py-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-widest hover:text-slate-600">Abort</button>
                      <button onClick={handleReplySubmit} className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg shadow-sm">Execute</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                {comment.replies?.map((reply: any) => (
                  <CommentItem 
                    key={reply.id} 
                    comment={reply} 
                    depth={depth + 1} 
                    onReply={onReply} 
                    onDelete={onDelete}
                    allAttachments={allAttachments} 
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const DiscussionThread: React.FC<{ requestId?: string }> = ({ requestId = 'temp_id' }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [allAttachments, setAllAttachments] = useState<Attachment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = AuthManager.getCurrentUser();

  const loadData = () => {
    if (!requestId) return;
    setComments(CommentManager.getComments(requestId));
    setAllAttachments(AttachmentManager.getAttachments(requestId));
  };

  useEffect(() => {
    loadData();
  }, [requestId]);

  const handlePost = async () => {
    if (!newCommentText.trim() || !user || !requestId) return;
    setIsProcessing(true);
    
    let attachmentId: string | undefined;
    if (selectedFile) {
      try {
        const uploaded = await AttachmentManager.uploadFile(requestId, selectedFile);
        attachmentId = uploaded.id;
      } catch (e: any) {
        alert(e.message);
        setIsProcessing(false);
        return;
      }
    }

    CommentManager.addComment(requestId, user.id, user.username, newCommentText, undefined, attachmentId);
    setNewCommentText('');
    setSelectedFile(null);
    setIsProcessing(false);
    loadData();
  };

  const handleReply = async (parentId: string, text: string, file?: File) => {
    if (!user || !requestId) return;
    
    let attachmentId: string | undefined;
    if (file) {
      try {
        const uploaded = await AttachmentManager.uploadFile(requestId, file);
        attachmentId = uploaded.id;
      } catch (e: any) {
        alert(e.message);
        return;
      }
    }

    CommentManager.addComment(requestId, user.id, user.username, text, parentId, attachmentId);
    loadData();
  };

  const handleDelete = (id: string) => {
    CommentManager.deleteComment(id);
    loadData();
  };

  return (
    <section className="space-y-4 w-full">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={14} className="text-slate-400" />
        <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Protocol Discussion</h3>
      </div>
      
      <div className="theme-bg border theme-border rounded-[2rem] p-6 w-full shadow-sm">
        <div className="flex flex-col gap-3 mb-6 w-full">
          <textarea 
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            placeholder="Commit entry to discussion thread..."
            className="w-full p-4 theme-bg border theme-border rounded-2xl outline-none focus:border-slate-900 text-[13px] font-medium transition-all min-h-[100px]"
          />
          
          {selectedFile && (
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl animate-in slide-in-from-left-2">
              <div className="flex items-center gap-3 text-blue-600">
                <FileText size={16} />
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase truncate max-w-[200px]">{selectedFile.name}</span>
                  <span className="text-[9px] opacity-70">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <button onClick={() => setSelectedFile(null)} className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors text-blue-400 hover:text-blue-600">
                <Trash2 size={16} />
              </button>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 theme-card border theme-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:border-blue-500 hover:text-blue-600 transition-all"
              >
                <Paperclip size={14} /> Provision File
              </button>
            </div>
            <button 
              disabled={isProcessing}
              onClick={handlePost}
              className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all flex items-center gap-3 shadow-lg disabled:opacity-50"
            >
              {isProcessing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Post Entry
            </button>
          </div>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar w-full">
          {comments.map(c => (
            <CommentItem 
              key={c.id} 
              comment={c} 
              depth={0} 
              onReply={handleReply} 
              onDelete={handleDelete}
              allAttachments={allAttachments} 
            />
          ))}
          {comments.length === 0 && (
            <div className="py-16 text-center text-slate-300 italic text-[11px] font-medium uppercase tracking-widest border border-dashed theme-border rounded-[2rem]">
              Zero records in thread
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
