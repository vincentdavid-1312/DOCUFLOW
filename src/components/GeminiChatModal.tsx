import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ShieldAlert,
  Zap,
  FileText,
  Copy,
  Check,
  RotateCcw,
  Paperclip,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppDocument, ChatMessage, ChatRole } from '../types/document';
import { sendGeminiChatMessage, ChatTurn } from '../services/geminiService';

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  allDocuments: AppDocument[];
  initialAttachedDocIds?: string[];
}

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  allDocuments,
  initialAttachedDocIds = [],
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'model',
      text: `Hello! I am **DocuFlow AI Copilot**.\n\nI can analyze your scanned receipts, review legal contracts, cross-examine multiple invoices, or rapidly answer questions about your digitized files.\n\nSelect a specialist persona below to match your workflow:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.5-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [role, setRole] = useState<ChatRole>('doc_analyst');
  const [attachedDocIds, setAttachedDocIds] = useState<string[]>(initialAttachedDocIds);
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-attach initial docs when modal opens with new selection
  useEffect(() => {
    if (initialAttachedDocIds.length > 0) {
      setAttachedDocIds(initialAttachedDocIds);
    } else if (allDocuments.length > 0 && attachedDocIds.length === 0) {
      // Default attach the first doc
      setAttachedDocIds([allDocuments[0].id]);
    }
  }, [initialAttachedDocIds, isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  if (!isOpen) return null;

  const attachedDocs = allDocuments.filter((d) => attachedDocIds.includes(d.id));

  // Build document context string for system prompt injection
  const buildDocumentContext = () => {
    if (attachedDocs.length === 0) return '';
    return attachedDocs
      .map((d, i) => {
        let content = `[Document ${i + 1}: ${d.name} (${d.category})]\n`;
        content += `- Page Count: ${d.pageCount}, Size: ${(d.sizeBytes / 1024).toFixed(0)} KB\n`;
        if (d.ocrData) {
          content += `- Document Type: ${d.ocrData.documentType}\n`;
          content += `- Executive Summary: ${d.ocrData.summary}\n`;
          if (d.ocrData.entities?.length > 0) {
            content += `- Key Entities:\n${d.ocrData.entities.map((e) => `  * ${e.label}: ${e.value}`).join('\n')}\n`;
          }
          content += `- Extracted Text Content:\n${d.ocrData.extractedText}\n`;
        } else {
          content += `- Note: Image scan without OCR pre-processing.\n`;
        }
        return content;
      })
      .join('\n---\n\n');
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachedDocNames: attachedDocs.map((d) => d.name),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Map history to ChatTurn format excluding welcome message
      const historyTurns: ChatTurn[] = newHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      const docContext = buildDocumentContext();
      const response = await sendGeminiChatMessage(historyTurns, role, docContext);

      const modelMessage: ChatMessage = {
        id: `model-${Date.now()}`,
        sender: 'model',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: response.modelUsed,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Chat send error:', err);
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'model',
        text: `⚠️ **Error communicating with Gemini**: ${err.message || 'Please check your connection and API key.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleDocAttachment = (docId: string) => {
    setAttachedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const quickPrompts = [
    'Summarize all attached documents in 3 bullet points',
    'Extract all monetary amounts, totals, and due dates',
    'Review for potential legal risks, obligations, or missing terms',
    'Compare these files and highlight differences',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl h-[92vh] sm:h-[86vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">DocuFlow Copilot</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                  Multi-Turn Chat
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Contextual intelligence across your documents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome',
                    sender: 'model',
                    text: 'Conversation history cleared. How can I assist with your documents?',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    modelUsed: 'gemini-3.5-flash',
                  },
                ]);
              }}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Clear conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div className="px-3.5 sm:px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-xs">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Role:
            </span>
            <button
              onClick={() => setRole('doc_analyst')}
              className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition ${
                role === 'doc_analyst'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Doc Analyst</span>
              <span className="text-[9px] opacity-75 hidden sm:inline">(3.5 Flash)</span>
            </button>

            <button
              onClick={() => setRole('legal_auditor')}
              className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition ${
                role === 'legal_auditor'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Legal Auditor</span>
              <span className="text-[9px] font-bold text-purple-200 bg-purple-950/80 px-1 rounded">
                High Thinking
              </span>
            </button>

            <button
              onClick={() => setRole('speed_assistant')}
              className={`px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition ${
                role === 'speed_assistant'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Speed Assistant</span>
              <span className="text-[9px] opacity-75 hidden sm:inline">(Flash-Lite)</span>
            </button>
          </div>

          {/* Attached documents counter dropdown trigger */}
          <button
            onClick={() => setShowDocSelector(!showDocSelector)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs shrink-0 transition"
          >
            <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
            <span>{attachedDocs.length} Attached</span>
            {showDocSelector ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Attached Documents Drawer */}
        {showDocSelector && (
          <div className="p-3 border-b border-slate-800 bg-slate-950/90 text-xs space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">
                Select documents to include in AI context:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAttachedDocIds(allDocuments.map((d) => d.id))}
                  className="text-indigo-400 hover:underline text-[11px]"
                >
                  Select All
                </button>
                <span className="text-slate-600">&bull;</span>
                <button
                  onClick={() => setAttachedDocIds([])}
                  className="text-slate-400 hover:underline text-[11px]"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {allDocuments.map((doc) => {
                const isSelected = attachedDocIds.includes(doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => handleToggleDocAttachment(doc.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className="truncate font-medium">{doc.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto shrink-0">
                      {(doc.sizeBytes / 1024).toFixed(0)}K
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages Scrollable Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-3.5 text-xs sm:text-[13px] leading-relaxed relative group ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-xs shadow-sm'
                  }`}
                >
                  {/* Model & Metadata Header if assistant */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-800/80 text-[10px] text-slate-400">
                      <span className="font-mono text-purple-400 font-semibold">
                        {msg.modelUsed || 'Gemini'}
                      </span>
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Attached docs tag if user attached files */}
                  {isUser && msg.attachedDocNames && msg.attachedDocNames.length > 0 && (
                    <div className="mb-1.5 text-[10px] text-indigo-200 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      <span className="truncate">Attached: {msg.attachedDocNames.join(', ')}</span>
                    </div>
                  )}

                  {/* Message body with basic markdown line breaks */}
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                  {/* Timestamp */}
                  <div
                    className={`mt-1.5 text-[9px] ${
                      isUser ? 'text-indigo-200 text-right' : 'text-slate-500 text-left'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl rounded-tl-xs p-3.5 text-xs text-slate-300 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span className="italic font-mono text-[11px]">
                  {role === 'legal_auditor'
                    ? 'Gemini 3.1 Pro is thinking deeply...'
                    : role === 'speed_assistant'
                    ? 'Gemini Flash-Lite is replying...'
                    : 'Gemini 3.5 Flash is analyzing your documents...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-3.5 sm:px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white whitespace-nowrap transition disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={`Ask ${
              role === 'legal_auditor'
                ? 'Legal Auditor (Thinking)'
                : role === 'speed_assistant'
                ? 'Rapid Assistant'
                : 'Doc Analyst'
            } anything...`}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
